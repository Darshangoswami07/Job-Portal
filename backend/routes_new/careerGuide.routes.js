import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getGuides, getGuideBySlug, createGuide, updateGuide, deleteGuide, toggleGuideBookmark, getGuideCategories } from "../controllers_new/careerGuideController.js";

const router = express.Router();

router.route("/").get(getGuides).post(isAuthenticated, createGuide);
router.route("/categories").get(getGuideCategories);
router.route("/:slug").get(getGuideBySlug);
router.route("/:id").put(isAuthenticated, updateGuide).delete(isAuthenticated, deleteGuide);
router.route("/:id/bookmark").post(isAuthenticated, toggleGuideBookmark);

export default router;
