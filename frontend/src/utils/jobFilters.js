export const SALARY_RANGES = [
  { label: "0-3 LPA", min: 0, max: 3 },
  { label: "3-6 LPA", min: 3, max: 6 },
  { label: "6-12 LPA", min: 6, max: 12 },
  { label: "12-20 LPA", min: 12, max: 20 },
  { label: "20+ LPA", min: 20, max: null },
];

export const EXPERIENCE_RANGES = [
  { label: "Entry (0-1 yrs)", min: 0, max: 1 },
  { label: "Mid (2-4 yrs)", min: 2, max: 4 },
  { label: "Senior (5-8 yrs)", min: 5, max: 8 },
  { label: "Lead (8+ yrs)", min: 8, max: null },
];

export const POSTED_DATE_OPTIONS = [
  "Today",
  "Last 24 hours",
  "Last 7 days",
  "Last 30 days",
];

/* ── Find Jobs page: shared static option lists ─────────────────────────── */

export const JOB_TYPE_OPTIONS = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];

/** UI label → backend `remoteType` token. */
export const WORK_MODE_OPTIONS = [
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
  { label: "On-site", value: "onsite" },
];

/** Curated skills — the backend `skills` filter param accepts any of these. */
export const SKILL_OPTIONS = [
  "React",
  "JavaScript",
  "TypeScript",
  "Python",
  "Node.js",
  "Java",
  "AI/ML",
  "SQL",
  "AWS",
  "Docker",
];

export const SALARY_SLIDER = { min: 0, max: 50, step: 1 }; // LPA

export const POPULAR_SEARCHES = [
  "Software Engineer",
  "React Developer",
  "Full Stack Developer",
  "Python Developer",
  "AI Engineer",
  "Remote Jobs",
];

export const TRENDING_SEARCHES = [
  "AI Engineer",
  "React Developer",
  "MERN Developer",
  "Python Developer",
  "Remote Software Engineer",
  "Frontend Developer",
];

/** Profile fields the recommendations API reports as missing. */
export const MISSING_PROFILE_LABELS = {
  skills: "Add your skills",
  preferredRole: "Add a preferred role",
  location: "Add your location",
  remotePreference: "Set a remote preference",
  experience: "Add work experience",
};

export const FILTER_CATEGORIES = [
  "location",
  "company",
  "industry",
  "department",
  "jobType",
  "workType",
  "source",
  "skills",
  "tags",
  "salary",
  "experience",
  "postedDate",
];

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const includes = (haystack, needle) => {
  const h = normalizeText(haystack);
  const n = normalizeText(needle);
  if (!n) return true;
  return h.includes(n);
};

const ROLE_TO_INDUSTRY = [
  { keywords: ["frontend", "react", "ui", "angular", "vue", "web developer"], industry: "Frontend" },
  { keywords: ["backend", "node", "java", "spring", "python", "django", "api", "go ", "golang"], industry: "Backend" },
  { keywords: ["full", "stack", "fullstack", "mern", "mean"], industry: "Fullstack" },
  { keywords: ["devops", "sre", "ci/cd", "kubernetes", "docker", "aws", "cloud", "infrastructure"], industry: "DevOps" },
  { keywords: ["data", "analyst", "scientist", "ml", "ai", "machine", "deep learning", "nlp"], industry: "Data Science" },
  { keywords: ["mobile", "android", "ios", "flutter", "react native"], industry: "Mobile" },
  { keywords: ["qa", "test", "quality", "automation"], industry: "QA" },
  { keywords: ["design", "ui/ux", "ux", "product design", "graphic"], industry: "Design" },
  { keywords: ["manager", "lead", "head", "director"], industry: "Management" },
];

export const inferIndustry = (job) => {
  if (job.industry) return job.industry;
  const title = normalizeText(job.title || "");
  for (const entry of ROLE_TO_INDUSTRY) {
    if (entry.keywords.some((kw) => title.includes(kw))) return entry.industry;
  }
  return job.department || "";
};

export const getJobSearchableText = (job) =>
  normalizeText(
    [
      job.title,
      job.description,
      job.requirements?.join(" "),
      job.responsibilities?.join(" "),
      job.skills?.join(" "),
      job.tags?.join(" "),
      job.location,
      job.city,
      job.country,
      job.jobType,
      job.workType,
      job.industry,
      job.department,
      job.company?.name,
      job.company?.location,
    ].join(" ")
  );

export const matchesKeyword = (job, keyword) => {
  const q = normalizeText(keyword);
  if (!q) return true;
  return getJobSearchableText(job).includes(q);
};

const salaryInRange = (job, range) => {
  if (!range) return false;
  const value = Number(job.salary);
  if (!Number.isFinite(value)) return false;
  if (range.max === null) return value >= range.min;
  return value >= range.min && value < range.max;
};

const experienceInRange = (job, range) => {
  if (!range) return false;
  const value = Number(job.experienceLevel);
  if (!Number.isFinite(value)) return false;
  if (range.max === null) return value >= range.min;
  return value >= range.min && value <= range.max;
};

const postedDateInRange = (job, label) => {
  const created = new Date(job.createdAt || job.publishedAt || Date.now()).getTime();
  const now = Date.now();
  const hours = (now - created) / (1000 * 60 * 60);
  if (label === "Today") return hours <= 24 && new Date(created).getDate() === new Date(now).getDate();
  if (label === "Last 24 hours") return hours <= 24;
  if (label === "Last 7 days") return hours <= 24 * 7;
  if (label === "Last 30 days") return hours <= 24 * 30;
  return true;
};

const categoryMatches = (job, category, value) => {
  switch (category) {
    case "location":
      return (
        includes(job.location, value) ||
        includes(job.city, value) ||
        includes(job.country, value) ||
        includes(job.company?.location, value) ||
        includes(job.company?.name, value)
      );
    case "company":
      return includes(job.company?.name, value) || includes(job.company?.location, value);
    case "industry":
      return includes(inferIndustry(job), value) || includes(job.industry, value);
    case "department":
      return includes(job.department, value);
    case "jobType":
      return normalizeText(job.jobType) === normalizeText(value);
    case "workType":
      if (normalizeText(value) === "remote") {
        return (
          normalizeText(job.workType) === "remote" ||
          job.remoteFriendly === true
        );
      }
      return normalizeText(job.workType) === normalizeText(value);
    case "skills":
      return (job.skills || []).some((skill) => includes(skill, value));
    case "tags":
      return (job.tags || []).some((tag) => includes(tag, value));
    case "salary":
      return salaryInRange(job, SALARY_RANGES.find((r) => r.label === value));
    case "experience":
      return experienceInRange(job, EXPERIENCE_RANGES.find((r) => r.label === value));
    case "postedDate":
      return postedDateInRange(job, value);
    default:
      return true;
  }
};

export const applyJobFilters = ({ jobs, keyword = "", filters = {} }) => {
  let result = jobs;

  if (normalizeText(keyword)) {
    const q = normalizeText(keyword);
    result = result.filter((job) => getJobSearchableText(job).includes(q));
  }

  const active = Object.entries(filters).filter(([, values]) => values && values.size > 0);
  if (active.length) {
    result = result.filter((job) =>
      active.every(([category, values]) =>
        [...values].some((value) => categoryMatches(job, category, value))
      )
    );
  }

  return result;
};

export const sortJobs = (jobs, sortKey = "relevance") => {
  const list = [...jobs];
  const sorters = {
    relevance: (a, b) =>
      Number(b.featured || 0) - Number(a.featured || 0) ||
      Number(b.trending || 0) - Number(a.trending || 0) ||
      Number(b.urgent || 0) - Number(a.urgent || 0) ||
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    oldest: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    salary_asc: (a, b) => (Number(a.salary) || 0) - (Number(b.salary) || 0),
    salary_desc: (a, b) => (Number(b.salary) || 0) - (Number(a.salary) || 0),
    experience_asc: (a, b) => (Number(a.experienceLevel) || 0) - (Number(b.experienceLevel) || 0),
    experience_desc: (a, b) => (Number(b.experienceLevel) || 0) - (Number(a.experienceLevel) || 0),
    views: (a, b) => (Number(b.views) || 0) - (Number(a.views) || 0),
    applicants: (a, b) => (Number(b.applicantsCount) || 0) - (Number(a.applicantsCount) || 0),
    ai_match: (a, b) => (Number(b.aiMatch) || 0) - (Number(a.aiMatch) || 0),
  };
  return list.sort(sorters[sortKey] || sorters.relevance);
};

export const getFilterOptions = (jobs, categories = FILTER_CATEGORIES) => {
  const options = {};
  for (const category of categories) {
    if (category === "salary") {
      options.salary = SALARY_RANGES.map((r) => r.label);
    } else if (category === "experience") {
      options.experience = EXPERIENCE_RANGES.map((r) => r.label);
    } else if (category === "postedDate") {
      options.postedDate = POSTED_DATE_OPTIONS;
    } else {
      const values = new Set();
      for (const job of jobs) {
        if (category === "company") {
          if (job.company?.name) values.add(job.company.name.trim());
        } else if (category === "industry") {
          const industry = inferIndustry(job);
          if (industry) values.add(industry);
        } else if (category === "skills") {
          (job.skills || []).forEach((s) => s && values.add(s.trim()));
        } else if (category === "tags") {
          (job.tags || []).forEach((t) => t && values.add(t.trim()));
        } else if (job[category]) {
          values.add(String(job[category]).trim());
        }
      }
      options[category] = [...values].filter(Boolean).sort();
    }
  }
  return options;
};

export const countActiveFilters = (filters) =>
  Object.values(filters).reduce(
    (total, values) => total + (values ? values.size : 0),
    0
  );

export const createEmptyFilters = () =>
  FILTER_CATEGORIES.reduce((acc, category) => {
    acc[category] = new Set();
    return acc;
  }, {});
