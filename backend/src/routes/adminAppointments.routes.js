import {
  Router,
} from "express";

import {
  createOverbookedAppointment,
  getAllAppointments,
  rescheduleAppointment,
  updateAppointmentStatus,
} from "../controllers/adminAppointments.controllers.js";

import {
  isAuth,
} from "../middlewares/auth.middleware.js";

import {
  isDentist,
} from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/admin/appointments",
  isAuth,
  isDentist,
  getAllAppointments,
);

router.post(
  "/admin/appointments/overbooked",
  isAuth,
  isDentist,
  createOverbookedAppointment,
);

router.patch(
  "/admin/appointments/:id/status",
  isAuth,
  isDentist,
  updateAppointmentStatus,
);

router.patch(
  "/admin/appointments/:id/reschedule",
  isAuth,
  isDentist,
  rescheduleAppointment,
);

export default router;