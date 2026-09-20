/**
 * Deterministic, inspectable user profile representation for job matching
 * (PLAN.md Phase 8 §14). No embeddings, no vector DB — a plain structured object
 * derived only from data the platform already stores on `User.profile`, plus
 * aggregate behaviour from Saved Jobs and Applications.
 *
 * Nothing here calls an LLM. Every field is traceable to a real source column.
 */
import { seniorityBucket } from "./dedupe.js";
import { roleFamily } from "./similarity.js";
import { normalizeLocation, collapseWhitespace } from "./normalize.js";

export const PROFILE_VERSION = "p1";

const SKILL_SPLIT = /[\s,;/|]+/;

/** Lower-case, trimmed, de-duplicated skill list. */
export function cleanSkillList(list) {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(list) ? list : []) {
    const s = collapseWhitespace(String(raw || "")).toLowerCase();
    if (!s || s.length > 60 || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/** Years of professional experience from the profile's experience entries. */
export function yearsOfExperience(experience = []) {
  let months = 0;
  for (const e of Array.isArray(experience) ? experience : []) {
    const start = e?.startDate ? new Date(e.startDate) : null;
    if (!start || Number.isNaN(start.getTime())) continue;
    const end = e?.current || !e?.endDate ? new Date() : new Date(e.endDate);
    if (Number.isNaN(end.getTime()) || end < start) continue;
    months += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }
  return Math.max(0, Math.round((months / 12) * 10) / 10);
}

const REMOTE_PREF = (v) => {
  const s = collapseWhitespace(String(v || "")).toLowerCase();
  if (/remote|work from home|wfh|anywhere/.test(s)) return "remote";
  if (/hybrid/.test(s)) return "hybrid";
  if (/on[-\s]?site|office|in[-\s]?person/.test(s)) return "onsite";
  return "";
};

const JOB_TYPE_PREF = (v) => {
  const s = collapseWhitespace(String(v || "")).toLowerCase().replace(/[_-]+/g, " ");
  if (/full ?time|permanent/.test(s)) return "Full-time";
  if (/part ?time/.test(s)) return "Part-time";
  if (/contract|contractor|temporary/.test(s)) return "Contract";
  if (/intern/.test(s)) return "Internship";
  if (/freelance/.test(s)) return "Freelance";
  return "";
};

/**
 * @param {object} user            a User doc / lean object (needs `profile`)
 * @param {object} [signals]       { savedGroups: JobGroup[], applications: {group, status}[] }
 * @returns a plain profile vector — safe to log field NAMES, never full contents
 */
export function buildUserProfileVector(user = {}, signals = {}) {
  const p = user.profile || {};

  const skills = cleanSkillList(p.skills);

  // Roles the user identifies with: headline + preferred role + past titles.
  const roleStrings = [
    p.headline,
    p.preferredJobRole,
    p.designation,
    ...(Array.isArray(p.experience) ? p.experience.map((e) => e?.title) : []),
  ]
    .map((s) => collapseWhitespace(String(s || "")))
    .filter(Boolean);

  const roleFamilies = [...new Set(roleStrings.map((t) => roleFamily(t)).filter(Boolean))];
  const seniority =
    roleStrings.map((t) => seniorityBucket(t)).find(Boolean) || "";

  const years = yearsOfExperience(p.experience);

  // Location preferences: `profile.location` may be a single value or CSV.
  const locations = [...new Set(
    String(p.location || "")
      .split(",")
      .map((t) => normalizeLocation(t))
      .filter(Boolean)
  )];

  const remotePref = REMOTE_PREF(p.workPreference);
  const jobTypePref = JOB_TYPE_PREF(p.employmentType);
  const industries = [p.industry].map((s) => collapseWhitespace(String(s || "")).toLowerCase()).filter(Boolean);

  // ── aggregate behavioural signals (never overfit to one item) ──────────────
  const savedGroups = Array.isArray(signals.savedGroups) ? signals.savedGroups : [];
  const applications = Array.isArray(signals.applications) ? signals.applications : [];

  const savedRoleFamilies = tallyTop(savedGroups.map((g) => roleFamily(g.displayTitle || g.normalizedTitle)));
  const savedSkills = tallyTop(savedGroups.flatMap((g) => cleanSkillList(g.skills)), 15);
  const savedLocations = tallyTop(savedGroups.map((g) => g.normalizedLocation).filter(Boolean));

  const appliedRoleFamilies = tallyTop(
    applications.map((a) => roleFamily(a.group?.displayTitle || a.group?.normalizedTitle))
  );
  const rejectedGroupKeys = new Set(
    applications.filter((a) => a.status === "rejected" && a.group?.dedupeHash).map((a) => a.group.dedupeHash)
  );

  return {
    version: PROFILE_VERSION,
    hasSignal:
      skills.length > 0 || roleFamilies.length > 0 || !!seniority || locations.length > 0 ||
      savedGroups.length > 0 || applications.length > 0,
    roles: roleStrings.slice(0, 8),
    roleFamilies,
    skills,
    seniority,
    years,
    locations,
    remotePref,
    jobTypePref,
    industries,
    salaryExpectation: parseSalary(p.preferredSalary),
    behaviour: {
      savedRoleFamilies,
      savedSkills,
      savedLocations,
      appliedRoleFamilies,
      savedCount: savedGroups.length,
      appliedCount: applications.length,
    },
    rejectedGroupKeys,
  };
}

/** Count occurrences, return values sorted by frequency (most first). */
function tallyTop(values, limit = 6) {
  const counts = new Map();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([v]) => v);
}

function parseSalary(str) {
  const nums = String(str || "").replace(/[^0-9.]/g, " ").match(/\d+(?:\.\d+)?/g);
  if (!nums) return undefined;
  const n = Number(nums[0]);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}
