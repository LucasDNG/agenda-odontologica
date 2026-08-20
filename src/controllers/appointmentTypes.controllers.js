import { pool } from "../db.js";

export const getAppointmentTypes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, duration_minutes, active
       FROM appointment_types
       WHERE active = true
       ORDER BY id`,
    );

    res.json({
      appointmentTypes: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener los servicios",
    });
  }
};