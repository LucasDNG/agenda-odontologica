import { pool } from "../db.js";

export const getBlockedDates = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, TO_CHAR(date, 'DD/MM/YYYY') AS date, reason FROM blocked_dates ORDER BY date",
    );
    res.json({ blockedDates: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener fechas bloqueadas" });
  }
};

export const createBlockedDate = async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date) return res.status(400).json({ message: "Debes indicar una fecha" });

    const result = await pool.query(
      `INSERT INTO blocked_dates (date, reason)
       VALUES ($1, $2)
       ON CONFLICT (date) DO NOTHING
       RETURNING id, TO_CHAR(date, 'DD/MM/YYYY') AS date, reason`,
      [date, reason || "Día no disponible"],
    );

    if (!result.rows[0]) {
      return res.status(409).json({ message: "La fecha ya está bloqueada" });
    }

    res.status(201).json({ message: "Fecha bloqueada", blockedDate: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al bloquear la fecha" });
  }
};

export const deleteBlockedDate = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM blocked_dates WHERE id = $1 RETURNING id",
      [req.params.id],
    );
    if (!result.rows[0]) return res.status(404).json({ message: "Fecha no encontrada" });
    res.json({ message: "Fecha desbloqueada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al desbloquear la fecha" });
  }
};
