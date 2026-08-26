import { Router } from "express";
import { getAllServices, createService, updateService } from "../controllers/adminServices.controllers.js";
import { isAuth } from "../middlewares/auth.middleware.js";
import { isDentist } from "../middlewares/role.middleware.js";
const router = Router();
router.get("/admin/appointment-types", isAuth, isDentist, getAllServices);
router.post("/admin/appointment-types", isAuth, isDentist, createService);
router.patch("/admin/appointment-types/:id", isAuth, isDentist, updateService);
export default router;
