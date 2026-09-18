/**
 * Real LLM provider for job-match refinement (PLAN.md Phase 9 §3–13).
 *
 * OpenAI-compatible Chat Completions — works with Groq, OpenAI, or any
 * compatible gateway — called through the existing SSRF-safe HTTP client. No
 * vendor SDK is added, so the provider stays swappable and the app has no hard
 * dependency on one vendor. The function registered here matches the Phase-8
 * `registerMatchProvider` contract:
 *
 *   async ({ profile, jobs }) => [{ groupId, matchScore, confidence, strengths[], gaps[] }]
 *
 * Config (env only — never committed, never logged, never returned by an API):
 *   AI_RECOMMENDATIONS_ENABLED = "true"
 *   AI_PROVIDER   = "groq" | "openai" | "custom"        (default "groq")
 *   AI_MODEL      = e.g. "llama-3.1-8b-instant"
 *   AI_API_KEY    = <secret>
 *   AI_BASE_URL   = override for AI_PROVIDER "custom"
 *   AI_TIMEOUT_MS = 1000 … 20000  (default 8000)
 */
import { safeRequest, SourceHttpError } from "../sources/httpClient.js";
import { registerMatchProvider } from "./aiMatcher.js";

export const AI_PROMPT_VERSION = "prompt-v1";

const PROVIDER_BASE_URLS = {
  groq: "https://api.groq.com/openai/v1",
  openai: "https://api.openai.com/v1",
};
const DEFAULT_MODELS = {
  groq: "llama-3.1-8b-instant",
  openai: "gpt-4o-mini",
};

function config(env = process.env) {
  const provider = (env.AI_PROVIDER || "groq").toLowerCase();
  const baseUrl = (env.AI_BASE_URL || PROVIDER_BASE_URLS[provider] || "").replace(/\/+$/, "");
  const model = env.AI_MODEL || DEFAULT_MODELS[provider] || "";
  const apiKey = env.AI_API_KEY || "";
  const timeoutMs = Math.max(1000, Math.min(Number(env.AI_TIMEOUT_MS) || 8000, 20000));
  return { provider, baseUrl, model, apiKey, timeoutMs };
}

/** Sanitized startup status — NEVER the key value. */
export function aiProviderStatus(env = process.env) {
  const c = config(env);
  return {
    featureEnabled: env.AI_RECOMMENDATIONS_ENABLED === "true",
    providerName: c.provider,
    providerConfigured: Boolean(c.baseUrl && c.model && c.apiKey),
    promptVersion: AI_PROMPT_VERSION,
  };
}

const SYSTEM_PROMPT =
  "You are a job-matching assistant. You are given a candidate's structured, " +
  "anonymised profile and a small list of jobs that were already shortlisted by " +
  "a deterministic matcher. For each job, judge how well it fits THIS candidate. " +
  "Reply with ONLY a JSON object of the form " +
  '{"results":[{"groupId":"<id>","matchScore":<0..1 number>,"confidence":"high|medium|low",' +
  '"strengths":["..."],"gaps":["..."]}]}. ' +
  "matchScore must be between 0 and 1. Keep each strength/gap under 120 characters, " +
  "max 4 of each. Do not invent skills the candidate does not list. Do not add any " +
  "text outside the JSON.";

function buildMessages({ profile, jobs }) {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: JSON.stringify({ candidate: profile, jobs }),
    },
  ];
}

/** Map an HTTP/transport failure to a metrics-friendly kind. */
export function classifyProviderError(err) {
  if (err instanceof SourceHttpError) {
    if (err.kind === "timeout") return "timeout";
    if (err.kind === "network" || err.kind === "ssrf") return "network";
    if (err.kind === "http") {
      if (/HTTP 429/.test(err.message)) return "rate_limit";
      return "http";
    }
    return "http";
  }
  if (/timeout/i.test(err?.message || "")) return "timeout";
  return "other";
}

/**
 * The provider function. Throws on any failure — `aiMatcher.refineMatches`
 * catches everything and falls back to the deterministic score.
 */
export async function openAiCompatibleProvider(payload, env = process.env) {
  const c = config(env);
  if (!c.baseUrl || !c.model || !c.apiKey) {
    const e = new Error("ai provider not configured");
    e.kind = "config";
    throw e;
  }

  const res = await safeRequest(`${c.baseUrl}/chat/completions`, {
    method: "POST",
    timeoutMs: c.timeoutMs,
    maxBytes: 256 * 1024,
    headers: { Authorization: `Bearer ${c.apiKey}` },
    userAgent: "JobPilot-Reco/1.0",
    body: {
      model: c.model,
      temperature: 0.2,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: buildMessages(payload),
    },
  });

  let parsed;
  try {
    parsed = JSON.parse(res.body);
  } catch {
    const e = new Error("provider response was not JSON");
    e.kind = "response";
    throw e;
  }
  const content = parsed?.choices?.[0]?.message?.content;
  if (!content) {
    const e = new Error("provider response had no content");
    e.kind = "response";
    throw e;
  }
  let obj;
  try {
    obj = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    const e = new Error("provider content was not valid JSON");
    e.kind = "response";
    throw e;
  }
  const rows = Array.isArray(obj) ? obj : obj.results;
  if (!Array.isArray(rows)) {
    const e = new Error("provider content missing results[]");
    e.kind = "response";
    throw e;
  }
  return rows; // aiMatcher.coerceRow validates each
}

/**
 * Register the real provider IF the feature is on AND it is fully configured.
 * Missing config → no provider registered → deterministic-only (never a crash).
 * @returns the sanitized status
 */
export function bootstrapAiProvider(env = process.env) {
  const status = aiProviderStatus(env);
  if (status.featureEnabled && status.providerConfigured) {
    registerMatchProvider((payload) => openAiCompatibleProvider(payload, env));
  }
  return status;
}
