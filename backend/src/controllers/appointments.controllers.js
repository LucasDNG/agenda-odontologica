import { pool } from "../db.js";

const MAX_ACTIVE_APPOINTMENTS_PER_PATIENT = 1;

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

export const createAppointment = async (
  req,
  res,
) => {
  const client = await pool.connect();

  try {
    const patientId = req.userId;

    const {
      appointmentTypeId,
      professionalId,
      date,
      startTime,
      notes,
    } = req.body;

    if (
      !appointmentTypeId ||
      !professionalId ||
      !date ||
      !startTime
    ) {
      return res.status(400).json({
        message:
          "Debes indicar servicio, profesional, fecha y horario",
      });
    }

    const dateFormat =
      /^\d{4}-\d{2}-\d{2}$/;

    const timeFormat =
      /^\d{2}:\d{2}$/;

    if (!dateFormat.test(date)) {
      return res.status(400).json({
        message:
          "La fecha debe tener formato YYYY-MM-DD",
      });
    }

    if (!timeFormat.test(startTime)) {
      return res.status(400).json({
        message:
          "El horario debe tener formato HH:MM",
      });
    }

    if (
      !isPositiveInteger(
        appointmentTypeId,
      )
    ) {
      return res.status(400).json({
        message:
          "El servicio no es válido",
      });
    }

    if (
      !isPositiveInteger(
        professionalId,
      )
    ) {
      return res.status(400).json({
        message:
          "El profesional no es válido",
      });
    }

    const selectedDateTime =
      new Date(
        `${date}T${startTime}:00`,
      );

    if (
      Number.isNaN(
        selectedDateTime.getTime(),
      )
    ) {
      return res.status(400).json({
        message:
          "La fecha u horario no son válidos",
      });
    }

    if (
      selectedDateTime <=
      new Date()
    ) {
      return res.status(400).json({
        message:
          "No podés reservar un turno en una fecha u horario pasado",
      });
    }

    await client.query("BEGIN");

    const userResult =
      await client.query(
        `
          SELECT
            id,
            role
          FROM users
          WHERE id = $1
          FOR UPDATE
        `,
        [patientId],
      );

    if (
      userResult.rows.length ===
      0
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(404).json({
        message:
          "Usuario no encontrado",
      });
    }

    if (
      userResult.rows[0].role !==
      "patient"
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(403).json({
        message:
          "Solo los pacientes pueden reservar turnos",
      });
    }

    const activeAppointmentsResult =
      await client.query(
        `
          SELECT COUNT(*)::INTEGER AS total
          FROM appointments
          WHERE patient_id = $1
            AND status IN (
              'scheduled',
              'confirmed'
            )
            AND (
              appointment_date > CURRENT_DATE
              OR (
                appointment_date = CURRENT_DATE
                AND start_time > CURRENT_TIME
              )
            )
        `,
        [patientId],
      );

    const activeAppointments =
      Number(
        activeAppointmentsResult
          .rows[0]?.total || 0,
      );

    if (
      activeAppointments >=
      MAX_ACTIVE_APPOINTMENTS_PER_PATIENT
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(409).json({
        code:
          "ACTIVE_APPOINTMENT_LIMIT",
        message:
          "Ya tenés un turno activo. Para reservar otro, primero cancelá o completá el turno actual.",
        maxActiveAppointments:
          MAX_ACTIVE_APPOINTMENTS_PER_PATIENT,
      });
    }

    const exactDuplicateResult =
      await client.query(
        `
          SELECT id
          FROM appointments
          WHERE patient_id = $1
            AND professional_id = $2
            AND appointment_date = $3
            AND start_time = $4
            AND status IN (
              'scheduled',
              'confirmed'
            )
          LIMIT 1
        `,
        [
          patientId,
          professionalId,
          date,
          startTime,
        ],
      );

    if (
      exactDuplicateResult.rows
        .length > 0
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(409).json({
        code:
          "DUPLICATE_APPOINTMENT",
        message:
          "Ya tenés reservado ese turno.",
      });
    }

    const professionalServiceResult =
      await client.query(
        `
          SELECT
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
            AND p.active = TRUE
            AND at.active = TRUE
        `,
        [
          professionalId,
          appointmentTypeId,
        ],
      );

    if (
      professionalServiceResult.rows
        .length === 0
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(400).json({
        message:
          "El profesional no realiza el servicio seleccionado",
      });
    }

    const professionalService =
      professionalServiceResult.rows[0];

    const duration = Number(
      professionalService
        .duration_minutes,
    );

    const startMinutes =
      timeToMinutes(startTime);

    const endMinutes =
      startMinutes + duration;

    if (
      startMinutes < 0 ||
      startMinutes >=
        24 * 60 ||
      endMinutes >
        24 * 60
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(400).json({
        message:
          "El horario no es válido",
      });
    }

    const endTime =
      minutesToTime(endMinutes);

    const blockedDateResult =
      await client.query(
        `
          SELECT reason
          FROM blocked_dates
          WHERE date = $1
          LIMIT 1
        `,
        [date],
      );

    if (
      blockedDateResult.rows
        .length > 0
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(400).json({
        message:
          "La fecha seleccionada no está disponible",
        reason:
          blockedDateResult.rows[0]
            .reason,
      });
    }

    const selectedDate =
      new Date(
        `${date}T12:00:00`,
      );

    const dayOfWeek =
      selectedDate.getDay();

    const availabilityResult =
      await client.query(
        `
          SELECT
            start_time,
            end_time
          FROM availability
          WHERE professional_id = $1
            AND day_of_week = $2
            AND active = TRUE
          ORDER BY start_time
        `,
        [
          professionalId,
          dayOfWeek,
        ],
      );

    if (
      availabilityResult.rows
        .length === 0
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(400).json({
        message:
          "El profesional no atiende en la fecha seleccionada",
      });
    }

    const fitsAvailability =
      availabilityResult.rows.some(
        (availability) => {
          const availabilityStart =
            timeToMinutes(
              availability.start_time,
            );

          const availabilityEnd =
            timeToMinutes(
              availability.end_time,
            );

          return (
            startMinutes >=
              availabilityStart &&
            endMinutes <=
              availabilityEnd
          );
        },
      );

    if (!fitsAvailability) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(400).json({
        message:
          "El horario seleccionado no está disponible",
      });
    }

    const overlappingResult =
      await client.query(
        `
          SELECT id
          FROM appointments
          WHERE professional_id = $1
            AND appointment_date = $2
            AND status IN (
              'scheduled',
              'confirmed'
            )
            AND COALESCE(
              is_overbooked,
              FALSE
            ) = FALSE
            AND start_time < $3
            AND end_time > $4
          LIMIT 1
          FOR UPDATE
        `,
        [
          professionalId,
          date,
          endTime,
          startTime,
        ],
      );

    if (
      overlappingResult.rows
        .length > 0
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(409).json({
        code:
          "SLOT_UNAVAILABLE",
        message:
          "Ese horario ya no está disponible",
      });
    }

    const result =
      await client.query(
        `
          INSERT INTO appointments
          (
            patient_id,
            professional_id,
            appointment_type_id,
            appointment_date,
            start_time,
            end_time,
            notes,
            is_overbooked
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            FALSE
          )
          RETURNING
            id,
            patient_id,
            professional_id,
            appointment_type_id,
            TO_CHAR(
              appointment_date,
              'DD/MM/YYYY'
            ) AS appointment_date,
            start_time,
            end_time,
            status,
            notes,
            is_overbooked,
            created_at
        `,
        [
          patientId,
          professionalId,
          appointmentTypeId,
          date,
          startTime,
          endTime,
          notes?.trim() ||
            null,
        ],
      );

    await client.query(
      "COMMIT",
    );

    return res.status(201).json({
      message:
        "Turno reservado correctamente",
      appointment:
        result.rows[0],
      service:
        professionalService
          .service_name,
      professional: {
        id: Number(
          professionalService
            .professional_id,
        ),
        name:
          professionalService
            .professional_name,
        lastname:
          professionalService
            .professional_lastname,
      },
    });
  } catch (error) {
    try {
      await client.query(
        "ROLLBACK",
      );
    } catch {
      // La transacción puede no haber iniciado.
    }

    console.error(
      "Error reservando turno:",
      error,
    );

    return res.status(500).json({
      message:
        "Error al reservar el turno",
    });
  } finally {
    client.release();
  }
};

export const getMyAppointments = async (
  req,
  res,
) => {
  try {
    const patientId =
      req.userId;

    const upcomingResult =
      await pool.query(
        `
          SELECT
            a.id,
            TO_CHAR(
              a.appointment_date,
              'DD/MM/YYYY'
            ) AS appointment_date,
            a.start_time,
            a.end_time,
            a.status,
            a.notes,
            a.professional_id,
            at.name AS service,
            at.duration_minutes,
            p.name AS professional_name,
            p.lastname AS professional_lastname,
            p.specialty AS professional_specialty
          FROM appointments a
          JOIN appointment_types at
            ON a.appointment_type_id = at.id
          LEFT JOIN professionals p
            ON p.id = a.professional_id
          WHERE a.patient_id = $1
            AND a.status IN (
              'scheduled',
              'confirmed'
            )
            AND (
              a.appointment_date > CURRENT_DATE
              OR (
                a.appointment_date = CURRENT_DATE
                AND a.start_time > CURRENT_TIME
              )
            )
          ORDER BY
            a.appointment_date,
            a.start_time
        `,
        [patientId],
      );

    const historyResult =
      await pool.query(
        `
          SELECT
            a.id,
            TO_CHAR(
              a.appointment_date,
              'DD/MM/YYYY'
            ) AS appointment_date,
            a.start_time,
            a.end_time,
            a.status,
            a.notes,
            a.professional_id,
            at.name AS service,
            at.duration_minutes,
            p.name AS professional_name,
            p.lastname AS professional_lastname,
            p.specialty AS professional_specialty
          FROM appointments a
          JOIN appointment_types at
            ON a.appointment_type_id = at.id
          LEFT JOIN professionals p
            ON p.id = a.professional_id
          WHERE a.patient_id = $1
            AND (
              a.status IN (
                'cancelled',
                'completed',
                'absent'
              )
              OR a.appointment_date < CURRENT_DATE
              OR (
                a.appointment_date = CURRENT_DATE
                AND a.end_time <= CURRENT_TIME
              )
            )
          ORDER BY
            a.appointment_date DESC,
            a.start_time DESC
        `,
        [patientId],
      );

    return res.json({
      upcomingAppointments:
        upcomingResult.rows,
      history:
        historyResult.rows,
      limits: {
        maxActiveAppointments:
          MAX_ACTIVE_APPOINTMENTS_PER_PATIENT,
      },
    });
  } catch (error) {
    console.error(
      "Error obteniendo turnos del paciente:",
      error,
    );

    return res.status(500).json({
      message:
        "Error al obtener los turnos",
    });
  }
};