import { SalaryData } from "../models_new/SalaryData.js";
import { generateSalaryData, getCompanyDetails, ALL_ROLES, ALL_COMPANIES, ALL_LOCATIONS, DEPARTMENTS, LEVELS } from "./salarySeedData.js";

export const searchSalaries = async (req, res) => {
  try {
    const { role, location, experienceLevel, skills, company, department, workMode, minSalary, maxSalary, page = 1, limit = 20, sort = "-averageSalary" } = req.query;
    const query = {};
    if (role) query.role = { $regex: role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };
    if (location) query.location = { $regex: location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };
    if (experienceLevel) query.experienceLevel = { $regex: experienceLevel, $options: "i" };
    if (company) query.company = { $regex: company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };
    if (department) query.department = { $regex: department, $options: "i" };
    if (workMode) query.workMode = workMode;
    if (skills) query.skills = { $in: skills.split(",").map(s => s.trim()).filter(Boolean) };
    if (minSalary || maxSalary) {
      query.averageSalary = {};
      if (minSalary) query.averageSalary.$gte = Number(minSalary);
      if (maxSalary) query.averageSalary.$lte = Number(maxSalary);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [results, total] = await Promise.all([
      SalaryData.find(query).sort(sort).skip(skip).limit(Number(limit)),
      SalaryData.countDocuments(query),
    ]);

    const stats = await SalaryData.aggregate([
      { $match: query },
      { $group: { _id: null, avgSalary: { $avg: "$averageSalary" }, medianSalary: { $avg: "$medianSalary" }, minSal: { $min: "$minSalary" }, maxSal: { $max: "$maxSalary" }, avgTotalComp: { $avg: "$totalCompensation" }, avgGrowth: { $avg: "$annualGrowth" }, count: { $sum: 1 } } },
    ]);

    const topCompanies = await SalaryData.aggregate([
      { $match: { ...query, company: { $ne: "" } } },
      { $group: { _id: "$company", avg: { $avg: "$averageSalary" }, totalComp: { $avg: "$totalCompensation" }, count: { $sum: 1 } } },
      { $sort: { avg: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      results,
      stats: stats[0] || { avgSalary: 0, medianSalary: 0, minSal: 0, maxSal: 0, avgTotalComp: 0, avgGrowth: 0, count: 0 },
      topCompanies: topCompanies.map(c => ({ company: c._id, averageSalary: Math.round(c.avg), totalCompensation: Math.round(c.totalComp), count: c.count })),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await SalaryData.distinct("role");
    res.json({ success: true, roles: roles.length > 0 ? roles : ALL_ROLES });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLocations = async (req, res) => {
  try {
    const locations = await SalaryData.distinct("location");
    res.json({ success: true, locations: locations.length > 0 ? locations : ALL_LOCATIONS });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInsights = async (req, res) => {
  try {
    const [avgGrowth, topCity, topRole, total, avgComp] = await Promise.all([
      SalaryData.aggregate([{ $group: { _id: null, avg: { $avg: "$annualGrowth" } } }]),
      SalaryData.aggregate([{ $group: { _id: "$location", avg: { $avg: "$averageSalary" } } }, { $sort: { avg: -1 } }, { $limit: 1 }]),
      SalaryData.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 1 }]),
      SalaryData.countDocuments(),
      SalaryData.aggregate([{ $group: { _id: null, avg: { $avg: "$averageSalary" } } }]),
    ]);

    const roleSalary = await SalaryData.aggregate([
      { $group: { _id: "$role", avgSal: { $avg: "$averageSalary" } } },
      { $sort: { avgSal: -1 } },
      { $limit: 1 },
    ]);

    res.json({
      success: true,
      insights: {
        avgGrowth: avgGrowth[0]?.avg ? Math.round(avgGrowth[0].avg * 10) / 10 : 0,
        topCity: topCity[0]?._id || "N/A",
        topRole: topRole[0]?._id || "N/A",
        totalDataPoints: total || 0,
        averageSalary: avgComp[0]?.avg ? Math.round(avgComp[0].avg) : 0,
        topPayingRole: roleSalary[0]?._id || "N/A",
        topPayingSalary: roleSalary[0]?.avgSal ? Math.round(roleSalary[0].avgSal) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompanies = async (req, res) => {
  try {
    const { search } = req.query;
    const match = {};
    if (search) match.company = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };

    const companies = await SalaryData.aggregate([
      { $match: { company: { $ne: "" }, ...match } },
      {
        $group: {
          _id: "$company",
          avgSalary: { $avg: "$averageSalary" },
          minSalary: { $min: "$minSalary" },
          maxSalary: { $max: "$maxSalary" },
          totalCompensation: { $avg: "$totalCompensation" },
          count: { $sum: 1 },
          avgGrowth: { $avg: "$annualGrowth" },
          demandScore: { $avg: "$demandScore" },
          departments: { $addToSet: "$department" },
          locations: { $addToSet: "$location" },
        },
      },
      { $sort: { avgSalary: -1 } },
      { $limit: 50 },
    ]);

    const details = getCompanyDetails();
    const enriched = companies.map(c => {
      const detail = details.find(d => d.name === c._id) || {};
      return {
        name: c._id,
        averageSalary: Math.round(c.avgSalary),
        minSalary: Math.round(c.minSalary),
        maxSalary: Math.round(c.maxSalary),
        totalCompensation: Math.round(c.totalCompensation),
        dataPoints: c.count,
        growth: Math.round(c.avgGrowth),
        demandScore: Math.round(c.demandScore),
        departments: c.departments,
        locations: c.locations,
        headquarters: detail.headquarters || "N/A",
        employees: detail.employees || 0,
        founded: detail.founded || 0,
        revenue: detail.revenue || "N/A",
        rating: detail.rating || "N/A",
        interviewExp: detail.interviewExp || "N/A",
        industry: detail.industry || "Technology",
      };
    });

    res.json({ success: true, companies: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrends = async (req, res) => {
  try {
    const { role, company, location } = req.query;
    const match = {};
    if (role) match.role = { $regex: role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };
    if (company) match.company = { $regex: company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };
    if (location) match.location = { $regex: location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };

    const levelOrder = { entry: 0, mid: 1, senior: 2, lead: 3 };
    const trends = await SalaryData.aggregate([
      { $match: match },
      {
        $group: {
          _id: { experienceLevel: "$experienceLevel" },
          avgSalary: { $avg: "$averageSalary" },
          minSalary: { $min: "$minSalary" },
          maxSalary: { $max: "$maxSalary" },
          totalComp: { $avg: "$totalCompensation" },
          count: { $sum: 1 },
        },
      },
    ]);

    const roleTrends = await SalaryData.aggregate([
      { $match: match },
      {
        $group: {
          _id: { role: "$role", experienceLevel: "$experienceLevel" },
          avgSalary: { $avg: "$averageSalary" },
          count: { $sum: 1 },
        },
      },
    ]);

    const grouped = {};
    roleTrends.forEach(t => {
      const roleName = t._id.role;
      if (!grouped[roleName]) grouped[roleName] = {};
      grouped[roleName][t._id.experienceLevel] = { avgSalary: Math.round(t.avgSalary), count: t.count };
    });

    const formattedTrends = trends
      .map(t => ({
        experienceLevel: t._id.experienceLevel,
        avgSalary: Math.round(t.avgSalary),
        minSalary: Math.round(t.minSalary),
        maxSalary: Math.round(t.maxSalary),
        totalCompensation: Math.round(t.totalComp),
        count: t.count,
      }))
      .sort((a, b) => levelOrder[a.experienceLevel] - levelOrder[b.experienceLevel]);

    res.json({
      success: true,
      trends: formattedTrends,
      roleTrends: Object.entries(grouped).map(([role, levels]) => ({ role, levels })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReport = async (req, res) => {
  try {
    const { role, company, location, experienceLevel, format } = req.query;
    const match = {};
    if (role) match.role = { $regex: role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };
    if (company) match.company = { $regex: company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };
    if (location) match.location = { $regex: location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };
    if (experienceLevel) match.experienceLevel = experienceLevel;

    const data = await SalaryData.find(match).sort({ averageSalary: -1 }).lean();
    const stats = await SalaryData.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalDataPoints: { $sum: 1 },
          avgSalary: { $avg: "$averageSalary" },
          medianSalary: { $avg: "$medianSalary" },
          minSal: { $min: "$minSalary" },
          maxSal: { $max: "$maxSalary" },
          avgTotalComp: { $avg: "$totalCompensation" },
          avgGrowth: { $avg: "$annualGrowth" },
        },
      },
    ]);

    const byExperience = await SalaryData.aggregate([
      { $match: match },
      { $group: { _id: "$experienceLevel", avg: { $avg: "$averageSalary" }, count: { $sum: 1 } } },
    ]);

    const byCompany = await SalaryData.aggregate([
      { $match: { ...match, company: { $ne: "" } } },
      { $group: { _id: "$company", avg: { $avg: "$averageSalary" }, count: { $sum: 1 } } },
      { $sort: { avg: -1 } },
      { $limit: 20 },
    ]);

    const byLocation = await SalaryData.aggregate([
      { $match: match },
      { $group: { _id: "$location", avg: { $avg: "$averageSalary" }, count: { $sum: 1 } } },
      { $sort: { avg: -1 } },
    ]);

    const report = {
      generatedAt: new Date().toISOString(),
      filters: { role, company, location, experienceLevel },
      stats: stats[0] || {},
      byExperience: byExperience.map(e => ({ level: e._id, avgSalary: Math.round(e.avg), count: e.count })),
      byCompany: byCompany.map(c => ({ name: c._id, avgSalary: Math.round(c.avg), count: c.count })),
      byLocation: byLocation.map(l => ({ name: l._id, avgSalary: Math.round(l.avg), count: l.count })),
      dataPoints: data.length,
      records: data,
    };

    if (format === "csv") {
      const headers = "Role,Company,Location,Experience,AvgSalary,MinSalary,MaxSalary,Bonus,Stock,TotalComp,WorkMode,Skills";
      const rows = data.map(r =>
        `"${r.role || ""}","${r.company || ""}","${r.location || ""}","${r.experienceLevel || ""}",${r.averageSalary || 0},${r.minSalary || 0},${r.maxSalary || 0},${r.bonus || 0},${r.stock || 0},${r.totalCompensation || 0},"${r.workMode || ""}","${(r.skills || []).join("; ")}"`
      );
      const csv = [headers, ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=salary-report-${new Date().toISOString().slice(0, 10)}.csv`);
      return res.send(csv);
    }

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCalculator = async (req, res) => {
  try {
    const { role, experienceLevel, location, skills: skillsStr } = req.query;
    if (!role || !experienceLevel) {
      return res.status(400).json({ success: false, message: "role and experienceLevel are required" });
    }

    const match = {
      role: { $regex: role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" },
      experienceLevel: { $regex: experienceLevel, $options: "i" },
    };
    if (location) match.location = { $regex: location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };

    const data = await SalaryData.find(match).sort({ averageSalary: -1 }).limit(50).lean();
    const suggestedSkills = [...new Set(data.flatMap(r => r.skills || []))];

    let skillBonus = 0;
    if (skillsStr) {
      const userSkills = skillsStr.split(",").map(s => s.trim().toLowerCase());
      const matched = data.filter(r => (r.skills || []).some(s => userSkills.includes(s.toLowerCase())));
      if (matched.length > 0) {
        const matchedAvg = matched.reduce((sum, r) => sum + r.averageSalary, 0) / matched.length;
        const overallAvg = data.length > 0 ? data.reduce((sum, r) => sum + r.averageSalary, 0) / data.length : 0;
        skillBonus = matchedAvg - overallAvg;
      }
    }

    let predictedSalary = 0;
    let predictedRange = { min: 0, max: 0 };
    let percentile = 50;
    if (data.length > 0) {
      const salaries = data.map(r => r.averageSalary).sort((a, b) => a - b);
      const mid = Math.floor(salaries.length / 2);
      predictedSalary = salaries.length % 2 === 0 ? Math.round((salaries[mid - 1] + salaries[mid]) / 2) : salaries[mid];
      predictedSalary += Math.round(skillBonus);
      predictedRange = {
        min: Math.round(predictedSalary * 0.85),
        max: Math.round(predictedSalary * 1.2),
      };
      const exactMatch = data.filter(r => (r.skills || []).some(s => userSkills.includes(s.toLowerCase())));
      if (exactMatch.length > 0) {
        const exactAvg = exactMatch.reduce((sum, r) => sum + r.averageSalary, 0) / exactMatch.length;
        predictedSalary = Math.round((predictedSalary + exactAvg) / 2);
      }
      const allSalaries = await SalaryData.find({}).sort({ averageSalary: -1 }).limit(1000).lean();
      const allAvg = allSalaries.reduce((sum, r) => sum + r.averageSalary, 0) / allSalaries.length;
      percentile = Math.min(99, Math.round((predictedSalary / allAvg) * 50 + 10));

      const totalCompMatch = [...data.filter(r => r.totalCompensation > 0)];
      const avgTotalComp = totalCompMatch.length > 0
        ? totalCompMatch.reduce((sum, r) => sum + r.totalCompensation, 0) / totalCompMatch.length
        : predictedSalary * 1.3;
      const equityRange = totalCompMatch.length > 0
        ? { min: Math.round(Math.min(...totalCompMatch.map(r => r.stock || 0))), max: Math.round(Math.max(...totalCompMatch.map(r => r.stock || 0))) }
        : { min: 0, max: Math.round(predictedSalary * 0.5) };

      const breakdown = {
        baseSalary: Math.round(predictedSalary * 0.75),
        bonus: Math.round(predictedSalary * 0.1),
        equity: Math.round(predictedSalary * 0.15),
        totalCompensation: predictedSalary,
      };

      return res.json({
        success: true,
        calculator: {
          role,
          experienceLevel,
          location: location || "All",
          predictedSalary,
          predictedRange,
          percentile,
          totalCompensation: breakdown.totalCompensation,
          breakdown,
          skillBonus: Math.round(skillBonus),
          suggestedSkills: suggestedSkills.slice(0, 10),
          dataPoints: data.length,
        },
      });
    }

    const baseByLevel = { entry: 600000, mid: 1500000, senior: 3500000, lead: 6500000 };
    const base = baseByLevel[experienceLevel] || 1000000;
    res.json({
      success: true,
      calculator: {
        role,
        experienceLevel,
        location: location || "All",
        predictedSalary: base,
        predictedRange: { min: Math.round(base * 0.8), max: Math.round(base * 1.3) },
        percentile: 40,
        totalCompensation: Math.round(base * 1.3),
        breakdown: { baseSalary: Math.round(base * 0.7), bonus: Math.round(base * 0.1), equity: Math.round(base * 0.2), totalCompensation: Math.round(base * 1.3) },
        skillBonus: 0,
        suggestedSkills: suggestedSkills.slice(0, 10),
        dataPoints: 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompanyDetail = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) return res.status(400).json({ success: false, message: "Company name is required" });

    const match = { company: { $regex: name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" } };

    const [stats, roles, locations, experience, salaries] = await Promise.all([
      SalaryData.aggregate([
        { $match: match },
        { $group: { _id: null, avgSalary: { $avg: "$averageSalary" }, minSal: { $min: "$minSalary" }, maxSal: { $max: "$maxSalary" }, avgTotalComp: { $avg: "$totalCompensation" }, avgGrowth: { $avg: "$annualGrowth" }, count: { $sum: 1 } } },
      ]),
      SalaryData.aggregate([
        { $match: match },
        { $group: { _id: "$role", avg: { $avg: "$averageSalary" }, count: { $sum: 1 } } },
        { $sort: { avg: -1 } },
      ]),
      SalaryData.aggregate([
        { $match: match },
        { $group: { _id: "$location", avg: { $avg: "$averageSalary" }, count: { $sum: 1 } } },
        { $sort: { avg: -1 } },
      ]),
      SalaryData.aggregate([
        { $match: match },
        { $group: { _id: "$experienceLevel", avg: { $avg: "$averageSalary" }, count: { $sum: 1 } } },
      ]),
      SalaryData.find(match).sort({ averageSalary: -1 }).limit(30).lean(),
    ]);

    const details = getCompanyDetails().find(d => d.name.toLowerCase() === name.toLowerCase());

    res.json({
      success: true,
      companyDetail: {
        name: name,
        stats: stats[0] || { avgSalary: 0, minSal: 0, maxSal: 0, avgTotalComp: 0, avgGrowth: 0, count: 0 },
        roles: roles.map(r => ({ role: r._id, avgSalary: Math.round(r.avg), count: r.count })),
        locations: locations.map(l => ({ location: l._id, avgSalary: Math.round(l.avg), count: l.count })),
        experience: experience.map(e => ({ level: e._id, avgSalary: Math.round(e.avg), count: e.count })),
        salaries,
        details: details || {},
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const seedSalaryData = async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 2000;

    const existing = await SalaryData.countDocuments();
    if (existing > 0) {
      await SalaryData.deleteMany({});
    }

    const records = generateSalaryData(count);
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      await SalaryData.insertMany(records.slice(i, i + batchSize));
    }

    const total = await SalaryData.countDocuments();
    res.status(201).json({ success: true, message: `Seeded ${total} salary records` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const departments = await SalaryData.distinct("department");
    res.json({ success: true, departments: departments.length > 0 ? departments : DEPARTMENTS });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
