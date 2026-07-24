import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  getTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate,
  incrementTemplateDownloads, getTemplateCategories, getFeaturedTemplates, searchTemplates,
} from "../controllers_new/resumeTemplateController.js";

const router = express.Router();

router.route("/categories").get(getTemplateCategories);
router.route("/featured").get(getFeaturedTemplates);
router.route("/search").get(searchTemplates);
router.route("/").get(getTemplates).post(isAuthenticated, createTemplate);
router.route("/:id").get(getTemplateById).put(isAuthenticated, updateTemplate).delete(isAuthenticated, deleteTemplate);
router.route("/:id/download").post(incrementTemplateDownloads);

export default router;
