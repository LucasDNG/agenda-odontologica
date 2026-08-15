import { Router } from "express";
import {
  createAppointment,
  getMyAppointments,
} from "../controllers/appointments.controllers.js";
import { isAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/appointments", isAuth, createAppointment);
router.get("/appointments", isAuth, getMyAppointments);

export default router;