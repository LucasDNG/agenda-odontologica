import { Router } from "express";

import {
  getPublicProfessionals,
} from "../controllers/publicProfessionals.controllers.js";

const router = Router();

router.get(
  "/professionals",
  getPublicProfessionals,
);

export default router;