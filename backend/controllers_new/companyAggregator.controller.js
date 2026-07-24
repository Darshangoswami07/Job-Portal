import { CompanyProfile } from "../models_new/CompanyProfile.js";
import { Job } from "../models/job.model.js";
import { aggregateCompanies } from "../services/companyAggregator.js";

export const listCompanyProfiles = async (req, res) => {
  try {
    const {
      search,
      industry,
      hiringStatus,
      location,
      minSalary,
      maxSalary,
      minRating,
      techStack,
      companySize,
      remote,
      sort = "-openJobCount",
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { industry: { $regex: search, $options: "i" } },
        { locations: { $regex: search, $options: "i" } },
        { techStack: { $regex: search, $options: "i" } },
        { aliases: { $regex: search, $options: "i" } },
      ];
    }

    if (industry) {
      const industries = industry.split(",").map((s) => s.trim()).filter(Boolean);
      if (industries.length > 0) filter.industry = { $in: industries };
    }

    if (hiringStatus) {
      const statuses = hiringStatus.split(",").map((s) => s.trim()).filter(Boolean);
      if (statuses.length > 0) filter.hiringStatus = { $in: statuses };
    }

    if (location) {
      filter.locations = { $regex: location, $options: "i" };
    }

    if (techStack) {
      const techs = techStack.split(",").map((s) => s.trim()).filter(Boolean);
      if (techs.length > 0) filter.techStack = { $in: techs };
    }

    if (minSalary || maxSalary) {
      filter["salaries.avgSalary"] = {};
      if (minSalary) filter["salaries.avgSalary"].$gte = Number(minSalary);
      if (maxSalary) filter["salaries.avgSalary"].$lte = Number(maxSalary);
    }

    if (minRating) {
      filter["ratings.overall"] = { $gte: Number(minRating) };
    }

    if (companySize) {
      filter.companySize = { $in: companySize.split(",").map((s) => s.trim()).filter(Boolean) };
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    let sortOption = {};
    switch (sort) {
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "most_jobs":
        sortOption = { openJobCount: -1 };
        break;
      case "highest_rated":
        sortOption = { "ratings.overall": -1 };
        break;
      case "highest_paying":
        sortOption = { "salaries.avgSalary": -1 };
        break;
      case "recently_active":
        sortOption = { lastActive: -1 };
        break;
      case "alphabetical":
        sortOption = { name: 1 };
        break;
      case "growth_score":
        sortOption = { "aiInsights.growthScore": -1 };
        break;
      default:
        sortOption = { openJobCount: -1, lastActive: -1 };
    }

    const [companies, totalCount] = await Promise.all([
      CompanyProfile.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .select("-linkedJobs")
        .lean(),
      CompanyProfile.countDocuments(filter),
    ]);

    const allIndustries = await CompanyProfile.distinct("industry", { industry: { $ne: "" } });
    const allHiringStatuses = await CompanyProfile.distinct("hiringStatus");
    const allLocations = await CompanyProfile.distinct("locations", { locations: { $ne: "" } });

    return res.status(200).json({
      success: true,
      companies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        hasMore: skip + limitNum < totalCount,
      },
      filters: {
        industries: allIndustries.sort(),
        hiringStatuses: allHiringStatuses,
        locations: allLocations.flat().filter(Boolean).sort(),
      },
    });
  } catch (error) {
    console.error("Error in listCompanyProfiles:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch companies", error: error.message });
  }
};

export const getCompanyProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await CompanyProfile.findById(id).populate({
      path: "linkedJobs",
      match: { isActive: true },
      options: { sort: { createdAt: -1 }, limit: 50 },
    }).lean();

    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const salaryPercentiles = calculateSalaryPercentiles(company.linkedJobs || []);

    return res.status(200).json({
      success: true,
      company: { ...company, salaryPercentiles },
    });
  } catch (error) {
    console.error("Error in getCompanyProfileById:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch company", error: error.message });
  }
};

function calculateSalaryPercentiles(jobs) {
  const salaries = jobs.filter((j) => j.salary && j.salary > 0).map((j) => j.salary).sort((a, b) => a - b);
  if (salaries.length === 0) return { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 };

  const p = (arr, q) => {
    const idx = Math.floor((q / 100) * arr.length);
    return arr[Math.min(idx, arr.length - 1)] || 0;
  };

  return {
    p10: p(salaries, 10),
    p25: p(salaries, 25),
    p50: p(salaries, 50),
    p75: p(salaries, 75),
    p90: p(salaries, 90),
  };
}

export const getCompanyJobs = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const company = await CompanyProfile.findById(id).select("linkedJobs normalizedName").lean();
    if (!company) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [jobs, totalJobs] = await Promise.all([
      Job.find({ _id: { $in: company.linkedJobs }, isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("company", "name logo location")
        .lean(),
      Job.countDocuments({ _id: { $in: company.linkedJobs }, isActive: true }),
    ]);

    return res.status(200).json({
      success: true,
      jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalJobs,
        totalPages: Math.ceil(totalJobs / limitNum),
        hasMore: skip + limitNum < totalJobs,
      },
    });
  } catch (error) {
    console.error("Error in getCompanyJobs:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch company jobs", error: error.message });
  }
};

export const syncCompanies = async (req, res) => {
  try {
    const result = await aggregateCompanies();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in syncCompanies:", error);
    return res.status(500).json({ success: false, message: "Sync failed", error: error.message });
  }
};

export const getCompanyStats = async (req, res) => {
  try {
    const totalCompanies = await CompanyProfile.countDocuments();
    const activelyHiring = await CompanyProfile.countDocuments({ hiringStatus: "actively_hiring" });
    const totalJobs = await CompanyProfile.aggregate([
      { $group: { _id: null, total: { $sum: "$openJobCount" } } },
    ]);

    const topIndustries = await CompanyProfile.aggregate([
      { $group: { _id: "$industry", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalCompanies,
        activelyHiring,
        totalOpenJobs: totalJobs[0]?.total || 0,
        topIndustries,
      },
    });
  } catch (error) {
    console.error("Error in getCompanyStats:", error);
    return res.status(500).json({ success: false, message: "Failed to get stats", error: error.message });
  }
};
