import { pool } from "../db.js";

export const getPatients = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id, u.name, u.lastname, u.email, u.phone, u.max_active_appointments,
        COUNT(a.id) FILTER (
          WHERE a.appointment_date >= CURRENT_DATE AND a.status = 'confirmed'
        )::int AS active_appointments
      FROM users u
      LEFT JOIN appointments a ON a.patient_id = u.id
      WHERE u.role = 'patient'
      GROUP BY u.id
      ORDER BY u.lastname, u.name
    `);

    res.json({ patients: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener pacientes" });
  }
};

export const updateAppointmentLimit = async (req, res) => {
  try {
    const { maxActiveAppointments } = req.body;
    if (!Number.isInteger(maxActiveAppointments) || maxActiveAppointments < 1 || maxActiveAppointments > 10) {
      return res.status(400).json({ message: "El límite debe ser entre 1 y 10" });
    }

    const result = await pool.query(
      `UPDATE users SET max_active_appointments = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND role = 'patient'
       RETURNING id, name, lastname, email, phone, max_active_appointments`,
      [maxActiveAppointments, req.params.id],
    );

    if (!result.rows[0]) return res.status(404).json({ message: "Paciente no encontrado" });

    res.json({ message: "Autorización actualizada", patient: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar autorización" });
  }
};
