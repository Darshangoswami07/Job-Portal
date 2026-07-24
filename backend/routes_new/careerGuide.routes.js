import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getGuides, getGuideBySlug, createGuide, updateGuide, deleteGuide, toggleGuideBookmark, toggleGuideLike, addGuideComment, getGuideCategories, getTrendingGuides, getFeaturedGuides, getRecommendedGuides, getUserBookmarkedGuides, getUserLikedGuides, toggleGuideFeatured, toggleGuideTrending, bulkDeleteGuides } from "../controllers_new/careerGuideController.js";

const router = express.Router();

router.route("/").get(getGuides).post(isAuthenticated, createGuide);
router.route("/categories").get(getGuideCategories);
router.route("/trending").get(getTrendingGuides);
router.route("/featured").get(getFeaturedGuides);
router.route("/recommended").get(getRecommendedGuides);
router.route("/bookmarked").get(isAuthenticated, getUserBookmarkedGuides);
router.route("/liked").get(isAuthenticated, getUserLikedGuides);

router.route("/:slug").get(getGuideBySlug);
router.route("/:id").put(isAuthenticated, updateGuide).delete(isAuthenticated, deleteGuide);
router.route("/:id/bookmark").post(isAuthenticated, toggleGuideBookmark);
router.route("/:id/like").post(isAuthenticated, toggleGuideLike);
router.route("/:id/comment").post(isAuthenticated, addGuideComment);
router.route("/:id/featured").patch(isAuthenticated, toggleGuideFeatured);
router.route("/:id/trending").patch(isAuthenticated, toggleGuideTrending);

router.route("/bulk/delete").post(isAuthenticated, bulkDeleteGuides);

export default router;