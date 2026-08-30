import { pool } from "../db.js";

export const getClinics = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        phone,
        email,
        address,
        active,
        created_at,
        updated_at
      FROM clinics
      ORDER BY name
    `);

    res.json({
      clinics: result.rows,
    });
  } catch (error) {
    console.error("Error obteniendo consultorios:", error);

    res.status(500).json({
      message: "Error al obtener los consultorios",
    });
  }
};

export const createClinic = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "El nombre del consultorio es obligatorio",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO clinics
          (name, phone, email, address)
        VALUES
          ($1, $2, $3, $4)
        RETURNING *
      `,
      [
        name.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
      ],
    );

    res.status(201).json({
      message: "Consultorio creado correctamente",
      clinic: result.rows[0],
    });
  } catch (error) {
    console.error("Error creando consultorio:", error);

    res.status(500).json({
      message: "Error al crear el consultorio",
    });
  }
};

export const updateClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, active } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "El nombre del consultorio es obligatorio",
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
          updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `,
      [
        name.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        address?.trim() || null,
        active !== false,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Consultorio no encontrado",
      });
    }

    res.json({
      message: "Consultorio actualizado correctamente",
      clinic: result.rows[0],
    });
  } catch (error) {
    console.error("Error actualizando consultorio:", error);

    res.status(500).json({
      message: "Error al actualizar el consultorio",
    });
  }
};