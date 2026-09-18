import mongoose from "mongoose";
import { SocialPost } from "../models_new/SocialPost.js";
import { SocialComment } from "../models_new/SocialComment.js";
import { SocialReaction } from "../models_new/SocialReaction.js";
import { SocialFollow } from "../models_new/SocialFollow.js";
import { SocialConnection } from "../models_new/SocialConnection.js";
import { SocialBookmark } from "../models_new/SocialBookmark.js";
import { SocialShare } from "../models_new/SocialShare.js";
import { SocialHashtag } from "../models_new/SocialHashtag.js";
import { SocialView } from "../models_new/SocialView.js";
import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import cloudinary from "../config/cloudinary.js";
import getDataUri from "../utils/datauri.js";
import {
  extractHashtags,
  extractMentions,
  upsertHashtags,
  decrementHashtags,
  createNotification,
  detectSpam,
  stripHtml,
  getMentionedUserIds,
} from "../services/socialService.js";
import { emitToSocialUser } from "../services/socialSocket.js";

const AUTHOR_SELECT = "fullname email currentRole profile.profilePhoto profile.headline profile.companyName profile.verificationStatus roles profile.portfolio profile.github profile.linkedin profile.company";

// Populate a SocialPost's author AND that author's linked Company in one hop.
// NOTE: `profile.company` lives on the User schema, so the company populate must
// be NESTED inside the author populate — never chained onto the SocialPost query
// (that path does not exist on SocialPost and throws under strictPopulate).
const AUTHOR_POPULATE = {
  path: "author",
  select: AUTHOR_SELECT,
  populate: { path: "profile.company", select: "name logo location", strictPopulate: false },
};
// Kept for User-level queries (e.g. createPost), where the path is valid.
const COMPANY_POPULATE = { path: "profile.company", select: "name logo location" };

export const PUBLIC_TYPES = [
  "text", "article", "image", "video", "document", "project", "hiring",
  "openToWork", "promotion", "certificate", "hackathon", "internship",
  "referral", "poll", "achievement", "interview", "advice", "portfolio", "github",
];

export const postSerializer = (post) => {
  const obj = post?.toObject ? post.toObject() : post;
  if (!obj) return null;
  obj.authorFullname = obj.author?.fullname || "JobPilot User";
  obj.authorPhoto = obj.author?.profile?.profilePhoto || "";
  obj.authorHeadline = obj.author?.profile?.headline || "";
  obj.authorCompany = obj.author?.profile?.companyName || obj.author?.profile?.company?.name || "";
  obj.authorRole = obj.author?.currentRole || "";
  obj.authorVerified = obj.author?.profile?.verificationStatus === "verified";
  obj.id = String(obj._id);
  return obj;
};

async function canViewPost(post, userId, viewer) {
  if (!post || String(post.author._id || post.author) === String(userId)) return true;
  if (post.status !== "active") return false;
  const visibility = post.visibility || "public";
  if (visibility === "public") return true;
  if (visibility === "onlyMe") return false;

  const viewerRole = viewer?.currentRole || "jobSeeker";

  if (visibility === "recruitersOnly") return viewerRole === "recruiter";
  if (visibility === "jobSeekersOnly") return viewerRole === "jobSeeker";

  const targetId = String(post.author._id || post.author);
  if (visibility === "connections") {
    const conn = await SocialConnection.findOne({
      $or: [
        { requester: userId, recipient: targetId },
        { requester: targetId, recipient: userId },
      ],
      status: "accepted",
    });
    return Boolean(conn);
  }
  if (visibility === "followers") {
    const follow = await SocialFollow.findOne({ follower: userId, following: targetId });
    return Boolean(follow);
  }
  return true;
}

async function getViewerContext(userId) {
  const [following, connections] = await Promise.all([
    SocialFollow.find({ follower: userId }).select("following").lean(),
    SocialConnection.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: "accepted",
    }).lean(),
  ]);
  return {
    followingIds: new Set(following.map((f) => String(f.following))),
    connectionIds: new Set(
      connections.map((c) => (String(c.requester) === String(userId) ? c.recipient : c.requester))
    ),
  };
}

async function buildFeedQuery(userId, ctx) {
  const context = ctx || (await getViewerContext(userId));
  const ids = [...context.followingIds, ...context.connectionIds, String(userId)];
  return {
    status: "active",
    $or: [{ visibility: "public" }, { author: { $in: ids } }],
  };
}

/** Sum every reaction bucket on a post document. */
function sumReactions(reactionCounts = {}) {
  return ["like", "love", "celebrate", "insightful", "support", "funny", "applause"]
    .reduce((n, k) => n + (Number(reactionCounts?.[k]) || 0), 0);
}

/** Recent-engagement score used by the Trending / For You tabs. */
function engagementScore(post) {
  const reactions = sumReactions(post.reactionCounts);
  const base = reactions + 2 * (post.commentCount || 0) + 1.5 * (post.shareCount || 0) + 0.1 * (post.viewCount || 0);
  const ageHours = Math.max(1, (Date.now() - new Date(post.createdAt).getTime()) / 3600000);
  // Gravity decay so a burst of fresh engagement outranks an old popular post.
  return base / Math.pow(ageHours + 2, 1.2);
}

export const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, hashtag, author } = req.query;
    // A single-topic filter from the Feed topic bar (alias of `hashtag`).
    const topic = req.query.topic ? String(req.query.topic).toLowerCase().replace(/^#/, "") : "";
    const tab = ["forYou", "following", "latest", "trending"].includes(req.query.tab)
      ? req.query.tab
      : "forYou";
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(30, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const userId = req.id;
    const [viewer, ctx] = await Promise.all([
      User.findById(userId).lean(),
      getViewerContext(userId),
    ]);
    const networkIds = [...ctx.followingIds, ...ctx.connectionIds];

    let filter;
    if (tab === "following") {
      // Strictly posts authored by people/companies the viewer follows or is connected to.
      filter = { status: "active", author: { $in: networkIds.length ? networkIds : [null] } };
    } else {
      filter = await buildFeedQuery(userId, ctx);
    }
    if (type && PUBLIC_TYPES.includes(type)) filter.type = type;
    const tagFilter = topic || (hashtag ? String(hashtag).toLowerCase() : "");
    if (tagFilter) filter.hashtags = { $in: [tagFilter] };
    if (author) filter.author = author;

    // Trending: rank a bounded recent candidate window by engagement score. No
    // deep pagination — the tab is a snapshot of what's hot right now.
    if (tab === "trending") {
      filter.createdAt = { $gte: new Date(Date.now() - 14 * 86400000) };
      const candidates = await SocialPost.find(filter)
        .sort({ createdAt: -1 })
        .limit(80)
        .populate(AUTHOR_POPULATE)
        .lean();

      const visibleT = [];
      for (const post of candidates) {
        if (await canViewPost(post, userId, viewer)) visibleT.push(post);
      }
      visibleT.sort((a, b) => engagementScore(b) - engagementScore(a));
      const ranked = visibleT.slice(0, 30);

      const idsT = ranked.map((p) => p._id);
      const [reactionsT, bookmarksT] = await Promise.all([
        idsT.length ? SocialReaction.find({ user: userId, target: { $in: idsT }, targetType: "post" }).select("target type").lean() : [],
        idsT.length ? SocialBookmark.find({ user: userId, post: { $in: idsT } }).select("post").lean() : [],
      ]);
      const rMap = new Map(reactionsT.map((r) => [String(r.target), r.type]));
      const bSet = new Set(bookmarksT.map((b) => String(b.post)));
      return res.json({
        success: true,
        posts: ranked.map((p) => {
          const s = postSerializer(p);
          s.myReaction = rMap.get(String(p._id)) || null;
          s.isBookmarked = bSet.has(String(p._id));
          return s;
        }),
        page: 1,
        pages: 1,
        total: ranked.length,
        hasMore: false,
      });
    }

    const sort =
      tab === "latest"
        ? { createdAt: -1 }
        : tab === "following"
          ? { pinned: -1, createdAt: -1 }
          : { pinned: -1, createdAt: -1 }; // forYou

    const [posts, total] = await Promise.all([
      SocialPost.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate(AUTHOR_POPULATE)
        .lean(),
      SocialPost.countDocuments(filter),
    ]);

    const visible = [];
    for (const post of posts) {
      if (await canViewPost(post, userId, viewer)) visible.push(post);
    }

    const postIds = visible.map((p) => p._id);
    const [reactions, bookmarks] = await Promise.all([
      postIds.length
        ? SocialReaction.find({ user: userId, target: { $in: postIds }, targetType: "post" }).select("target type").lean()
        : [],
      postIds.length
        ? SocialBookmark.find({ user: userId, post: { $in: postIds } }).select("post").lean()
        : [],
    ]);
    const reactedMap = new Map(reactions.map((r) => [String(r.target), r.type]));
    const bookmarkedSet = new Set(bookmarks.map((b) => String(b.post)));

    const data = visible.map((p) => {
      const serialized = postSerializer(p);
      serialized.myReaction = reactedMap.get(String(p._id)) || null;
      serialized.isBookmarked = bookmarkedSet.has(String(p._id));
      return serialized;
    });

    return res.json({
      success: true,
      posts: data,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
      hasMore: skip + data.length < total,
    });
  } catch (error) {
    console.error("Error in getFeed:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPost = async (req, res) => {
  try {
    const viewer = await User.findById(req.id).lean();
    const post = await SocialPost.findById(req.params.id)
      .populate(AUTHOR_POPULATE)
      .lean();

    if (!post || !(await canViewPost(post, req.id, viewer))) {
      return res.status(404).json({ success: false, message: "Post not found or not visible." });
    }

    const [reaction, bookmark] = await Promise.all([
      SocialReaction.findOne({ user: req.id, target: post._id, targetType: "post" }).select("type").lean(),
      SocialBookmark.findOne({ user: req.id, post: post._id }).select("collection").lean(),
    ]);

    const data = postSerializer(post);
    data.myReaction = reaction?.type || null;
    data.isBookmarked = Boolean(bookmark);
    data.collection = bookmark?.collection || "";

    return res.json({ success: true, post: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const userId = req.id;
    const body = req.body;

    const rawContent = String(body.content || "").trim();
    const contentText = stripHtml(rawContent);

    let type = body.type || "text";
    if (!PUBLIC_TYPES.includes(type)) type = "text";

    const media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileUri = getDataUri(file);
        const isImage = file.mimetype.startsWith("image/");
        const isVideo = file.mimetype.startsWith("video/");
        const resourceType = isImage ? "image" : isVideo ? "video" : "raw";
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
          resource_type: resourceType,
          folder: "social/posts",
          ...(isImage ? { quality: "auto", fetch_format: "auto" } : {}),
        });
        media.push({
          type: isImage ? "image" : isVideo ? "video" : "document",
          url: cloudResponse.secure_url,
          publicId: cloudResponse.public_id,
          name: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          thumb: isImage ? cloudResponse.secure_url : cloudResponse.secure_url,
        });
      }
    }

    if (media.some((m) => m.type === "image") && type === "text") type = "image";
    if (media.length > 0 && type === "text") type = media[0].type === "video" ? "video" : "image";

    const hashtags = extractHashtags(contentText);
    const mentionUsernames = extractMentions(contentText);
    const mentionIds = await getMentionedUserIds(mentionUsernames);

    const spam = detectSpam(contentText);

    const poll = {};
    let isPoll = false;
    if (type === "poll" || body.poll) {
      const options = Array.isArray(body.pollOptions)
        ? body.pollOptions.map((o) => ({ text: String(o || "").trim() })).filter((o) => o.text)
        : [];
      if (options.length >= 2) {
        isPoll = true;
        poll.question = body.pollQuestion || contentText.slice(0, 200) || "Poll";
        poll.options = options;
        poll.endsAt = body.pollEndsAt ? new Date(body.pollEndsAt) : null;
        poll.totalVotes = 0;
      }
    }

    const hiring = {};
    if (type === "hiring" || body.hiring) {
      hiring.title = body.hiringTitle || contentText.slice(0, 120) || "";
      hiring.companyName = body.hiringCompany || "";
      hiring.location = body.hiringLocation || "";
      hiring.employmentType = body.hiringType || "";
      hiring.salary = body.hiringSalary || "";
      hiring.applyLink = body.hiringApplyLink || "";
      hiring.isRemote = body.hiringRemote === "true" || body.hiringRemote === true;
    }

    const project = {};
    if (["project", "portfolio", "github"].includes(type) || body.project) {
      project.name = body.projectName || "";
      project.description = body.projectDescription || "";
      project.url = body.projectUrl || "";
      project.github = body.projectGithub || "";
      project.demo = body.projectDemo || "";
      project.techStack = Array.isArray(body.techStack)
        ? body.techStack.filter(Boolean)
        : String(body.techStack || "").split(",").map((s) => s.trim()).filter(Boolean);
      project.status = body.projectStatus || "";
    }

    const certificate = {};
    if (type === "certificate" || body.certificate) {
      certificate.name = body.certName || "";
      certificate.issuer = body.certIssuer || "";
      certificate.issueDate = body.certDate ? new Date(body.certDate) : null;
      certificate.credentialId = body.certCredentialId || "";
      certificate.credentialUrl = body.certCredentialUrl || "";
      if (media[0]) {
        certificate.fileUrl = media[0].url;
        certificate.publicId = media[0].publicId;
      }
    }

    const achievement = {};
    if (["achievement", "hackathon", "promotion", "internship", "referral", "openToWork"].includes(type) || body.achievement) {
      achievement.title = body.achievementTitle || "";
      achievement.category = body.achievementCategory || "other";
      achievement.description = body.achievementDescription || "";
    }

    const article = {};
    if (type === "article" && body.articleTitle) {
      article.title = body.articleTitle;
      article.coverUrl = body.articleCover || media[0]?.url || "";
      const words = contentText.split(/\s+/).length;
      article.readingTime = Math.max(1, Math.round(words / 200));
    }

    const link = {};
    if (body.linkUrl) {
      link.url = body.linkUrl;
      link.title = body.linkTitle || "";
      link.description = body.linkDescription || "";
      link.image = body.linkImage || "";
      link.domain = new URL(body.linkUrl).hostname.replace("www.", "");
    }

    const newPost = await SocialPost.create({
      author: userId,
      type,
      content: rawContent,
      contentText,
      media,
      visibility: body.visibility || "public",
      hashtags,
      mentions: mentionIds,
      hiring,
      project,
      certificate,
      achievement,
      article,
      link,
      poll: isPoll ? poll : {},
      isPoll,
      tags: Array.isArray(body.tags) ? body.tags.filter(Boolean).slice(0, 10) : [],
      moderation: {
        reviewed: !spam.isSpam,
        flaggedBySystem: spam.isSpam,
        flagReason: spam.reason,
      },
    });

    if (hashtags.length) await upsertHashtags(hashtags);

    const author = await User.findById(userId).select(AUTHOR_SELECT).populate(COMPANY_POPULATE).lean();
    const data = postSerializer({ ...newPost.toObject(), author });
    data.myReaction = null;
    data.isBookmarked = false;

    if (spam.isSpam) {
      createNotification({
        user: userId,
        type: "system",
        title: "Post flagged for review",
        message: "Our moderation system flagged your post. It is pending review.",
      });
    }

    return res.status(201).json({ success: true, post: data, moderation: spam.isSpam ? "flagged" : "ok" });
  } catch (error) {
    console.error("Error in createPost:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });
    if (String(post.author) !== String(req.id)) {
      return res.status(403).json({ success: false, message: "You can only edit your own posts." });
    }

    const body = req.body;
    const rawContent = String(body.content ?? post.content).trim();
    const contentText = stripHtml(rawContent);
    const oldTags = post.hashtags || [];
    const newTags = extractHashtags(contentText);
    const mentionUsernames = extractMentions(contentText);
    const mentionIds = await getMentionedUserIds(mentionUsernames);

    post.content = rawContent;
    post.contentText = contentText;
    post.hashtags = newTags;
    post.mentions = mentionIds;
    post.edited = true;
    if (body.visibility) post.visibility = body.visibility;
    if (body.pollQuestion && post.poll) post.poll.question = body.pollQuestion;

    await post.save();

    if (oldTags.join(",") !== newTags.join(",")) {
      await decrementHashtags(oldTags.filter((t) => !newTags.includes(t)));
      await upsertHashtags(newTags.filter((t) => !oldTags.includes(t)));
    }

    const full = await SocialPost.findById(post._id)
      .populate(AUTHOR_POPULATE)
      .lean();
    return res.json({ success: true, post: postSerializer(full) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });
    if (String(post.author) !== String(req.id)) {
      return res.status(403).json({ success: false, message: "You can only delete your own posts." });
    }
    post.status = "deleted";
    post.deletedAt = new Date();
    await post.save();
    if (post.hashtags?.length) await decrementHashtags(post.hashtags);
    return res.json({ success: true, message: "Post deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const togglePin = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });
    if (String(post.author) !== String(req.id)) {
      return res.status(403).json({ success: false, message: "You can only pin your own posts." });
    }
    post.pinned = !post.pinned;
    await post.save();
    return res.json({ success: true, pinned: post.pinned });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const registerView = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id).select("author viewCount");
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });

    const viewerIp = req.ip || "";
    let counted = false;
    if (String(post.author) !== String(req.id)) {
      const existing = await SocialView.findOne({
        post: post._id,
        ...(req.id ? { user: req.id } : { viewerIp: viewerIp || "anon" }),
      });
      if (!existing) {
        await SocialView.create({ post: post._id, user: req.id || null, viewerIp: viewerIp || "anon" });
        await SocialPost.updateOne({ _id: post._id }, { $inc: { viewCount: 1 } });
        counted = true;
      }
    }
    return res.json({ success: true, counted, viewCount: post.viewCount + (counted ? 1 : 0) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const targetUser = req.params.userId;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

    const viewer = await User.findById(req.id).lean();
    const posts = await SocialPost.find({ author: targetUser, status: "active" })
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(Math.min(30, Number(limit)))
      .populate(AUTHOR_POPULATE)
      .lean();

    const visible = [];
    for (const p of posts) {
      if (await canViewPost(p, req.id, viewer)) visible.push(p);
    }

    const [reactions, bookmarks] = await Promise.all([
      visible.length ? SocialReaction.find({ user: req.id, target: { $in: visible.map((p) => p._id) }, targetType: "post" }).select("target type").lean() : [],
      visible.length ? SocialBookmark.find({ user: req.id, post: { $in: visible.map((p) => p._id) } }).select("post").lean() : [],
    ]);
    const reactedMap = new Map(reactions.map((r) => [String(r.target), r.type]));
    const bookmarkedSet = new Set(bookmarks.map((b) => String(b.post)));

    return res.json({
      success: true,
      posts: visible.map((p) => {
        const s = postSerializer(p);
        s.myReaction = reactedMap.get(String(p._id)) || null;
        s.isBookmarked = bookmarkedSet.has(String(p._id));
        return s;
      }),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.id;
    const collection = String(req.body.collection || "Saved Posts").trim() || "Saved Posts";

    const existing = await SocialBookmark.findOne({ user: userId, post: id });
    let saved;
    if (existing) {
      await existing.deleteOne();
      await SocialPost.updateOne({ _id: id }, { $inc: { bookmarkCount: -1 } });
      saved = false;
    } else {
      await SocialBookmark.create({ user: userId, post: id, collection });
      await SocialPost.updateOne({ _id: id }, { $inc: { bookmarkCount: 1 } });
      saved = true;
    }

    const bookmarkCount = await SocialBookmark.countDocuments({ post: id });
    return res.json({ success: true, saved, bookmarkCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookmarks = async (req, res) => {
  try {
    const { page = 1, limit = 12, collection } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const filter = { user: req.id };
    if (collection) filter.collection = collection;

    const [bookmarks, total] = await Promise.all([
      SocialBookmark.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(30, Number(limit)))
        .populate({ path: "post", populate: { path: "author", select: AUTHOR_SELECT } })
        .lean(),
      SocialBookmark.countDocuments(filter),
    ]);

    const postIds = bookmarks.map((b) => b.post?._id).filter(Boolean);
    const reactions = postIds.length
      ? await SocialReaction.find({ user: req.id, target: { $in: postIds }, targetType: "post" }).select("target type").lean()
      : [];
    const reactedMap = new Map(reactions.map((r) => [String(r.target), r.type]));

    const collections = await SocialBookmark.distinct("collection", { user: req.id });

    return res.json({
      success: true,
      bookmarks: bookmarks.map((b) => {
        const s = postSerializer(b.post);
        if (s) {
          s.myReaction = reactedMap.get(String(b.post._id)) || null;
          s.isBookmarked = true;
          s.collection = b.collection;
        }
        return s;
      }).filter(Boolean),
      collections,
      total,
      pages: Math.ceil(total / Math.max(1, Number(limit))),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.id;
    const { platform = "feed", recipientId, message = "" } = req.body;

    const post = await SocialPost.findById(id);
    if (!post || post.status !== "active") {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const platformOptions = ["feed", "connection", "chat", "copy", "email", "whatsapp", "linkedin", "twitter"];
    const safePlatform = platformOptions.includes(platform) ? platform : "feed";

    await SocialShare.create({
      user: userId,
      post: id,
      platform: safePlatform,
      recipient: recipientId || null,
      message: String(message || "").slice(0, 1000),
    });
    await SocialPost.updateOne({ _id: id }, { $inc: { shareCount: 1 } });

    if (recipientId && String(recipientId) !== String(userId)) {
      const actor = await User.findById(userId).select("fullname profile.profilePhoto").lean();
      createNotification({
        user: recipientId,
        type: "system",
        title: `${actor?.fullname || "Someone"} shared a post with you`,
        message: post.contentText?.slice(0, 90) || "View the shared post",
        link: `/feed/${id}`,
      });
      emitToSocialUser(String(recipientId), "social:new_post", { postId: String(id) });
    }

    const shareCount = await SocialShare.countDocuments({ post: id });
    return res.json({ success: true, shareCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const votePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.id;
    const { optionId } = req.body;

    const post = await SocialPost.findById(id);
    if (!post || !post.isPoll || !post.poll?.options?.length) {
      return res.status(400).json({ success: false, message: "This post does not have an active poll." });
    }
    if (post.poll.endsAt && new Date(post.poll.endsAt) < new Date()) {
      return res.status(400).json({ success: false, message: "This poll has ended." });
    }

    const alreadyVoted = post.poll.options.some((o) => (o.voters || []).some((v) => String(v) === String(userId)));
    if (alreadyVoted) {
      return res.status(400).json({ success: false, message: "You have already voted." });
    }

    const option = post.poll.options.id(optionId);
    if (!option) {
      return res.status(400).json({ success: false, message: "Poll option not found." });
    }

    option.votes = (option.votes || 0) + 1;
    option.voters = [...(option.voters || []), userId];
    post.poll.totalVotes = (post.poll.totalVotes || 0) + 1;
    await post.save();

    const author = await User.findById(post.author).select("fullname profile.profilePhoto").lean();
    if (String(post.author) !== String(userId)) {
      createNotification({
        user: post.author,
        type: "system",
        title: `${author?.fullname || "Someone"} voted on your poll`,
        message: post.poll.question?.slice(0, 90) || "View poll results",
        link: `/feed/${id}`,
      });
    }

    return res.json({
      success: true,
      poll: {
        question: post.poll.question,
        options: post.poll.options,
        totalVotes: post.poll.totalVotes,
        endsAt: post.poll.endsAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const targetId = req.params.userId;
    const profile = await User.findById(targetId)
      .populate({ path: "profile.company", select: "name logo location industry" })
      .lean();
    if (!profile) return res.status(404).json({ success: false, message: "User not found." });

    const [followerCount, followingCount, connectionCount, postCount, connections] = await Promise.all([
      SocialFollow.countDocuments({ following: targetId }),
      SocialFollow.countDocuments({ follower: targetId }),
      SocialConnection.countDocuments({ status: "accepted", $or: [{ requester: targetId }, { recipient: targetId }] }),
      SocialPost.countDocuments({ author: targetId, status: "active" }),
      SocialConnection.find({ status: "accepted", $or: [{ requester: targetId }, { recipient: targetId }] })
        .limit(6)
        .populate({ path: "requester", select: "fullname profile.profilePhoto profile.headline" })
        .populate({ path: "recipient", select: "fullname profile.profilePhoto profile.headline" })
        .lean(),
    ]);

    const connectionUsers = connections.map((c) => String(c.requester?._id) === String(targetId) ? c.recipient : c.requester).filter(Boolean);

    return res.json({
      success: true,
      profile: {
        _id: profile._id,
        fullname: profile.fullname,
        email: String(targetId) === String(req.id) ? profile.email : undefined,
        currentRole: profile.currentRole,
        profile: {
          profilePhoto: profile.profile?.profilePhoto || "",
          headline: profile.profile?.headline || "",
          bio: profile.profile?.bio || "",
          companyName: profile.profile?.companyName || profile.profile?.company?.name || "",
          companyLogo: profile.profile?.companyLogo || profile.profile?.company?.logo || "",
          location: profile.profile?.location || "",
          skills: profile.profile?.skills || [],
          experience: profile.profile?.experience || [],
          education: profile.profile?.education || [],
          certifications: profile.profile?.certifications || [],
          portfolio: profile.profile?.portfolio || "",
          github: profile.profile?.github || "",
          linkedin: profile.profile?.linkedin || "",
          website: profile.profile?.website || "",
          verificationStatus: profile.profile?.verificationStatus || "pending",
        },
        followerCount,
        followingCount,
        connectionCount,
        postCount,
        connectionUsers,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrending = async (req, res) => {
  try {
    const [hashtags, recruiters, jobs, skillAgg, trendingPosts] = await Promise.all([
      SocialHashtag.find().sort({ postCount: -1 }).limit(10).select("name postCount").lean(),
      User.find({ currentRole: "recruiter", profileCompleted: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("fullname profile.profilePhoto profile.headline profile.companyName")
        .lean(),
      Job.aggregate([
        { $match: { status: "active" } },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        { $project: { title: 1, location: 1, jobType: 1, salary: 1, company: 1 } },
      ]).catch(() => []),
      // Most common skills across professionals on the platform.
      User.aggregate([
        { $match: { "profile.skills.0": { $exists: true } } },
        { $unwind: "$profile.skills" },
        { $group: { _id: { $toLower: "$profile.skills" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, name: "$_id", count: 1 } },
      ]).catch(() => []),
      // Trending posts: public posts from the last 10 days, ranked by engagement.
      SocialPost.find({
        status: "active",
        visibility: "public",
        createdAt: { $gte: new Date(Date.now() - 10 * 86400000) },
      })
        .sort({ createdAt: -1 })
        .limit(40)
        .populate({ path: "author", select: AUTHOR_SELECT })
        .lean()
        .catch(() => []),
    ]);

    const rankedPosts = (trendingPosts || [])
      .sort((a, b) => engagementScore(b) - engagementScore(a))
      .slice(0, 5)
      .map((p) => {
        const s = postSerializer(p);
        return {
          id: s.id,
          title: s.article?.title || s.contentText?.slice(0, 80) || "Post",
          authorFullname: s.authorFullname,
          isEditorial: Boolean(s.isEditorial),
          reactions: sumReactions(s.reactionCounts),
          commentCount: s.commentCount || 0,
        };
      });

    return res.json({
      success: true,
      trending: { hashtags, recruiters, jobs, skills: skillAgg || [], posts: rankedPosts },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getHashtagPosts = async (req, res) => {
  try {
    const tag = String(req.params.tag).toLowerCase();
    const { page = 1, limit = 10 } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));

    const viewer = await User.findById(req.id).lean();
    const posts = await SocialPost.find({ hashtags: tag, status: "active" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(30, Number(limit)))
      .populate(AUTHOR_POPULATE)
      .lean();

    const visible = [];
    for (const p of posts) {
      if (await canViewPost(p, req.id, viewer)) visible.push(p);
    }

    const postIds = visible.map((p) => p._id);
    const [reactions, bookmarks] = await Promise.all([
      postIds.length ? SocialReaction.find({ user: req.id, target: { $in: postIds }, targetType: "post" }).select("target type").lean() : [],
      postIds.length ? SocialBookmark.find({ user: req.id, post: { $in: postIds } }).select("post").lean() : [],
    ]);
    const reactedMap = new Map(reactions.map((r) => [String(r.target), r.type]));
    const bookmarkedSet = new Set(bookmarks.map((b) => String(b.post)));

    const total = await SocialPost.countDocuments({ hashtags: tag, status: "active" });
    return res.json({
      success: true,
      hashtag: tag,
      posts: visible.map((p) => {
        const s = postSerializer(p);
        s.myReaction = reactedMap.get(String(p._id)) || null;
        s.isBookmarked = bookmarkedSet.has(String(p._id));
        return s;
      }),
      total,
      pages: Math.ceil(total / Math.max(1, Number(limit))),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const followHashtag = async (req, res) => {
  try {
    const tag = String(req.params.tag).toLowerCase();
    const userId = req.id;
    const hashtag = await SocialHashtag.findOneAndUpdate(
      { name: tag },
      { $setOnInsert: { name: tag } },
      { new: true, upsert: true }
    );
    const has = (hashtag.followers || []).some((f) => String(f) === String(userId));
    let followed;
    if (has) {
      await SocialHashtag.updateOne({ _id: hashtag._id }, { $pull: { followers: userId }, $inc: { followerCount: -1 } });
      followed = false;
    } else {
      await SocialHashtag.updateOne({ _id: hashtag._id }, { $addToSet: { followers: userId }, $inc: { followerCount: 1 } });
      followed = true;
    }
    return res.json({ success: true, followed, followerCount: Math.max(0, hashtag.followerCount + (followed ? 1 : -1)) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};