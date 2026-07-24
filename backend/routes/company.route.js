import express from "express";
import { getCompany, getCompanyById, getAllCompanies, getCompanyJobs, registerCompany, updateCompany } from "../controllers/company.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/multer.js";

const router = express.Router();

router.route("/register").post(isAuthenticated,registerCompany);
router.route("/get").get(isAuthenticated,getCompany);
router.route("/get/:id").get(isAuthenticated,getCompanyById);
router.route("/update/:id").put(isAuthenticated,singleUpload,updateCompany);

router.route("/all").get(getAllCompanies);
router.route("/:id/jobs").get(getCompanyJobs);

export default router;