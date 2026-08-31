import { Router } from "express";

import {
  createPatient,
  getPatientById,
  searchPatients,
  updatePatient,
} from "../controllers/patients.controllers.js";

import { isAuth } from "../middlewares/auth.middleware.js";
import { isDentist } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/admin/patients",
  isAuth,
  isDentist,
  searchPatients,
);

router.get(
  "/admin/patients/:id",
  isAuth,
  isDentist,
  getPatientById,
);

router.post(
  "/admin/patients",
  isAuth,
  isDentist,
  createPatient,
);

router.put(
  "/admin/patients/:id",
  isAuth,
  isDentist,
  updatePatient,
);

export default router;