import { pool } from "../db.js";

export const getClinics = async (
  req,
  res,
) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        phone,
        email,
        address,
        active,
        max_active_appointments_per_patient,
        created_at,
        updated_at
      FROM clinics
      ORDER BY name
    `);

    return res.json({
      clinics: result.rows,
    });
  } catch (error) {
    console.error(
      "Error obteniendo consultorios:",
      error,
    );

    return res.status(500).json({
      message:
        "Error al obtener los consultorios",
    });
  }
};

export const createClinic = async (
  req,
  res,
) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      maxActiveAppointmentsPerPatient,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message:
          "El nombre del consultorio es obligatorio",
      });
    }

    const maxAppointments =
      Number(
        maxActiveAppointmentsPerPatient ||
          1,
      );

    if (
      !Number.isInteger(
        maxAppointments,
      ) ||
      maxAppointments < 1 ||
      maxAppointments > 5
    ) {
      return res.status(400).json({
        message:
          "El límite de turnos debe estar entre 1 y 5",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO clinics
        (
          name,
          phone,
          email,
          address,
          max_active_appointments_per_patient
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        RETURNING *
      `,
      [
        name.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
        maxAppointments,
      ],
    );

    return res.status(201).json({
      message:
        "Consultorio creado correctamente",
      clinic: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Error creando consultorio:",
      error,
    );

    return res.status(500).json({
      message:
        "Error al crear el consultorio",
    });
  }
};

export const updateClinic = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    const {
      name,
      phone,
      email,
      address,
      active,
      maxActiveAppointmentsPerPatient,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message:
          "El nombre del consultorio es obligatorio",
      });
    }

    const maxAppointments =
      Number(
        maxActiveAppointmentsPerPatient,
      );

    if (
      !Number.isInteger(
        maxAppointments,
      ) ||
      maxAppointments < 1 ||
      maxAppointments > 5
    ) {
      return res.status(400).json({
        message:
          "El límite de turnos debe estar entre 1 y 5",
      });
    }

    const result = await pool.query(
      `
        UPDATE clinics
        SET
          name = $1,
          phone = $2,
          email = $3,
          address = $4,
          active = $5,
          max_active_appointments_per_patient = $6,
          updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `,
      [
        name.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
        active !== false,
        maxAppointments,
        id,
      ],
    );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          "Consultorio no encontrado",
      });
    }

    return res.json({
      message:
        "Configuración actualizada correctamente",
      clinic: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Error actualizando consultorio:",
      error,
    );

    return res.status(500).json({
      message:
        "Error al actualizar el consultorio",
    });
  }
};