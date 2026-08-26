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
import adminPatientsRoutes from "./routes/adminPatients.routes.js";
import adminServicesRoutes from "./routes/adminServices.routes.js";
import adminAvailabilityRoutes from "./routes/adminAvailability.routes.js";
import { startReminderScheduler } from "./services/reminders.service.js";

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Origen no permitido por CORS"));
  },
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api", appointmentTypesRoutes);
app.use("/api", availabilityRoutes);
app.use("/api", blockedDatesRoutes);
app.use("/api", availableSlotsRoutes);
app.use("/api", appointmentsRoutes);
app.use("/api", adminAppointmentsRoutes);
app.use("/api", adminPatientsRoutes);
app.use("/api", adminServicesRoutes);
app.use("/api", adminAvailabilityRoutes);

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    res.json({
      message: "API Agenda Odontológica funcionando",
      database: "Neon conectado",
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al conectar con la base de datos" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
  startReminderScheduler();
});
