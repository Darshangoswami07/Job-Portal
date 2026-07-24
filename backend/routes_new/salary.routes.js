import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  searchSalaries, getRoles, getLocations, getInsights, seedSalaryData,
  getCompanies, getTrends, getReport, getCalculator, getCompanyDetail,
  getDepartments,
} from "../controllers_new/salaryController.js";

const router = express.Router();

router.route("/search").get(isAuthenticated, searchSalaries);
router.route("/roles").get(isAuthenticated, getRoles);
router.route("/locations").get(isAuthenticated, getLocations);
router.route("/insights").get(isAuthenticated, getInsights);
router.route("/companies").get(isAuthenticated, getCompanies);
router.route("/companies/:name").get(isAuthenticated, getCompanyDetail);
router.route("/trends").get(isAuthenticated, getTrends);
router.route("/report").get(isAuthenticated, getReport);
router.route("/calculator").get(isAuthenticated, getCalculator);
router.route("/departments").get(isAuthenticated, getDepartments);
router.route("/seed").post(isAuthenticated, seedSalaryData);

export default router;
