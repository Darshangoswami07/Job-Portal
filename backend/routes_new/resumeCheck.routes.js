import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/multer.js";
import {
  analyzeResume,
  getMyAnalyses,
  getAnalysisById,
  deleteAnalysis,
  renameAnalysis,
  getComparison,
} from "../controllers_new/resumeCheckController.js";

const router = express.Router();

router.route("/analyze").post(isAuthenticated, singleUpload, analyzeResume);
router.route("/").get(isAuthenticated, getMyAnalyses);
router.route("/compare").get(isAuthenticated, getComparison);
router.route("/:id").get(isAuthenticated, getAnalysisById);
router.route("/:id").delete(isAuthenticated, deleteAnalysis);
router.route("/:id/rename").patch(isAuthenticated, renameAnalysis);

export default router;
