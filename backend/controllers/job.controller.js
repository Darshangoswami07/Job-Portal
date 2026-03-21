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
    console.error("Error in postJob:", error);
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
    console.error("Error in getAllJobs:", error);
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
    console.error("Error in getJobById:", error);
  }
};

export const getAdminJobs = async (req, res) => {
  try {
    const adminId = req.id;
    // populate the company field so frontend can display its name
    const jobs = await Job.find({ created_by: adminId })
      .populate({ path: "company" })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      jobs: jobs || [],
      success: true,
      message: jobs && jobs.length > 0 ? "Jobs fetched successfully" : "No jobs found for this admin"
    });
  } catch (error) {
    console.error("Error in getAdminJobs:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching admin jobs",
    });
  }
};

// update job fields
export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const {
      title,
      description,
      requirements,
      location,
      jobType,
      salary,
      experience,
      position,
      companyId,
    } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (requirements) updateData.requirements = requirements.split(",");
    if (location) updateData.location = location;
    if (jobType) updateData.jobType = jobType;
    if (salary) updateData.salary = Number(salary);
    if (experience) updateData.experienceLevel = experience;
    if (position) updateData.position = Number(position);
    if (companyId) updateData.company = companyId;

    const updated = await Job.findByIdAndUpdate(jobId, updateData, {
      new: true,
    }).populate({ path: "company" });

    if (!updated) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Job updated successfully",
      success: true,
      job: updated,
    });
  } catch (error) {
    console.error("Error in updateJob:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};
