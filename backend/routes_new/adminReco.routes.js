/**
 * Admin recommendation-quality metrics (Phase 9). Authenticated + admin.
 * Mounted at /api/v1/admin/reco-metrics.
 */
import express from "express";

import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import { getRecoMetrics } from "../controllers_new/adminRecoController.js";

const router = express.Router();

router.use(isAuthenticated, requireRole("admin"));
router.get("/", getRecoMetrics);

export default router;
