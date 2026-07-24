import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { generateRoadmap, getMyRoadmaps, getRoadmapById, markStepComplete, deleteRoadmap } from "../controllers_new/roadmapController.js";

const router = express.Router();

router.route("/generate").post(isAuthenticated, generateRoadmap);
router.route("/").get(isAuthenticated, getMyRoadmaps);
router.route("/:id").get(isAuthenticated, getRoadmapById).delete(isAuthenticated, deleteRoadmap);
router.route("/:id/step").patch(isAuthenticated, markStepComplete);

export default router;
