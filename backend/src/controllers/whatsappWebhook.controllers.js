import { pool } from "../db.js";
import { sendWhatsappTextMessage } from "../services/whatsapp.service.js";

export const verifyWhatsappWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error("Falta WHATSAPP_VERIFY_TOKEN en el .env");
    return res.sendStatus(500);
  }

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Webhook de WhatsApp verificado correctamente");
    return res.status(200).send(challenge);
  }

  console.warn("Verificación de webhook rechazada");
  return res.sendStatus(403);
};

export const receiveWhatsappWebhook = async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;

    if (body?.object !== "whatsapp_business_account") {
      return;
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        for (const message of value?.messages || []) {
          const phone = message.from;
          const messageId = message.id;
          const type = message.type;

          let text = "";

          if (type === "text") {
            text = message.text?.body?.trim() || "";
          }

          console.log("====================================");
          console.log("NUEVO MENSAJE DE WHATSAPP");
          console.log("Teléfono:", phone);
          console.log("ID:", messageId);
          console.log("Tipo:", type);
          console.log("Mensaje:", text);
          console.log("====================================");

          if (type !== "text" || !text) {
            continue;
          }

          await pool.query(
            `
              INSERT INTO whatsapp_consultations
                (phone, message, meta_message_id)
              VALUES
                ($1, $2, $3)
              ON CONFLICT (meta_message_id)
              DO NOTHING
            `,
            [phone, text, messageId],
          );

          console.log("Consulta de WhatsApp guardada en la base de datos");

          const autoReplyEnabled =
            process.env.WHATSAPP_AUTO_REPLY_ENABLED === "true";

          if (!autoReplyEnabled) {
            continue;
          }

          const bookingUrl =
            process.env.BOOKING_URL || "http://localhost:5173";

          const automaticReply = `Hola 👋

Gracias por comunicarte con el consultorio odontológico.

Para solicitar un turno ingresá acá:
${bookingUrl}

Si necesitás realizar una consulta, escribinos tu mensaje por este medio y será respondido por el consultorio.`;

          await sendWhatsappTextMessage(phone, automaticReply);
        }
      }
    }
  } catch (error) {
    console.error("Error procesando webhook de WhatsApp:", error);
  }
};