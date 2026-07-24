import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getCategories, startInterview, submitAnswer, getMySessions, getSessionById, deleteSession } from "../controllers_new/interviewController.js";

const router = express.Router();

router.route("/categories").get(isAuthenticated, getCategories);
router.route("/start").post(isAuthenticated, startInterview);
router.route("/submit-answer").post(isAuthenticated, submitAnswer);
router.route("/sessions").get(isAuthenticated, getMySessions);
router.route("/sessions/:id").get(isAuthenticated, getSessionById);
router.route("/sessions/:id").delete(isAuthenticated, deleteSession);

export default router;
