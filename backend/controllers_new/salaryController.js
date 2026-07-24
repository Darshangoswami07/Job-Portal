import { SalaryData } from "../models_new/SalaryData.js";

export const searchSalaries = async (req, res) => {
  try {
    const { role, location, experienceLevel, skills, company, page = 1, limit = 20, sort = "-averageSalary" } = req.query;
    const query = {};
    if (role) query.role = { $regex: role, $options: "i" };
    if (location) query.location = { $regex: location, $options: "i" };
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (company) query.company = { $regex: company, $options: "i" };
    if (skills) query.skills = { $in: skills.split(",").map((s) => s.trim()) };

    const skip = (Number(page) - 1) * Number(limit);
    const [results, total] = await Promise.all([
      SalaryData.find(query).sort(sort).skip(skip).limit(Number(limit)),
      SalaryData.countDocuments(query),
    ]);

    const stats = await SalaryData.aggregate([
      { $match: query },
      { $group: { _id: null, avgSalary: { $avg: "$averageSalary" }, medianSalary: { $avg: "$medianSalary" }, minSal: { $min: "$minSalary" }, maxSal: { $max: "$maxSalary" }, count: { $sum: 1 } } },
    ]);

    const topCompanies = await SalaryData.aggregate([
      { $match: { ...query, company: { $ne: "" } } },
      { $group: { _id: "$company", avg: { $avg: "$averageSalary" }, count: { $sum: 1 } } },
      { $sort: { avg: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      results,
      stats: stats[0] || { avgSalary: 0, medianSalary: 0, minSal: 0, maxSal: 0, count: 0 },
      topCompanies: topCompanies.map((c) => ({ company: c._id, averageSalary: Math.round(c.avg), count: c.count })),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await SalaryData.distinct("role");
    res.json({ success: true, roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLocations = async (req, res) => {
  try {
    const locations = await SalaryData.distinct("location");
    res.json({ success: true, locations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInsights = async (req, res) => {
  try {
    const [avgGrowth, topCity, topRole, total] = await Promise.all([
      SalaryData.aggregate([{ $group: { _id: null, avg: { $avg: "$averageSalary" } } }]),
      SalaryData.aggregate([{ $group: { _id: "$location", avg: { $avg: "$averageSalary" } } }, { $sort: { avg: -1 } }, { $limit: 1 }]),
      SalaryData.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 1 }]),
      SalaryData.countDocuments(),
    ]);
    res.json({ success: true, insights: { avgGrowth: avgGrowth[0]?.avg || 0, topCity: topCity[0]?._id || "N/A", topRole: topRole[0]?._id || "N/A", totalDataPoints: total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const seedSalaryData = async (req, res) => {
  try {
    const roles = ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Scientist", "DevOps Engineer", "Product Manager", "UI/UX Designer", "Mobile Developer", "Cloud Architect", "ML Engineer"];
    const locations = ["Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai", "Kolkata", "Remote"];
    const levels = ["entry", "mid", "senior", "lead"];
    const data = [];
    for (const role of roles) {
      for (const location of locations) {
        for (const level of levels) {
          const base = role.length * 10000 + location.length * 5000;
          const mult = level === "entry" ? 0.5 : level === "mid" ? 1 : level === "senior" ? 1.8 : 2.5;
          const min = Math.round(base * mult * 0.7);
          const max = Math.round(base * mult * 1.3);
          data.push({ role, location, minSalary: min, maxSalary: max, medianSalary: Math.round((min + max) / 2), averageSalary: Math.round((min + max) / 2), experienceLevel: level, company: ["Google", "Microsoft", "Amazon", "Meta", "Netflix", "Flipkart", "Uber", "Swiggy"][Math.floor(Math.random() * 8)], skills: ["JavaScript", "Python", "React", "Node.js", "AWS", "Docker"].slice(0, Math.floor(Math.random() * 4) + 2) });
        }
      }
    }
    await SalaryData.insertMany(data);
    res.status(201).json({ success: true, message: `Seeded ${data.length} salary records` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
