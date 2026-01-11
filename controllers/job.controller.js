import { Job } from "../models/job.model.js";

export const postJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      location,
      jobType,
      salary,
      experience,
      position,
      companyId
    } = req.body;

    const userId = req.id;

    if (
      !title || !description || !requirements || !location ||
      !jobType || !salary || !experience || !position || !companyId
    ) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    const job = await Job.create({
      title,
      description,
      requirements: requirements.split(","),
      location,
      jobType,
      salary: Number(salary),
      experienceLevel: experience,
      position,
      company: companyId,
      created_by: userId,
    });

    return res.status(201).json({
      success: true,
      job,
    });
  } catch (error) {
    console.log("Error in postJob:", error);
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const jobs = await Job.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } }
      ]
    });

    return res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.log("Error in getAllJobs:", error);
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.log("Error in getJobById:", error);
  }
};

export const getAdminJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ created_by: req.id });

    return res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.log("Error in getAdminJobs:", error);
  }
};
