import { pool } from "../db.js";

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const createAppointment = async (req, res) => {
  try {
    const patientId = req.userId;
    const { appointmentTypeId, date, startTime, notes } = req.body;

    if (!appointmentTypeId || !date || !startTime) {
      return res.status(400).json({
        message: "Debes indicar servicio, fecha y horario",
      });
    }

    const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
    const timeFormat = /^\d{2}:\d{2}$/;

    if (!dateFormat.test(date)) {
      return res.status(400).json({
        message: "La fecha debe tener formato YYYY-MM-DD",
      });
    }

    if (!timeFormat.test(startTime)) {
      return res.status(400).json({
        message: "El horario debe tener formato HH:MM",
      });
    }

    const userResult = await pool.query(
      `SELECT id, role
       FROM users
       WHERE id = $1`,
      [patientId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    if (userResult.rows[0].role !== "patient") {
      return res.status(403).json({
        message: "Solo los pacientes pueden reservar turnos",
      });
    }

    const appointmentTypeResult = await pool.query(
      `SELECT id, name, duration_minutes
       FROM appointment_types
       WHERE id = $1
       AND active = true`,
      [appointmentTypeId],
    );

    if (appointmentTypeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Servicio no encontrado",
      });
    }

    const appointmentType = appointmentTypeResult.rows[0];
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + appointmentType.duration_minutes;
    const endTime = minutesToTime(endMinutes);

    const blockedDateResult = await pool.query(
      `SELECT reason
       FROM blocked_dates
       WHERE date = $1`,
      [date],
    );

    if (blockedDateResult.rows.length > 0) {
      return res.status(400).json({
        message: "La fecha seleccionada no está disponible",
        reason: blockedDateResult.rows[0].reason,
      });
    }

    const selectedDate = new Date(`${date}T12:00:00`);
    const dayOfWeek = selectedDate.getDay();

    const availabilityResult = await pool.query(
      `SELECT start_time, end_time
       FROM availability
       WHERE day_of_week = $1
       AND active = true`,
      [dayOfWeek],
    );

    if (availabilityResult.rows.length === 0) {
      return res.status(400).json({
        message: "Laura no atiende en la fecha seleccionada",
      });
    }

    const fitsAvailability = availabilityResult.rows.some((availability) => {
      const availabilityStart = timeToMinutes(availability.start_time);
      const availabilityEnd = timeToMinutes(availability.end_time);

      return (
        startMinutes >= availabilityStart &&
        endMinutes <= availabilityEnd
      );
    });

    if (!fitsAvailability) {
      return res.status(400).json({
        message: "El horario seleccionado no está disponible",
      });
    }

    const overlappingResult = await pool.query(
      `SELECT id
       FROM appointments
       WHERE appointment_date = $1
       AND status IN ('scheduled', 'confirmed')
       AND start_time < $2
       AND end_time > $3`,
      [date, endTime, startTime],
    );

    if (overlappingResult.rows.length > 0) {
      return res.status(409).json({
        message: "Ese horario ya no está disponible",
      });
    }

    const result = await pool.query(
      `INSERT INTO appointments
        (
          patient_id,
          appointment_type_id,
          appointment_date,
          start_time,
          end_time,
          notes
        )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id,
         patient_id,
         appointment_type_id,
         TO_CHAR(appointment_date, 'DD/MM/YYYY') AS appointment_date,
         start_time,
         end_time,
         status,
         notes,
         created_at`,
      [
        patientId,
        appointmentTypeId,
        date,
        startTime,
        endTime,
        notes || null,
      ],
    );

    res.status(201).json({
      message: "Turno reservado correctamente",
      appointment: result.rows[0],
      service: appointmentType.name,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al reservar el turno",
    });
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    const patientId = req.userId;

    const upcomingResult = await pool.query(
      `SELECT
         a.id,
         TO_CHAR(a.appointment_date, 'DD/MM/YYYY') AS appointment_date,
         a.start_time,
         a.end_time,
         a.status,
         a.notes,
         at.name AS service,
         at.duration_minutes
       FROM appointments a
       JOIN appointment_types at
         ON a.appointment_type_id = at.id
       WHERE a.patient_id = $1
         AND a.appointment_date >= CURRENT_DATE
         AND a.status IN ('scheduled', 'confirmed')
       ORDER BY a.appointment_date, a.start_time`,
      [patientId],
    );

    const historyResult = await pool.query(
      `SELECT
         a.id,
         TO_CHAR(a.appointment_date, 'DD/MM/YYYY') AS appointment_date,
         a.start_time,
         a.end_time,
         a.status,
         a.notes,
         at.name AS service,
         at.duration_minutes
       FROM appointments a
       JOIN appointment_types at
         ON a.appointment_type_id = at.id
       WHERE a.patient_id = $1
         AND (
           a.appointment_date < CURRENT_DATE
           OR a.status IN ('cancelled', 'completed', 'absent')
         )
       ORDER BY a.appointment_date DESC, a.start_time DESC`,
      [patientId],
    );

    res.json({
      upcomingAppointments: upcomingResult.rows,
      history: historyResult.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener los turnos",
    });
  }
};