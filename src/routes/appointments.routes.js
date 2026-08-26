import { Router } from "express";
import { createAppointment, getMyAppointments, cancelMyAppointment } from "../controllers/appointments.controllers.js";
import { isAuth } from "../middlewares/auth.middleware.js";
const router = Router();
router.post("/appointments", isAuth, createAppointment);
router.get("/appointments", isAuth, getMyAppointments);
router.patch("/appointments/:id/cancel", isAuth, cancelMyAppointment);
export default router;
