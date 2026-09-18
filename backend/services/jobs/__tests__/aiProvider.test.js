import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("../../sources/httpClient.js", async (io) => {
  const actual = await io();
  return { ...actual, safeRequest: vi.fn() };
});

import { safeRequest, SourceHttpError } from "../../sources/httpClient.js";
import {
  openAiCompatibleProvider,
  aiProviderStatus,
  bootstrapAiProvider,
  classifyProviderError,
  AI_PROMPT_VERSION,
} from "../aiProvider.js";
import { isAiEnabled, clearMatchProvider, registerMatchProvider } from "../aiMatcher.js";

const ENV = (over = {}) => ({
  AI_RECOMMENDATIONS_ENABLED: "true",
  AI_PROVIDER: "groq",
  AI_MODEL: "llama-3.1-8b-instant",
  AI_API_KEY: "sk-fake-test-key",
  AI_TIMEOUT_MS: "5000",
  ...over,
});

const payload = {
  profile: { roleFamilies: ["backend"], skills: ["node.js"], seniority: "senior" },
  jobs: [{ groupId: "g1", title: "Backend Engineer", skills: ["node.js"] }],
};

const okBody = (content) => ({
  status: 200,
  headers: {},
  body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }),
  url: "x",
});

beforeEach(() => {
  safeRequest.mockReset();
  clearMatchProvider();
});
afterEach(() => {
  clearMatchProvider();
  delete process.env.AI_RECOMMENDATIONS_ENABLED;
});

describe("aiProviderStatus", () => {
  it("reports config presence WITHOUT the key value", () => {
    const s = aiProviderStatus(ENV());
    expect(s).toEqual({
      featureEnabled: true,
      providerName: "groq",
      providerConfigured: true,
      promptVersion: AI_PROMPT_VERSION,
    });
    expect(JSON.stringify(s)).not.toContain("sk-fake-test-key");
  });
  it("providerConfigured is false when the key is missing", () => {
    expect(aiProviderStatus(ENV({ AI_API_KEY: "" })).providerConfigured).toBe(false);
  });
});

describe("bootstrapAiProvider", () => {
  it("registers the provider only when flag ON and fully configured", () => {
    process.env.AI_RECOMMENDATIONS_ENABLED = "true";
    bootstrapAiProvider(ENV());
    expect(isAiEnabled()).toBe(true);
  });
  it("registers nothing when the flag is off", () => {
    bootstrapAiProvider(ENV({ AI_RECOMMENDATIONS_ENABLED: "false" }));
    expect(isAiEnabled()).toBe(false);
  });
  it("registers nothing when the key is missing (no crash)", () => {
    expect(() => bootstrapAiProvider(ENV({ AI_API_KEY: "" }))).not.toThrow();
    expect(isAiEnabled()).toBe(false);
  });
});

describe("openAiCompatibleProvider — happy path", () => {
  it("returns the results array from a well-formed response", async () => {
    safeRequest.mockResolvedValue(okBody({ results: [{ groupId: "g1", matchScore: 0.8, confidence: "high", strengths: ["a"], gaps: [] }] }));
    const rows = await openAiCompatibleProvider(payload, ENV());
    expect(rows).toEqual([{ groupId: "g1", matchScore: 0.8, confidence: "high", strengths: ["a"], gaps: [] }]);
    // request went to the groq base URL with a Bearer header
    const [url, opts] = safeRequest.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(opts.headers.Authorization).toMatch(/^Bearer /);
    expect(opts.method).toBe("POST");
  });

  it("accepts a bare array as content too", async () => {
    safeRequest.mockResolvedValue(okBody([{ groupId: "g1", matchScore: 0.5 }]));
    expect(await openAiCompatibleProvider(payload, ENV())).toHaveLength(1);
  });
});

describe("openAiCompatibleProvider — failures all throw (aiMatcher will fall back)", () => {
  it("missing config", async () => {
    await expect(openAiCompatibleProvider(payload, ENV({ AI_API_KEY: "" }))).rejects.toThrow(/not configured/);
  });
  it("HTTP 429 (rate limit)", async () => {
    safeRequest.mockRejectedValue(new SourceHttpError("HTTP 429 from api.groq.com", "http"));
    const err = await openAiCompatibleProvider(payload, ENV()).catch((e) => e);
    expect(classifyProviderError(err)).toBe("rate_limit");
  });
  it("HTTP 401", async () => {
    safeRequest.mockRejectedValue(new SourceHttpError("HTTP 401 from api.groq.com", "http"));
    const err = await openAiCompatibleProvider(payload, ENV()).catch((e) => e);
    expect(classifyProviderError(err)).toBe("http");
  });
  it("timeout", async () => {
    safeRequest.mockRejectedValue(new SourceHttpError("Request timed out after 5000ms", "timeout"));
    const err = await openAiCompatibleProvider(payload, ENV()).catch((e) => e);
    expect(classifyProviderError(err)).toBe("timeout");
  });
  it("network error", async () => {
    safeRequest.mockRejectedValue(new SourceHttpError("ECONNRESET", "network"));
    expect(classifyProviderError(await openAiCompatibleProvider(payload, ENV()).catch((e) => e))).toBe("network");
  });
  it("body is not JSON", async () => {
    safeRequest.mockResolvedValue({ status: 200, headers: {}, body: "<html>", url: "x" });
    await expect(openAiCompatibleProvider(payload, ENV())).rejects.toThrow(/not JSON/);
  });
  it("no message content", async () => {
    safeRequest.mockResolvedValue({ status: 200, headers: {}, body: JSON.stringify({ choices: [{}] }), url: "x" });
    await expect(openAiCompatibleProvider(payload, ENV())).rejects.toThrow(/no content/);
  });
  it("content is not valid JSON", async () => {
    safeRequest.mockResolvedValue({ status: 200, headers: {}, body: JSON.stringify({ choices: [{ message: { content: "not json {" } }] }), url: "x" });
    await expect(openAiCompatibleProvider(payload, ENV())).rejects.toThrow(/not valid JSON/);
  });
  it("content missing results[]", async () => {
    safeRequest.mockResolvedValue(okBody({ foo: 1 }));
    await expect(openAiCompatibleProvider(payload, ENV())).rejects.toThrow(/missing results/);
  });
});

describe("end-to-end through aiMatcher: provider failure → deterministic fallback", () => {
  it("a 5xx from the real provider yields null (no throw out of refineMatches)", async () => {
    const { refineMatches } = await import("../aiMatcher.js");
    process.env.AI_RECOMMENDATIONS_ENABLED = "true";
    registerMatchProvider((p) => openAiCompatibleProvider(p, ENV()));
    safeRequest.mockRejectedValue(new SourceHttpError("HTTP 503 from api.groq.com", "http"));
    const out = await refineMatches(
      { roleFamilies: ["backend"], skills: ["node.js"] },
      [{ group: { _id: "g1", displayTitle: "Backend Engineer", skills: ["node.js"], sources: [] }, baseline: { score: 0.6, reasons: [], gaps: [] } }],
      { classifyError: classifyProviderError }
    );
    expect(out).toBeNull();
    delete process.env.AI_RECOMMENDATIONS_ENABLED;
  });
});
