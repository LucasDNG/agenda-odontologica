import { pool } from "../db.js";

export const getAllServices = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM appointment_types ORDER BY id");
    res.json({ services: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener servicios" });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, durationMinutes } = req.body;
    if (!name || !Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      return res.status(400).json({ message: "Nombre y duración válidos son obligatorios" });
    }

    const result = await pool.query(
      `INSERT INTO appointment_types (name, duration_minutes, active)
       VALUES ($1, $2, true) RETURNING *`,
      [name.trim(), durationMinutes],
    );
    res.status(201).json({ message: "Servicio creado", service: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear servicio" });
  }
};

export const updateService = async (req, res) => {
  try {
    const { name, durationMinutes, active } = req.body;
    const result = await pool.query(
      `UPDATE appointment_types SET
        name = COALESCE($1, name),
        duration_minutes = COALESCE($2, duration_minutes),
        active = COALESCE($3, active)
       WHERE id = $4 RETURNING *`,
      [name ?? null, durationMinutes ?? null, active ?? null, req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ message: "Servicio no encontrado" });
    res.json({ message: "Servicio actualizado", service: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar servicio" });
  }
};
