import { Router } from "express";

import {
  verifyWhatsappWebhook,
  receiveWhatsappWebhook,
} from "../controllers/whatsappWebhook.controllers.js";

const router = Router();

router.get("/webhooks/whatsapp", verifyWhatsappWebhook);
router.post("/webhooks/whatsapp", receiveWhatsappWebhook);

export default router;