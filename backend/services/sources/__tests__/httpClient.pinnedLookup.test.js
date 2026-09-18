import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import http from "http";

// Force the *hostname* resolution path (not an IP literal) so the pinned
// `lookup` shim the connect layer calls is actually exercised. Node's connect
// path invokes it with `{ all: true }` and expects the ARRAY form — a
// regression here surfaced as "Invalid IP address: undefined" on Node ≥ 20
// (autoSelectFamily / happy-eyeballs) and blocked every external adapter.
vi.mock("dns", async (importOriginal) => {
  const actual = await importOriginal();
  const lookup = (hostname, opts, cb) => {
    const done = typeof opts === "function" ? opts : cb;
    const wantsAll = opts && typeof opts === "object" && opts.all;
    if (hostname === "pinned.test") {
      return wantsAll
        ? done(null, [{ address: "127.0.0.1", family: 4 }])
        : done(null, "127.0.0.1", 4);
    }
    return actual.lookup(hostname, opts, cb);
  };
  return { ...actual, lookup, default: { ...actual.default, lookup } };
});

const { safeGet } = await import("../httpClient.js");

let server;
let port;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, path: req.url }));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  port = server.address().port;
});

afterAll(() => new Promise((r) => server.close(r)));

describe("safeGet — pinned DNS lookup honours the { all: true } contract", () => {
  it("completes a hostname-based request (array-form lookup callback)", async () => {
    const res = await safeGet(`http://pinned.test:${port}/jobs`, {
      allowedHosts: ["pinned.test"],
      allowPrivateHosts: true, // 127.0.0.1 target — first hop only
      timeoutMs: 5000,
    });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toMatchObject({ ok: true, path: "/jobs" });
  });
});
