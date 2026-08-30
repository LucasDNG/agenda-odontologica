import { pool } from "../db.js";
import { sendWhatsappTextMessage } from "../services/whatsapp.service.js";

export const getWhatsappConsultations = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        id,
        phone,
        message,
        meta_message_id,
        status,
        created_at,
        answered_at
      FROM whatsapp_consultations
    `;

    const values = [];

    if (status === "pending" || status === "answered") {
      query += ` WHERE status = $1`;
      values.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);

    res.json({
      consultations: result.rows,
    });
  } catch (error) {
    console.error("Error obteniendo consultas de WhatsApp:", error);

    res.status(500).json({
      message: "Error obteniendo las consultas de WhatsApp",
    });
  }
};

export const replyWhatsappConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const reply = message?.trim();

    if (!reply) {
      return res.status(400).json({
        message: "La respuesta no puede estar vacía",
      });
    }

    const consultationResult = await pool.query(
      `
        SELECT *
        FROM whatsapp_consultations
        WHERE id = $1
      `,
      [id],
    );

    if (consultationResult.rowCount === 0) {
      return res.status(404).json({
        message: "Consulta no encontrada",
      });
    }

    const consultation = consultationResult.rows[0];

    await sendWhatsappTextMessage(consultation.phone, reply);

    const updatedResult = await pool.query(
      `
        UPDATE whatsapp_consultations
        SET
          status = 'answered',
          answered_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [id],
    );

    res.json({
      message: "Respuesta enviada correctamente",
      consultation: updatedResult.rows[0],
    });
  } catch (error) {
    console.error("Error respondiendo consulta de WhatsApp:", error);

    res.status(500).json({
      message: "No se pudo enviar la respuesta por WhatsApp",
    });
  }
};