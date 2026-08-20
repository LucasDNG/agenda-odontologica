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

export const getAvailableSlots = async (req, res) => {
  try {
    const { date, appointmentTypeId } = req.query;

    if (!date || !appointmentTypeId) {
      return res.status(400).json({
        message: "Debes indicar la fecha y el servicio",
      });
    }

    const typeResult = await pool.query(
      `SELECT id, name, duration_minutes
       FROM appointment_types
       WHERE id = $1
       AND active = true`,
      [appointmentTypeId],
    );

    if (typeResult.rows.length === 0) {
      return res.status(404).json({
        message: "Servicio no encontrado",
      });
    }

    const appointmentType = typeResult.rows[0];
    const duration = appointmentType.duration_minutes;

    const blockedResult = await pool.query(
      `SELECT reason
       FROM blocked_dates
       WHERE date = $1`,
      [date],
    );

    if (blockedResult.rows.length > 0) {
      return res.json({
        date,
        service: appointmentType.name,
        durationMinutes: duration,
        blocked: true,
        reason: blockedResult.rows[0].reason,
        availableSlots: [],
      });
    }

    const selectedDate = new Date(`${date}T12:00:00`);
    const dayOfWeek = selectedDate.getDay();

    const availabilityResult = await pool.query(
      `SELECT start_time, end_time
       FROM availability
       WHERE day_of_week = $1
       AND active = true
       ORDER BY start_time`,
      [dayOfWeek],
    );

    const appointmentsResult = await pool.query(
      `SELECT start_time, end_time
       FROM appointments
       WHERE appointment_date = $1
       AND status IN ('scheduled', 'confirmed')`,
      [date],
    );

    const occupiedAppointments = appointmentsResult.rows.map(
      (appointment) => ({
        start: timeToMinutes(appointment.start_time),
        end: timeToMinutes(appointment.end_time),
      }),
    );

    const availableSlots = [];

    for (const availability of availabilityResult.rows) {
      const start = timeToMinutes(availability.start_time);
      const end = timeToMinutes(availability.end_time);

      for (
        let current = start;
        current + duration <= end;
        current += duration
      ) {
        const slotStart = current;
        const slotEnd = current + duration;

        const overlaps = occupiedAppointments.some(
          (appointment) =>
            slotStart < appointment.end &&
            slotEnd > appointment.start,
        );

        if (!overlaps) {
          availableSlots.push({
            startTime: minutesToTime(slotStart),
            endTime: minutesToTime(slotEnd),
          });
        }
      }
    }

    res.json({
      date,
      service: appointmentType.name,
      durationMinutes: duration,
      blocked: false,
      availableSlots,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener los horarios disponibles",
    });
  }
};