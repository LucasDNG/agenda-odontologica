import { pool } from "../db.js";

import {
  NOTIFICATION_TYPES,
  sendAppointmentNotification,
} from "./appointmentNotifications.service.js";

const DEFAULT_INTERVAL_MINUTES =
  5;

let reminderInterval = null;
let running = false;

const getIntervalMilliseconds =
  () => {
    const configured =
      Number(
        process.env
          .APPOINTMENT_REMINDER_INTERVAL_MINUTES,
      );

    const minutes =
      Number.isFinite(
        configured,
      ) &&
      configured >= 1
        ? configured
        : DEFAULT_INTERVAL_MINUTES;

    return (
      minutes *
      60 *
      1000
    );
  };

export const processAppointmentReminders =
  async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const result =
        await pool.query(`
          SELECT
            a.id,

            (
              a.appointment_date
              + a.start_time
            )
              AS appointment_datetime,

            (
              a.appointment_date
              + a.start_time
              - INTERVAL '24 hours'
            )
              AS reminder_datetime

          FROM appointments a

          WHERE
            a.status IN (
              'scheduled',
              'confirmed'
            )

            AND (
              a.appointment_date
              + a.start_time
            ) > NOW()

            AND (
              a.appointment_date
              + a.start_time
              - INTERVAL '24 hours'
            ) <= NOW()

            AND NOT EXISTS (
              SELECT 1

              FROM whatsapp_notifications wn

              WHERE
                wn.appointment_id =
                  a.id

                AND
                wn.notification_type =
                  'appointment_reminder'

                AND
                wn.status IN (
                  'pending',
                  'sent'
                )
            )

          ORDER BY
            a.appointment_date,
            a.start_time

          LIMIT 100
        `);

      for (
        const appointment of
        result.rows
      ) {
        await sendAppointmentNotification({
          appointmentId:
            appointment.id,

          type:
            NOTIFICATION_TYPES.REMINDER,

          scheduledFor:
            appointment
              .reminder_datetime,

          preventDuplicate: true,
        });
      }
    } catch (error) {
      console.error(
        "Error procesando recordatorios de turnos:",
        error,
      );
    } finally {
      running = false;
    }
  };

export const startAppointmentReminderWorker =
  () => {
    if (reminderInterval) {
      return;
    }

    const enabled =
      String(
        process.env
          .APPOINTMENT_REMINDERS_ENABLED ??
          "true",
      ).toLowerCase() !==
      "false";

    if (!enabled) {
      console.log(
        "Recordatorios de turnos desactivados",
      );

      return;
    }

    const interval =
      getIntervalMilliseconds();

    console.log(
      `Recordatorios de turnos activos cada ${Math.round(
        interval / 60000,
      )} minuto(s)`,
    );

    setTimeout(() => {
      processAppointmentReminders();
    }, 5000);

    reminderInterval =
      setInterval(() => {
        processAppointmentReminders();
      }, interval);

    if (
      typeof reminderInterval.unref ===
      "function"
    ) {
      reminderInterval.unref();
    }
  };

export const stopAppointmentReminderWorker =
  () => {
    if (!reminderInterval) {
      return;
    }

    clearInterval(
      reminderInterval,
    );

    reminderInterval = null;
  };