import { Router } from "express";
import { getBlockedDates, createBlockedDate, deleteBlockedDate } from "../controllers/blockedDates.controllers.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { isDentist } from "../middlewares/role.middleware.js";
const router = Router();
router.get("/blocked-dates", getBlockedDates);
router.post("/admin/blocked-dates", isAuth, isDentist, createBlockedDate);
router.delete("/admin/blocked-dates/:id", isAuth, isDentist, deleteBlockedDate);
export default router;
