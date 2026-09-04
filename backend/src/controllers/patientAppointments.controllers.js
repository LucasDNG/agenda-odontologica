import { pool } from "../db.js";

export const cancelMyAppointment = async (
  req,
  res,
) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({
        message: "Turno inválido",
      });
    }

    await client.query("BEGIN");

    const appointmentResult =
      await client.query(
        `
          SELECT
            a.id,
            a.patient_id,
            a.professional_id,
            a.appointment_date,
            a.start_time,
            a.end_time,
            a.status,
            a.is_overbooked,
            at.name AS service,
            p.name AS professional_name,
            p.lastname AS professional_lastname
          FROM appointments a
          LEFT JOIN appointment_types at
            ON at.id = a.appointment_type_id
          LEFT JOIN professionals p
            ON p.id = a.professional_id
          WHERE a.id = $1
            AND a.patient_id = $2
          FOR UPDATE
        `,
        [
          Number(id),
          req.userId,
        ],
      );

    if (
      appointmentResult.rows.length ===
      0
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(404).json({
        message:
          "Turno no encontrado",
      });
    }

    const appointment =
      appointmentResult.rows[0];

    if (
      appointment.status ===
      "cancelled"
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(409).json({
        message:
          "El turno ya está cancelado",
      });
    }

    if (
      appointment.status ===
        "completed" ||
      appointment.status ===
        "absent"
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(409).json({
        message:
          "Este turno ya no puede cancelarse",
      });
    }

    const appointmentDateTime =
      new Date(
        `${String(
          appointment.appointment_date,
        ).slice(0, 10)}T${String(
          appointment.start_time,
        ).slice(0, 5)}:00`,
      );

    if (
      Number.isNaN(
        appointmentDateTime.getTime(),
      )
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(400).json({
        message:
          "La fecha del turno es inválida",
      });
    }

    if (
      appointmentDateTime <=
      new Date()
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(409).json({
        message:
          "No podés cancelar un turno que ya pasó",
      });
    }

    const updatedResult =
      await client.query(
        `
          UPDATE appointments
          SET
            status = 'cancelled',
            updated_at = NOW()
          WHERE id = $1
          RETURNING
            id,
            patient_id,
            professional_id,
            appointment_type_id,
            appointment_date,
            start_time,
            end_time,
            status,
            notes,
            is_overbooked,
            delay_minutes
        `,
        [Number(id)],
      );

    await client.query(
      "COMMIT",
    );

    return res.json({
      message:
        "Turno cancelado correctamente",
      appointment:
        updatedResult.rows[0],
    });
  } catch (error) {
    await client.query(
      "ROLLBACK",
    );

    console.error(
      "Error cancelando turno del paciente:",
      error,
    );

    return res.status(500).json({
      message:
        "Error al cancelar el turno",
    });
  } finally {
    client.release();
  }
};