import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { applyjob, getApplicants, getAppliedjobs, updateStatus } from '../controllers/application.controller.js';


const router = express.Router();

router.route("/apply/:id").get(isAuthenticated, applyjob);
router.route("/get").get(isAuthenticated, getAppliedjobs);
router.route("/:id/applicant").get(isAuthenticated,getApplicants);
router.route("/status/:id/update").post(isAuthenticated,updateStatus);

export default router;