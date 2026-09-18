/**
 * Per-adapter configuration validation + credential status (Phase 5 §14).
 *
 * `validateSourceConfig` is pure — it never reads env / DB.
 * `getCredentialStatus` reports ONLY `configured: true|false` — never a value,
 * never the env-var name.
 */
import { parseCron } from "../jobs/cron.js";

// Keys in `config` whose values must never be echoed back to an admin client.
const SECRET_KEY_RE = /(ref|key|secret|token|password|credential|auth)/i;
// …except these public identifiers.
const PUBLIC_CONFIG_KEYS = new Set(["boardToken", "boardSlug"]);

const ADAPTERS = {
  internal: {
    type: "internal",
    required: [],
    credentialEnvs: [],
    validate: () => null,
  },
  greenhouse: {
    type: "ats",
    required: ["boardToken"],
    credentialEnvs: [],
    validate: (cfg) => {
      const token = cfg.boardToken || cfg.boardSlug;
      if (!token || typeof token !== "string") return "greenhouse: config.boardToken is required";
      if (!/^[a-z0-9][a-z0-9-]{0,80}$/i.test(token)) return `greenhouse: invalid board token "${token}"`;
      return null;
    },
  },
  lever: {
    type: "ats",
    required: ["site"],
    credentialEnvs: [],
    validate: (cfg) => {
      const site = cfg.site || cfg.company;
      if (!site || typeof site !== "string") return "lever: config.site is required";
      if (!/^[a-z0-9][a-z0-9-]{0,60}$/i.test(site)) return `lever: invalid site "${site}"`;
      return null;
    },
  },
  ashby: {
    type: "ats",
    required: ["jobBoardName"],
    credentialEnvs: [],
    validate: (cfg) => {
      const board = cfg.jobBoardName || cfg.boardName;
      if (!board || typeof board !== "string") return "ashby: config.jobBoardName is required";
      if (!/^[a-z0-9][a-z0-9 _-]{0,80}$/i.test(board)) return `ashby: invalid jobBoardName "${board}"`;
      return null;
    },
  },
  smartrecruiters: {
    type: "ats",
    required: ["companyId"],
    credentialEnvs: [],
    validate: (cfg) => {
      const id = cfg.companyId || cfg.company;
      if (!id || typeof id !== "string") return "smartrecruiters: config.companyId is required";
      if (!/^[a-z0-9][a-z0-9 _.-]{0,80}$/i.test(id)) return `smartrecruiters: invalid companyId "${id}"`;
      if (cfg.maxDetail !== undefined && !(Number(cfg.maxDetail) > 0)) return "smartrecruiters: maxDetail must be positive";
      return null;
    },
  },
  workable: {
    type: "ats",
    required: ["subdomain", "apiTokenRef"],
    credentialEnvs: (cfg) => [cfg.apiTokenRef || "WORKABLE_API_TOKEN"],
    validate: (cfg) => {
      if (!cfg.subdomain || !/^[a-z0-9][a-z0-9-]{0,60}$/i.test(String(cfg.subdomain))) {
        return "workable: config.subdomain is required (valid account subdomain)";
      }
      if (cfg.apiTokenRef !== undefined && !/^[A-Z][A-Z0-9_]*$/.test(String(cfg.apiTokenRef))) {
        return "workable: config.apiTokenRef must be an ENV VAR NAME (not a value)";
      }
      return null;
    },
  },
  adzuna: {
    type: "aggregator",
    required: ["appIdRef", "appKeyRef"],
    credentialEnvs: (cfg) => [cfg.appIdRef || "ADZUNA_APP_ID", cfg.appKeyRef || "ADZUNA_APP_KEY"],
    validate: (cfg) => {
      for (const k of ["appIdRef", "appKeyRef"]) {
        if (cfg[k] !== undefined && !/^[A-Z][A-Z0-9_]*$/.test(String(cfg[k]))) {
          return `adzuna: config.${k} must be an ENV VAR NAME (not a value)`;
        }
      }
      for (const k of ["maxQueries", "maxPagesPerQuery", "maxRequests", "resultsPerPage", "pages"]) {
        if (cfg[k] !== undefined && !(Number(cfg[k]) >= 1)) return `adzuna: config.${k} must be a positive number`;
      }
      if (cfg.countries !== undefined && !(Array.isArray(cfg.countries) || typeof cfg.countries === "string")) {
        return "adzuna: config.countries must be a comma string or array of market codes";
      }
      return null;
    },
  },
  jsearch: {
    type: "aggregator",
    required: ["apiKeyRef"],
    credentialEnvs: (cfg) => [cfg.apiKeyRef || "RAPIDAPI_KEY"],
    validate: (cfg) => {
      if (cfg.apiKeyRef !== undefined && !/^[A-Z][A-Z0-9_]*$/.test(String(cfg.apiKeyRef))) {
        return "jsearch: config.apiKeyRef must be an ENV VAR NAME (not a value)";
      }
      return null;
    },
  },
  jooble: {
    type: "aggregator",
    required: ["apiKeyRef"],
    credentialEnvs: (cfg) => [cfg.apiKeyRef || "JOOBLE_API_KEY"],
    validate: (cfg) => {
      if (cfg.apiKeyRef !== undefined && !/^[A-Z][A-Z0-9_]*$/.test(String(cfg.apiKeyRef))) {
        return "jooble: config.apiKeyRef must be an ENV VAR NAME (not a value)";
      }
      return null;
    },
  },
  themuse: {
    // The Muse public Jobs API — API key is OPTIONAL (anonymous access allowed).
    type: "aggregator",
    required: [],
    credentialEnvs: () => [], // optional → never "missing"
    validate: (cfg) => {
      if (cfg.apiKeyRef !== undefined && cfg.apiKeyRef !== "" && !/^[A-Z][A-Z0-9_]*$/.test(String(cfg.apiKeyRef))) {
        return "themuse: config.apiKeyRef must be an ENV VAR NAME (not a value)";
      }
      if (cfg.pages !== undefined && !(Number(cfg.pages) >= 1)) return "themuse: pages must be >= 1";
      return null;
    },
  },
  jobicy: {
    // Jobicy public remote-jobs API — no authentication.
    type: "aggregator",
    required: [],
    credentialEnvs: () => [],
    validate: (cfg) => {
      if (cfg.count !== undefined && !(Number(cfg.count) >= 1 && Number(cfg.count) <= 200)) {
        return "jobicy: count must be 1–200";
      }
      if (cfg.filters !== undefined && !Array.isArray(cfg.filters)) {
        return "jobicy: config.filters must be an array of {geo,industry,tag}";
      }
      return null;
    },
  },
  usajobs: {
    // Official U.S. federal jobs API — both credentials required by the API.
    type: "feed",
    required: ["apiKeyRef", "userAgentRef"],
    credentialEnvs: (cfg) => [cfg.apiKeyRef || "USAJOBS_API_KEY", cfg.userAgentRef || "USAJOBS_USER_AGENT"],
    validate: (cfg) => {
      for (const k of ["apiKeyRef", "userAgentRef"]) {
        if (cfg[k] !== undefined && !/^[A-Z][A-Z0-9_]*$/.test(String(cfg[k]))) {
          return `usajobs: config.${k} must be an ENV VAR NAME (not a value)`;
        }
      }
      if (cfg.pages !== undefined && !(Number(cfg.pages) >= 1)) return "usajobs: pages must be >= 1";
      return null;
    },
  },
};

export function knownAdapters() {
  return Object.keys(ADAPTERS);
}

export function adapterSpec(adapter) {
  return ADAPTERS[adapter] || null;
}

// Human-facing field descriptors for the "Add Source" form. NO values — just
// what to ask the admin for. `*Ref` fields are ENV-VAR NAMES the admin types.
const CONFIG_FIELDS = {
  internal: [],
  greenhouse: [
    { key: "boardToken", label: "Board token / slug", placeholder: "acme", required: true, secret: false },
  ],
  lever: [
    { key: "site", label: "Lever account slug", placeholder: "leverdemo", required: true, secret: false },
  ],
  ashby: [
    { key: "jobBoardName", label: "Ashby job board name", placeholder: "Ashby", required: true, secret: false },
  ],
  smartrecruiters: [
    { key: "companyId", label: "SmartRecruiters company identifier", placeholder: "AcmeInc", required: true, secret: false },
    { key: "maxDetail", label: "Max detail fetches / sync", placeholder: "100", required: false, secret: false },
  ],
  workable: [
    { key: "subdomain", label: "Workable account subdomain", placeholder: "acme", required: true, secret: false },
    { key: "apiTokenRef", label: "API token env-var name", placeholder: "WORKABLE_API_TOKEN", required: true, secret: true },
  ],
  adzuna: [
    { key: "appIdRef", label: "App ID env-var name", placeholder: "ADZUNA_APP_ID", required: true, secret: true },
    { key: "appKeyRef", label: "App key env-var name", placeholder: "ADZUNA_APP_KEY", required: true, secret: true },
    { key: "country", label: "Country code", placeholder: "in", required: false, secret: false },
    { key: "pages", label: "Pages per keyword", placeholder: "1", required: false, secret: false },
  ],
  jsearch: [
    { key: "apiKeyRef", label: "RapidAPI key env-var name", placeholder: "RAPIDAPI_KEY", required: true, secret: true },
    { key: "country", label: "Country", placeholder: "India", required: false, secret: false },
  ],
  jooble: [
    { key: "apiKeyRef", label: "Jooble key env-var name", placeholder: "JOOBLE_API_KEY", required: true, secret: true },
    { key: "location", label: "Location", placeholder: "India", required: false, secret: false },
  ],
  themuse: [
    { key: "apiKeyRef", label: "The Muse API key env-var name (optional)", placeholder: "THE_MUSE_API_KEY", required: false, secret: true },
    { key: "pages", label: "Pages per sync", placeholder: "3", required: false, secret: false },
    { key: "categories", label: "Category filters (comma-separated)", placeholder: "Software Engineering, Data Science", required: false, secret: false },
  ],
  jobicy: [
    { key: "count", label: "Jobs per request (1–200)", placeholder: "100", required: false, secret: false },
    { key: "filters", label: "Optional filters (JSON array of {geo,industry,tag})", placeholder: "[{\"geo\":\"usa\"}]", required: false, secret: false },
  ],
  usajobs: [
    { key: "apiKeyRef", label: "USAJOBS Authorization-Key env-var name", placeholder: "USAJOBS_API_KEY", required: true, secret: true },
    { key: "userAgentRef", label: "USAJOBS registered-email env-var name", placeholder: "USAJOBS_USER_AGENT", required: true, secret: true },
    { key: "queries", label: "Keyword searches (comma-separated)", placeholder: "software engineer, data scientist", required: false, secret: false },
    { key: "pages", label: "Pages per keyword", placeholder: "1", required: false, secret: false },
  ],
};

/** Catalogue of selectable adapters for the admin "Add Source" UI. No secrets. */
export function adapterCatalog() {
  return knownAdapters().map((name) => {
    const spec = ADAPTERS[name];
    const credentialEnvs =
      typeof spec.credentialEnvs === "function" ? spec.credentialEnvs({}) : spec.credentialEnvs;
    return {
      adapter: name,
      type: spec.type,
      needsCredential: (credentialEnvs || []).length > 0,
      configFields: CONFIG_FIELDS[name] || [],
    };
  });
}

/**
 * @returns {{ error: string } | { ok: true, warnings: string[] }}
 */
export function validateSourceConfig(adapter, config = {}) {
  const spec = ADAPTERS[adapter];
  if (!spec) return { error: `Unknown adapter "${adapter}"` };
  if (config && typeof config !== "object") return { error: "config must be an object" };

  const cfg = config || {};

  // reject a raw override that could point outbound requests anywhere
  if (cfg.baseUrl !== undefined) return { error: "config.baseUrl override is not permitted" };

  const err = spec.validate(cfg);
  if (err) return { error: err };

  for (const key of ["schedule", "verifyLinksSchedule"]) {
    if (cfg[key] !== undefined && cfg[key] !== "") {
      try {
        parseCron(cfg[key]);
      } catch {
        return { error: `Invalid cron in config.${key}: "${cfg[key]}"` };
      }
    }
  }
  if (cfg.verifyLinksLimit !== undefined) {
    const n = Number(cfg.verifyLinksLimit);
    if (!Number.isInteger(n) || n < 1 || n > 200) {
      return { error: "config.verifyLinksLimit must be an integer 1–200" };
    }
  }

  const warnings = [];
  for (const key of spec.required) {
    if (spec.type !== "aggregator" && (cfg[key] === undefined || cfg[key] === "")) {
      warnings.push(`config.${key} is not set`);
    }
  }
  return { ok: true, warnings };
}

/**
 * Credential presence for an adapter, resolved from the environment by name.
 * @returns {{ configured: boolean, missing: string[] }}  (env-var names in
 *          `missing` are safe to surface — they are names, not values — but
 *          callers may choose to hide them; NO value is ever returned.)
 */
export function getCredentialStatus(adapter, config = {}, env = process.env) {
  const spec = ADAPTERS[adapter];
  if (!spec) return { configured: false, missing: [] };
  const names = typeof spec.credentialEnvs === "function" ? spec.credentialEnvs(config || {}) : spec.credentialEnvs;
  if (!names.length) return { configured: true, missing: [] };
  const missing = names.filter((n) => !env[n]);
  return { configured: missing.length === 0, missing };
}

/** Redact secret-ish config values before returning config to an admin client. */
export function sanitizeConfig(config = {}) {
  const out = {};
  for (const [k, v] of Object.entries(config || {})) {
    if (PUBLIC_CONFIG_KEYS.has(k)) {
      out[k] = v;
    } else if (SECRET_KEY_RE.test(k)) {
      out[k] = v ? "***configured***" : "";
    } else {
      out[k] = v;
    }
  }
  return out;
}
