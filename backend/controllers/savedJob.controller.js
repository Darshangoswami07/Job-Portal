import SavedJob from "../models/savedJob.model.js";
import { Job } from "../models/job.model.js";

export const saveJob = async (req, res) => {
  try {
    const userId = req.id;
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        message: "Job id is required",
        success: false,
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    const existing = await SavedJob.findOne({ userId, jobId });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Job already saved",
        savedJob: existing,
      });
    }

    const savedJob = await SavedJob.create({ userId, jobId });
    await savedJob.populate({ path: "jobId", populate: { path: "company" } });

    return res.status(201).json({
      success: true,
      message: "Job saved successfully",
      savedJob,
    });
  } catch (error) {
    console.error("Error in saveJob:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving job",
    });
  }
};

export const getSavedJobs = async (req, res) => {
  try {
    const userId = req.params.userId || req.id;
    if (req.params.userId && req.id !== req.params.userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const savedJobs = await SavedJob.find({ userId })
      .populate({ path: "jobId", populate: { path: "company" } })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      savedJobs,
    });
  } catch (error) {
    console.error("Error in getSavedJobs:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching saved jobs",
    });
  }
};

export const removeSavedJob = async (req, res) => {
  try {
    const userId = req.id;
    const { jobId } = req.params;
    const removed = await SavedJob.findOneAndDelete({ userId, jobId });

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: "Saved job not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Saved job removed successfully",
    });
  } catch (error) {
    console.error("Error in removeSavedJob:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while removing saved job",
    });
  }
};
