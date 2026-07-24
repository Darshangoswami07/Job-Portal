import mongoose from "mongoose";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { syncCompanyOnJobCreate } from "../services/companyAggregator.js";

export const postJob = async (req, res) => {
  try {
    const user = await User.findById(req.id);
    if (!user.roles?.recruiter) {
      return res.status(403).json({
        message: "Enable recruiter mode in profile settings to post jobs",
        success: false,
      });
    }
    if (user.profile?.verificationStatus !== "verified") {
      return res.status(403).json({
        message: "Recruiter verification required to post jobs. Please complete your recruiter profile.",
        success: false,
      });
    }

    const {
      title, description, requirements, responsibilities, niceToHave,
      skills, benefits, location, city, country, jobType, workType,
      salary, salaryMin, salaryMax, salaryCurrency,
      experience, experienceMin, experienceMax,
      position, companyId, industry, department,
      tags, deadline, easyApply, remoteFriendly, visaSponsorship,
      workAuthorization, interviewDifficulty,
    } = req.body;

    const userId = req.id;

    if (!title || !description || !location || !jobType || !salary || !position || !companyId) {
      return res.status(400).json({
        message: "Title, description, location, job type, salary, position, and company are required",
        success: false,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid company selected",
        success: false,
      });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();

    const job = await Job.create({
      title, slug, description,
      requirements: requirements ? (Array.isArray(requirements) ? requirements : requirements.split(",")) : [],
      responsibilities: responsibilities || [],
      niceToHave: niceToHave || [],
      skills: skills || [],
      benefits: benefits || [],
      location, city, country: country || "India",
      jobType, workType: workType || "On-site",
      salary: Number(salary),
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      salaryCurrency: salaryCurrency || "INR",
      experienceLevel: experience ? Number(experience) : 0,
      experienceMin: experienceMin ? Number(experienceMin) : undefined,
      experienceMax: experienceMax ? Number(experienceMax) : undefined,
      position: Number(position),
      company: companyId,
      created_by: userId,
      industry: industry || "",
      department: department || "",
      tags: tags || [],
      deadline: deadline || undefined,
      easyApply: easyApply || false,
      remoteFriendly: remoteFriendly || false,
      visaSponsorship: visaSponsorship || false,
      workAuthorization: workAuthorization || "Any",
      interviewDifficulty: interviewDifficulty || "medium",
      publishedAt: new Date(),
    });

    syncCompanyOnJobCreate(job);

    return res.status(201).json({
      message: "Job created successfully",
      success: true,
      job,
    });
  } catch (error) {
    console.error("Error in postJob:", error);
    return res.status(500).json({
      message: "Server error while creating job",
      success: false,
    });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const {
      keyword, location, city, country,
      jobType, workType,
      salary, salaryMin, salaryMax,
      experience, experienceMin, experienceMax,
      industry, department, skills, tags,
      remote, featured, trending, urgent, verified,
      easyApply, visaSponsorship,
      sort, page = 1, limit = 12,
    } = req.query;

    let query = { isActive: true };

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { skills: { $in: [new RegExp(keyword, "i")] } },
        { tags: { $in: [new RegExp(keyword, "i")] } },
      ];
    }
    if (location) query.location = { $regex: location, $options: "i" };
    if (city) query.city = { $regex: city, $options: "i" };
    if (country) query.country = { $regex: country, $options: "i" };
    if (jobType) query.jobType = { $regex: jobType, $options: "i" };
    if (workType) query.workType = { $regex: workType, $options: "i" };
    if (industry) query.industry = { $regex: industry, $options: "i" };
    if (department) query.department = { $regex: department, $options: "i" };
    if (skills) {
      const skillArr = skills.split(",");
      query.skills = { $in: skillArr.map(s => new RegExp(s.trim(), "i")) };
    }
    if (tags) {
      const tagArr = tags.split(",");
      query.tags = { $in: tagArr.map(t => new RegExp(t.trim(), "i")) };
    }
    if (remote === "true") query.workType = "Remote";
    if (featured === "true") query.featured = true;
    if (trending === "true") query.trending = true;
    if (urgent === "true") query.urgent = true;
    if (verified === "true") query.verified = true;
    if (easyApply === "true") query.easyApply = true;
    if (visaSponsorship === "true") query.visaSponsorship = true;

    if (salary) query.salary = { $gte: Number(salary) };
    if (salaryMin || salaryMax) {
      query.salary = {};
      if (salaryMin) query.salary.$gte = Number(salaryMin);
      if (salaryMax) query.salary.$lte = Number(salaryMax);
    }
    if (experience) query.experienceLevel = { $gte: Number(experience) };
    if (experienceMin || experienceMax) {
      query.experienceLevel = {};
      if (experienceMin) query.experienceLevel.$gte = Number(experienceMin);
      if (experienceMax) query.experienceLevel.$lte = Number(experienceMax);
    }

    let sortOption = { featured: -1, trending: -1, publishedAt: -1 };
    if (sort === "salary_asc") sortOption = { salary: 1 };
    else if (sort === "salary_desc") sortOption = { salary: -1 };
    else if (sort === "oldest") sortOption = { publishedAt: 1 };
    else if (sort === "views") sortOption = { views: -1 };
    else if (sort === "applicants") sortOption = { applicantsCount: -1 };
    else if (sort === "ai_match") sortOption = { aiMatch: -1 };
    else if (sort === "experience_asc") sortOption = { experienceLevel: 1 };
    else if (sort === "experience_desc") sortOption = { experienceLevel: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, totalJobs, allIndustries, allDepartments, allWorkTypes, allJobTypes] = await Promise.all([
      Job.find(query)
        .populate({ path: "company" })
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Job.countDocuments(query),
      Job.distinct("industry", { isActive: true, industry: { $ne: "" } }),
      Job.distinct("department", { isActive: true, department: { $ne: "" } }),
      Job.distinct("workType", { isActive: true }),
      Job.distinct("jobType", { isActive: true }),
    ]);

    return res.status(200).json({
      success: true,
      jobs,
      totalJobs,
      currentPage: Number(page),
      totalPages: Math.ceil(totalJobs / Number(limit)),
      filters: {
        industries: allIndustries.sort(),
        departments: allDepartments.sort(),
        workTypes: allWorkTypes.sort(),
        jobTypes: allJobTypes.sort(),
      },
    });
  } catch (error) {
    console.error("Error in getAllJobs:", error);
    return res.status(500).json({
      message: "Server error while fetching jobs",
      success: false,
    });
  }
};

export const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findByIdAndUpdate(
      jobId,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate({ path: "company" })
      .populate({ path: "applications" });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    const related = await Job.find({
      _id: { $ne: job._id },
      isActive: true,
      $or: [
        { skills: { $in: job.skills?.slice(0, 3) || [] } },
        { industry: job.industry },
        { department: job.department },
        { jobType: job.jobType },
      ],
    })
      .select("title slug location salary salaryMin salaryMax salaryCurrency company jobType workType experienceLevel skills aiMatch views applicantsCount featured urgent easyApply company")
      .populate("company", "name logo location")
      .limit(6)
      .sort({ aiMatch: -1, views: -1 });

    return res.status(200).json({
      success: true,
      job,
      related,
      aiInsights: {
        aiMatch: job.aiMatch,
        atsScore: job.atsScore,
        skillMatch: job.skillMatch,
        resumeMatch: job.resumeMatch,
        missingSkills: job.missingSkills,
        interviewDifficulty: job.interviewDifficulty,
        estimatedSalary: job.estimatedSalary,
        careerGrowth: job.careerGrowth,
      },
    });
  } catch (error) {
    console.error("Error in getJobById:", error);
    return res.status(500).json({
      message: "Server error while fetching job",
      success: false,
    });
  }
};

export const getJobBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const job = await Job.findOneAndUpdate(
      { slug, isActive: true },
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate({ path: "company" })
      .populate({ path: "applications" });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    const related = await Job.find({
      _id: { $ne: job._id },
      isActive: true,
      $or: [
        { skills: { $in: job.skills?.slice(0, 3) || [] } },
        { industry: job.industry },
        { department: job.department },
      ],
    })
      .select("title slug location salary salaryMin salaryMax salaryCurrency company jobType workType experienceLevel skills aiMatch views applicantsCount featured urgent easyApply company")
      .populate("company", "name logo location")
      .limit(6)
      .sort({ aiMatch: -1, views: -1 });

    return res.status(200).json({
      success: true,
      job,
      related,
      aiInsights: {
        aiMatch: job.aiMatch,
        atsScore: job.atsScore,
        skillMatch: job.skillMatch,
        resumeMatch: job.resumeMatch,
        missingSkills: job.missingSkills,
        interviewDifficulty: job.interviewDifficulty,
        estimatedSalary: job.estimatedSalary,
        careerGrowth: job.careerGrowth,
      },
    });
  } catch (error) {
    console.error("Error in getJobBySlug:", error);
    return res.status(500).json({
      message: "Server error while fetching job",
      success: false,
    });
  }
};

export const getFeaturedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true, featured: true })
      .populate("company", "name logo location")
      .sort({ publishedAt: -1 })
      .limit(12);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrendingJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true, trending: true })
      .populate("company", "name logo location")
      .sort({ views: -1, applicantsCount: -1 })
      .limit(12);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRemoteJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true, workType: "Remote" })
      .populate("company", "name logo location")
      .sort({ featured: -1, publishedAt: -1 })
      .limit(20);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminJobs = async (req, res) => {
  try {
    const adminId = req.id;
    const jobs = await Job.find({ created_by: adminId })
      .populate({ path: "company" })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      jobs: jobs || [],
      success: true,
      message: jobs && jobs.length > 0 ? "Jobs fetched successfully" : "No jobs found for this admin",
    });
  } catch (error) {
    console.error("Error in getAdminJobs:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching admin jobs",
    });
  }
};

export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const updateData = {};
    const fields = [
      "title", "description", "requirements", "responsibilities", "niceToHave",
      "skills", "benefits", "location", "city", "country",
      "jobType", "workType", "salary", "salaryMin", "salaryMax", "salaryCurrency",
      "experienceLevel", "experienceMin", "experienceMax",
      "position", "company", "industry", "department", "tags",
      "isActive", "featured", "trending", "urgent", "verified",
      "easyApply", "sponsored", "remoteFriendly", "visaSponsorship",
      "workAuthorization", "interviewDifficulty",
      "aiMatch", "atsScore", "skillMatch", "resumeMatch", "missingSkills",
      "estimatedSalary", "careerGrowth", "promotionPotential",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (req.body.experience !== undefined) updateData.experienceLevel = Number(req.body.experience);
    if (req.body.companyId !== undefined) updateData.company = req.body.companyId;

    const updated = await Job.findByIdAndUpdate(jobId, { $set: updateData }, { new: true }).populate({ path: "company" });

    if (!updated) {
      return res.status(404).json({ message: "Job not found", success: false });
    }

    syncCompanyOnJobCreate(updated);

    res.status(200).json({ message: "Job updated successfully", success: true, job: updated });
  } catch (error) {
    console.error("Error in updateJob:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const incrementJobView = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, views: job.views });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJobFilters = async (req, res) => {
  try {
    const [industries, departments, workTypes, jobTypes, cities] = await Promise.all([
      Job.distinct("industry", { isActive: true, industry: { $ne: "" } }),
      Job.distinct("department", { isActive: true, department: { $ne: "" } }),
      Job.distinct("workType", { isActive: true }),
      Job.distinct("jobType", { isActive: true }),
      Job.distinct("city", { isActive: true, city: { $ne: "" } }),
    ]);
    res.json({
      success: true,
      filters: {
        industries: industries.sort(),
        departments: departments.sort(),
        workTypes: workTypes.sort(),
        jobTypes: jobTypes.sort(),
        cities: cities.sort(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRelatedJobs = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });

    const related = await Job.find({
      _id: { $ne: job._id },
      isActive: true,
      $or: [
        { skills: { $in: job.skills?.slice(0, 3) || [] } },
        { industry: job.industry },
        { department: job.department },
      ],
    })
      .select("title slug location salary salaryMin salaryMax company jobType workType skills aiMatch views")
      .populate("company", "name logo location")
      .limit(8)
      .sort({ aiMatch: -1, views: -1 });

    res.json({ success: true, jobs: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
