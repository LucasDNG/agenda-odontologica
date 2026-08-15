import { Router } from "express";
import { getAvailableSlots } from "../controllers/availableSlots.controllers.js";
import { isAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/available-slots", isAuth, getAvailableSlots);

export default router;