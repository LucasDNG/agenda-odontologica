import { Router } from "express";
import {
  signUp,
  signIn,
  signOut,
  profile,
} from "../controllers/auth.controllers.js";
import { isAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/signout", signOut);
router.get("/profile", isAuth, profile);

export default router;