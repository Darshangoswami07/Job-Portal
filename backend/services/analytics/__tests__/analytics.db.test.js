import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";

import { useTestDb } from "../../../test/mongo.js";
import { AnalyticsEvent } from "../../../models_new/AnalyticsEvent.js";
import { JobGroup } from "../../../models_new/JobGroup.js";
import { User } from "../../../models/user.model.js";
import { recordEvent, sanitizeMeta } from "../events.js";
import { buildAnalytics } from "../aggregate.js";
import { postClientEvent } from "../../../controllers_new/analyticsController.js";
import { getAdminAnalytics } from "../../../controllers_new/adminAnalyticsController.js";
import requireRole from "../../../middlewares/requireRole.js";

useTestDb();

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};

describe("sanitizeMeta (privacy)", () => {
  it("drops secret / PII keys and non-scalars, keeps short scalars", () => {
    const out = sanitizeMeta({
      q: "react developer",
      total: 12,
      remote: true,
      password: "hunter2",
      token: "abc",
      email: "x@y.com",
      phone: "999",
      resumeText: "long",
      authHeader: "Bearer z",
      nested: { a: 1 },
      list: [1, 2],
      big: "x".repeat(400),
    });
    expect(out).toEqual({ q: "react developer", total: 12, remote: true, big: "x".repeat(120) });
  });
});

describe("recordEvent", () => {
  beforeEach(async () => { await AnalyticsEvent.deleteMany({}); });

  it("persists a whitelisted event, ignores an unknown type, never throws", async () => {
    await expect(recordEvent("search_performed", { meta: { q: "node", total: 3 } })).resolves.toBeDefined();
    await expect(recordEvent("totally_made_up", { meta: {} })).resolves.toBeNull();
    const rows = await AnalyticsEvent.find({}).lean();
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("search_performed");
    expect(rows[0].meta).toEqual({ q: "node", total: 3 });
  });

  it("never persists a raw Job id as groupKey (bounded string only)", async () => {
    await recordEvent("job_dismissed", { groupKey: "x".repeat(200) });
    const row = await AnalyticsEvent.findOne({ type: "job_dismissed" }).lean();
    expect(row.groupKey.length).toBeLessThanOrEqual(60);
  });
});

describe("client beacon", () => {
  it("accepts only client-observable events; 400 otherwise; always 202 for valid", () => {
    const ok = mockRes();
    postClientEvent({ id: undefined, body: { type: "recommendation_impression", meta: { position: 2 } } }, ok);
    expect(ok.statusCode).toBe(202);

    const bad = mockRes();
    postClientEvent({ body: { type: "search_performed" } }, bad);
    expect(bad.statusCode).toBe(400);
  });
});

describe("buildAnalytics", () => {
  beforeEach(async () => {
    await AnalyticsEvent.deleteMany({});
    await JobGroup.deleteMany({});
    for (let i = 0; i < 3; i += 1) {
      await JobGroup.create({
        dedupeHash: `h${i}`, displayTitle: `Job ${i}`, status: "active", remoteType: "remote",
        bestJobId: new mongoose.Types.ObjectId(), sources: [], postedAt: new Date(),
      });
    }
  });

  it("returns a bounded, projected snapshot and reports 'insufficient traffic' with no events", async () => {
    const a = await buildAnalytics({ days: 30 });
    expect(a.overview.activeGroups).toBe(3);
    expect(a.search.sample).toBe("insufficient traffic");
    expect(a.recommendations.sample).toBe("insufficient traffic");
    expect(a).not.toHaveProperty("_id");
    expect(JSON.stringify(a)).not.toMatch(/apikey|password|bearer /i);
  });

  it("computes rates once there is enough sample", async () => {
    const writes = [];
    for (let i = 0; i < 25; i += 1) writes.push(recordEvent("search_performed", { meta: { q: i % 3 ? "react" : "", total: i % 5 ? 4 : 0 } }));
    for (let i = 0; i < 5; i += 1) writes.push(recordEvent("search_zero_result", { meta: { q: "zzz" } }));
    await Promise.all(writes);
    const a = await buildAnalytics({ days: 30 });
    expect(a.search.sample).toBe("ok");
    expect(a.search.searches).toBe(25);
    expect(a.search.zeroResult).toBe(5);
    expect(a.search.zeroResultRate).toBeCloseTo(0.2, 1);
    expect(a.search.topQueries[0]).toHaveProperty("query");
  });
});

describe("admin analytics endpoint", () => {
  beforeEach(async () => { await User.deleteMany({}); });

  it("requires admin", async () => {
    const nonAdmin = await User.create({ fullname: "N", email: `n${Date.now()}@x.com`, password: "h", roles: { jobSeeker: true } });
    const res = mockRes();
    let nexted = false;
    await requireRole("admin")({ id: nonAdmin._id }, res, () => { nexted = true; });
    expect(nexted).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it("returns provider config + benchmark + no secrets", async () => {
    const res = mockRes();
    await getAdminAnalytics({ query: { days: "30" } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.config).toHaveProperty("providerConfigured");
    expect(res.body.data.config.aiQuality).toHaveProperty("tripped");
    expect(res.body.data.offlineBenchmark).toHaveProperty("ndcgAt5");
    const json = JSON.stringify(res.body);
    expect(json).not.toMatch(/sk-[A-Za-z0-9]/);
    expect(json).not.toMatch(/Bearer /);
    expect(json.toLowerCase()).not.toContain("ai_api_key");
  });
});
