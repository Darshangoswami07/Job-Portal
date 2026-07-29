import express from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  logout,
  register,
  updateProfile,
  getResume,
  getResumeById,
  uploadResume,
  deleteResume,
  setPrimaryResume,
  getProfile,
  getProfileById,
  updateAdvancedProfile,
  uploadProjectThumbnail,
  uploadCertificateFile,
  viewUploadedAsset,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts, please try again later", success: false },
  standardHeaders: true,
  legacyHeaders: false,
});

router.route("/register").post(authLimiter, register);
router.route("/login").post(authLimiter, login);
router.route("/logout").get(logout);
router.route("/profile").get(isAuthenticated, getProfile).put(isAuthenticated, updateAdvancedProfile);
router.route("/profile/:userId").get(isAuthenticated, getProfileById);
router.route("/updateprofile").post(isAuthenticated, singleUpload, updateProfile);
router.route("/resume").get(isAuthenticated, getResume);
router.route("/resumes").post(isAuthenticated, singleUpload, uploadResume);
router.route("/resumes/:resumeId").get(isAuthenticated, getResumeById).delete(isAuthenticated, deleteResume);
router.route("/resumes/:resumeId/primary").patch(isAuthenticated, setPrimaryResume);
router.route("/uploads/project-thumbnail").post(isAuthenticated, singleUpload, uploadProjectThumbnail);
router.route("/uploads/certificate").post(isAuthenticated, singleUpload, uploadCertificateFile);
router.route("/uploads/view").get(isAuthenticated, viewUploadedAsset);

export default router;
