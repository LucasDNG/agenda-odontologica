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

    const dateFormat = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateFormat.test(date)) {
      return res.status(400).json({
        message: "La fecha debe tener formato YYYY-MM-DD",
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
    const duration = appointmentType.duration_minutes;

    // Comprobamos si la fecha está bloqueada
    const blockedDateResult = await pool.query(
      `SELECT reason
       FROM blocked_dates
       WHERE date = $1`,
      [date],
    );

    if (blockedDateResult.rows.length > 0) {
      return res.json({
        date,
        service: appointmentType.name,
        durationMinutes: duration,
        blocked: true,
        reason: blockedDateResult.rows[0].reason,
        availableSlots: [],
      });
    }

    // Obtenemos el día de la semana
    const selectedDate = new Date(`${date}T12:00:00`);
    const dayOfWeek = selectedDate.getDay();

    // Buscamos los horarios habituales de Laura para ese día
    const availabilityResult = await pool.query(
      `SELECT start_time, end_time
       FROM availability
       WHERE day_of_week = $1
       AND active = true
       ORDER BY start_time`,
      [dayOfWeek],
    );

    if (availabilityResult.rows.length === 0) {
      return res.json({
        date,
        service: appointmentType.name,
        durationMinutes: duration,
        blocked: false,
        availableSlots: [],
      });
    }

    // Buscamos turnos que ya ocupan horarios ese día
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

    // Recorremos cada franja horaria de Laura
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

        // Un turno se superpone si:
        // slotStart < appointmentEnd
        // y slotEnd > appointmentStart
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