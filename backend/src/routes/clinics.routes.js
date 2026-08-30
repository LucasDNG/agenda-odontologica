import { Router } from "express";

import {
  getClinics,
  createClinic,
  updateClinic,
} from "../controllers/clinics.controllers.js";

import { isAuth } from "../middlewares/auth.middleware.js";
import { isDentist } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/admin/clinics", isAuth, isDentist, getClinics);

router.post("/admin/clinics", isAuth, isDentist, createClinic);

router.put("/admin/clinics/:id", isAuth, isDentist, updateClinic);

export default router;