import { pool } from "../db.js";

export const getPublicProfessionals = async (
  req,
  res,
) => {
  try {
    const { appointmentTypeId } = req.query;

    if (!appointmentTypeId) {
      return res.status(400).json({
        message: "Debes indicar el servicio",
      });
    }

    const result = await pool.query(
      `SELECT
         p.id,
         p.name,
         p.lastname,
         p.specialty
       FROM professionals p
       JOIN professional_services ps
         ON ps.professional_id = p.id
       JOIN appointment_types at
         ON at.id = ps.appointment_type_id
       WHERE ps.appointment_type_id = $1
         AND p.active = true
         AND at.active = true
       ORDER BY
         p.lastname,
         p.name`,
      [appointmentTypeId],
    );

    return res.json({
      professionals: result.rows,
    });
  } catch (error) {
    console.error(
      "Error obteniendo profesionales públicos:",
      error,
    );

    return res.status(500).json({
      message:
        "Error al obtener los profesionales",
    });
  }
};