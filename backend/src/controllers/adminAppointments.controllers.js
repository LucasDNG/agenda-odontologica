import { pool } from "../db.js";

export const getAllAppointments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         a.id,
         TO_CHAR(a.appointment_date, 'DD/MM/YYYY') AS appointment_date,
         a.start_time,
         a.end_time,
         a.status,
         a.notes,

         u.id AS patient_id,
         u.name AS patient_name,
         u.lastname AS patient_lastname,
         u.email AS patient_email,
         u.phone AS patient_phone,

         at.id AS appointment_type_id,
         at.name AS service,
         at.duration_minutes

       FROM appointments a

       JOIN users u
         ON a.patient_id = u.id

       JOIN appointment_types at
         ON a.appointment_type_id = at.id

       ORDER BY
         a.appointment_date,
         a.start_time`,
    );

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