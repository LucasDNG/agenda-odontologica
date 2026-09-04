import { pool } from "../db.js";

import {
  normalizeWhatsappPhone,
  sendWhatsappTextMessage,
} from "./whatsapp.service.js";

const NOTIFICATION_TYPES = {
  CREATED:
    "appointment_created",

  CANCELLED:
    "appointment_cancelled",

  RESCHEDULED:
    "appointment_rescheduled",

  RESTORED:
    "appointment_restored",

  REMINDER:
    "appointment_reminder",
};

const formatDate = (date) => {
  if (!date) {
    return "";
  }

  const value =
    String(date).slice(
      0,
      10,
    );

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    const [
      year,
      month,
      day,
    ] = value.split("-");

    return `${day}/${month}/${year}`;
  }

  return String(date);
};

const formatTime = (time) =>
  String(time || "")
    .slice(0, 5);

const getAppointmentData =
  async (
    appointmentId,
    client = pool,
  ) => {
    const result =
      await client.query(
        `
          SELECT
            a.id,
            a.patient_id,
            a.patient_record_id,
            a.status,
            a.appointment_date,
            a.start_time,
            a.end_time,
            a.is_overbooked,

            at.name
              AS service_name,

            pr.name
              AS professional_name,

            pr.lastname
              AS professional_lastname,

            COALESCE(
              patient_record.id,
              account_patient.id
            )
              AS notification_patient_id,

            COALESCE(
              patient_record.name,
              account_patient.name
            )
              AS patient_name,

            COALESCE(
              patient_record.lastname,
              account_patient.lastname
            )
              AS patient_lastname,

            COALESCE(
              patient_record.phone,
              account_patient.phone
            )
              AS patient_phone,

            c.name
              AS clinic_name,

            c.phone
              AS clinic_phone,

            c.address
              AS clinic_address

          FROM appointments a

          LEFT JOIN appointment_types at
            ON at.id =
              a.appointment_type_id

          LEFT JOIN professionals pr
            ON pr.id =
              a.professional_id

          LEFT JOIN patients patient_record
            ON patient_record.id =
              a.patient_record_id

          LEFT JOIN patients account_patient
            ON account_patient.user_id =
              a.patient_id

          LEFT JOIN clinics c
            ON c.active = TRUE

          WHERE a.id = $1

          ORDER BY c.id

          LIMIT 1
        `,
        [appointmentId],
      );

    return (
      result.rows[0] ||
      null
    );
  };

const getProfessionalName = (
  appointment,
) =>
  [
    appointment
      .professional_name,

    appointment
      .professional_lastname,
  ]
    .filter(Boolean)
    .join(" ");

const getPatientName = (
  appointment,
) =>
  [
    appointment.patient_name,
    appointment.patient_lastname,
  ]
    .filter(Boolean)
    .join(" ");

const getClinicName = (
  appointment,
) =>
  appointment.clinic_name ||
  "Consultorio odontológico";

const buildMessage = (
  type,
  appointment,
) => {
  const clinicName =
    getClinicName(
      appointment,
    );

  const patientName =
    getPatientName(
      appointment,
    );

  const professionalName =
    getProfessionalName(
      appointment,
    );

  const date =
    formatDate(
      appointment
        .appointment_date,
    );

  const time =
    formatTime(
      appointment.start_time,
    );

  const service =
    appointment.service_name ||
    "Consulta odontológica";

  const greeting =
    patientName
      ? `Hola ${patientName}.`
      : "Hola.";

  if (
    type ===
    NOTIFICATION_TYPES.CREATED
  ) {
    return [
      greeting,
      "",
      `Tu turno en ${clinicName} quedó confirmado.`,
      "",
      `📅 Fecha: ${date}`,
      `🕐 Hora: ${time}`,
      `🦷 Servicio: ${service}`,
      professionalName
        ? `👨‍⚕️ Profesional: ${professionalName}`
        : null,
      "",
      "Si necesitás cancelar el turno, podés hacerlo desde la agenda.",
    ]
      .filter(
        (line) =>
          line !== null,
      )
      .join("\n");
  }

  if (
    type ===
    NOTIFICATION_TYPES.CANCELLED
  ) {
    return [
      greeting,
      "",
      `Tu turno en ${clinicName} fue cancelado.`,
      "",
      `📅 Fecha: ${date}`,
      `🕐 Hora: ${time}`,
      `🦷 Servicio: ${service}`,
      professionalName
        ? `👨‍⚕️ Profesional: ${professionalName}`
        : null,
      "",
      "El horario quedó liberado.",
    ]
      .filter(
        (line) =>
          line !== null,
      )
      .join("\n");
  }

  if (
    type ===
    NOTIFICATION_TYPES.RESCHEDULED
  ) {
    return [
      greeting,
      "",
      `Tu turno en ${clinicName} fue reprogramado.`,
      "",
      `📅 Nueva fecha: ${date}`,
      `🕐 Nuevo horario: ${time}`,
      `🦷 Servicio: ${service}`,
      professionalName
        ? `👨‍⚕️ Profesional: ${professionalName}`
        : null,
      "",
      "Te esperamos.",
    ]
      .filter(
        (line) =>
          line !== null,
      )
      .join("\n");
  }

  if (
    type ===
    NOTIFICATION_TYPES.RESTORED
  ) {
    return [
      greeting,
      "",
      `Tu turno en ${clinicName} fue restaurado y está nuevamente confirmado.`,
      "",
      `📅 Fecha: ${date}`,
      `🕐 Hora: ${time}`,
      `🦷 Servicio: ${service}`,
      professionalName
        ? `👨‍⚕️ Profesional: ${professionalName}`
        : null,
      "",
      "Te esperamos.",
    ]
      .filter(
        (line) =>
          line !== null,
      )
      .join("\n");
  }

  if (
    type ===
    NOTIFICATION_TYPES.REMINDER
  ) {
    return [
      greeting,
      "",
      `Te recordamos tu próximo turno en ${clinicName}.`,
      "",
      `📅 Fecha: ${date}`,
      `🕐 Hora: ${time}`,
      `🦷 Servicio: ${service}`,
      professionalName
        ? `👨‍⚕️ Profesional: ${professionalName}`
        : null,
      appointment
        .clinic_address
        ? `📍 ${appointment.clinic_address}`
        : null,
      "",
      "Te esperamos.",
    ]
      .filter(
        (line) =>
          line !== null,
      )
      .join("\n");
  }

  return null;
};

const createLog =
  async ({
    appointment,
    type,
    phone,
    message,
    scheduledFor = null,
  }) => {
    const result =
      await pool.query(
        `
          INSERT INTO whatsapp_notifications
          (
            appointment_id,
            patient_id,
            notification_type,
            phone,
            message,
            status,
            scheduled_for,
            attempt_count
          )

          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            'pending',
            $6,
            0
          )

          RETURNING id
        `,
        [
          appointment.id,

          appointment
            .notification_patient_id ||
            null,

          type,
          phone,
          message,
          scheduledFor,
        ],
      );

    return result.rows[0];
  };

const markSent =
  async (
    notificationId,
    whatsappMessageId,
  ) => {
    await pool.query(
      `
        UPDATE whatsapp_notifications

        SET
          status = 'sent',

          whatsapp_message_id =
            $2,

          sent_at = NOW(),

          attempt_count =
            attempt_count + 1,

          error_message = NULL,

          updated_at = NOW()

        WHERE id = $1
      `,
      [
        notificationId,
        whatsappMessageId,
      ],
    );
  };

const markFailed =
  async (
    notificationId,
    error,
  ) => {
    await pool.query(
      `
        UPDATE whatsapp_notifications

        SET
          status = 'failed',

          attempt_count =
            attempt_count + 1,

          error_message = $2,

          updated_at = NOW()

        WHERE id = $1
      `,
      [
        notificationId,

        String(
          error?.message ||
            error ||
            "Error desconocido",
        ).slice(
          0,
          2000,
        ),
      ],
    );
  };

const createSkippedLog =
  async ({
    appointment,
    type,
    reason,
    scheduledFor = null,
  }) => {
    await pool.query(
      `
        INSERT INTO whatsapp_notifications
        (
          appointment_id,
          patient_id,
          notification_type,
          phone,
          message,
          status,
          error_message,
          scheduled_for,
          attempt_count
        )

        VALUES
        (
          $1,
          $2,
          $3,
          NULL,
          NULL,
          'skipped',
          $4,
          $5,
          0
        )
      `,
      [
        appointment.id,

        appointment
          .notification_patient_id ||
          null,

        type,
        reason,
        scheduledFor,
      ],
    );
  };

export const sendAppointmentNotification =
  async ({
    appointmentId,
    type,
    scheduledFor = null,
    preventDuplicate = false,
  }) => {
    try {
      const appointment =
        await getAppointmentData(
          appointmentId,
        );

      if (!appointment) {
        return {
          sent: false,
          reason:
            "appointment_not_found",
        };
      }

      if (
        type ===
          NOTIFICATION_TYPES.REMINDER &&
        ![
          "scheduled",
          "confirmed",
        ].includes(
          appointment.status,
        )
      ) {
        return {
          sent: false,
          reason:
            "appointment_not_active",
        };
      }

      if (preventDuplicate) {
        const duplicateResult =
          await pool.query(
            `
              SELECT id

              FROM whatsapp_notifications

              WHERE
                appointment_id = $1
                AND notification_type = $2
                AND status = 'sent'

              LIMIT 1
            `,
            [
              appointmentId,
              type,
            ],
          );

        if (
          duplicateResult.rows
            .length > 0
        ) {
          return {
            sent: false,
            reason: "duplicate",
          };
        }
      }

      const phone =
        normalizeWhatsappPhone(
          appointment.patient_phone,
        );

      const message =
        buildMessage(
          type,
          appointment,
        );

      if (!message) {
        return {
          sent: false,
          reason:
            "invalid_notification_type",
        };
      }

      if (!phone) {
        await createSkippedLog({
          appointment,
          type,

          reason:
            "El paciente no tiene un teléfono válido",

          scheduledFor,
        });

        return {
          sent: false,
          reason:
            "invalid_phone",
        };
      }

      const log =
        await createLog({
          appointment,
          type,
          phone,
          message,
          scheduledFor,
        });

      try {
        const result =
          await sendWhatsappTextMessage(
            phone,
            message,
          );

        await markSent(
          log.id,
          result.messageId,
        );

        return {
          sent: true,

          notificationId:
            log.id,

          whatsappMessageId:
            result.messageId,
        };
      } catch (error) {
        await markFailed(
          log.id,
          error,
        );

        console.error(
          `No se pudo enviar ${type} por WhatsApp:`,
          error.message,
        );

        return {
          sent: false,
          reason:
            "whatsapp_error",
          error:
            error.message,
        };
      }
    } catch (error) {
      console.error(
        "Error procesando notificación de turno:",
        error,
      );

      return {
        sent: false,
        reason:
          "notification_error",
        error:
          error.message,
      };
    }
  };

export {
  NOTIFICATION_TYPES,
};