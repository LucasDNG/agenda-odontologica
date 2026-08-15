import { Router } from "express";
import { getAppointmentTypes } from "../controllers/appointmentTypes.controllers.js";

const router = Router();

router.get("/appointment-types", getAppointmentTypes);

export default router;