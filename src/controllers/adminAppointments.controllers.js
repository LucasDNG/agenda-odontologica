import { pool } from "../db.js";
import { timeToMinutes, minutesToTime } from "../utils/time.js";
import {
  sendAppointmentCancelled,
  sendAppointmentRescheduled,
} from "../services/whatsapp.service.js";

const getDetails = async (id) => {
  const result = await pool.query(
    `SELECT a.*, u.name AS patient_name, u.phone AS patient_phone,
      at.name AS service, at.duration_minutes
     FROM appointments a
     JOIN users u ON u.id = a.patient_id
     JOIN appointment_types at ON at.id = a.appointment_type_id
     WHERE a.id = $1`,
    [id],
  );
  return result.rows[0] || null;
};

const slotIsFree = async ({ date, startMinutes, endMinutes, ignoreId }) => {
  const result = await pool.query(
    `SELECT id FROM appointments
     WHERE appointment_date = $1
       AND status = 'confirmed'
       AND COALESCE(is_overbooked, false) = false
       AND id <> $2
       AND start_time < $3
       AND end_time > $4
     LIMIT 1`,
    [date, ignoreId, minutesToTime(endMinutes), minutesToTime(startMinutes)],
  );
  return !result.rows[0];
};

const findNextFreeSlotSameDay = async (appointment, date) => {
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
  const ranges = await pool.query(
    `SELECT start_time, end_time FROM availability
     WHERE day_of_week = $1 AND active = true ORDER BY start_time`,
    [dayOfWeek],
  );

  const originalStart = timeToMinutes(appointment.start_time);
  const duration = appointment.duration_minutes;

  for (const range of ranges.rows) {
    const rangeStart = timeToMinutes(range.start_time);
    const rangeEnd = timeToMinutes(range.end_time);
    let current = Math.max(rangeStart, originalStart);
    current = Math.ceil(current / 5) * 5;

    for (; current + duration <= rangeEnd; current += 5) {
      if (await slotIsFree({
        date,
        startMinutes: current,
        endMinutes: current + duration,
        ignoreId: appointment.id,
      })) {
        return {
          startTime: minutesToTime(current),
          endTime: minutesToTime(current + duration),
        };
      }
    }
  }

  return null;
};

export const getAllAppointments = async (req, res) => {
  try {
    const { date, status } = req.query;
    const values = [];
    const conditions = [];

    if (date) {
      values.push(date);
      conditions.push(`a.appointment_date = $${values.length}`);
    }
    if (status) {
      values.push(status);
      conditions.push(`a.status = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT
        a.id, TO_CHAR(a.appointment_date, 'DD/MM/YYYY') AS appointment_date,
        a.start_time, a.end_time, a.status, a.notes, a.is_overbooked,
        u.id AS patient_id, u.name AS patient_name, u.lastname AS patient_lastname,
        u.email AS patient_email, u.phone AS patient_phone,
        at.id AS appointment_type_id, at.name AS service, at.duration_minutes
       FROM appointments a
       JOIN users u ON u.id = a.patient_id
       JOIN appointment_types at ON at.id = a.appointment_type_id
       ${where}
       ORDER BY a.appointment_date, a.start_time`,
      values,
    );

    res.json({ appointments: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener turnos" });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const allowed = ["cancelled", "completed", "absent"];
    const { status } = req.body;
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const appointment = await getDetails(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Turno no encontrado" });

    const result = await pool.query(
      `UPDATE appointments
       SET status = $1, reminder_sent_at = CASE WHEN $1 = 'cancelled' THEN NULL ELSE reminder_sent_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, status`,
      [status, req.params.id],
    );

    let whatsappSent = false;
    if (status === "cancelled") {
      const date = new Date(appointment.appointment_date).toLocaleDateString("es-AR");
      const whatsapp = await sendAppointmentCancelled({
        phone: appointment.patient_phone,
        name: appointment.patient_name,
        date,
        time: appointment.start_time.slice(0, 5),
        service: appointment.service,
      });
      whatsappSent = whatsapp.sent === true;
    }

    res.json({ message: "Estado actualizado", appointment: result.rows[0], whatsappSent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el turno" });
  }
};

export const restoreAppointment = async (req, res) => {
  try {
    const appointment = await getDetails(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Turno no encontrado" });
    if (appointment.status !== "cancelled") {
      return res.status(400).json({ message: "Solo se restauran turnos cancelados" });
    }

    const date = new Date(appointment.appointment_date).toISOString().slice(0, 10);
    const originalStart = timeToMinutes(appointment.start_time);
    const originalEnd = timeToMinutes(appointment.end_time);

    let startTime = appointment.start_time.slice(0, 5);
    let endTime = appointment.end_time.slice(0, 5);
    let isOverbooked = false;

    const originalFree = await slotIsFree({
      date,
      startMinutes: originalStart,
      endMinutes: originalEnd,
      ignoreId: appointment.id,
    });

    if (!originalFree) {
      const freeSlot = await findNextFreeSlotSameDay(appointment, date);

      if (freeSlot) {
        startTime = freeSlot.startTime;
        endTime = freeSlot.endTime;
      } else {
        isOverbooked = true;
      }
    }

    const result = await pool.query(
      `UPDATE appointments
       SET start_time = $1, end_time = $2, status = 'confirmed',
           is_overbooked = $3, reminder_sent_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, TO_CHAR(appointment_date, 'DD/MM/YYYY') AS appointment_date,
         start_time, end_time, status, is_overbooked`,
      [startTime, endTime, isOverbooked, appointment.id],
    );

    const restored = result.rows[0];

    const whatsapp = await sendAppointmentRescheduled({
      phone: appointment.patient_phone,
      name: appointment.patient_name,
      date: restored.appointment_date,
      time: restored.start_time.slice(0, 5),
      service: appointment.service,
      overbooked: restored.is_overbooked,
    });

    res.json({
      message: restored.is_overbooked
        ? `No había huecos: restaurado como sobreturno a las ${restored.start_time.slice(0, 5)}`
        : `Turno restaurado para las ${restored.start_time.slice(0, 5)}`,
      appointment: restored,
      whatsappSent: whatsapp.sent === true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al restaurar el turno" });
  }
};

export const rescheduleAppointment = async (req, res) => {
  try {
    const { date, startTime } = req.body;
    if (!date || !startTime) {
      return res.status(400).json({ message: "Fecha y horario son obligatorios" });
    }

    const appointment = await getDetails(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Turno no encontrado" });

    const start = timeToMinutes(startTime);
    const end = start + appointment.duration_minutes;

    if (!(await slotIsFree({
      date,
      startMinutes: start,
      endMinutes: end,
      ignoreId: appointment.id,
    }))) {
      return res.status(409).json({ message: "El nuevo horario está ocupado" });
    }

    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    const ranges = await pool.query(
      "SELECT start_time, end_time FROM availability WHERE day_of_week = $1 AND active = true",
      [dayOfWeek],
    );
    const fits = ranges.rows.some((r) =>
      start >= timeToMinutes(r.start_time) && end <= timeToMinutes(r.end_time)
    );
    if (!fits) {
      return res.status(400).json({ message: "El horario no está dentro de la disponibilidad" });
    }

    const result = await pool.query(
      `UPDATE appointments
       SET appointment_date = $1, start_time = $2, end_time = $3,
           status = 'confirmed', is_overbooked = false, reminder_sent_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, TO_CHAR(appointment_date, 'DD/MM/YYYY') AS appointment_date,
         start_time, end_time, status, is_overbooked`,
      [date, startTime, minutesToTime(end), appointment.id],
    );

    const updated = result.rows[0];
    const whatsapp = await sendAppointmentRescheduled({
      phone: appointment.patient_phone,
      name: appointment.patient_name,
      date: updated.appointment_date,
      time: updated.start_time.slice(0, 5),
      service: appointment.service,
      overbooked: false,
    });

    res.json({ message: "Turno reprogramado", appointment: updated, whatsappSent: whatsapp.sent === true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al reprogramar el turno" });
  }
};
