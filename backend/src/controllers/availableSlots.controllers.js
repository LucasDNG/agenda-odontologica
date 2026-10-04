import { pool } from "../db.js";

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time)
    .slice(0, 5)
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const isPositiveInteger = (value) => {
  const number = Number(value);

  return Number.isInteger(number) && number > 0;
};

export const getAvailableSlots = async (req, res) => {
  try {
    const {
      date,
      appointmentTypeId,
      professionalId,
    } = req.query;

    if (
      !date ||
      !appointmentTypeId ||
      !professionalId
    ) {
      return res.status(400).json({
        message:
          "Debes indicar fecha, servicio y profesional",
      });
    }

    const dateFormat = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateFormat.test(date)) {
      return res.status(400).json({
        message:
          "La fecha debe tener formato YYYY-MM-DD",
      });
    }

    if (!isPositiveInteger(appointmentTypeId)) {
      return res.status(400).json({
        message: "El servicio no es válido",
      });
    }

    if (!isPositiveInteger(professionalId)) {
      return res.status(400).json({
        message: "El profesional no es válido",
      });
    }

    const professionalServiceResult =
      await pool.query(
        `SELECT
           p.id AS professional_id,
           p.name AS professional_name,
           p.lastname AS professional_lastname,
           at.id AS appointment_type_id,
           at.name AS service_name,
           at.duration_minutes
         FROM professionals p
         JOIN professional_services ps
           ON ps.professional_id = p.id
         JOIN appointment_types at
           ON at.id = ps.appointment_type_id
         WHERE p.id = $1
           AND at.id = $2
           AND p.active = true
           AND at.active = true`,
        [professionalId, appointmentTypeId],
      );

    if (
      professionalServiceResult.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          "El profesional no realiza el servicio seleccionado",
      });
    }

    const professionalService =
      professionalServiceResult.rows[0];

    const duration = Number(
      professionalService.duration_minutes,
    );

    const blockedDateResult = await pool.query(
      `SELECT reason
       FROM blocked_dates
       WHERE date = $1
       LIMIT 1`,
      [date],
    );

    if (blockedDateResult.rows.length > 0) {
      return res.json({
        date,
        professional: {
          id: Number(
            professionalService.professional_id,
          ),
          name:
            professionalService.professional_name,
          lastname:
            professionalService.professional_lastname,
        },
        service: {
          id: Number(
            professionalService.appointment_type_id,
          ),
          name: professionalService.service_name,
          durationMinutes: duration,
        },
        blocked: true,
        reason: blockedDateResult.rows[0].reason,
        availableSlots: [],
      });
    }

    const selectedDate = new Date(
      `${date}T12:00:00`,
    );

    const dayOfWeek = selectedDate.getDay();

    const availabilityResult = await pool.query(
      `SELECT
         id,
         start_time,
         end_time
       FROM availability
       WHERE professional_id = $1
         AND day_of_week = $2
         AND active = true
       ORDER BY start_time`,
      [professionalId, dayOfWeek],
    );

    if (availabilityResult.rows.length === 0) {
      return res.json({
        date,
        professional: {
          id: Number(
            professionalService.professional_id,
          ),
          name:
            professionalService.professional_name,
          lastname:
            professionalService.professional_lastname,
        },
        service: {
          id: Number(
            professionalService.appointment_type_id,
          ),
          name: professionalService.service_name,
          durationMinutes: duration,
        },
        blocked: false,
        availableSlots: [],
      });
    }

    const appointmentsResult = await pool.query(
      `SELECT
         start_time,
         end_time
       FROM appointments
       WHERE professional_id = $1
         AND appointment_date = $2
         AND status IN ('scheduled', 'confirmed')
         AND COALESCE(is_overbooked, false) = false`,
      [professionalId, date],
    );

    const occupiedAppointments =
      appointmentsResult.rows.map(
        (appointment) => ({
          start: timeToMinutes(
            appointment.start_time,
          ),
          end: timeToMinutes(
            appointment.end_time,
          ),
        }),
      );

    const availableSlots = [];

    for (const availability of availabilityResult.rows) {
      const availabilityStart = timeToMinutes(
        availability.start_time,
      );

      const availabilityEnd = timeToMinutes(
        availability.end_time,
      );

      for (
        let current = availabilityStart;
        current + duration <= availabilityEnd;
        current += duration
      ) {
        const slotStart = current;
        const slotEnd = current + duration;

        const overlaps =
          occupiedAppointments.some(
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

    return res.json({
      date,
      professional: {
        id: Number(
          professionalService.professional_id,
        ),
        name:
          professionalService.professional_name,
        lastname:
          professionalService.professional_lastname,
      },
      service: {
        id: Number(
          professionalService.appointment_type_id,
        ),
        name: professionalService.service_name,
        durationMinutes: duration,
      },
      blocked: false,
      availableSlots,
    });
  } catch (error) {
    console.error(
      "Error obteniendo horarios disponibles:",
      error,
    );

    return res.status(500).json({
      message:
        "Error al obtener los horarios disponibles",
    });
  }
};

const isoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseIsoDate = (value) => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

const mondayOf = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);
  result.setHours(12, 0, 0, 0);

  return result;
};

const countOpenSlots = (
  availabilityRows,
  occupiedAppointments,
  duration,
) => {
  let openSlots = 0;

  for (const availability of availabilityRows) {
    const availabilityStart = timeToMinutes(
      availability.start_time,
    );
    const availabilityEnd = timeToMinutes(
      availability.end_time,
    );

    for (
      let current = availabilityStart;
      current + duration <= availabilityEnd;
      current += duration
    ) {
      const slotEnd = current + duration;
      const overlaps = occupiedAppointments.some(
        (appointment) =>
          current < appointment.end &&
          slotEnd > appointment.start,
      );

      if (!overlaps) {
        openSlots += 1;
      }
    }
  }

  return openSlots;
};

export const getAvailableWeek = async (req, res) => {
  try {
    const { appointmentTypeId, professionalId, from } = req.query;

    if (!appointmentTypeId || !professionalId) {
      return res.status(400).json({
        message: "Debes indicar servicio y profesional",
      });
    }

    if (!isPositiveInteger(appointmentTypeId) || !isPositiveInteger(professionalId)) {
      return res.status(400).json({
        message: "El servicio o el profesional no es válido",
      });
    }

    const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
    const start = dateFormat.test(from || "")
      ? mondayOf(parseIsoDate(from))
      : mondayOf(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const fromDate = isoDate(start);
    const toDate = isoDate(end);

    const professionalServiceResult = await pool.query(
      `SELECT at.duration_minutes
       FROM professionals p
       JOIN professional_services ps
         ON ps.professional_id = p.id
       JOIN appointment_types at
         ON at.id = ps.appointment_type_id
       WHERE p.id = $1
         AND at.id = $2
         AND p.active = true
         AND at.active = true`,
      [professionalId, appointmentTypeId],
    );

    if (professionalServiceResult.rows.length === 0) {
      return res.status(404).json({
        message: "El profesional no realiza el servicio seleccionado",
      });
    }

    const duration = Number(
      professionalServiceResult.rows[0].duration_minutes,
    );

    const [availabilityResult, blockedResult, appointmentsResult] =
      await Promise.all([
        pool.query(
          `SELECT day_of_week, start_time, end_time
           FROM availability
           WHERE professional_id = $1
             AND active = true`,
          [professionalId],
        ),
        pool.query(
          `SELECT date::text AS date
           FROM blocked_dates
           WHERE date BETWEEN $1 AND $2`,
          [fromDate, toDate],
        ),
        pool.query(
          `SELECT
             appointment_date::text AS appointment_date,
             start_time,
             end_time
           FROM appointments
           WHERE professional_id = $1
             AND appointment_date BETWEEN $2 AND $3
             AND status IN ('scheduled', 'confirmed')
             AND COALESCE(is_overbooked, false) = false`,
          [professionalId, fromDate, toDate],
        ),
      ]);

    const blockedDates = new Set(
      blockedResult.rows.map((row) => row.date),
    );

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);

      const iso = isoDate(date);
      const dayOfWeek = date.getDay();
      const dayAvailability = availabilityResult.rows.filter(
        (row) => Number(row.day_of_week) === dayOfWeek,
      );

      if (blockedDates.has(iso) || dayAvailability.length === 0) {
        return {
          date: iso,
          dayOfWeek,
          status: "closed",
        };
      }

      const occupiedAppointments = appointmentsResult.rows
        .filter((row) => row.appointment_date === iso)
        .map((row) => ({
          start: timeToMinutes(row.start_time),
          end: timeToMinutes(row.end_time),
        }));

      const openSlots = countOpenSlots(
        dayAvailability,
        occupiedAppointments,
        duration,
      );

      return {
        date: iso,
        dayOfWeek,
        status: openSlots > 0 ? "open" : "full",
      };
    });

    return res.json({
      from: fromDate,
      to: toDate,
      days,
    });
  } catch (error) {
    console.error("Error obteniendo la semana:", error);

    return res.status(500).json({
      message: "Error al obtener la semana",
    });
  }
};