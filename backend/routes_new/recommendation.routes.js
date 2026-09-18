/**
 * Personalized job recommendations (Phase 8). Authenticated + rate-limited.
 * Mounted at /api/v1/recommendations.
 */
import express from "express";
import rateLimit from "express-rate-limit";

import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  getJobRecommendations,
  getJobMatchExplanation,
  dismissJob,
  undismissJob,
} from "../controllers_new/recommendationController.js";

const router = express.Router();

// Bounded usage — a refresh loop must not trigger a flood of (LLM-backed) builds.
const recoLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  message: { success: false, message: "Too many recommendation requests, slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

// A tighter limit on the write action so a "dismiss + reload" loop cannot spin.
const dismissLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  message: { success: false, message: "Too many changes, slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(isAuthenticated, recoLimiter);

router.get("/jobs", getJobRecommendations);
router.get("/jobs/:groupId", getJobMatchExplanation);
router.post("/jobs/:groupId/dismiss", dismissLimiter, dismissJob);
router.delete("/jobs/:groupId/dismiss", dismissLimiter, undismissJob);

export default router;
