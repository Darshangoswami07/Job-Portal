import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate, incrementTemplateDownloads, getTemplateCategories } from "../controllers_new/resumeTemplateController.js";

const router = express.Router();

router.route("/").get(getTemplates).post(isAuthenticated, createTemplate);
router.route("/categories").get(getTemplateCategories);
router.route("/:id").get(getTemplateById).put(isAuthenticated, updateTemplate).delete(isAuthenticated, deleteTemplate);
router.route("/:id/download").post(incrementTemplateDownloads);

export default router;
