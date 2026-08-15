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

    // Comprobamos que el usuario sea un paciente
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

    // Buscamos el servicio y su duración
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

    // Comprobamos si la fecha está bloqueada
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

    // Obtenemos el día de la semana
    const selectedDate = new Date(`${date}T12:00:00`);
    const dayOfWeek = selectedDate.getDay();

    // Buscamos las franjas horarias de Laura
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

    // Comprobamos que el turno entre completamente
    // dentro de alguna franja de atención
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

    // Comprobamos que no exista otro turno superpuesto
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

    // Creamos el turno
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
         appointment_date,
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