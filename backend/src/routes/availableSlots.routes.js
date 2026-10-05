import { Router } from "express";
import {
  getAvailableSlots,
  getAvailableWeek,
} from "../controllers/availableSlots.controllers.js";
import { isAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/available-slots", isAuth, getAvailableSlots);
router.get("/available-week", isAuth, getAvailableWeek);

export default router;