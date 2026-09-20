/**
 * Per-source default sync cadence (PLAN.md Phase 13 §13.2–13.3).
 *
 * A source's explicit `JobSource.schedule` always wins. When it is empty, the
 * scheduler falls back to a cadence chosen from the adapter / source type so we
 * do not hardcode one global frequency. All cadences are conservative and
 * respect the per-source `rateLimitPerMin` + advisory lock.
 *
 *   internal    → every tick (handled in the scheduler; empty schedule)
 *   ats         → hourly            (company boards change a few times/day)
 *   aggregator  → every 3 hours     (licensed APIs; be gentle on quota)
 *   feed        → every 6 hours
 *   partner     → every 3 hours
 */
const BY_TYPE = {
  ats: "0 * * * *",        // top of every hour
  aggregator: "0 */3 * * *",
  feed: "0 */6 * * *",
  partner: "0 */3 * * *",
};

const BY_ADAPTER = {
  // Workable exposes an updated_at cursor → a bit more frequent is fine.
  workable: "0 */2 * * *",
};

/**
 * @param {{ adapter?: string, type?: string, schedule?: string }} source
 * @returns {string} an explicit schedule, or a cron string, or "" for "every tick"
 */
export function effectiveSchedule(source = {}) {
  if (source.schedule && String(source.schedule).trim()) return String(source.schedule).trim();
  if (source.adapter === "internal" || source.type === "internal") return ""; // every tick
  return BY_ADAPTER[source.adapter] || BY_TYPE[source.type] || "0 */3 * * *";
}
