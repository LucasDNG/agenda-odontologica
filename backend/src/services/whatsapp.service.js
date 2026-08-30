export const sendWhatsappTextMessage = async (to, message) => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v26.0";

  if (!token) {
    throw new Error("Falta WHATSAPP_TOKEN en el .env");
  }

  if (!phoneNumberId) {
    throw new Error("Falta WHATSAPP_PHONE_NUMBER_ID en el .env");
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: true,
          body: message,
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Error enviando WhatsApp:", data);
    throw new Error("No se pudo enviar el mensaje de WhatsApp");
  }

  console.log("WhatsApp enviado correctamente:", data.messages?.[0]?.id);

  return data;
};