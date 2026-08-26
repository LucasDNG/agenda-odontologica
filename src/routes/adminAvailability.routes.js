import { Router } from "express";
import {
  getAllAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
} from "../controllers/adminAvailability.controllers.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { isDentist } from "../middlewares/role.middleware.js";
const router = Router();
router.get("/admin/availability", isAuth, isDentist, getAllAvailability);
router.post("/admin/availability", isAuth, isDentist, createAvailability);
router.patch("/admin/availability/:id", isAuth, isDentist, updateAvailability);
router.delete("/admin/availability/:id", isAuth, isDentist, deleteAvailability);
export default router;
