import { Notification } from "../models_new/Notification.js";
import { SocialHashtag } from "../models_new/SocialHashtag.js";
import { emitToSocialUser } from "./socialSocket.js";

export function extractHashtags(text = "") {
  const matches = text.match(/#([\p{L}\p{N}_]+)/gu) || [];
  const seen = new Set();
  const tags = [];
  for (const raw of matches) {
    const tag = raw.slice(1).toLowerCase();
    if (!seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  }
  return tags.slice(0, 15);
}

export function extractMentions(text = "") {
  const matches = text.match(/@([\p{L}\p{N}_.]+)/gu) || [];
  const seen = new Set();
  const usernames = [];
  for (const raw of matches) {
    const name = raw.slice(1).toLowerCase();
    if (!seen.has(name)) {
      seen.add(name);
      usernames.push(name);
    }
  }
  return usernames.slice(0, 20);
}

export async function upsertHashtags(tags) {
  if (!tags || tags.length === 0) return;
  const ops = tags.map((tag) => ({
    updateOne: {
      filter: { name: tag.toLowerCase() },
      update: {
        $inc: { postCount: 1 },
        $setOnInsert: { name: tag.toLowerCase() },
      },
      upsert: true,
    },
  }));
  await SocialHashtag.bulkWrite(ops);
}

export async function decrementHashtags(tags) {
  if (!tags || tags.length === 0) return;
  await SocialHashtag.updateMany(
    { name: { $in: tags.map((t) => t.toLowerCase()) } },
    { $inc: { postCount: -1 } }
  );
  await SocialHashtag.deleteMany({ postCount: { $lte: 0 } });
}

export async function createNotification({ user, type, title, message = "", link = "", metadata = {} }) {
  if (!user) return null;
  try {
    const notification = await Notification.create({ user, type, title, message, link, metadata });
    emitToSocialUser(String(user), "social:notification", notification);
    return notification;
  } catch (error) {
    console.error("Error creating social notification:", error.message);
    return null;
  }
}

const SPAM_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?(?:make money|earn \$|guaranteed income|forex|bitcoin|airdrop|free gift|win (?:a )?prize|lottery|click here to claim)/i,
  /(\b(cash|prize|winner|claim|urgent)\b[\s\S]{0,120}){3,}/i,
  /\b(buy|sell|cheap|discount|click)\b.*\b(traffic|followers|likes|views|backlinks)\b/i,
];

export function detectSpam(text = "") {
  if (!text || text.trim().length === 0) return { isSpam: false, reason: "" };
  const lower = text.toLowerCase();
  if (/(\w+\s+){1,4}\1{3,}/.test(lower)) {
    return { isSpam: true, reason: "repetitive content" };
  }
  if (lower.match(/(http|https|www\.)/g)?.length > 5) {
    return { isSpam: true, reason: "too many links" };
  }
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(lower)) {
      return { isSpam: true, reason: "spam patterns detected" };
    }
  }
  if (text.length > 10000) {
    return { isSpam: true, reason: "content too long" };
  }
  return { isSpam: false, reason: "" };
}

export function stripHtml(html = "") {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function timeAgoLabel(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export async function getMentionedUserIds(usernames) {
  if (!usernames || usernames.length === 0) return [];
  const regexes = usernames.map((u) => new RegExp(`^${u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"));
  const users = await Promise.all(
    regexes.map(async (re) => {
      const found = await getMentionByRegex(re);
      return found ? found._id : null;
    })
  );
  return users.filter(Boolean);
}

async function getMentionByRegex(re) {
  try {
    const User = (await import("../models/user.model.js")).User;
    return await User.findOne({
      $or: [
        { email: re },
        { fullname: re },
        { "profile.headline": re },
      ],
    }).select("_id fullname email profile.profilePhoto");
  } catch {
    return null;
  }
}