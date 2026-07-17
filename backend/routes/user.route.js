import express from "express";
import {
  login,
  logout,
  register,
  updateProfile,
  getResume,
  getProfile,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/profile").get(isAuthenticated, getProfile);
router.route("/updateprofile").post(isAuthenticated, singleUpload, updateProfile);
router.route("/resume").get(isAuthenticated, getResume);

export default router;
