/**
 * Read-only admin audit log (Phase 6 §16). Authenticated + admin.
 * Mounted at /api/v1/admin/audit.
 */
import express from "express";

import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import { listAuditLog } from "../controllers_new/adminAuditController.js";

const router = express.Router();

router.use(isAuthenticated, requireRole("admin"));
router.get("/", listAuditLog);

export default router;
