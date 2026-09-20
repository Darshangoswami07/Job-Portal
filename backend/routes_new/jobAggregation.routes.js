/**
 * @deprecated (Phase 4) — legacy live-aggregation trigger.
 *
 * This endpoint used to run third-party aggregation synchronously on demand and
 * was never the user search path. It now:
 *   - requires an authenticated admin
 *   - delegates to the source-adapter + sync pipeline (no direct persistence)
 *   - returns a Deprecation header
 *
 * It will be removed once no consumer references it. The supported mechanism is
 * the background sync worker (`npm run worker`) driven by JobSource schedules.
 */
import express from "express";

import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import { aggregateJobs } from "../services/jobAggregator.js";

const router = express.Router();

const deprecate = (req, res, next) => {
  res.set("Deprecation", "true");
  res.set("Link", '</api/v1/job/search>; rel="successor-version"');
  next();
};

router.post("/aggregate", deprecate, isAuthenticated, requireRole("admin"), async (req, res) => {
  try {
    const result = await aggregateJobs();
    res.json({
      success: true,
      deprecated: true,
      message:
        "This endpoint is deprecated. Aggregation now runs via the background sync " +
        "worker (source adapters → ingest → JobGroup).",
      data: result,
    });
  } catch (error) {
    console.error("Legacy aggregation error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/aggregate/status", deprecate, (req, res) => {
  res.json({
    success: true,
    deprecated: true,
    message: "Deprecated. See SyncRun / JobSource for sync status.",
  });
});

export default router;
