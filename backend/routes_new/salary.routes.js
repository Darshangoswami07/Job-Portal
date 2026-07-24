import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { searchSalaries, getRoles, getLocations, getInsights, seedSalaryData } from "../controllers_new/salaryController.js";

const router = express.Router();

router.route("/search").get(isAuthenticated, searchSalaries);
router.route("/roles").get(isAuthenticated, getRoles);
router.route("/locations").get(isAuthenticated, getLocations);
router.route("/insights").get(isAuthenticated, getInsights);
router.route("/seed").post(isAuthenticated, seedSalaryData);

export default router;
