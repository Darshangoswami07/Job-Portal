import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createBlog, getBlogs, getBlogBySlug, getRelatedBlogs, getTrendingBlogs,
  getRecommendedBlogs, updateBlog, deleteBlog, toggleBlogLike,
  toggleBlogBookmark, addComment, getCategories, getAllBlogsAdmin,
  adminUpdateBlog, adminDeleteBlog, getBlogById,
} from "../controllers_new/blogController.js";

const router = express.Router();

router.route("/").get(getBlogs).post(isAuthenticated, createBlog);
router.get("/categories", getCategories);
router.get("/trending", getTrendingBlogs);
router.get("/recommended", getRecommendedBlogs);
router.get("/related/:slug", getRelatedBlogs);

router.get("/admin", isAuthenticated, getAllBlogsAdmin);
router.get("/admin/:id", isAuthenticated, getBlogById);
router.put("/admin/:id", isAuthenticated, adminUpdateBlog);
router.delete("/admin/:id", isAuthenticated, adminDeleteBlog);

router.get("/:slug", getBlogBySlug);
router.put("/:id", isAuthenticated, updateBlog);
router.delete("/:id", isAuthenticated, deleteBlog);
router.post("/:id/like", isAuthenticated, toggleBlogLike);
router.post("/:id/bookmark", isAuthenticated, toggleBlogBookmark);
router.post("/:id/comment", isAuthenticated, addComment);

export default router;