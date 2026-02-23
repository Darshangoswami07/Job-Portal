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
        message: "Job created successfully",
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
    const query ={
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } }
      ]
    }

    const jobs = await Job.find(query).populate({
      path: "company",
    }).sort({ createdAt: -1 });
    if(!jobs){
      return res.status(404).json({
        message: "No jobs found",
        success: false,
      });
    }

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
    const jobId = req.params.id;
    const job = await Job.findById(jobId).populate({
      path:"applications"
    })

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
