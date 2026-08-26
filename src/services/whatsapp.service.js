const whatsappEnabled = () => process.env.WHATSAPP_ENABLED === "true";

const normalizePhone = (phone) => {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("54") && !digits.startsWith("549")) {
    digits = `549${digits.slice(2)}`;
  }
  return digits;
};

const sendTemplate = async ({ phone, templateName, parameters = [] }) => {
  if (!whatsappEnabled()) {
    console.log(`[WhatsApp desactivado] ${templateName} → ${phone}`, parameters);
    return { sent: false, disabled: true };
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v23.0";

  if (!token || !phoneNumberId) {
    throw new Error("Faltan credenciales de WhatsApp");
  }

  const to = normalizePhone(phone);
  if (!to) throw new Error("Teléfono inválido");

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
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_LANGUAGE_CODE || "es_AR" },
          components: [{
            type: "body",
            parameters: parameters.map((text) => ({
              type: "text",
              text: String(text ?? ""),
            })),
          }],
        },
      }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "No se pudo enviar WhatsApp");
  }

  return { sent: true, data };
};

const safe = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    console.error("WhatsApp:", error.message);
    return { sent: false, error: error.message };
  }
};

export const sendAppointmentConfirmed = (data) => safe(() =>
  sendTemplate({
    phone: data.phone,
    templateName: process.env.WHATSAPP_TEMPLATE_CONFIRMED || "turno_confirmado",
    parameters: [data.name, data.service, data.date, data.time],
  })
);

export const sendAppointmentCancelled = (data) => safe(() =>
  sendTemplate({
    phone: data.phone,
    templateName: process.env.WHATSAPP_TEMPLATE_CANCELLED || "turno_cancelado",
    parameters: [data.name, data.service, data.date, data.time],
  })
);

export const sendAppointmentRescheduled = (data) => safe(() =>
  sendTemplate({
    phone: data.phone,
    templateName: process.env.WHATSAPP_TEMPLATE_RESCHEDULED || "turno_reprogramado",
    parameters: [
      data.name,
      data.service,
      data.date,
      data.time,
      data.overbooked ? "Sobreturno" : "Turno",
    ],
  })
);

export const sendAppointmentReminder = (data) => safe(() =>
  sendTemplate({
    phone: data.phone,
    templateName: process.env.WHATSAPP_TEMPLATE_REMINDER || "recordatorio_turno",
    parameters: [data.name, data.service, data.date, data.time],
  })
);
