import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  getQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion,
  toggleBookmark, toggleLike, bulkCreateQuestions,
  getCategories, getCompanies,
  getUserBookmarks, getUserProgress, recordSolved,
} from "../controllers_new/questionController.js";

const router = express.Router();

router.route("/categories").get(getCategories);
router.route("/companies").get(getCompanies);

router.route("/bookmarks").get(isAuthenticated, getUserBookmarks);
router.route("/progress").get(isAuthenticated, getUserProgress);

router.route("/bulk").post(isAuthenticated, bulkCreateQuestions);

router.route("/").get(getQuestions).post(isAuthenticated, createQuestion);
router.route("/:id")
  .get(getQuestionById)
  .put(isAuthenticated, updateQuestion)
  .delete(isAuthenticated, deleteQuestion);
router.route("/:id/bookmark").post(isAuthenticated, toggleBookmark);
router.route("/:id/like").post(isAuthenticated, toggleLike);
router.route("/:id/solved").post(isAuthenticated, recordSolved);

export default router;
