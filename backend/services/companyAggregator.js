import { Job } from "../models/job.model.js";
import { Company } from "../models/company.model.js";
import { CompanyProfile } from "../models_new/CompanyProfile.js";

const TECH_KEYWORDS = [
  "react","node","python","java","javascript","typescript","go","rust",
  "aws","azure","gcp","docker","kubernetes","sql","nosql","mongodb",
  "postgresql","redis","graphql","html","css","sass","vue","angular",
  "nextjs","nestjs","express","django","flask","spring","tensorflow",
  "pytorch","machine learning","ai","data science","devops","ci/cd",
  "git","linux","swift","kotlin","flutter","react native","dart",
  "c++","c#",".net","php","ruby","scala","tailwind","bootstrap",
  "mysql","mariadb","oracle","sqlite","cassandra","dynamodb",
  "firebase","supabase","prisma","typeorm","mongoose","jest","mocha",
  "cypress","playwright","selenium","nginx","apache","terraform",
  "ansible","jenkins","github actions","serverless","lambda",
  "ec2","s3","rds","cloudfront","terraform","kubernetes","helm",
];

const INDUSTRY_MAP = [
  { keywords: ["software","engineer","developer","programmer","full stack","frontend","backend","devops","data","machine learning"], industry: "Software Engineering" },
  { keywords: ["design","ui","ux","graphic","product design","visual","creative"], industry: "Design" },
  { keywords: ["marketing","growth","seo","content","social media","brand","digital marketing"], industry: "Marketing" },
  { keywords: ["sales","account executive","business development","bdr","sdr","account manager"], industry: "Sales" },
  { keywords: ["finance","accounting","audit","tax","financial","investment","banking"], industry: "Finance" },
  { keywords: ["hr","human resources","recruiter","talent","people","hiring"], industry: "Human Resources" },
  { keywords: ["health","medical","doctor","nurse","clinical","healthcare","pharma"], industry: "Healthcare" },
  { keywords: ["legal","lawyer","paralegal","compliance","attorney","legal counsel"], industry: "Legal" },
  { keywords: ["consulting","consultant","strategy","analyst","management consultant"], industry: "Consulting" },
  { keywords: ["education","teacher","professor","training","instructor","academic"], industry: "Education" },
  { keywords: ["customer support","customer success","account management","client services"], industry: "Customer Success" },
  { keywords: ["product management","product owner","program manager","technical program"], industry: "Product Management" },
  { keywords: ["security","cyber security","information security","security engineer","soc"], industry: "Cybersecurity" },
  { keywords: ["data","analyst","data engineer","data scientist","business intelligence","analytics"], industry: "Data & Analytics" },
];

function normalizeName(name) {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function extractDomain(website) {
  if (!website) return "";
  try {
    return new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace("www.", "");
  } catch {
    return website.replace(/^https?:\/\//, "").replace("www.", "").split("/")[0];
  }
}

function extractTechStack(requirements) {
  if (!requirements || !Array.isArray(requirements)) return [];
  const text = requirements.join(" ").toLowerCase();
  const found = new Set();
  for (const keyword of TECH_KEYWORDS) {
    if (text.includes(keyword)) found.add(keyword);
  }
  return [...found];
}

function extractIndustry(title, description) {
  const text = `${title || ""} ${description || ""}`.toLowerCase();
  for (const mapping of INDUSTRY_MAP) {
    if (mapping.keywords.some((k) => text.includes(k))) return mapping.industry;
  }
  return "Technology";
}

function generateAiInsights(companyData) {
  const { openJobCount, totalJobCount, salaries, techStack, locations } = companyData;

  const hiringVelocity = openJobCount > 5 ? "fast" : openJobCount > 0 ? "moderate" : "slow";
  const hiringTrend = openJobCount > 3 ? "growing" : openJobCount > 0 ? "stable" : "declining";
  const competitionLevel = openJobCount > 10 ? "high" : openJobCount > 3 ? "medium" : "low";

  const growthScore = Math.min(100, Math.round(
    (openJobCount * 5) +
    (totalJobCount * 2) +
    (salaries.avgSalary > 0 ? 10 : 0) +
    (locations.length * 3) +
    (techStack.length * 2)
  ));

  const stabilityScore = Math.min(100, Math.round(
    (totalJobCount > 0 ? 30 : 0) +
    (salaries.avgSalary > 50000 ? 20 : salaries.avgSalary > 0 ? 10 : 0) +
    (locations.length > 1 ? 15 : 5) +
    (techStack.length > 2 ? 15 : 5) +
    (openJobCount > 0 ? 20 : 0)
  ));

  const interviewDifficulty = openJobCount > 10 ? "hard" : openJobCount > 3 ? "medium" : "easy";

  return {
    hiringTrend,
    growthScore,
    salaryPrediction: salaries.avgSalary > 0
      ? `$${Math.round(salaries.avgSalary * 1.1 / 1000)}K - $${Math.round(salaries.avgSalary * 1.25 / 1000)}K (next year)`
      : "Insufficient data",
    stabilityScore,
    competitionLevel,
    hiringVelocity,
    techStackAnalysis: techStack.length > 0
      ? `Uses ${techStack.slice(0, 3).join(", ")}${techStack.length > 3 ? ` and ${techStack.length - 3} other technologies` : ""}`
      : "Tech stack information not available",
    interviewDifficulty,
    lastAnalyzedAt: new Date(),
  };
}

export async function aggregateCompanies() {
  try {
    const jobs = await Job.find({ isActive: true }).populate("company").lean();
    console.log(`CompanyAggregator: Processing ${jobs.length} active jobs...`);

    const manualCompanies = await Company.find().lean();
    const jobGroups = {};

    for (const job of jobs) {
      const companyData = job.company;
      if (!companyData) continue;
      const key = companyData._id.toString();
      if (!jobGroups[key]) {
        jobGroups[key] = { company: companyData, jobs: [] };
      }
      jobGroups[key].jobs.push(job);
    }

    for (const company of manualCompanies) {
      const key = company._id.toString();
      if (!jobGroups[key]) {
        jobGroups[key] = { company, jobs: [] };
      }
    }

    console.log(`CompanyAggregator: Found ${Object.keys(jobGroups).length} unique companies to process`);
    const results = [];

    for (const [, group] of Object.entries(jobGroups)) {
      const { company, jobs: companyJobs } = group;

      const salaries = companyJobs.filter((j) => j.salary && j.salary > 0).map((j) => j.salary);
      const locations = [...new Set(companyJobs.filter((j) => j.location).map((j) => j.location))];

      const techStackSet = new Set();
      for (const job of companyJobs) {
        extractTechStack(job.requirements).forEach((t) => techStackSet.add(t));
      }

      const primaryJob = companyJobs[0] || {};
      const industry = extractIndustry(primaryJob.title, primaryJob.description);

      const minSalary = salaries.length > 0 ? Math.min(...salaries) : 0;
      const maxSalary = salaries.length > 0 ? Math.max(...salaries) : 0;
      const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0;
      const openJobCount = companyJobs.filter((j) => j.isActive !== false).length;

      const normalizedName = normalizeName(company.name);
      const domain = extractDomain(company.website);

      let hiringStatus = "unknown";
      if (openJobCount > 5) hiringStatus = "actively_hiring";
      else if (openJobCount > 0) hiringStatus = "selectively_hiring";
      else hiringStatus = "not_hiring";

      const lastActive = companyJobs.length > 0
        ? new Date(Math.max(...companyJobs.map((j) => new Date(j.createdAt || Date.now()).getTime())))
        : company.createdAt || new Date();

      const profileInput = {
        normalizedName,
        aliases: [company.name],
        name: company.name,
        description: company.description || "",
        website: company.website || "",
        domain,
        logo: company.logo || "",
        industry,
        companySize: "Unknown",
        headquarters: company.location || "",
        techStack: [...techStackSet],
        locations,
        salaries: { minSalary, maxSalary, avgSalary, currency: "USD", salaryPeriod: "yearly" },
        openJobCount,
        totalJobCount: companyJobs.length,
        hiringStatus,
        lastActive,
        lastSyncedAt: new Date(),
        source: "local",
        sourceCompanyId: company._id.toString(),
        linkedJobs: companyJobs.map((j) => j._id),
      };

      profileInput.aiInsights = generateAiInsights(profileInput);

      const profile = await CompanyProfile.findOneAndUpdate(
        { normalizedName },
        { $set: profileInput, $addToSet: { aliases: { $each: [company.name] } } },
        { upsert: true, new: true },
      );

      results.push(profile);
    }

    console.log(`CompanyAggregator: Successfully aggregated ${results.length} company profiles`);
    return { success: true, count: results.length };
  } catch (error) {
    console.error("CompanyAggregator Error:", error);
    return { success: false, error: error.message };
  }
}

export async function syncCompanyOnJobCreate(job) {
  try {
    const populatedJob = await Job.findById(job._id).populate("company").lean();
    if (!populatedJob?.company) return;
    const company = populatedJob.company;
    const normalizedName = normalizeName(company.name);

    const existingProfile = await CompanyProfile.findOne({ normalizedName });
    const allJobs = await Job.find({ company: company._id, isActive: true }).lean();

    const salaries = allJobs.filter((j) => j.salary && j.salary > 0).map((j) => j.salary);
    const locations = [...new Set(allJobs.filter((j) => j.location).map((j) => j.location))];
    const openJobCount = allJobs.length;

    const updateData = {
      openJobCount,
      totalJobCount: allJobs.length,
      locations,
      lastActive: new Date(),
      lastSyncedAt: new Date(),
      hiringStatus: openJobCount > 5 ? "actively_hiring" : openJobCount > 0 ? "selectively_hiring" : "unknown",
      $addToSet: { linkedJobs: job._id },
    };

    if (salaries.length > 0) {
      updateData["salaries.minSalary"] = Math.min(...salaries);
      updateData["salaries.maxSalary"] = Math.max(...salaries);
      updateData["salaries.avgSalary"] = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
    }

    const techStack = new Set(existingProfile?.techStack || []);
    if (populatedJob.requirements) {
      extractTechStack(populatedJob.requirements).forEach((t) => techStack.add(t));
    }
    updateData.techStack = [...techStack];

    if (!existingProfile) {
      const domain = extractDomain(company.website);
      const industry = extractIndustry(populatedJob.title, populatedJob.description);
      updateData.normalizedName = normalizedName;
      updateData.name = company.name;
      updateData.description = company.description || "";
      updateData.website = company.website || "";
      updateData.domain = domain;
      updateData.logo = company.logo || "";
      updateData.industry = industry;
      updateData.headquarters = company.location || "";
      updateData.source = "local";
      updateData.sourceCompanyId = company._id.toString();
      updateData.aliases = [company.name];
      updateData.salaries = updateData.salaries || { minSalary: 0, maxSalary: 0, avgSalary: 0, currency: "USD", salaryPeriod: "yearly" };
      updateData.aiInsights = generateAiInsights(updateData);
    } else {
      updateData.aiInsights = generateAiInsights({
        ...existingProfile.toObject(),
        ...updateData,
      });
    }

    await CompanyProfile.findOneAndUpdate(
      { normalizedName },
      { $set: updateData },
      { upsert: true },
    );
  } catch (error) {
    console.error("syncCompanyOnJobCreate Error:", error);
  }
}
