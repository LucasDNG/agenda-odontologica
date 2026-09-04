const getWhatsappConfig = () => {
  const token =
    process.env.WHATSAPP_TOKEN;

  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  const apiVersion =
    process.env.WHATSAPP_API_VERSION ||
    "v26.0";

  if (!token) {
    throw new Error(
      "Falta WHATSAPP_TOKEN en el .env",
    );
  }

  if (!phoneNumberId) {
    throw new Error(
      "Falta WHATSAPP_PHONE_NUMBER_ID en el .env",
    );
  }

  return {
    token,
    phoneNumberId,
    apiVersion,
  };
};

export const normalizeWhatsappPhone = (
  phone,
) => {
  if (!phone) {
    return null;
  }

  let normalized =
    String(phone).replace(
      /\D/g,
      "",
    );

  if (!normalized) {
    return null;
  }

  if (
    normalized.startsWith("0")
  ) {
    normalized =
      normalized.slice(1);
  }

  if (
    normalized.startsWith("15") &&
    normalized.length <= 10
  ) {
    normalized =
      normalized.slice(2);
  }

  if (
    !normalized.startsWith("54")
  ) {
    normalized =
      `54${normalized}`;
  }

  if (
    normalized.startsWith("54") &&
    !normalized.startsWith("549")
  ) {
    normalized =
      `549${normalized.slice(2)}`;
  }

  if (
    normalized.length < 12 ||
    normalized.length > 15
  ) {
    return null;
  }

  return normalized;
};

export const sendWhatsappTextMessage =
  async (to, message) => {
    const {
      token,
      phoneNumberId,
      apiVersion,
    } = getWhatsappConfig();

    const normalizedPhone =
      normalizeWhatsappPhone(to);

    if (!normalizedPhone) {
      throw new Error(
        "Número de WhatsApp inválido",
      );
    }

    if (
      !message ||
      !String(message).trim()
    ) {
      throw new Error(
        "El mensaje de WhatsApp está vacío",
      );
    }

    const response =
      await fetch(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            messaging_product:
              "whatsapp",

            recipient_type:
              "individual",

            to: normalizedPhone,

            type: "text",

            text: {
              preview_url: false,

              body:
                String(
                  message,
                ).trim(),
            },
          }),
        },
      );

    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const metaMessage =
        data?.error?.message ||
        "Error desconocido de Meta";

      console.error(
        "Error enviando WhatsApp:",
        data,
      );

      throw new Error(
        metaMessage,
      );
    }

    const messageId =
      data?.messages?.[0]?.id ||
      null;

    console.log(
      "WhatsApp enviado:",
      messageId,
    );

    return {
      ...data,
      messageId,
      phone:
        normalizedPhone,
    };
  };