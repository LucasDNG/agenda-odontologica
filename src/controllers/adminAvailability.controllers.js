import { pool } from "../db.js";

export const getAllAvailability = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM availability ORDER BY day_of_week, start_time");
    res.json({ availability: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener horarios" });
  }
};

export const createAvailability = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;
    if (dayOfWeek === undefined || !startTime || !endTime || startTime >= endTime) {
      return res.status(400).json({ message: "Datos de horario inválidos" });
    }

    const result = await pool.query(
      `INSERT INTO availability (day_of_week, start_time, end_time, active)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [dayOfWeek, startTime, endTime],
    );
    res.status(201).json({ message: "Horario creado", availability: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear horario" });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, active } = req.body;
    const result = await pool.query(
      `UPDATE availability SET
        day_of_week = COALESCE($1, day_of_week),
        start_time = COALESCE($2, start_time),
        end_time = COALESCE($3, end_time),
        active = COALESCE($4, active)
       WHERE id = $5 RETURNING *`,
      [dayOfWeek ?? null, startTime ?? null, endTime ?? null, active ?? null, req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ message: "Horario no encontrado" });
    res.json({ message: "Horario actualizado", availability: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar horario" });
  }
};

export const deleteAvailability = async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM availability WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: "Horario no encontrado" });
    res.json({ message: "Horario eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar horario" });
  }
};
