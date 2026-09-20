/**
 * Client analytics beacon (PLAN.md Phase 10 §10.4). ONLY the two events the
 * client alone can observe — recommendation impressions and clicks. Everything
 * else is recorded server-side at the real action. Optional auth, heavily
 * bounded, never fails the caller.
 */
import mongoose from "mongoose";

import { recordEvent } from "../services/analytics/events.js";

const CLIENT_EVENTS = new Set(["recommendation_impression", "recommendation_clicked", "recommendation_refreshed"]);

export const postClientEvent = (req, res) => {
  try {
    const { type, groupId, meta } = req.body || {};
    if (!CLIENT_EVENTS.has(type)) {
      return res.status(400).json({ success: false, message: "Unsupported event" });
    }
    // groupId (a JobGroup _id) is NOT stored; we never trust a client hash.
    // We only keep a bounded, sanitized meta + the count.
    recordEvent(type, {
      userId: req.id || undefined,
      groupKey: "",
      meta: {
        ...(mongoose.isValidObjectId(groupId) ? { hasGroup: true } : {}),
        position: Number(meta?.position),
        strategy: typeof meta?.strategy === "string" ? meta.strategy : undefined,
      },
    });
    return res.status(202).json({ success: true });
  } catch {
    return res.status(202).json({ success: true }); // never fail a beacon
  }
};
