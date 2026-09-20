import { describe, it, expect, beforeEach } from "vitest";

import { useTestDb } from "../../../test/mongo.js";
import { User } from "../../../models/user.model.js";
import { AdminAudit } from "../../../models_new/AdminAudit.js";
import requireRole from "../../../middlewares/requireRole.js";
import { listAuditLog } from "../../../controllers_new/adminAuditController.js";

useTestDb();

let admin;
let recruiter;

const mockRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  return res;
};

beforeEach(async () => {
  admin = await User.create({ fullname: "A", email: `a${Date.now()}@x.com`, password: "h", roles: { admin: true } });
  recruiter = await User.create({ fullname: "R", email: `r${Date.now()}@x.com`, password: "h", roles: { recruiter: true } });
});

describe("audit authorization (requireRole)", () => {
  const run = async (userId) => {
    const res = mockRes();
    let ok = false;
    await requireRole("admin")({ id: userId }, res, () => (ok = true));
    return { res, ok };
  };
  it("401 anonymous, 403 recruiter, allows admin", async () => {
    expect((await run(undefined)).res.statusCode).toBe(401);
    expect((await run(recruiter._id)).res.statusCode).toBe(403);
    expect((await run(admin._id)).ok).toBe(true);
  });
});

describe("GET /api/v1/admin/audit", () => {
  beforeEach(async () => {
    for (let i = 0; i < 12; i += 1) {
      await AdminAudit.create({
        userId: admin._id,
        action: i % 2 ? "job-source.sync" : "job-source.enable",
        targetKey: i % 3 ? "greenhouse:acme" : "internal",
        targetId: undefined,
        meta: { i, credentialRef: "SHOULD_NOT_LEAK", secretKey: "abc" },
        createdAt: new Date(Date.now() - i * 60_000),
      });
    }
  });

  it("paginates newest-first with a capped limit", async () => {
    const res = mockRes();
    await listAuditLog({ query: { page: "1", limit: "5" } }, res);
    expect(res.body.data.entries).toHaveLength(5);
    expect(res.body.data.pagination.total).toBe(12);
    const times = res.body.data.entries.map((e) => new Date(e.at).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));

    const capped = mockRes();
    await listAuditLog({ query: { limit: "9999" } }, capped);
    expect(capped.body.data.pagination.limit).toBe(50);
  });

  it("filters by action and targetKey", async () => {
    const byAction = mockRes();
    await listAuditLog({ query: { action: "job-source.sync" } }, byAction);
    expect(byAction.body.data.entries.every((e) => e.action === "job-source.sync")).toBe(true);

    const byKey = mockRes();
    await listAuditLog({ query: { targetKey: "internal" } }, byKey);
    expect(byKey.body.data.entries.every((e) => e.targetKey === "internal")).toBe(true);
  });

  it("filters by date range and rejects invalid dates", async () => {
    const bad = mockRes();
    await listAuditLog({ query: { from: "not-a-date" } }, bad);
    expect(bad.statusCode).toBe(400);

    const ranged = mockRes();
    await listAuditLog({ query: { from: new Date(Date.now() - 3 * 60_000).toISOString() } }, ranged);
    expect(ranged.body.data.entries.length).toBeLessThanOrEqual(4);
  });

  it("includes the actor but NEVER leaks secret-ish meta values", async () => {
    const res = mockRes();
    await listAuditLog({ query: {} }, res);
    const json = JSON.stringify(res.body);
    expect(json).not.toContain("SHOULD_NOT_LEAK");
    expect(json).not.toContain('"abc"');
    const e = res.body.data.entries[0];
    expect(e.actor.email).toBe(admin.email);
    expect(e.meta.credentialRef).toBe("***");
    expect(e.meta.secretKey).toBe("***");
    expect(e.meta.i).toBeTypeOf("number");
  });
});
