import { Router } from "express";
import { getAllAppointments } from "../controllers/adminAppointments.controllers.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { isDentist } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/admin/appointments",
  isAuth,
  isDentist,
  getAllAppointments,
);

export default router;