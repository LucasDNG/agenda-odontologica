import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { pool } from "./db.js";

import authRoutes from "./routes/auth.routes.js";
import appointmentTypesRoutes from "./routes/appointmentTypes.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import blockedDatesRoutes from "./routes/blockedDates.routes.js";
import availableSlotsRoutes from "./routes/availableSlots.routes.js";
import appointmentsRoutes from "./routes/appointments.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api", appointmentTypesRoutes);
app.use("/api", availabilityRoutes);
app.use("/api", blockedDatesRoutes);
app.use("/api", availableSlotsRoutes);
app.use("/api", appointmentsRoutes);

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "API Agenda Odontológica funcionando",
      database: "Neon PostgreSQL conectado",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error conectando con la base de datos",
    });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});