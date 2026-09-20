/**
 * Small shared helpers for the ATS adapters (Lever, Ashby, Workable,
 * SmartRecruiters). Field mapping only — no HTTP, no fabrication.
 */
import { isHttpUrl } from "../jobs/normalize.js";

export const cleanStr = (v) => (typeof v === "string" ? v.trim() : "");

export const pickUrl = (...candidates) => {
  for (const c of candidates) if (isHttpUrl(c)) return String(c).trim();
  return "";
};

/** Accepts ISO strings, Date, or millisecond epoch numbers. */
export const toDate = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  const d = typeof v === "number" ? new Date(v) : v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const EMPLOYMENT_MAP = {
  fulltime: "Full-time",
  "full-time": "Full-time",
  "full time": "Full-time",
  permanent: "Full-time",
  regular: "Full-time",
  parttime: "Part-time",
  "part-time": "Part-time",
  "part time": "Part-time",
  contract: "Contract",
  contractor: "Contract",
  temporary: "Contract",
  freelance: "Freelance",
  intern: "Internship",
  internship: "Internship",
};

/** Map a source's free-text employment type onto our jobType enum. "" if unknown. */
export const mapEmploymentType = (v) => {
  const key = cleanStr(v).toLowerCase().replace(/_/g, "-");
  return EMPLOYMENT_MAP[key] || "";
};

/** Map an explicit remote flag / workplace type onto our workType hint. "" if unknown. */
export const mapWorkType = (v) => {
  const s = cleanStr(v).toLowerCase();
  if (s === "remote" || s === "fully remote") return "Remote";
  if (s === "hybrid") return "Hybrid";
  if (s === "on-site" || s === "onsite" || s === "in-office" || s === "in office") return "On-site";
  return "";
};

/** Non-fabricating salary extraction from a structured range object. */
export function salaryFromRange(range) {
  if (!range || typeof range !== "object") return {};
  const min = Number(range.min ?? range.minValue ?? range.minimum);
  const max = Number(range.max ?? range.maxValue ?? range.maximum);
  const out = {};
  if (Number.isFinite(min) && min > 0) out.salaryMin = Math.round(min);
  if (Number.isFinite(max) && max > 0) out.salaryMax = Math.round(max);
  const cur = cleanStr(range.currency || range.currencyCode);
  if (cur) out.salaryCurrency = cur;
  return out;
}
