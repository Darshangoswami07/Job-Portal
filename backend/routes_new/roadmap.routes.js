import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  generateRoadmap, getMyRoadmaps, getRoadmapById, updateRoadmap, deleteRoadmap,
  duplicateRoadmap, markStepComplete, getSkillGapAnalysis, generateWeeklyPlanAction,
  updateWeeklyTask, markWeeklyPlanComplete, getDashboard, aiMentor,
  resumeIntegration, getJobMarket, getCompanyPrep, addCertification,
  updateCertification, exportRoadmap, createNotification, markNotificationsRead,
  getAvailableRoles, getResourcesBySkill, getCatalog, seedDefaultRoadmaps, addSingleDefaultRoadmap,
} from "../controllers_new/roadmapController.js";

const router = express.Router();

router.route("/generate").post(isAuthenticated, generateRoadmap);
router.route("/dashboard").get(isAuthenticated, getDashboard);
router.route("/available-roles").get(isAuthenticated, getAvailableRoles);
router.route("/job-market/:role").get(isAuthenticated, getJobMarket);
router.route("/company-prep/:company").get(isAuthenticated, getCompanyPrep);
router.route("/resources/:skill").get(isAuthenticated, getResourcesBySkill);
router.route("/ai-mentor").post(isAuthenticated, aiMentor);
router.route("/catalog").get(isAuthenticated, getCatalog);
router.route("/seed-defaults").post(isAuthenticated, seedDefaultRoadmaps);
router.route("/add-default").post(isAuthenticated, addSingleDefaultRoadmap);

router.route("/").get(isAuthenticated, getMyRoadmaps);

router.route("/:id").get(isAuthenticated, getRoadmapById)
  .patch(isAuthenticated, updateRoadmap)
  .delete(isAuthenticated, deleteRoadmap);

router.route("/:id/step").patch(isAuthenticated, markStepComplete);
router.route("/:id/duplicate").post(isAuthenticated, duplicateRoadmap);
router.route("/:id/skill-gap").get(isAuthenticated, getSkillGapAnalysis);
router.route("/:id/weekly-plan").post(isAuthenticated, generateWeeklyPlanAction);
router.route("/:id/weekly-plan/task").patch(isAuthenticated, updateWeeklyTask);
router.route("/:id/weekly-plan/:weekIndex/complete").patch(isAuthenticated, markWeeklyPlanComplete);
router.route("/:id/resume").post(isAuthenticated, resumeIntegration);
router.route("/:id/certifications").post(isAuthenticated, addCertification);
router.route("/:id/certifications/:certId").patch(isAuthenticated, updateCertification);
router.route("/:id/export").get(isAuthenticated, exportRoadmap);
router.route("/:id/notifications").post(isAuthenticated, createNotification);
router.route("/:id/notifications/read").patch(isAuthenticated, markNotificationsRead);

export default router;
