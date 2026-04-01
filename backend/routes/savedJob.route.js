import express from "express";
import {
  saveJob,
  getSavedJobs,
  removeSavedJob,
} from "../controllers/savedJob.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.post("/post", isAuthenticated, saveJob);
router.get("/me", isAuthenticated, getSavedJobs);
router.get("/:userId", isAuthenticated, getSavedJobs);
router.delete("/:jobId", isAuthenticated, removeSavedJob);

export default router;
