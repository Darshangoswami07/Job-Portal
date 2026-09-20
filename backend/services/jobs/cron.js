/**
 * Tiny 5-field cron matcher — no dependency.
 *
 * Per field, supports: star, "star slash n" steps, "a-b" ranges, "a,b,c" lists,
 * and "a-b slash n". Fields:
 *   minute (0-59)  hour (0-23)  day-of-month (1-31)  month (1-12)  day-of-week (0-6, 0=Sun)
 *
 * An empty / falsy expression means "every tick" (used for the internal source).
 */

function parseField(field, min, max) {
  const allowed = new Set();
  for (const part of String(field).split(",")) {
    const [range, stepRaw] = part.split("/");
    const step = stepRaw ? parseInt(stepRaw, 10) : 1;
    if (!Number.isInteger(step) || step < 1) throw new Error(`bad cron step: ${part}`);

    let lo = min;
    let hi = max;
    if (range !== "*" && range !== "") {
      const [a, b] = range.split("-");
      lo = parseInt(a, 10);
      hi = b !== undefined ? parseInt(b, 10) : lo;
      if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo < min || hi > max || lo > hi) {
        throw new Error(`bad cron range: ${part}`);
      }
    }
    for (let v = lo; v <= hi; v += step) allowed.add(v);
  }
  return allowed;
}

export function parseCron(expr) {
  const parts = String(expr).trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`cron expression must have 5 fields: "${expr}"`);
  return {
    minute: parseField(parts[0], 0, 59),
    hour: parseField(parts[1], 0, 23),
    dom: parseField(parts[2], 1, 31),
    month: parseField(parts[3], 1, 12),
    dow: parseField(parts[4], 0, 6),
  };
}

/** Does `expr` fire at minute-granularity for `date` (default: now, UTC)? */
export function cronMatches(expr, date = new Date()) {
  if (!expr) return true;
  let c;
  try {
    c = parseCron(expr);
  } catch {
    return false;
  }
  const dow = date.getUTCDay();
  return (
    c.minute.has(date.getUTCMinutes()) &&
    c.hour.has(date.getUTCHours()) &&
    c.month.has(date.getUTCMonth() + 1) &&
    c.dom.has(date.getUTCDate()) &&
    c.dow.has(dow)
  );
}

/**
 * Is a source due to run? True when its cron matches the current minute AND it
 * has not already run inside this same minute (guards against a tick firing
 * twice within 60s).
 */
export function cronDue(expr, lastRunAt, now = new Date()) {
  if (!cronMatches(expr, now)) return false;
  if (!lastRunAt) return true;
  const last = new Date(lastRunAt);
  return (
    now.getUTCFullYear() !== last.getUTCFullYear() ||
    now.getUTCMonth() !== last.getUTCMonth() ||
    now.getUTCDate() !== last.getUTCDate() ||
    now.getUTCHours() !== last.getUTCHours() ||
    now.getUTCMinutes() !== last.getUTCMinutes()
  );
}

/**
 * The next minute (strictly after `after`) at which `expr` fires. Scans at most
 * `maxHours` forward (default 48h) so an impossible schedule cannot loop
 * unbounded. Returns `null` for an empty expression ("every tick") or when
 * nothing is found in the window.
 */
export function nextCronFireAfter(expr, after = new Date(), maxHours = 48) {
  if (!expr || !String(expr).trim()) return null;
  const t = new Date(Math.floor(after.getTime() / 60000) * 60000 + 60000);
  for (let i = 0; i < maxHours * 60; i += 1) {
    if (cronMatches(expr, t)) return new Date(t);
    t.setUTCMinutes(t.getUTCMinutes() + 1);
  }
  return null;
}
