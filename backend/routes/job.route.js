import express from "express";
import {
  getAdminJobs,
  getAllJobs,
  getJobById,
  getJobBySlug,
  getFeaturedJobs,
  getTrendingJobs,
  getRemoteJobs,
  getRelatedJobs,
  getJobFilters,
  postJob,
  updateJob,
  deleteJob,
  incrementJobView,
} from "../controllers/job.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.get("/filters", getJobFilters);
router.get("/featured", getFeaturedJobs);
router.get("/trending", getTrendingJobs);
router.get("/remote", getRemoteJobs);
router.get("/get", getAllJobs);
router.get("/related/:id", getRelatedJobs);
router.get("/slug/:slug", getJobBySlug);
router.get("/get/:id", getJobById);
router.get("/getadminjobs", isAuthenticated, getAdminJobs);

router.post("/post", isAuthenticated, postJob);
router.put("/update/:id", isAuthenticated, updateJob);
router.delete("/delete/:id", isAuthenticated, deleteJob);
router.patch("/view/:id", incrementJobView);

export default router;
