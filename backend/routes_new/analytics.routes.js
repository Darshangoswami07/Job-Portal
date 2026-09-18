/**
 * Analytics — a client beacon (bounded) + the admin dashboard (Phase 10).
 * Mounted at /api/v1/analytics and /api/v1/admin/analytics.
 */
import express from "express";
import rateLimit from "express-rate-limit";

import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import optionalAuth from "../middlewares/optionalAuth.js";
import { postClientEvent } from "../controllers_new/analyticsController.js";
import {
  getAdminAnalytics,
  runAiQualityCheck,
  clearAiQuality,
} from "../controllers_new/adminAnalyticsController.js";

const beaconLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: "Too many events" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const clientRouter = express.Router();
clientRouter.post("/events", beaconLimiter, optionalAuth, postClientEvent);

export const adminRouter = express.Router();
adminRouter.use(isAuthenticated, requireRole("admin"));
adminRouter.get("/", getAdminAnalytics);
adminRouter.post("/ai-quality/check", runAiQualityCheck);
adminRouter.post("/ai-quality/clear", clearAiQuality);
