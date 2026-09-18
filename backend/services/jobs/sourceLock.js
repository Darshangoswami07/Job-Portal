import crypto from "crypto";

import { JobSource } from "../../models_new/JobSource.js";

/**
 * MongoDB advisory lock scoped to one JobSource (PLAN.md §20).
 *
 * Acquisition is a single atomic `findOneAndUpdate`: it succeeds only when the
 * source is currently unlocked OR the previous holder's lease has expired
 * (crash recovery). No extra collection, no Redis.
 */
const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function newLockHolderId() {
  return `${process.pid}-${crypto.randomBytes(6).toString("hex")}`;
}

/**
 * @returns {Promise<{ acquired: boolean, holder: string, source: object|null }>}
 */
export async function acquireSourceLock(sourceId, { holder = newLockHolderId(), ttlMs = DEFAULT_TTL_MS } = {}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  const source = await JobSource.findOneAndUpdate(
    {
      _id: sourceId,
      $or: [
        { "lock.active": { $ne: true } },
        { "lock.expiresAt": { $lt: now } },
        { "lock.expiresAt": { $exists: false } },
      ],
    },
    {
      $set: {
        lock: { active: true, holder, acquiredAt: now, expiresAt },
      },
    },
    { new: true }
  );

  return { acquired: Boolean(source), holder, source: source || null };
}

/** Release only if we still hold it (holder match). Safe to call twice. */
export async function releaseSourceLock(sourceId, holder) {
  await JobSource.updateOne(
    { _id: sourceId, "lock.holder": holder },
    { $set: { "lock.active": false } }
  );
}
