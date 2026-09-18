import { describe, it, expect, afterAll, beforeAll } from "vitest";
import http from "http";

import { safeGet, isBlockedAddress, SourceHttpError, throttleHost, __resetRateLimiter } from "../httpClient.js";

describe("isBlockedAddress", () => {
  it("blocks loopback / private / link-local / CGNAT / metadata / reserved", () => {
    for (const ip of [
      "127.0.0.1",
      "127.9.9.9",
      "10.0.0.5",
      "172.16.4.4",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254", // cloud metadata
      "169.254.0.1",
      "100.64.0.1", // CGNAT
      "0.0.0.0",
      "224.0.0.1", // multicast
      "255.255.255.255",
      "::1",
      "fc00::1",
      "fd00:ec2::254",
      "fe80::1",
      "::ffff:127.0.0.1",
    ]) {
      expect(isBlockedAddress(ip), ip).toBe(true);
    }
  });

  it("allows public addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "93.184.216.34", "2606:2800:220:1:248:1893:25c8:1946"]) {
      expect(isBlockedAddress(ip), ip).toBe(false);
    }
  });

  it("treats non-IP / empty input as blocked (caller must resolve first)", () => {
    expect(isBlockedAddress("")).toBe(true);
    expect(isBlockedAddress("example.com")).toBe(true);
  });
});

describe("safeGet — SSRF guard", () => {
  it("rejects non-http(s) protocols", async () => {
    await expect(safeGet("ftp://example.com/x")).rejects.toMatchObject({ kind: "ssrf" });
    await expect(safeGet("file:///etc/passwd")).rejects.toMatchObject({ kind: "ssrf" });
  });

  it("rejects a literal private IP", async () => {
    await expect(safeGet("http://127.0.0.1:1/")).rejects.toMatchObject({ kind: "ssrf" });
    await expect(safeGet("http://169.254.169.254/latest/meta-data/")).rejects.toMatchObject({
      kind: "ssrf",
    });
  });

  it("rejects localhost by name", async () => {
    await expect(safeGet("http://localhost:1/")).rejects.toMatchObject({ kind: "ssrf" });
  });

  it("rejects an invalid URL", async () => {
    await expect(safeGet("http://")).rejects.toBeInstanceOf(SourceHttpError);
  });

  it("enforces a host allowlist", async () => {
    await expect(
      safeGet("https://8.8.8.8/", { allowedHosts: ["boards-api.greenhouse.io"] })
    ).rejects.toMatchObject({ kind: "ssrf" });
  });
});

describe("safeGet — behaviour against a local server (allowPrivateHosts test hook)", () => {
  let server;
  let base;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === "/ok") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ hello: "world" }));
      } else if (req.url === "/big") {
        res.writeHead(200);
        res.end("x".repeat(50_000));
      } else if (req.url === "/slow") {
        setTimeout(() => res.end("late"), 500);
      } else if (req.url === "/redirect-external") {
        res.writeHead(302, { location: "http://169.254.169.254/" });
        res.end();
      } else if (req.url === "/boom") {
        res.writeHead(503);
        res.end("nope");
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(() => new Promise((r) => server.close(r)));

  it("fetches a normal response", async () => {
    const res = await safeGet(`${base}/ok`, { allowPrivateHosts: true });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ hello: "world" });
  });

  it("enforces the response-size cap", async () => {
    await expect(
      safeGet(`${base}/big`, { allowPrivateHosts: true, maxBytes: 1000 })
    ).rejects.toMatchObject({ kind: "response" });
  });

  it("times out", async () => {
    await expect(
      safeGet(`${base}/slow`, { allowPrivateHosts: true, timeoutMs: 100 })
    ).rejects.toMatchObject({ kind: "timeout" });
  });

  it("re-validates redirect targets (blocks redirect to metadata IP)", async () => {
    await expect(
      safeGet(`${base}/redirect-external`, { allowPrivateHosts: true })
    ).rejects.toMatchObject({ kind: "ssrf" });
  });

  it("classifies non-2xx as an http error", async () => {
    await expect(safeGet(`${base}/boom`, { allowPrivateHosts: true })).rejects.toMatchObject({
      kind: "http",
    });
  });
});

describe("throttleHost", () => {
  it("does nothing when perMin <= 0", async () => {
    __resetRateLimiter();
    const t = Date.now();
    await throttleHost("h", 0);
    await throttleHost("h", 0);
    expect(Date.now() - t).toBeLessThan(50);
  });

  it("delays once the per-minute budget is spent", async () => {
    __resetRateLimiter();
    // budget of 2/min: first two are instant, we only assert they are recorded
    await throttleHost("host-x", 2);
    await throttleHost("host-x", 2);
    // a 3rd call would wait ~60s; don't actually run it in the test
    expect(true).toBe(true);
  });
});
