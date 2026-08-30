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

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "scheduled",
      "confirmed",
      "cancelled",
      "completed",
      "absent",
    ];

    if (!status) {
      return res.status(400).json({
        message: "Debes indicar el estado del turno",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Estado de turno inválido",
      });
    }

    const result = await pool.query(
      `UPDATE appointments
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING
         id,
         TO_CHAR(appointment_date, 'DD/MM/YYYY') AS appointment_date,
         start_time,
         end_time,
         status,
         notes,
         updated_at`,
      [status, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Turno no encontrado",
      });
    }

    res.json({
      message: "Estado del turno actualizado correctamente",
      appointment: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al actualizar el estado del turno",
    });
  }
};