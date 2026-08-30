import { Router } from "express";

import {
  getWhatsappConsultations,
  replyWhatsappConsultation,
} from "../controllers/whatsappConsultations.controllers.js";

import { isAuth } from "../middlewares/auth.middleware.js";
import { isDentist } from "../middlewares/role.middleware.js";

const router = Router();

router.get(
  "/admin/whatsapp-consultations",
  isAuth,
  isDentist,
  getWhatsappConsultations,
);

router.post(
  "/admin/whatsapp-consultations/:id/reply",
  isAuth,
  isDentist,
  replyWhatsappConsultation,
);

export default router;