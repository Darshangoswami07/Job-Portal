/**
 * Pure normalization helpers (PLAN.md §12).
 *
 * No database access, no side effects — safe to unit test in isolation and to
 * reuse from the backfill script and (later) source adapters.
 */

const WHITESPACE = /\s+/g;

const TITLE_ABBREVIATIONS = [
  [/\bsr\b/g, "senior"],
  [/\bjr\b/g, "junior"],
  [/\bmgr\b/g, "manager"],
  [/\bdev\b/g, "developer"],
];

// Trailing requisition-id noise, e.g. "Backend Engineer (REQ-12345)" or "... #4821".
const REQ_ID_NOISE = [
  /[\s(\[-]*(?:req|requisition|job|id|ref|posting)[\s#:_-]*[a-z0-9][\w-]*[)\]]*\s*$/i,
  /\s+[#(]\d[\w-]*\)?\s*$/,
];

const REMOTE_WORDS = /\b(remote|work from home|wfh|anywhere|distributed)\b/i;
const HYBRID_WORDS = /\bhybrid\b/i;
const ONSITE_WORDS = /\b(on[-\s]?site|in[-\s]?office|in person)\b/i;

export function collapseWhitespace(value) {
  return String(value == null ? "" : value).replace(WHITESPACE, " ").trim();
}

/** Strip HTML tags + entities to plain text, optionally truncated. */
export function htmlToText(html, maxLen = 0) {
  let text = String(html == null ? "" : html)
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&(?:#39|apos|quot);/g, "'");
  text = collapseWhitespace(text);
  if (maxLen > 0 && text.length > maxLen) text = `${text.slice(0, maxLen).trimEnd()}…`;
  return text;
}

/**
 * Lowercase, strip punctuation, expand common abbreviations, drop trailing
 * requisition ids. Used for cross-source title matching.
 */
export function normalizeTitle(title) {
  let out = collapseWhitespace(title).toLowerCase();
  // Strip trailing requisition ids while their punctuation markers still exist.
  for (const pattern of REQ_ID_NOISE) out = out.replace(pattern, "");
  // Drop punctuation (incl. "."), keeping "+"/"#" for stacks like "c#", "react+".
  out = out.replace(/[^\p{L}\p{N}\s+#]/gu, " ");
  for (const [pattern, replacement] of TITLE_ABBREVIATIONS) {
    out = out.replace(pattern, replacement);
  }
  return collapseWhitespace(out);
}

/**
 * Lowercase alphanumeric company key. Mirrors the logic already used in
 * services/companyAggregator.js so grouping is consistent.
 */
export function normalizeCompany(name) {
  return String(name == null ? "" : name).toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

/**
 * Lowercase, punctuation-collapsed location string. A `remote` location
 * normalizes to the literal "remote" so remote roles group together
 * regardless of the city text the source attached.
 */
export function normalizeLocation(location, { remoteType } = {}) {
  const raw = collapseWhitespace(location).toLowerCase();
  if (remoteType === "remote" || (!raw && remoteType === "remote")) return "remote";
  if (!raw) return "";
  if (REMOTE_WORDS.test(raw) && !/[,/]/.test(raw)) return "remote";
  return raw.replace(/[^\p{L}\p{N}\s,/-]/gu, " ").replace(WHITESPACE, " ").trim();
}

/**
 * Decide remote / hybrid / onsite / unknown from whatever signals a job carries.
 * Explicit structured fields win over free-text keyword sniffing.
 */
export function detectRemoteType(job = {}) {
  const workType = String(job.workType || "").toLowerCase();
  if (workType === "remote") return "remote";
  if (workType === "hybrid") return "hybrid";
  if (workType === "on-site" || workType === "onsite") {
    // an explicit On-site can still be overridden by an unambiguous remote flag
    if (job.remoteFriendly === true) return "hybrid";
    return "onsite";
  }

  const haystack = [job.location, job.city, job.title, job.description]
    .filter(Boolean)
    .join(" ");

  if (HYBRID_WORDS.test(haystack)) return "hybrid";
  if (REMOTE_WORDS.test(haystack)) return "remote";
  if (ONSITE_WORDS.test(haystack)) return "onsite";
  if (job.remoteFriendly === true) return "remote";
  return "unknown";
}

const TRACKING_PARAM = /^(utm_|gh_|lever-|ref_|src$|source$|ref$|campaign$|fbclid$|gclid$|mc_)/i;

/**
 * Strip tracking/analytics query parameters and fragments from a URL.
 * Returns "" for anything that is not a valid http(s) URL — we never guess.
 */
export function stripTrackingParams(url) {
  const value = collapseWhitespace(url);
  if (!value) return "";
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return "";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";

  for (const key of [...parsed.searchParams.keys()]) {
    if (TRACKING_PARAM.test(key)) parsed.searchParams.delete(key);
  }
  parsed.hash = "";
  let out = parsed.toString();
  if (out.endsWith("?")) out = out.slice(0, -1);
  return out;
}

/** True when `url` is a syntactically valid http(s) URL. */
export function isHttpUrl(url) {
  const value = collapseWhitespace(url);
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Extract a bare hostname (no "www.") from a URL or email, else "". */
export function extractDomain(value) {
  const raw = collapseWhitespace(value);
  if (!raw) return "";
  if (raw.includes("@") && !raw.includes("/")) {
    return raw.split("@").pop().toLowerCase().replace(/^www\./, "");
  }
  try {
    const withProto = raw.startsWith("http") ? raw : `https://${raw}`;
    return new URL(withProto).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}
