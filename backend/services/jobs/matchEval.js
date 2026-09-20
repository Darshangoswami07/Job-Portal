/**
 * Offline recommendation-quality evaluation (PLAN.md Phase 8 §49–52).
 *
 * NOT on the request path. Synthetic users + JobGroups + a hand-labelled
 * relevance key, plus Precision@k / HitRate@k / MRR helpers. Lets us check the
 * deterministic matcher behaves sensibly, and compare baseline vs baseline+AI,
 * without any live provider.
 */
import { buildUserProfileVector } from "./userProfile.js";
import { matchUserToJob } from "./matching.js";

export const EVAL_USERS = [
  {
    id: "u-react",
    profile: {
      skills: ["React", "Node.js", "TypeScript", "Redux"],
      headline: "Frontend Engineer",
      location: "Remote",
      workPreference: "Remote",
      employmentType: "Full time",
      experience: [{ title: "Frontend Engineer", startDate: "2022-01-01", current: true }],
    },
    relevant: ["g-react-dev", "g-frontend-eng"],
  },
  {
    id: "u-backend",
    profile: {
      skills: ["Python", "Django", "PostgreSQL", "Docker"],
      headline: "Senior Backend Engineer",
      location: "Bengaluru",
      workPreference: "Hybrid",
      employmentType: "Full time",
      experience: [
        { title: "Backend Engineer", startDate: "2017-01-01", endDate: "2021-01-01" },
        { title: "Senior Backend Engineer", startDate: "2021-01-01", current: true },
      ],
    },
    relevant: ["g-django-dev", "g-senior-backend"],
  },
  {
    id: "u-data",
    profile: {
      skills: ["Python", "Pandas", "scikit-learn", "SQL"],
      headline: "Data Scientist",
      location: "Remote",
      workPreference: "Remote",
      experience: [{ title: "Data Analyst", startDate: "2023-01-01", current: true }],
    },
    relevant: ["g-data-scientist"],
  },
  {
    id: "u-java",
    profile: {
      skills: ["Java", "Spring Boot", "Kafka", "PostgreSQL"],
      headline: "Backend Engineer",
      location: "Bengaluru",
      workPreference: "Hybrid",
      experience: [{ title: "Java Developer", startDate: "2020-01-01", current: true }],
    },
    relevant: ["g-java-backend"],
  },
  {
    id: "u-fullstack",
    profile: {
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
      headline: "Full Stack Engineer",
      location: "Remote",
      workPreference: "Remote",
      experience: [{ title: "Full Stack Developer", startDate: "2021-06-01", current: true }],
    },
    relevant: ["g-fullstack-eng", "g-react-dev"],
  },
  {
    id: "u-devops",
    profile: {
      skills: ["Kubernetes", "Terraform", "AWS", "Docker", "CI/CD"],
      headline: "DevOps Engineer",
      location: "Remote",
      workPreference: "Remote",
      experience: [{ title: "DevOps Engineer", startDate: "2019-01-01", current: true }],
    },
    relevant: ["g-devops-eng"],
  },
  {
    id: "u-qa",
    profile: {
      skills: ["Selenium", "Cypress", "Playwright", "JavaScript"],
      headline: "QA Engineer",
      location: "Pune",
      workPreference: "Hybrid",
      experience: [{ title: "QA Automation Engineer", startDate: "2021-01-01", current: true }],
    },
    relevant: ["g-qa-eng"],
  },
  {
    id: "u-mobile",
    profile: {
      skills: ["Kotlin", "Android", "Jetpack Compose"],
      headline: "Android Engineer",
      location: "Bengaluru",
      workPreference: "On-site",
      experience: [{ title: "Android Developer", startDate: "2020-01-01", current: true }],
    },
    relevant: ["g-android-dev"],
  },
];

export const EVAL_GROUPS = [
  { _id: "g-react-dev", displayTitle: "React Developer", normalizedTitle: "react developer", skills: ["React", "Redux", "JavaScript"], remoteType: "remote", seniority: "", experienceLevel: 2, jobType: "Full-time", industry: "Technology", normalizedLocation: "remote", dedupeHash: "g-react-dev" },
  { _id: "g-frontend-eng", displayTitle: "Frontend Engineer", normalizedTitle: "frontend engineer", skills: ["React", "TypeScript", "CSS"], remoteType: "remote", seniority: "", experienceLevel: 2, jobType: "Full-time", industry: "Technology", normalizedLocation: "remote", dedupeHash: "g-frontend-eng" },
  { _id: "g-django-dev", displayTitle: "Django Developer", normalizedTitle: "django developer", skills: ["Python", "Django", "PostgreSQL"], remoteType: "hybrid", seniority: "", experienceLevel: 3, jobType: "Full-time", industry: "Technology", normalizedLocation: "bengaluru", dedupeHash: "g-django-dev" },
  { _id: "g-senior-backend", displayTitle: "Senior Backend Engineer", normalizedTitle: "senior backend engineer", skills: ["Python", "Docker", "PostgreSQL"], remoteType: "hybrid", seniority: "senior", experienceLevel: 5, jobType: "Full-time", industry: "Technology", normalizedLocation: "bengaluru", dedupeHash: "g-senior-backend" },
  { _id: "g-data-scientist", displayTitle: "Data Scientist", normalizedTitle: "data scientist", skills: ["Python", "Pandas", "scikit-learn"], remoteType: "remote", seniority: "", experienceLevel: 2, jobType: "Full-time", industry: "Technology", normalizedLocation: "remote", dedupeHash: "g-data-scientist" },
  { _id: "g-android-dev", displayTitle: "Android Developer", normalizedTitle: "android developer", skills: ["Kotlin", "Android"], remoteType: "onsite", seniority: "", experienceLevel: 2, jobType: "Full-time", industry: "Technology", normalizedLocation: "pune", dedupeHash: "g-android-dev" },
  { _id: "g-sales-mgr", displayTitle: "Sales Manager", normalizedTitle: "sales manager", skills: ["CRM", "Negotiation"], remoteType: "onsite", seniority: "lead", experienceLevel: 6, jobType: "Full-time", industry: "Retail", normalizedLocation: "mumbai", dedupeHash: "g-sales-mgr" },
  { _id: "g-frontend-intern", displayTitle: "Frontend Intern", normalizedTitle: "frontend intern", skills: ["HTML", "CSS", "JavaScript"], remoteType: "onsite", seniority: "intern", experienceLevel: 0, jobType: "Internship", industry: "Technology", normalizedLocation: "delhi", dedupeHash: "g-frontend-intern" },
  { _id: "g-java-backend", displayTitle: "Java Backend Engineer", normalizedTitle: "java backend engineer", skills: ["Java", "Spring Boot", "Kafka"], remoteType: "hybrid", seniority: "", experienceLevel: 4, jobType: "Full-time", industry: "Technology", normalizedLocation: "bengaluru", dedupeHash: "g-java-backend" },
  { _id: "g-fullstack-eng", displayTitle: "Full Stack Engineer", normalizedTitle: "full stack engineer", skills: ["React", "Node.js", "TypeScript", "PostgreSQL"], remoteType: "remote", seniority: "", experienceLevel: 3, jobType: "Full-time", industry: "Technology", normalizedLocation: "remote", dedupeHash: "g-fullstack-eng" },
  { _id: "g-devops-eng", displayTitle: "DevOps Engineer", normalizedTitle: "devops engineer", skills: ["Kubernetes", "Terraform", "AWS", "Docker"], remoteType: "remote", seniority: "", experienceLevel: 4, jobType: "Full-time", industry: "Technology", normalizedLocation: "remote", dedupeHash: "g-devops-eng" },
  { _id: "g-qa-eng", displayTitle: "QA Automation Engineer", normalizedTitle: "qa automation engineer", skills: ["Selenium", "Cypress", "Playwright"], remoteType: "hybrid", seniority: "", experienceLevel: 3, jobType: "Full-time", industry: "Technology", normalizedLocation: "pune", dedupeHash: "g-qa-eng" },
  { _id: "g-hr-mgr", displayTitle: "HR Manager", normalizedTitle: "hr manager", skills: ["Recruiting", "Onboarding"], remoteType: "onsite", seniority: "lead", experienceLevel: 7, jobType: "Full-time", industry: "Retail", normalizedLocation: "delhi", dedupeHash: "g-hr-mgr" },
  { _id: "g-php-dev", displayTitle: "PHP Developer", normalizedTitle: "php developer", skills: ["PHP", "Laravel", "MySQL"], remoteType: "onsite", seniority: "", experienceLevel: 2, jobType: "Full-time", industry: "Technology", normalizedLocation: "noida", dedupeHash: "g-php-dev" },
];

function precisionAtK(rankedIds, relevant, k) {
  const top = rankedIds.slice(0, k);
  if (!top.length) return 0;
  return top.filter((id) => relevant.includes(id)).length / Math.min(k, top.length);
}
function hitRateAtK(rankedIds, relevant, k) {
  return rankedIds.slice(0, k).some((id) => relevant.includes(id)) ? 1 : 0;
}
function reciprocalRank(rankedIds, relevant) {
  for (let i = 0; i < rankedIds.length; i += 1) if (relevant.includes(rankedIds[i])) return 1 / (i + 1);
  return 0;
}
/** Binary-gain NDCG@k. */
function ndcgAtK(rankedIds, relevant, k) {
  const rel = new Set(relevant);
  let dcg = 0;
  for (let i = 0; i < Math.min(k, rankedIds.length); i += 1) {
    if (rel.has(rankedIds[i])) dcg += 1 / Math.log2(i + 2);
  }
  let idcg = 0;
  for (let i = 0; i < Math.min(k, relevant.length); i += 1) idcg += 1 / Math.log2(i + 2);
  return idcg ? dcg / idcg : 0;
}

/**
 * @param {(profile, group) => {score:number}} [scorer]  defaults to the deterministic matcher
 * @param {number} [k]
 */
export function evaluate(scorer = matchUserToJob, k = 5) {
  const perUser = [];
  for (const u of EVAL_USERS) {
    const profile = buildUserProfileVector({ profile: u.profile }, {});
    const ranked = [...EVAL_GROUPS]
      .map((g) => ({ id: g._id, score: scorer(profile, g).score }))
      .sort((a, b) => b.score - a.score)
      .map((r) => r.id);
    perUser.push(scoreUser(u, ranked, k));
  }
  return aggregate(perUser, k);
}

/**
 * Baseline-vs-AI comparison (PLAN.md Phase 9 §14). `blendedScore(profile, group)`
 * may be async — pass a function that mirrors the production blend
 * (deterministic baseline + optional AI row). Returns the same shape as
 * `evaluate`, so the two can be tabulated side by side.
 * @param {(profile:object, group:object) => Promise<number>|number} blendedScore
 */
export async function evaluateAsync(blendedScore, k = 5) {
  const perUser = [];
  for (const u of EVAL_USERS) {
    const profile = buildUserProfileVector({ profile: u.profile }, {});
    const scored = [];
    for (const g of EVAL_GROUPS) scored.push({ id: g._id, score: await blendedScore(profile, g) });
    const ranked = scored.sort((a, b) => b.score - a.score).map((r) => r.id);
    perUser.push(scoreUser(u, ranked, k));
  }
  return aggregate(perUser, k);
}

function scoreUser(u, ranked, k) {
  return {
    user: u.id,
    ranked,
    precisionAtK: precisionAtK(ranked, u.relevant, k),
    hitRateAtK: hitRateAtK(ranked, u.relevant, k),
    rr: reciprocalRank(ranked, u.relevant),
    ndcgAtK: ndcgAtK(ranked, u.relevant, k),
    topIsRelevant: ranked.length > 0 && u.relevant.includes(ranked[0]),
  };
}

function aggregate(perUser, k) {
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  return {
    perUser,
    meanPrecisionAtK: mean(perUser.map((r) => r.precisionAtK)),
    hitRateAtK: mean(perUser.map((r) => r.hitRateAtK)),
    mrr: mean(perUser.map((r) => r.rr)),
    ndcgAtK: mean(perUser.map((r) => r.ndcgAtK)),
    k,
  };
}
