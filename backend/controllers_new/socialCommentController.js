import { SocialComment } from "../models_new/SocialComment.js";
import { SocialPost } from "../models_new/SocialPost.js";
import { SocialReaction } from "../models_new/SocialReaction.js";
import { User } from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";
import getDataUri from "../utils/datauri.js";
import {
  createNotification,
  extractMentions,
  getMentionedUserIds,
  stripHtml,
} from "../services/socialService.js";
import { emitToSocialUser } from "../services/socialSocket.js";

const AUTHOR_SELECT = "fullname currentRole profile.profilePhoto profile.headline profile.companyName profile.verificationStatus";
export const commentSerializer = (c) => {
  const obj = c?.toObject ? c.toObject() : c;
  if (!obj) return null;
  obj.authorFullname = obj.author?.fullname || "JobPilot User";
  obj.authorPhoto = obj.author?.profile?.profilePhoto || "";
  obj.authorRole = obj.author?.currentRole || "";
  obj.authorHeadline = obj.author?.profile?.headline || "";
  obj.id = String(obj._id);
  return obj;
};

export const commentCountByPost = async (postId) => {
  return SocialComment.countDocuments({ post: postId, status: "active" });
};

export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { parent = null, page = 1, limit = 15 } = req.query;

    const filter = { post: postId, status: "active" };
    if (parent) filter.parent = parent;
    else filter.parent = null;

    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const [comments, total] = await Promise.all([
      SocialComment.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(Math.min(30, Number(limit)))
        .populate({ path: "author", select: AUTHOR_SELECT })
        .lean(),
      SocialComment.countDocuments(filter),
    ]);

    const commentIds = comments.map((c) => c._id);
    const [reactions] = await Promise.all([
      commentIds.length
        ? SocialReaction.find({ user: req.id, target: { $in: commentIds }, targetType: "comment" }).select("target type").lean()
        : [],
    ]);
    const reactedMap = new Map(reactions.map((r) => [String(r.target), r.type]));

    return res.json({
      success: true,
      comments: comments.map((c) => {
        const s = commentSerializer(c);
        s.myReaction = reactedMap.get(String(c._id)) || null;
        return s;
      }),
      total,
      pages: Math.ceil(total / Math.max(1, Number(limit))),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const userId = req.id;
    const { postId } = req.params;
    const { content, parent, gif } = req.body;

    const post = await SocialPost.findById(postId);
    if (!post || post.status !== "active") {
      return res.status(404).json({ success: false, message: "Post not found." });
    }
    if (!content && !gif?.url) {
      return res.status(400).json({ success: false, message: "Comment content is required." });
    }

    if (content && content.length > 3000) {
      return res.status(400).json({ success: false, message: "Comment is too long." });
    }

    let parentComment = null;
    if (parent) {
      parentComment = await SocialComment.findById(parent);
      if (!parentComment) {
        return res.status(400).json({ success: false, message: "Parent comment not found." });
      }
    }

    const raw = String(content || "").trim();
    const mentionUsernames = extractMentions(raw);
    const mentionIds = await getMentionedUserIds(mentionUsernames);

    let media = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const fileUri = getDataUri(file);
        const isImage = file.mimetype.startsWith("image/");
        const cloudRes = await cloudinary.uploader.upload(fileUri.content, {
          resource_type: isImage ? "image" : "video",
          folder: "social/comments",
        });
        media.push({
          type: isImage ? "image" : "video",
          url: cloudRes.secure_url,
          publicId: cloudRes.public_id,
          name: file.originalname,
        });
      }
    }

    const newComment = await SocialComment.create({
      post: postId,
      author: userId,
      parent: parentComment?._id || null,
      root: parentComment?.root || parentComment?._id || null,
      content: raw,
      contentText: stripHtml(raw),
      mentions: mentionIds,
      media,
      gif: gif?.url ? { url: gif.url, preview: gif.preview || "" } : undefined,
    });

    await SocialPost.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });
    if (parentComment && String(parentComment._id) !== String(parentComment.root || "")) {
      await SocialComment.updateOne({ _id: parentComment.root || parentComment._id }, { $inc: { replyCount: 1 } });
    } else if (parentComment) {
      await SocialComment.updateOne({ _id: parentComment._id }, { $inc: { replyCount: 1 } });
    }

    const populated = (await SocialComment.findById(newComment._id).populate({ path: "author", select: AUTHOR_SELECT })).toObject();

    if (String(post.author) !== String(userId)) {
      const author = await User.findById(userId).select("fullname profile.profilePhoto").lean();
      createNotification({
        user: post.author,
        type: "system",
        title: `${author?.fullname || "Someone"} commented on your post`,
        message: stripHtml(content)?.slice(0, 90) || "View comment",
        link: `/feed/${postId}`,
      });
      emitToSocialUser(String(post.author), "social:comment", { postId: String(postId), comment: commentSerializer(populated) });
    }

    for (const mentionedId of mentionIds) {
      if (String(mentionedId) !== String(userId)) {
        createNotification({
          user: mentionedId,
          type: "system",
          title: "You were mentioned in a comment",
          message: stripHtml(content)?.slice(0, 90),
          link: `/feed/${postId}`,
        });
      }
    }

    return res.status(201).json({ success: true, comment: commentSerializer(populated) });
  } catch (error) {
    console.error("Error in addComment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const comment = await SocialComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found." });
    if (String(comment.author) !== String(req.id)) {
      return res.status(403).json({ success: false, message: "You can only edit your own comments." });
    }
    const raw = String(req.body.content || "").trim();
    if (!raw) return res.status(400).json({ success: false, message: "Comment content is required." });
    const mentionUsernames = extractMentions(raw);
    const mentionIds = await getMentionedUserIds(mentionUsernames);
    comment.content = raw;
    comment.contentText = stripHtml(raw);
    comment.mentions = mentionIds;
    comment.edited = true;
    await comment.save();
    const populated = await comment.populate({ path: "author", select: AUTHOR_SELECT });
    return res.json({ success: true, comment: commentSerializer(populated) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await SocialComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found." });
    if (String(comment.author) !== String(req.id)) {
      return res.status(403).json({ success: false, message: "You can only delete your own comments." });
    }
    comment.status = "deleted";
    comment.deletedAt = new Date();
    await comment.save();

    const replies = await SocialComment.countDocuments({ root: comment._id, status: "active" });
    const totalRemoved = 1 + replies;
    await SocialPost.updateOne({ _id: comment.post }, { $inc: { commentCount: -totalRemoved } });

    if (comment.parent && comment.root) {
      await SocialComment.updateOne({ _id: comment.root }, { $inc: { replyCount: -totalRemoved } });
    }

    return res.json({ success: true, message: "Comment deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCommentReplies = async (req, res) => {
  try {
    const { id } = req.params;
    const replies = await SocialComment.find({ root: id, status: "active" })
      .sort({ createdAt: 1 })
      .populate({ path: "author", select: AUTHOR_SELECT })
      .lean();

    const [reactions] = await Promise.all([
      replies.length
        ? SocialReaction.find({ user: req.id, target: { $in: replies.map((r) => r._id) }, targetType: "comment" }).select("target type").lean()
        : [],
    ]);
    const reactedMap = new Map(reactions.map((r) => [String(r.target), r.type]));

    return res.json({
      success: true,
      comments: replies.map((c) => {
        const s = commentSerializer(c);
        s.myReaction = reactedMap.get(String(c._id)) || null;
        return s;
      }),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};