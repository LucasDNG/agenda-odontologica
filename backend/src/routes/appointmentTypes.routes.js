import { Router } from "express";

import {
  getAppointmentTypes,
  getAdminAppointmentTypes,
  createAppointmentType,
  updateAppointmentType,
} from "../controllers/appointmentTypes.controllers.js";

import {
  isAuth,
} from "../middlewares/auth.middleware.js";

import {
  isDentist,
} from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/appointment-types",
  getAppointmentTypes,
);

router.get(
  "/admin/appointment-types",
  isAuth,
  isDentist,
  getAdminAppointmentTypes,
);

router.post(
  "/admin/appointment-types",
  isAuth,
  isDentist,
  createAppointmentType,
);

router.put(
  "/admin/appointment-types/:id",
  isAuth,
  isDentist,
  updateAppointmentType,
);

export default router;