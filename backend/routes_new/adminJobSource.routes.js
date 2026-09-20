/**
 * Admin Job Source operations (Phase 5). Every route: authenticated + admin.
 * Mounted at /api/v1/admin/job-sources.
 */
import express from "express";
import rateLimit from "express-rate-limit";

import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import {
  listJobSources,
  getJobSource,
  createJobSource,
  updateJobSource,
  syncJobSource,
  verifyJobSourceLinks,
  listSyncRuns,
  getJobSourceHealth,
  getAdapterCatalog,
  testJobSource,
} from "../controllers_new/adminJobSourceController.js";
import {
  getCapabilityMatrix,
  getCatalogHealth,
  getSourceCoverage,
  getConfigCheck,
} from "../controllers_new/adminCatalogController.js";

const router = express.Router();

// tighter limit for the operations that make outbound requests
const opLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many operations, slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(isAuthenticated, requireRole("admin"));

router.get("/", listJobSources);
router.get("/adapters", getAdapterCatalog); // before /:id
router.get("/capabilities", getCapabilityMatrix); // Phase 12 — before /:id
router.get("/coverage", getSourceCoverage); // Phase 13 — before /:id
router.get("/catalog-health", getCatalogHealth); // Phase 13 — before /:id
router.get("/config-check", getConfigCheck); // Phase 18 — before /:id
router.post("/", createJobSource);
router.get("/:id", getJobSource);
router.patch("/:id", updateJobSource);
router.get("/:id/health", getJobSourceHealth);
router.get("/:id/sync-runs", listSyncRuns);
router.post("/:id/sync", opLimiter, syncJobSource);
router.post("/:id/test", opLimiter, testJobSource); // Phase 18 — bounded probe
router.post("/:id/verify-links", opLimiter, verifyJobSourceLinks);

export default router;
