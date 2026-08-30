import { Router } from "express";

import {
  getProfessionals,
  createProfessional,
  updateProfessional,
  getProfessionalServices,
  setProfessionalServices,
} from "../controllers/professionals.controllers.js";

import { isAuth } from "../middlewares/auth.middleware.js";
import { isDentist } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/admin/professionals",
  isAuth,
  isDentist,
  getProfessionals,
);

router.post(
  "/admin/professionals",
  isAuth,
  isDentist,
  createProfessional,
);

router.put(
  "/admin/professionals/:id",
  isAuth,
  isDentist,
  updateProfessional,
);

router.get(
  "/admin/professionals/:id/services",
  isAuth,
  isDentist,
  getProfessionalServices,
);

router.put(
  "/admin/professionals/:id/services",
  isAuth,
  isDentist,
  setProfessionalServices,
);

export default router;