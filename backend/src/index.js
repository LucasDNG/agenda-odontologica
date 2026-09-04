import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import "dotenv/config";

import { pool } from "./db.js";

import authRoutes from "./routes/auth.routes.js";
import appointmentTypesRoutes from "./routes/appointmentTypes.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import blockedDatesRoutes from "./routes/blockedDates.routes.js";
import availableSlotsRoutes from "./routes/availableSlots.routes.js";
import appointmentsRoutes from "./routes/appointments.routes.js";
import adminAppointmentsRoutes from "./routes/adminAppointments.routes.js";
import whatsappWebhookRoutes from "./routes/whatsappWebhook.routes.js";
import whatsappConsultationsRoutes from "./routes/whatsappConsultations.routes.js";
import clinicsRoutes from "./routes/clinics.routes.js";
import professionalsRoutes from "./routes/professionals.routes.js";
import publicProfessionalsRoutes from "./routes/publicProfessionals.routes.js";
import patientsRoutes from "./routes/patients.routes.js";

import {
  appointmentNotificationsMiddleware,
} from "./middlewares/appointmentNotifications.middleware.js";

import {
  startAppointmentReminderWorker,
  stopAppointmentReminderWorker,
} from "./services/appointmentReminder.service.js";

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",

    credentials: true,
  }),
);

app.use(morgan("dev"));

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(cookieParser());

app.use(
  "/api",
  appointmentNotificationsMiddleware,
);

app.use("/api", authRoutes);

app.use(
  "/api",
  appointmentTypesRoutes,
);

app.use(
  "/api",
  availabilityRoutes,
);

app.use(
  "/api",
  blockedDatesRoutes,
);

app.use(
  "/api",
  availableSlotsRoutes,
);

app.use(
  "/api",
  appointmentsRoutes,
);

app.use(
  "/api",
  adminAppointmentsRoutes,
);

app.use(
  "/api",
  whatsappWebhookRoutes,
);

app.use(
  "/api",
  whatsappConsultationsRoutes,
);

app.use(
  "/api",
  clinicsRoutes,
);

app.use(
  "/api",
  professionalsRoutes,
);

app.use(
  "/api",
  publicProfessionalsRoutes,
);

app.use(
  "/api",
  patientsRoutes,
);

app.get("/", async (req, res) => {
  try {
    const result =
      await pool.query(
        "SELECT NOW()",
      );

    res.json({
      message:
        "API Agenda Odontológica funcionando",

      database:
        "Neon PostgreSQL conectado",

      time:
        result.rows[0].now,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Error conectando con la base de datos",
    });
  }
});

app.use(
  (error, req, res, next) => {
    console.error(
      "Error no controlado:",
      error,
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    return res
      .status(500)
      .json({
        message:
          "Error interno del servidor",
      });
  },
);

const PORT =
  process.env.PORT ||
  3000;

const server =
  app.listen(PORT, () => {
    console.log(
      `Servidor escuchando en el puerto ${PORT}`,
    );

    startAppointmentReminderWorker();
  });

const shutdown =
  async (signal) => {
    console.log(
      `${signal}: cerrando servidor`,
    );

    stopAppointmentReminderWorker();

    server.close(
      async () => {
        try {
          await pool.end();
        } catch (error) {
          console.error(
            "Error cerrando PostgreSQL:",
            error,
          );
        }

        process.exit(0);
      },
    );
  };

process.on(
  "SIGTERM",
  () =>
    shutdown("SIGTERM"),
);

process.on(
  "SIGINT",
  () =>
    shutdown("SIGINT"),
);