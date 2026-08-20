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

app.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time",
    );

    res.json({
      message: "API Agenda Odontológica funcionando",
      database: "Neon conectado",
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al conectar con la base de datos",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});