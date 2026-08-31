import { Router } from "express";

import {
  getAvailability,
  getProfessionalAvailability,
  setProfessionalAvailability,
} from "../controllers/availability.controllers.js";

import { isAuth } from "../middlewares/auth.middleware.js";
import { isDentist } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/availability",
  getAvailability,
);

router.get(
  "/admin/professionals/:id/availability",
  isAuth,
  isDentist,
  getProfessionalAvailability,
);

router.put(
  "/admin/professionals/:id/availability",
  isAuth,
  isDentist,
  setProfessionalAvailability,
);

export default router;