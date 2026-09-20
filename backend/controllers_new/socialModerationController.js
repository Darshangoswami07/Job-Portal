import { SocialReport } from "../models_new/SocialReport.js";
import { SocialPost } from "../models_new/SocialPost.js";
import { SocialComment } from "../models_new/SocialComment.js";
import { SocialMute } from "../models_new/SocialMute.js";
import { User } from "../models/user.model.js";

export const report = async (req, res) => {
  try {
    const userId = req.id;
    const { targetType, targetId, reason, details = "" } = req.body;
    if (!["post", "comment", "user"].includes(targetType)) {
      return res.status(400).json({ success: false, message: "Invalid target type." });
    }
    if (!reason || String(reason).trim().length < 3) {
      return res.status(400).json({ success: false, message: "A reason is required." });
    }

    if (targetType === "post") {
      const post = await SocialPost.findById(targetId);
      if (!post) return res.status(404).json({ success: false, message: "Post not found." });
      if (String(post.author) === String(userId)) {
        return res.status(400).json({ success: false, message: "You cannot report your own post." });
      }
    } else if (targetType === "comment") {
      const comment = await SocialComment.findById(targetId);
      if (!comment) return res.status(404).json({ success: false, message: "Comment not found." });
    } else {
      const targetUser = await User.findById(targetId);
      if (!targetUser) return res.status(404).json({ success: false, message: "User not found." });
    }

    await SocialReport.create({
      reporter: userId,
      targetType,
      targetId,
      reason: String(reason).slice(0, 200),
      details: String(details).slice(0, 2000),
    });

    return res.status(201).json({ success: true, message: "Report submitted. Our team will review it." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const canModerate = async (req, res, next) => {
  try {
    const user = await User.findById(req.id).select("currentRole roles").lean();
    const isRecruiter = user?.currentRole === "recruiter" || user?.roles?.recruiter === true;
    if (!isRecruiter) {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const { status = "open", page = 1, limit = 15 } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const filter = { status };
    const [reports, total] = await Promise.all([
      SocialReport.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(50, Number(limit)))
        .populate({ path: "reporter", select: "fullname profile.profilePhoto" })
        .lean(),
      SocialReport.countDocuments(filter),
    ]);
    return res.json({ success: true, reports, total, pages: Math.ceil(total / Math.max(1, Number(limit))) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action = "" } = req.body;
    const report = await SocialReport.findById(id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found." });

    report.status = ["reviewed", "resolved", "dismissed"].includes(status) ? status : "reviewed";
    report.action = String(action || "").slice(0, 500);
    report.handledBy = req.id;
    report.handledAt = new Date();
    await report.save();

    if (report.status === "resolved" && report.targetType === "post") {
      await SocialPost.updateOne({ _id: report.targetId }, { status: "hidden", "moderation.flagReason": action || "Actioned by moderator" });
    }
    if (report.status === "resolved" && report.targetType === "comment") {
      await SocialComment.updateOne({ _id: report.targetId }, { status: "hidden" });
    }

    return res.json({ success: true, report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getModerationQueue = async (req, res) => {
  try {
    const { page = 1, limit = 15, flag } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const filter = { status: { $in: ["active", "hidden"] } };
    if (flag === "flagged") filter["moderation.flaggedBySystem"] = true;
    const [posts, total] = await Promise.all([
      SocialPost.find(filter)
        .sort({ "moderation.flaggedBySystem": -1, createdAt: -1 })
        .skip(skip)
        .limit(Math.min(50, Number(limit)))
        .populate({ path: "author", select: "fullname email profile.profilePhoto" })
        .lean(),
      SocialPost.countDocuments(filter),
    ]);
    return res.json({ success: true, posts, total, pages: Math.ceil(total / Math.max(1, Number(limit))) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const moderatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason = "" } = req.body;
    if (!["active", "hidden"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }
    const post = await SocialPost.findById(id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found." });
    post.status = status;
    post.moderation.flagReason = reason;
    post.moderation.reviewed = true;
    await post.save();
    return res.json({ success: true, message: status === "active" ? "Post restored." : "Post hidden.", status: post.status });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { blocked } = req.body;
    if (String(userId) === String(req.id)) {
      return res.status(400).json({ success: false, message: "You cannot block yourself." });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    let blockedIds = user?.profile?.blocked?.map(String) || [];
    if (blocked) {
      if (!blockedIds.includes(String(req.id))) {
        blockedIds.push(String(req.id));
        await User.updateOne({ _id: userId }, { $set: { "profile.blocked": blockedIds } });
      }
    } else {
      blockedIds = blockedIds.filter((b) => b !== String(req.id));
      await User.updateOne({ _id: userId }, { $set: { "profile.blocked": blockedIds } });
    }
    return res.json({ success: true, blocked: Boolean(blocked) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminAnalytics = async (req, res) => {
  try {
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [totalPosts, totalComments, totalUsers, totalReactions, reportsOpen, posts30, comments30] = await Promise.all([
      SocialPost.countDocuments({ status: { $ne: "deleted" } }),
      SocialComment.countDocuments({ status: "active" }),
      User.countDocuments({}),
      SocialPost.aggregate([
        { $group: { _id: null, total: { $sum: { $add: [
          "$reactionCounts.like", "$reactionCounts.love", "$reactionCounts.celebrate",
          "$reactionCounts.insightful", "$reactionCounts.support", "$reactionCounts.funny",
          "$reactionCounts.applause",
        ] } } } },
      ]),
      SocialReport.countDocuments({ status: "open" }),
      SocialPost.countDocuments({ createdAt: { $gte: fromDate, $lte: toDate } }),
      SocialComment.countDocuments({ createdAt: { $gte: fromDate, $lte: toDate } }),
    ]);

    const postsByDay = await SocialPost.aggregate([
      { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return res.json({
      success: true,
      stats: {
        totalPosts,
        totalComments,
        totalUsers,
        totalReactions: postsReactions(reactions),
        reportsOpen,
        posts30,
        comments30,
        postsByDay,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

function postsReactions(reactions) {
  return reactions?.[0]?.total || 0;
}