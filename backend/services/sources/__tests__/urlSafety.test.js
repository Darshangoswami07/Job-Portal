import { describe, it, expect } from "vitest";
import { isSafeRedirectUrl } from "../httpClient.js";

describe("isSafeRedirectUrl", () => {
  it("allows normal external https/http URLs", () => {
    expect(isSafeRedirectUrl("https://boards.greenhouse.io/acme/jobs/1")).toBe(true);
    expect(isSafeRedirectUrl("http://careers.example.com/apply/2")).toBe(true);
  });

  it("rejects dangerous schemes", () => {
    for (const u of [
      "javascript:alert(1)",
      "data:text/html,<script>x</script>",
      "file:///etc/passwd",
      "chrome-extension://abc/x",
      "about:blank",
      "vbscript:msgbox(1)",
    ]) {
      expect(isSafeRedirectUrl(u), u).toBe(false);
    }
  });

  it("rejects localhost / loopback / private / metadata hosts", () => {
    for (const u of [
      "http://localhost/apply",
      "http://sub.localhost/apply",
      "http://127.0.0.1/apply",
      "https://10.1.2.3/apply",
      "https://192.168.0.10/apply",
      "http://169.254.169.254/latest/meta-data/",
      "http://[::1]/apply",
      "https://intranet.corp/apply",
      "https://build.internal/x",
    ]) {
      expect(isSafeRedirectUrl(u), u).toBe(false);
    }
  });

  it("rejects malformed / empty input", () => {
    expect(isSafeRedirectUrl("")).toBe(false);
    expect(isSafeRedirectUrl("not a url")).toBe(false);
    expect(isSafeRedirectUrl(null)).toBe(false);
    expect(isSafeRedirectUrl("http://")).toBe(false);
  });
});
