import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getPlans, createPlan, updatePlan, deletePlan, getMySubscription, createSubscription, cancelSubscription } from "../controllers_new/subscriptionController.js";

const router = express.Router();

router.route("/plans").get(getPlans).post(isAuthenticated, createPlan);
router.route("/plans/:id").put(isAuthenticated, updatePlan).delete(isAuthenticated, deletePlan);
router.route("/my").get(isAuthenticated, getMySubscription);
router.route("/subscribe").post(isAuthenticated, createSubscription);
router.route("/cancel").post(isAuthenticated, cancelSubscription);

export default router;
