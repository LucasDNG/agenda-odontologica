import { Router } from "express";
import { getPatients, updateAppointmentLimit } from "../controllers/adminPatients.controllers.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { isDentist } from "../middlewares/role.middleware.js";
const router = Router();
router.get("/admin/patients", isAuth, isDentist, getPatients);
router.patch("/admin/patients/:id/appointment-limit", isAuth, isDentist, updateAppointmentLimit);
export default router;
