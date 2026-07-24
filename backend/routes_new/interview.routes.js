import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getCategories, startInterview, submitAnswer, getMySessions, getSessionById } from "../controllers_new/interviewController.js";

const router = express.Router();

router.route("/categories").get(isAuthenticated, getCategories);
router.route("/start").post(isAuthenticated, startInterview);
router.route("/submit-answer").post(isAuthenticated, submitAnswer);
router.route("/sessions").get(isAuthenticated, getMySessions);
router.route("/sessions/:id").get(isAuthenticated, getSessionById);

export default router;
