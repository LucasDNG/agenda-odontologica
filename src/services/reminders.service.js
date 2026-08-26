import cron from "node-cron";
import { pool } from "../db.js";
import { sendAppointmentReminder } from "./whatsapp.service.js";

export const sendTomorrowReminders = async () => {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        TO_CHAR(a.appointment_date, 'DD/MM/YYYY') AS appointment_date,
        a.start_time,
        u.name AS patient_name,
        u.phone AS patient_phone,
        at.name AS service
      FROM appointments a
      JOIN users u ON u.id = a.patient_id
      JOIN appointment_types at ON at.id = a.appointment_type_id
      WHERE a.appointment_date = CURRENT_DATE + INTERVAL '1 day'
        AND a.status = 'confirmed'
        AND a.reminder_sent_at IS NULL
      ORDER BY a.start_time
    `);

    for (const appointment of result.rows) {
      const notification = await sendAppointmentReminder({
        phone: appointment.patient_phone,
        name: appointment.patient_name,
        date: appointment.appointment_date,
        time: appointment.start_time.slice(0, 5),
        service: appointment.service,
      });

      if (notification.sent) {
        await pool.query(
          "UPDATE appointments SET reminder_sent_at = CURRENT_TIMESTAMP WHERE id = $1",
          [appointment.id],
        );
      }
    }
  } catch (error) {
    console.error("Error procesando recordatorios:", error);
  }
};

export const startReminderScheduler = () => {
  sendTomorrowReminders();
  cron.schedule("0 8-20 * * *", sendTomorrowReminders, {
    timezone: "America/Argentina/Buenos_Aires",
  });
  console.log("Recordatorios automáticos iniciados");
};
