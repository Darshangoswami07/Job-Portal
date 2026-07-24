import express from "express";
import {
  listCompanyProfiles,
  getCompanyProfileById,
  getCompanyJobs,
  syncCompanies,
  getCompanyStats,
} from "../controllers_new/companyAggregator.controller.js";

const router = express.Router();

router.get("/", listCompanyProfiles);
router.get("/stats", getCompanyStats);
router.get("/:id", getCompanyProfileById);
router.get("/:id/jobs", getCompanyJobs);
router.post("/sync", syncCompanies);

export default router;
