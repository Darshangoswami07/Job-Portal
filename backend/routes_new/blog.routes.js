import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { createBlog, getBlogs, getBlogBySlug, updateBlog, deleteBlog, toggleBlogLike, toggleBlogBookmark, addComment } from "../controllers_new/blogController.js";

const router = express.Router();

router.route("/").get(getBlogs).post(isAuthenticated, createBlog);
router.route("/:slug").get(getBlogBySlug);
router.route("/:id").put(isAuthenticated, updateBlog).delete(isAuthenticated, deleteBlog);
router.route("/:id/like").post(isAuthenticated, toggleBlogLike);
router.route("/:id/bookmark").post(isAuthenticated, toggleBlogBookmark);
router.route("/:id/comment").post(isAuthenticated, addComment);

export default router;
