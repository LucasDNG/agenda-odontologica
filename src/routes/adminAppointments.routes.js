import { Router } from "express";
import {
  getAllAppointments,
  updateAppointmentStatus,
  restoreAppointment,
  rescheduleAppointment,
} from "../controllers/adminAppointments.controllers.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { isDentist } from "../middlewares/role.middleware.js";
const router = Router();
router.get("/admin/appointments", isAuth, isDentist, getAllAppointments);
router.patch("/admin/appointments/:id/status", isAuth, isDentist, updateAppointmentStatus);
router.patch("/admin/appointments/:id/restore", isAuth, isDentist, restoreAppointment);
router.patch("/admin/appointments/:id/reschedule", isAuth, isDentist, rescheduleAppointment);
export default router;
