import { pool } from "../db.js";

const OVERBOOKED_SLOT_MINUTES = 15;

const timeToMinutes = (time) => {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(
    minutes / 60,
  );

  const mins =
    minutes % 60;

  return `${String(hours).padStart(
    2,
    "0",
  )}:${String(mins).padStart(
    2,
    "0",
  )}`;
};

const isValidDate = (date) =>
  /^\d{4}-\d{2}-\d{2}$/.test(
    date,
  );

const isValidTime = (time) =>
  /^\d{2}:\d{2}$/.test(
    time,
  );

const getDayOfWeek = (
  date,
) => {
  const dateObject =
    new Date(
      `${date}T12:00:00`,
    );

  return dateObject.getDay();
};

export const getAllAppointments =
  async (req, res) => {
    try {
      const result =
        await pool.query(`
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
            a.is_overbooked,
            a.delay_minutes,

            p.id AS patient_record_id,
            p.name AS patient_name,
            p.lastname AS patient_lastname,
            p.email AS patient_email,
            p.phone AS patient_phone,

            at.id AS appointment_type_id,
            at.name AS service,
            at.duration_minutes,

            pr.id AS professional_id,
            pr.name AS professional_name,
            pr.lastname AS professional_lastname,
            pr.specialty AS professional_specialty

          FROM appointments a

          JOIN patients p
            ON a.patient_record_id = p.id

          JOIN appointment_types at
            ON a.appointment_type_id = at.id

          LEFT JOIN professionals pr
            ON a.professional_id = pr.id

          ORDER BY
            a.appointment_date,
            a.start_time,
            a.is_overbooked
        `);

      return res.json({
        appointments:
          result.rows,
      });
    } catch (error) {
      console.error(
        "Error obteniendo turnos:",
        error,
      );

      return res.status(500).json({
        message:
          "Error al obtener los turnos",
      });
    }
  };

export const createOverbookedAppointment =
  async (req, res) => {
    try {
      const {
        patientId,
        professionalId,
        appointmentTypeId,
        date,
        startTime,
        notes,
      } = req.body;

      if (
        !patientId ||
        !professionalId ||
        !appointmentTypeId ||
        !date ||
        !startTime
      ) {
        return res.status(400).json({
          message:
            "Debes indicar paciente, profesional, servicio, fecha y horario",
        });
      }

      if (
        !isValidDate(date)
      ) {
        return res.status(400).json({
          message:
            "La fecha debe tener formato YYYY-MM-DD",
        });
      }

      if (
        !isValidTime(
          startTime,
        )
      ) {
        return res.status(400).json({
          message:
            "El horario debe tener formato HH:MM",
        });
      }

      const patientResult =
        await pool.query(
          `
            SELECT
              id,
              user_id,
              name,
              lastname,
              phone,
              email

            FROM patients

            WHERE id = $1
              AND active = TRUE
          `,
          [patientId],
        );

      if (
        patientResult.rows
          .length === 0
      ) {
        return res.status(404).json({
          message:
            "Paciente no encontrado",
        });
      }

      const patient =
        patientResult.rows[0];

      const professionalResult =
        await pool.query(
          `
            SELECT
              id,
              name,
              lastname

            FROM professionals

            WHERE id = $1
              AND active = TRUE
          `,
          [professionalId],
        );

      if (
        professionalResult.rows
          .length === 0
      ) {
        return res.status(404).json({
          message:
            "Profesional no encontrado",
        });
      }

      const serviceResult =
        await pool.query(
          `
            SELECT
              at.id,
              at.name,
              at.duration_minutes

            FROM appointment_types at

            JOIN professional_services ps
              ON ps.appointment_type_id =
                at.id

            WHERE at.id = $1
              AND ps.professional_id = $2
              AND at.active = TRUE
          `,
          [
            appointmentTypeId,
            professionalId,
          ],
        );

      if (
        serviceResult.rows
          .length === 0
      ) {
        return res.status(400).json({
          message:
            "El profesional seleccionado no realiza ese servicio",
        });
      }

      const service =
        serviceResult.rows[0];

      const serviceDuration =
        Number(
          service.duration_minutes,
        );

      const delayMinutes =
        Math.max(
          serviceDuration -
            OVERBOOKED_SLOT_MINUTES,
          0,
        );

      const startMinutes =
        timeToMinutes(
          startTime,
        );

      const endMinutes =
        startMinutes +
        serviceDuration;

      if (
        endMinutes >
        24 * 60
      ) {
        return res.status(400).json({
          message:
            "El turno no puede finalizar después de las 24:00",
        });
      }

      const endTime =
        minutesToTime(
          endMinutes,
        );

      const result =
        await pool.query(
          `
            INSERT INTO appointments
            (
              patient_id,
              patient_record_id,
              professional_id,
              appointment_type_id,
              appointment_date,
              start_time,
              end_time,
              status,
              notes,
              is_overbooked,
              delay_minutes
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
              'confirmed',
              $8,
              TRUE,
              $9
            )

            RETURNING
              id,
              patient_id,
              patient_record_id,
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
              delay_minutes,
              created_at
          `,
          [
            patient.user_id ||
              null,

            patient.id,

            professionalId,

            appointmentTypeId,

            date,

            startTime,

            endTime,

            notes || null,

            delayMinutes,
          ],
        );

      return res.status(201).json({
        message:
          "Sobreturno creado correctamente",

        appointment:
          result.rows[0],

        patient,

        professional:
          professionalResult
            .rows[0],

        service:
          service.name,

        delayMinutes,
      });
    } catch (error) {
      console.error(
        "Error creando sobreturno:",
        error,
      );

      return res.status(500).json({
        message:
          "Error al crear el sobreturno",
      });
    }
  };

export const updateAppointmentStatus =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const { status } =
        req.body;

      const allowedStatuses = [
        "scheduled",
        "confirmed",
        "cancelled",
        "completed",
        "absent",
      ];

      if (!status) {
        return res.status(400).json({
          message:
            "Debes indicar el estado del turno",
        });
      }

      if (
        !allowedStatuses.includes(
          status,
        )
      ) {
        return res.status(400).json({
          message:
            "Estado de turno inválido",
        });
      }

      const result =
        await pool.query(
          `
            UPDATE appointments

            SET
              status = $1,
              updated_at =
                CURRENT_TIMESTAMP

            WHERE id = $2

            RETURNING
              id,

              TO_CHAR(
                appointment_date,
                'DD/MM/YYYY'
              ) AS appointment_date,

              start_time,
              end_time,
              status,
              notes,
              is_overbooked,
              delay_minutes,
              professional_id,
              patient_record_id,
              updated_at
          `,
          [status, id],
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          message:
            "Turno no encontrado",
        });
      }

      return res.json({
        message:
          "Estado del turno actualizado correctamente",

        appointment:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        error,
      );

      return res.status(500).json({
        message:
          "Error al actualizar el estado del turno",
      });
    }
  };

export const rescheduleAppointment =
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const { id } =
        req.params;

      const {
        date,
        startTime,
      } = req.body;

      const numericId =
        Number(id);

      if (
        !Number.isInteger(
          numericId,
        ) ||
        numericId <= 0
      ) {
        return res.status(400).json({
          message:
            "Turno inválido",
        });
      }

      if (
        !date ||
        !startTime
      ) {
        return res.status(400).json({
          message:
            "Debes indicar fecha y horario",
        });
      }

      if (
        !isValidDate(date)
      ) {
        return res.status(400).json({
          message:
            "La fecha debe tener formato YYYY-MM-DD",
        });
      }

      if (
        !isValidTime(
          startTime,
        )
      ) {
        return res.status(400).json({
          message:
            "El horario debe tener formato HH:MM",
        });
      }

      await client.query(
        "BEGIN",
      );

      const appointmentResult =
        await client.query(
          `
            SELECT
              a.id,
              a.status,
              a.professional_id,
              a.appointment_type_id,
              a.is_overbooked,
              at.duration_minutes,
              at.name AS service_name

            FROM appointments a

            JOIN appointment_types at
              ON at.id =
                a.appointment_type_id

            WHERE a.id = $1

            FOR UPDATE
          `,
          [numericId],
        );

      if (
        appointmentResult.rows
          .length === 0
      ) {
        await client.query(
          "ROLLBACK",
        );

        return res.status(404).json({
          message:
            "Turno no encontrado",
        });
      }

      const appointment =
        appointmentResult.rows[0];

      if (
        [
          "cancelled",
          "completed",
          "absent",
        ].includes(
          appointment.status,
        )
      ) {
        await client.query(
          "ROLLBACK",
        );

        return res.status(409).json({
          message:
            "Este turno ya no puede reprogramarse",
        });
      }

      const professionalResult =
        await client.query(
          `
            SELECT id

            FROM professionals

            WHERE id = $1
              AND active = TRUE
          `,
          [
            appointment.professional_id,
          ],
        );

      if (
        professionalResult.rows
          .length === 0
      ) {
        await client.query(
          "ROLLBACK",
        );

        return res.status(409).json({
          message:
            "El profesional de este turno ya no está activo",
        });
      }

      const serviceResult =
        await client.query(
          `
            SELECT
              at.id,
              at.duration_minutes

            FROM appointment_types at

            JOIN professional_services ps
              ON
                ps.appointment_type_id =
                  at.id

            WHERE
              at.id = $1
              AND
              ps.professional_id = $2
              AND
              at.active = TRUE
          `,
          [
            appointment.appointment_type_id,
            appointment.professional_id,
          ],
        );

      if (
        serviceResult.rows
          .length === 0
      ) {
        await client.query(
          "ROLLBACK",
        );

        return res.status(409).json({
          message:
            "El profesional ya no tiene asignado este servicio",
        });
      }

      const duration =
        Number(
          serviceResult.rows[0]
            .duration_minutes,
        );

      const startMinutes =
        timeToMinutes(
          startTime,
        );

      const endMinutes =
        startMinutes +
        duration;

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
            "Horario inválido",
        });
      }

      const endTime =
        minutesToTime(
          endMinutes,
        );

      const isOverbooked =
        appointment.is_overbooked ===
        true;

      if (!isOverbooked) {
        const dayOfWeek =
          getDayOfWeek(
            date,
          );

        const availabilityResult =
          await client.query(
            `
              SELECT id

              FROM availability

              WHERE
                professional_id = $1
                AND day_of_week = $2
                AND active = TRUE
                AND start_time <= $3
                AND end_time >= $4

              LIMIT 1
            `,
            [
              appointment.professional_id,
              dayOfWeek,
              startTime,
              endTime,
            ],
          );

        if (
          availabilityResult.rows
            .length === 0
        ) {
          await client.query(
            "ROLLBACK",
          );

          return res.status(409).json({
            message:
              "El nuevo horario está fuera de la disponibilidad del profesional",
          });
        }

        const conflictResult =
          await client.query(
            `
              SELECT id

              FROM appointments

              WHERE
                professional_id = $1
                AND appointment_date = $2
                AND id <> $3
                AND status IN (
                  'scheduled',
                  'confirmed'
                )
                AND COALESCE(
                  is_overbooked,
                  FALSE
                ) = FALSE
                AND start_time < $4
                AND end_time > $5

              LIMIT 1
            `,
            [
              appointment.professional_id,
              date,
              numericId,
              endTime,
              startTime,
            ],
          );

        if (
          conflictResult.rows
            .length > 0
        ) {
          await client.query(
            "ROLLBACK",
          );

          return res.status(409).json({
            message:
              "Ese horario ya está ocupado",
          });
        }
      }

      const delayMinutes =
        isOverbooked
          ? Math.max(
              duration -
                OVERBOOKED_SLOT_MINUTES,
              0,
            )
          : 0;

      const updateResult =
        await client.query(
          `
            UPDATE appointments

            SET
              appointment_date = $1,
              start_time = $2,
              end_time = $3,
              delay_minutes = $4,
              updated_at =
                CURRENT_TIMESTAMP

            WHERE id = $5

            RETURNING
              id,

              TO_CHAR(
                appointment_date,
                'DD/MM/YYYY'
              ) AS appointment_date,

              start_time,
              end_time,
              status,
              notes,
              professional_id,
              appointment_type_id,
              patient_record_id,
              is_overbooked,
              delay_minutes,
              updated_at
          `,
          [
            date,
            startTime,
            endTime,
            delayMinutes,
            numericId,
          ],
        );

      await client.query(
        "COMMIT",
      );

      return res.json({
        message:
          "Turno reprogramado correctamente",

        appointment:
          updateResult.rows[0],
      });
    } catch (error) {
      await client.query(
        "ROLLBACK",
      );

      console.error(
        "Error reprogramando turno:",
        error,
      );

      return res.status(500).json({
        message:
          "Error al reprogramar el turno",
      });
    } finally {
      client.release();
    }
  };