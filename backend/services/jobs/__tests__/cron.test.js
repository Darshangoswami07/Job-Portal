import { describe, it, expect } from "vitest";
import { parseCron, cronMatches, cronDue } from "../cron.js";

const at = (h, m, opts = {}) =>
  new Date(Date.UTC(2024, opts.mon ?? 5, opts.day ?? 3, h, m, 0));

describe("cronMatches", () => {
  it("empty expression fires every tick", () => {
    expect(cronMatches("", at(3, 17))).toBe(true);
    expect(cronMatches(null, at(0, 0))).toBe(true);
  });

  it('"0 */6 * * *" fires at 0:00, 6:00, 12:00, 18:00 only', () => {
    expect(cronMatches("0 */6 * * *", at(6, 0))).toBe(true);
    expect(cronMatches("0 */6 * * *", at(12, 0))).toBe(true);
    expect(cronMatches("0 */6 * * *", at(6, 1))).toBe(false);
    expect(cronMatches("0 */6 * * *", at(7, 0))).toBe(false);
  });

  it("supports lists and ranges", () => {
    expect(cronMatches("15,45 9-17 * * 1-5", at(10, 15))).toBe(true);
    expect(cronMatches("15,45 9-17 * * 1-5", at(10, 30))).toBe(false);
  });

  it("invalid expression never matches", () => {
    expect(cronMatches("nonsense", at(0, 0))).toBe(false);
    expect(cronMatches("* * *", at(0, 0))).toBe(false);
  });

  it("parseCron rejects malformed fields", () => {
    expect(() => parseCron("70 * * * *")).toThrow();
    expect(() => parseCron("* * * *")).toThrow();
  });
});

describe("cronDue", () => {
  it("is due when the cron matches and it has not run this minute", () => {
    const now = at(6, 0);
    expect(cronDue("0 */6 * * *", null, now)).toBe(true);
    expect(cronDue("0 */6 * * *", at(0, 0), now)).toBe(true);
  });

  it("is not due twice within the same minute", () => {
    const now = at(6, 0, { day: 3 });
    expect(cronDue("0 */6 * * *", now, now)).toBe(false);
  });

  it("is not due when the cron does not match now", () => {
    expect(cronDue("0 */6 * * *", null, at(7, 0))).toBe(false);
  });
});
