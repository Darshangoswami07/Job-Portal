import express from "express";
import rateLimit from "express-rate-limit";
import { refresh } from "../controllers/user.controller.js";

const router = express.Router();

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many attempts, please try again later", success: false },
  standardHeaders: true,
  legacyHeaders: false,
});

router.route("/refresh").post(refreshLimiter, refresh);

export default router;
