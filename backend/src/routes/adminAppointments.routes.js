import { Router } from "express";
import {
  getAllAppointments,
  updateAppointmentStatus,
} from "../controllers/adminAppointments.controllers.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { isDentist } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/admin/appointments",
  isAuth,
  isDentist,
  getAllAppointments,
);

router.patch(
  "/admin/appointments/:id/status",
  isAuth,
  isDentist,
  updateAppointmentStatus,
);

export default router;