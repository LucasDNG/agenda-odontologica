import { pool } from "../db.js";

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    mins,
  ).padStart(2, "0")}`;
};

export const getPatientsForAppointments = async (
  req,
  res,
) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        lastname,
        email,
        phone
      FROM users
      WHERE role = 'patient'
      ORDER BY lastname, name
    `);

    res.json({
      patients: result.rows,
    });
  } catch (error) {
    console.error("Error obteniendo pacientes:", error);

    res.status(500).json({
      message: "Error al obtener los pacientes",
    });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const result = await pool.query(`
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

        u.id AS patient_id,
        u.name AS patient_name,
        u.lastname AS patient_lastname,
        u.email AS patient_email,
        u.phone AS patient_phone,

        at.id AS appointment_type_id,
        at.name AS service,
        at.duration_minutes,

        p.id AS professional_id,
        p.name AS professional_name,
        p.lastname AS professional_lastname,
        p.specialty AS professional_specialty

      FROM appointments a

      JOIN users u
        ON a.patient_id = u.id

      JOIN appointment_types at
        ON a.appointment_type_id = at.id

      LEFT JOIN professionals p
        ON a.professional_id = p.id

      ORDER BY
        a.appointment_date,
        a.start_time,
        a.is_overbooked
    `);

    res.json({
      appointments: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener los turnos",
    });
  }
};

export const createOverbookedAppointment = async (
  req,
  res,
) => {
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

    const patientResult = await pool.query(
      `
        SELECT
          id,
          name,
          lastname,
          role
        FROM users
        WHERE id = $1
      `,
      [patientId],
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        message: "Paciente no encontrado",
      });
    }

    if (patientResult.rows[0].role !== "patient") {
      return res.status(400).json({
        message:
          "El usuario seleccionado no es un paciente",
      });
    }

    const professionalResult = await pool.query(
      `
        SELECT
          id,
          name,
          lastname
        FROM professionals
        WHERE id = $1
          AND active = true
      `,
      [professionalId],
    );

    if (professionalResult.rows.length === 0) {
      return res.status(404).json({
        message: "Profesional no encontrado",
      });
    }

    const serviceResult = await pool.query(
      `
        SELECT
          at.id,
          at.name,
          at.duration_minutes
        FROM appointment_types at

        JOIN professional_services ps
          ON ps.appointment_type_id = at.id

        WHERE at.id = $1
          AND ps.professional_id = $2
          AND at.active = true
      `,
      [appointmentTypeId, professionalId],
    );

    if (serviceResult.rows.length === 0) {
      return res.status(400).json({
        message:
          "El profesional seleccionado no realiza ese servicio",
      });
    }

    const service = serviceResult.rows[0];

    const startMinutes = timeToMinutes(startTime);
    const endMinutes =
      startMinutes + service.duration_minutes;

    if (endMinutes > 24 * 60) {
      return res.status(400).json({
        message:
          "El turno no puede finalizar después de las 24:00",
      });
    }

    const endTime = minutesToTime(endMinutes);

    const result = await pool.query(
      `
        INSERT INTO appointments
        (
          patient_id,
          professional_id,
          appointment_type_id,
          appointment_date,
          start_time,
          end_time,
          status,
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
          'confirmed',
          $7,
          TRUE
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
        notes || null,
      ],
    );

    res.status(201).json({
      message: "Sobreturno creado correctamente",
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error("Error creando sobreturno:", error);

    res.status(500).json({
      message: "Error al crear el sobreturno",
    });
  }
};

export const updateAppointmentStatus = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "scheduled",
      "confirmed",
      "cancelled",
      "completed",
      "absent",
    ];

    if (!status) {
      return res.status(400).json({
        message: "Debes indicar el estado del turno",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Estado de turno inválido",
      });
    }

    const result = await pool.query(
      `
        UPDATE appointments
        SET
          status = $1,
          updated_at = CURRENT_TIMESTAMP
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
          professional_id,
          updated_at
      `,
      [status, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Turno no encontrado",
      });
    }

    res.json({
      message:
        "Estado del turno actualizado correctamente",
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error al actualizar el estado del turno",
    });
  }
};