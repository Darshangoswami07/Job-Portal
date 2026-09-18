import express from "express";
import {
  getAdminJobs,
  getAllJobs,
  searchJobs,
  getSearchSuggestions,
  applyRedirect,
  getJobById,
  getJobBySlug,
  getFeaturedJobs,
  getTrendingJobs,
  getRemoteJobs,
  getCatalogStats,
  getRelatedJobs,
  getJobFilters,
  postJob,
  updateJob,
  deleteJob,
  incrementJobView,
} from "../controllers/job.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import requireRole from "../middlewares/requireRole.js";
import optionalAuth from "../middlewares/optionalAuth.js";

const router = express.Router();

router.get("/filters", getJobFilters);
router.get("/catalog-stats", getCatalogStats); // public — real homepage numbers
router.get("/featured", getFeaturedJobs);
router.get("/trending", getTrendingJobs);
router.get("/remote", getRemoteJobs);
router.get("/search/suggestions", getSearchSuggestions);
router.get("/search", optionalAuth, searchJobs);
router.get("/get", getAllJobs);
router.get("/related/:id", getRelatedJobs);
router.get("/slug/:slug", getJobBySlug);
router.get("/get/:id", getJobById);
router.get("/getadminjobs", isAuthenticated, getAdminJobs);

// Phase 4: safe external Apply — client sends a job id only; the URL is loaded
// and validated server-side. GET → 302, POST → { url } for the SPA to open.
router.get("/:id/apply-redirect", optionalAuth, applyRedirect);
router.post("/:id/apply-redirect", optionalAuth, applyRedirect);

router.post("/post", isAuthenticated, requireRole("recruiter"), postJob);
router.put("/update/:id", isAuthenticated, requireRole("recruiter"), updateJob);
router.delete("/delete/:id", isAuthenticated, requireRole("recruiter"), deleteJob);
router.patch("/view/:id", incrementJobView);

export default router;
