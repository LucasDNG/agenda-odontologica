import { Router } from "express";
import { getBlockedDates } from "../controllers/blockedDates.controllers.js";

const router = Router();

router.get("/blocked-dates", getBlockedDates);

export default router;