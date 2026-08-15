import { pool } from "../db.js";

export const getAvailability = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, day_of_week, start_time, end_time, active
       FROM availability
       WHERE active = true
       ORDER BY day_of_week, start_time`,
    );

    res.json({
      availability: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener la disponibilidad",
    });
  }
};