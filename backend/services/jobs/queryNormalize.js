/**
 * Controlled search-query normalization (PLAN.md Phase 11 §11.2).
 *
 * Fixes common spelling / spacing variants ONLY. Never creates cross-technology
 * equivalence — Java ≠ JavaScript, React ≠ Angular, Python ≠ PHP. Applied to the
 * `$text` query string; the raw query is preserved for analytics.
 */
const collapse = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

// Whole-phrase rewrites (applied in order, before token mapping).
const PHRASE_MAP = [
  [/\bsoftware eng(?:ineer)?\b/g, "software engineer"],
  [/\bsr\.? /g, "senior "],
  [/\bjr\.? /g, "junior "],
  [/\bfront[ -]?end\b/g, "frontend"],
  [/\bback[ -]?end\b/g, "backend"],
  [/\bfull[ -]?stack\b/g, "fullstack"],
  [/\bmachine learning\b/g, "machine learning ml"],
  [/\bdev ?ops\b/g, "devops"],
  // "<framework> js" / "<framework>.js" / "<framework>js" → canonical name.
  // "java script" → javascript is a spacing variant, handled here too and it
  // must NOT touch a bare "java".
  [/\bjava[ .]?script\b/g, "javascript"],
  [/\btype[ .]?script\b/g, "typescript"],
  [/\breact[ .]?js\b/g, "react"],
  [/\bnode[ .]?js\b/g, "node"],
  [/\bnext[ .]?js\b/g, "next"],
  [/\bvue[ .]?js\b/g, "vue"],
];

// Single-token canonicalisation (spacing/punct variants of the SAME tech).
const TOKEN_MAP = new Map(Object.entries({
  reactjs: "react",
  nodejs: "node",
  nextjs: "next",
  vuejs: "vue",
  golang: "go",
  postgres: "postgresql",
  k8s: "kubernetes",
}));

/**
 * @param {string} raw
 * @returns {{ normalized: string, changed: boolean }}
 */
export function normalizeSearchQuery(raw) {
  let q = collapse(raw);
  if (!q) return { normalized: "", changed: false };

  for (const [re, to] of PHRASE_MAP) q = q.replace(re, to);

  q = q
    .split(" ")
    .map((tok) => TOKEN_MAP.get(tok) || tok)
    .join(" ");

  q = collapse(q);
  return { normalized: q, changed: q !== collapse(raw) };
}
