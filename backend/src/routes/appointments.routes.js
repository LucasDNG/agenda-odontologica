import { Router } from "express";
import { createAppointment } from "../controllers/appointments.controllers.js";
import { isAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/appointments", isAuth, createAppointment);

export default router;