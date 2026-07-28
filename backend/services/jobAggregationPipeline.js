import crypto from "crypto";
import { Job } from "../models/job.model.js";
import { Company } from "../models/company.model.js";
import { User } from "../models/user.model.js";
import { fetchAdzunaJobs, isAdzunaConfigured } from "./jobAggregators/adzuna.js";
import { fetchJSearchJobs, isJSearchConfigured } from "./jobAggregators/jsearch.js";
import { fetchJoobleJobs, isJoobleConfigured } from "./jobAggregators/jooble.js";

const normalizeKey = (value) =>
  (value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const dedupeKey = (job) => `${normalizeKey(job.title)}|${normalizeKey(job.company)}|${normalizeKey(job.location)}`;

async function getSystemUser() {
  let systemUser = await User.findOne({ email: "system@jobhub.com" });
  if (!systemUser) {
    const bcrypt = (await import("bcryptjs")).default;
    systemUser = await User.create({
      fullname: "JobHub System",
      email: "system@jobhub.com",
      phoneNumber: 0,
      password: bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), 10),
      roles: { jobSeeker: false, recruiter: true },
    });
  }
  return systemUser;
}

async function findOrCreateCompany(name, logoUrl, systemUserId) {
  const normalized = normalizeKey(name);
  let company = await Company.findOne({ name: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
  if (!company) {
    company = await Company.create({
      name,
      logo: logoUrl || "",
      userId: systemUserId,
    });
  } else if (logoUrl && !company.logo) {
    company.logo = logoUrl;
    await company.save();
  }
  return company;
}

function dedupeJobs(jobs) {
  const seen = new Map();
  for (const job of jobs) {
    if (!job.title || !job.company) continue;
    const key = dedupeKey(job);
    if (!seen.has(key)) seen.set(key, job);
  }
  return Array.from(seen.values());
}

async function fetchAllSources() {
  const results = await Promise.allSettled([
    fetchAdzunaJobs(),
    fetchJSearchJobs(),
    fetchJoobleJobs(),
  ]);

  const jobs = [];
  const sourceNames = ["Adzuna", "JSearch", "Jooble"];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      jobs.push(...result.value);
    } else {
      console.error(`${sourceNames[i]} fetch failed:`, result.reason?.message || result.reason);
    }
  });
  return jobs;
}

export async function runJobAggregation() {
  const configured = {
    adzuna: isAdzunaConfigured(),
    jsearch: isJSearchConfigured(),
    jooble: isJoobleConfigured(),
  };

  if (!configured.adzuna && !configured.jsearch && !configured.jooble) {
    console.log("Job aggregation skipped: no aggregator API keys configured (ADZUNA_APP_ID/ADZUNA_APP_KEY, RAPIDAPI_KEY, JOOBLE_API_KEY)");
    return { success: true, upserted: 0, fetched: 0, skipped: true };
  }

  const rawJobs = await fetchAllSources();
  const jobs = dedupeJobs(rawJobs);
  const systemUser = await getSystemUser();

  let upserted = 0;
  for (const job of jobs) {
    const company = await findOrCreateCompany(job.company, job.companyLogoUrl, systemUser._id);
    const hash = crypto.createHash("sha256").update(`${job.source}|${job.externalId || dedupeKey(job)}`).digest("hex");

    await Job.findOneAndUpdate(
      { hash },
      {
        $set: {
          title: job.title,
          description: job.description || job.title,
          location: job.location || "Remote",
          salary: 0,
          estimatedSalary: job.salaryRange || "",
          experienceLevel: 0,
          jobType: "Full-time",
          position: 1,
          company: company._id,
          created_by: systemUser._id,
          source: job.source,
          sourceUrl: job.sourceUrl || "",
          externalId: job.externalId || "",
          hash,
          publishedAt: job.postedDate || new Date(),
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    upserted += 1;
  }

  console.log(`Job aggregation: fetched ${rawJobs.length}, deduped to ${jobs.length}, upserted ${upserted}`);
  return { success: true, fetched: rawJobs.length, upserted, configured };
}
