import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { runJobAggregation } from "../services/jobAggregationPipeline.js";

const router = express.Router();

router.post("/sync", isAuthenticated, async (req, res) => {
  try {
    const result = await runJobAggregation();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Job aggregation sync failed:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
