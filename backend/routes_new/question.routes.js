import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getQuestions, createQuestion, toggleQuestionBookmark } from "../controllers_new/questionController.js";

const router = express.Router();

router.route("/").get(getQuestions).post(isAuthenticated, createQuestion);
router.route("/:id/bookmark").post(isAuthenticated, toggleQuestionBookmark);

export default router;
