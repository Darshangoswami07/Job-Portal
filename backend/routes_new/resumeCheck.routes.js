import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/multer.js";
import { analyzeResume, getMyAnalyses, getAnalysisById } from "../controllers_new/resumeCheckController.js";

const router = express.Router();

router.route("/analyze").post(isAuthenticated, singleUpload, analyzeResume);
router.route("/").get(isAuthenticated, getMyAnalyses);
router.route("/:id").get(isAuthenticated, getAnalysisById);

export default router;
