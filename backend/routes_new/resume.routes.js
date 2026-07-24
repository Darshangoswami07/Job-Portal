import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { createResume, getMyResumes, getResumeById, updateResume, deleteResume, duplicateResume, getResumeSuggestions, updateResumeScore } from "../controllers_new/resumeController.js";

const router = express.Router();

router.route("/").post(isAuthenticated, createResume).get(isAuthenticated, getMyResumes);
router.route("/:id").get(isAuthenticated, getResumeById).put(isAuthenticated, updateResume).delete(isAuthenticated, deleteResume);
router.route("/:id/duplicate").post(isAuthenticated, duplicateResume);
router.route("/:id/suggestions").get(isAuthenticated, getResumeSuggestions);
router.route("/:id/score").post(isAuthenticated, updateResumeScore);

export default router;
