import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { createCoverLetter, getMyCoverLetters, getCoverLetterById, updateCoverLetter, deleteCoverLetter, generateCoverLetter } from "../controllers_new/coverLetterController.js";

const router = express.Router();

router.route("/").post(isAuthenticated, createCoverLetter).get(isAuthenticated, getMyCoverLetters);
router.route("/generate").post(isAuthenticated, generateCoverLetter);
router.route("/:id").get(isAuthenticated, getCoverLetterById).put(isAuthenticated, updateCoverLetter).delete(isAuthenticated, deleteCoverLetter);

export default router;
