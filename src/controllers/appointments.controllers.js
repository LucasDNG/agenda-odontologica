import { pool } from "../db.js";
import { timeToMinutes, minutesToTime } from "../utils/time.js";
import {
  sendAppointmentConfirmed,
  sendAppointmentCancelled,
} from "../services/whatsapp.service.js";

export const createAppointment = async (req, res) => {
  const client = await pool.connect();
  try {
    const patientId = req.userId;
    const { appointmentTypeId, date, startTime, notes } = req.body;

    if (!appointmentTypeId || !date || !startTime) {
      return res.status(400).json({ message: "Debes indicar servicio, fecha y horario" });
    }

    await client.query("BEGIN");

    const patientResult = await client.query(
      `SELECT id, name, phone, role, max_active_appointments
       FROM users WHERE id = $1 FOR UPDATE`,
      [patientId],
    );
    const patient = patientResult.rows[0];

    if (!patient) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    if (patient.role !== "patient") {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Solo los pacientes pueden reservar turnos" });
    }

    const activeResult = await client.query(
      `SELECT COUNT(*)::int AS total FROM appointments
       WHERE patient_id = $1
         AND appointment_date >= CURRENT_DATE
         AND status = 'confirmed'`,
      [patientId],
    );

    if (activeResult.rows[0].total >= patient.max_active_appointments) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: patient.max_active_appointments === 1
          ? "Ya tenés un turno futuro activo. Si necesitás otro, comunicate con la odontóloga."
          : `Ya alcanzaste el máximo de ${patient.max_active_appointments} turnos autorizados.`,
      });
    }

    const typeResult = await client.query(
      "SELECT id, name, duration_minutes FROM appointment_types WHERE id = $1 AND active = true",
      [appointmentTypeId],
    );
    const type = typeResult.rows[0];
    if (!type) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    if (date < new Date().toISOString().slice(0, 10)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No podés reservar en una fecha pasada" });
    }

    const blocked = await client.query("SELECT reason FROM blocked_dates WHERE date = $1", [date]);
    if (blocked.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "La fecha no está disponible", reason: blocked.rows[0].reason });
    }

    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    const ranges = await client.query(
      "SELECT start_time, end_time FROM availability WHERE day_of_week = $1 AND active = true",
      [dayOfWeek],
    );

    const start = timeToMinutes(startTime);
    const end = start + type.duration_minutes;
    const endTime = minutesToTime(end);

    const fits = ranges.rows.some((r) =>
      start >= timeToMinutes(r.start_time) && end <= timeToMinutes(r.end_time)
    );
    if (!fits) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "El horario no está dentro de la disponibilidad" });
    }

    const overlap = await client.query(
      `SELECT id FROM appointments
       WHERE appointment_date = $1
         AND status = 'confirmed'
         AND COALESCE(is_overbooked, false) = false
         AND start_time < $2
         AND end_time > $3
       LIMIT 1`,
      [date, endTime, startTime],
    );

    if (overlap.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Ese horario ya no está disponible" });
    }

    const result = await client.query(
      `INSERT INTO appointments
        (patient_id, appointment_type_id, appointment_date, start_time, end_time, status, notes)
       VALUES ($1, $2, $3, $4, $5, 'confirmed', $6)
       RETURNING id, patient_id, appointment_type_id,
         TO_CHAR(appointment_date, 'DD/MM/YYYY') AS appointment_date,
         start_time, end_time, status, notes, is_overbooked`,
      [patientId, appointmentTypeId, date, startTime, endTime, notes || null],
    );

    await client.query("COMMIT");

    const appointment = result.rows[0];
    const whatsapp = await sendAppointmentConfirmed({
      phone: patient.phone,
      name: patient.name,
      date: appointment.appointment_date,
      time: appointment.start_time.slice(0, 5),
      service: type.name,
    });

    res.status(201).json({
      message: "Turno confirmado correctamente",
      appointment,
      service: type.name,
      whatsappSent: whatsapp.sent === true,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(error);
    res.status(500).json({ message: "Error al reservar el turno" });
  } finally {
    client.release();
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    const patientId = req.userId;

    const upcoming = await pool.query(
      `SELECT a.id, TO_CHAR(a.appointment_date, 'DD/MM/YYYY') AS appointment_date,
        a.start_time, a.end_time, a.status, a.notes, a.is_overbooked,
        at.name AS service, at.duration_minutes
       FROM appointments a
       JOIN appointment_types at ON at.id = a.appointment_type_id
       WHERE a.patient_id = $1
         AND a.appointment_date >= CURRENT_DATE
         AND a.status = 'confirmed'
       ORDER BY a.appointment_date, a.start_time`,
      [patientId],
    );

    const history = await pool.query(
      `SELECT a.id, TO_CHAR(a.appointment_date, 'DD/MM/YYYY') AS appointment_date,
        a.start_time, a.end_time, a.status, a.notes, a.is_overbooked,
        at.name AS service, at.duration_minutes
       FROM appointments a
       JOIN appointment_types at ON at.id = a.appointment_type_id
       WHERE a.patient_id = $1
         AND (a.appointment_date < CURRENT_DATE OR a.status IN ('cancelled','completed','absent'))
       ORDER BY a.appointment_date DESC, a.start_time DESC`,
      [patientId],
    );

    res.json({
      upcomingAppointments: upcoming.rows,
      history: history.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los turnos" });
  }
};

export const cancelMyAppointment = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE appointments a
       SET status = 'cancelled', reminder_sent_at = NULL, updated_at = CURRENT_TIMESTAMP
       FROM users u, appointment_types at
       WHERE a.id = $1
         AND a.patient_id = $2
         AND a.patient_id = u.id
         AND a.appointment_type_id = at.id
         AND a.status = 'confirmed'
         AND a.appointment_date >= CURRENT_DATE
       RETURNING a.id, TO_CHAR(a.appointment_date, 'DD/MM/YYYY') AS appointment_date,
         a.start_time, a.end_time, a.status,
         u.name AS patient_name, u.phone AS patient_phone, at.name AS service`,
      [req.params.id, req.userId],
    );

    const appointment = result.rows[0];
    if (!appointment) {
      return res.status(404).json({ message: "Turno no encontrado o no cancelable" });
    }

    const whatsapp = await sendAppointmentCancelled({
      phone: appointment.patient_phone,
      name: appointment.patient_name,
      date: appointment.appointment_date,
      time: appointment.start_time.slice(0, 5),
      service: appointment.service,
    });

    res.json({
      message: "Turno cancelado correctamente",
      appointment,
      whatsappSent: whatsapp.sent === true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al cancelar el turno" });
  }
};
