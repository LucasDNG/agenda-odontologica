import { pool } from "../db.js";
import { timeToMinutes, minutesToTime } from "../utils/time.js";

export const getAvailableSlots = async (req, res) => {
  try {
    const { date, appointmentTypeId } = req.query;
    if (!date || !appointmentTypeId) {
      return res.status(400).json({ message: "Debes indicar fecha y servicio" });
    }

    const typeResult = await pool.query(
      "SELECT id, name, duration_minutes FROM appointment_types WHERE id = $1 AND active = true",
      [appointmentTypeId],
    );
    const type = typeResult.rows[0];
    if (!type) return res.status(404).json({ message: "Servicio no encontrado" });

    const blocked = await pool.query("SELECT reason FROM blocked_dates WHERE date = $1", [date]);
    if (blocked.rows[0]) {
      return res.json({
        date,
        service: type.name,
        durationMinutes: type.duration_minutes,
        blocked: true,
        reason: blocked.rows[0].reason,
        availableSlots: [],
      });
    }

    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();

    const availabilityResult = await pool.query(
      `SELECT start_time, end_time FROM availability
       WHERE day_of_week = $1 AND active = true ORDER BY start_time`,
      [dayOfWeek],
    );

    const occupiedResult = await pool.query(
      `SELECT start_time, end_time FROM appointments
       WHERE appointment_date = $1
         AND status = 'confirmed'
         AND COALESCE(is_overbooked, false) = false`,
      [date],
    );

    const occupied = occupiedResult.rows.map((a) => ({
      start: timeToMinutes(a.start_time),
      end: timeToMinutes(a.end_time),
    }));

    const slots = [];
    const duration = type.duration_minutes;

    for (const range of availabilityResult.rows) {
      const start = timeToMinutes(range.start_time);
      const end = timeToMinutes(range.end_time);

      for (let current = start; current + duration <= end; current += duration) {
        const slotEnd = current + duration;
        const overlap = occupied.some((a) => current < a.end && slotEnd > a.start);
        if (!overlap) {
          slots.push({
            startTime: minutesToTime(current),
            endTime: minutesToTime(slotEnd),
          });
        }
      }
    }

    res.json({
      date,
      service: type.name,
      durationMinutes: duration,
      blocked: false,
      availableSlots: slots,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener horarios disponibles" });
  }
};
