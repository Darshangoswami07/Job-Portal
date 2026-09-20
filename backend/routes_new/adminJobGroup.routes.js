/**
 * Admin JobGroup inspection + split (Phase 7 / PLAN.md §7).
 * Authenticated + admin. Mounted at /api/v1/admin/job-groups.
 */
import express from "express";

import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import {
  listJobGroups,
  getJobGroup,
  splitJobGroup,
} from "../controllers_new/adminJobGroupController.js";

const router = express.Router();

router.use(isAuthenticated, requireRole("admin"));

router.get("/", listJobGroups);
router.get("/:id", getJobGroup);
router.post("/:id/split", splitJobGroup);

export default router;
