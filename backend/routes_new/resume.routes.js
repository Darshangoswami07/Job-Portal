import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createResume, getMyResumes, getResumeById, updateResume, autoSaveResume, deleteResume,
  duplicateResume, toggleFavorite, togglePublic, getPublicResume,
  getResumeSuggestions, generateResume, updateResumeScore,
} from "../controllers_new/resumeController.js";

const router = express.Router();

router.route("/").get(isAuthenticated, getMyResumes).post(isAuthenticated, createResume);
router.route("/generate").post(isAuthenticated, generateResume);
router.route("/public/:slug").get(getPublicResume);
router.route("/:id").get(isAuthenticated, getResumeById).put(isAuthenticated, updateResume).delete(isAuthenticated, deleteResume);
router.route("/:id/autosave").put(isAuthenticated, autoSaveResume);
router.route("/:id/duplicate").post(isAuthenticated, duplicateResume);
router.route("/:id/favorite").post(isAuthenticated, toggleFavorite);
router.route("/:id/public").post(isAuthenticated, togglePublic);
router.route("/:id/suggestions").get(isAuthenticated, getResumeSuggestions);
router.route("/:id/score").post(isAuthenticated, updateResumeScore);

export default router;
