import { pool } from "../db.js";

export const getBlockedDates = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, date, reason, created_at
       FROM blocked_dates
       ORDER BY date`,
    );

    res.json({
      blockedDates: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener las fechas bloqueadas",
    });
  }
};