import { SocialReaction } from "../models_new/SocialReaction.js";
import { SocialPost } from "../models_new/SocialPost.js";
import { SocialComment } from "../models_new/SocialComment.js";
import { User } from "../models/user.model.js";
import { createNotification } from "../services/socialService.js";
import { emitToSocialUser } from "../services/socialSocket.js";

const REACTION_TYPES = ["like", "love", "celebrate", "insightful", "support", "funny", "applause"];

const REACTION_LABELS = {
  like: "liked", love: "loved", celebrate: "celebrated", insightful: "found insightful",
  support: "supported", funny: "found funny", applause: "applauded",
};

export const getReactionCounts = (post) => {
  const counts = {
    like: post?.reactionCounts?.like || 0,
    love: post?.reactionCounts?.love || 0,
    celebrate: post?.reactionCounts?.celebrate || 0,
    insightful: post?.reactionCounts?.insightful || 0,
    support: post?.reactionCounts?.support || 0,
    funny: post?.reactionCounts?.funny || 0,
    applause: post?.reactionCounts?.applause || 0,
  };
  return counts;
};

export const togglePostReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.id;
    const type = REACTION_TYPES.includes(req.body.type) ? req.body.type : "like";

    const post = await SocialPost.findById(id);
    if (!post || post.status !== "active") {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const existing = await SocialReaction.findOne({ user: userId, target: id, targetType: "post" });
    let reaction = null;
    let changedFrom = null;

    if (existing) {
      if (existing.type === type) {
        await existing.deleteOne();
        await SocialPost.updateOne(
          { _id: id },
          { $inc: { [`reactionCounts.${type}`]: -1 } }
        );
      } else {
        changedFrom = existing.type;
        existing.type = type;
        await existing.save();
        await SocialPost.updateOne(
          { _id: id },
          {
            $inc: {
              [`reactionCounts.${type}`]: 1,
              [`reactionCounts.${changedFrom}`]: -1,
            },
          }
        );
        reaction = existing;
      }
    } else {
      await SocialReaction.create({ user: userId, target: id, targetType: "post", targetModel: "SocialPost", type });
      await SocialPost.updateOne({ _id: id }, { $inc: { [`reactionCounts.${type}`]: 1 } });
      reaction = { type };
    }

    if (reaction && String(post.author) !== String(userId)) {
      const actor = await User.findById(userId).select("fullname profile.profilePhoto").lean();
      createNotification({
        user: post.author,
        type: "system",
        title: `${actor?.fullname || "Someone"} ${REACTION_LABELS[type] || "reacted to"} your post`,
        message: post.contentText?.slice(0, 80) || "View post",
        link: `/feed/${id}`,
        metadata: { reactionType: type, actorId: String(userId), postId: String(id) },
      });
      emitToSocialUser(String(post.author), "social:reaction", {
        postId: String(id),
        reactionId: reaction._id ? String(reaction._id) : null,
        type,
        userId: String(userId),
        changedFrom,
      });
    }

    const fresh = await SocialPost.findById(id).select("reactionCounts").lean();
    return res.json({
      success: true,
      reaction: reaction ? { type } : null,
      changedFrom,
      counts: getReactionCounts(fresh),
    });
  } catch (error) {
    console.error("Error in togglePostReaction:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleCommentReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.id;
    const type = REACTION_TYPES.includes(req.body.type) ? req.body.type : "like";

    const comment = await SocialComment.findById(id);
    if (!comment || comment.status !== "active") {
      return res.status(404).json({ success: false, message: "Comment not found." });
    }

    const existing = await SocialReaction.findOne({ user: userId, target: id, targetType: "comment" });
    let reaction = null;
    let changedFrom = null;

    if (existing) {
      if (existing.type === type) {
        await existing.deleteOne();
        await SocialComment.updateOne({ _id: id }, { $inc: { [`reactionCounts.${type}`]: -1 } });
      } else {
        changedFrom = existing.type;
        existing.type = type;
        await existing.save();
        await SocialComment.updateOne(
          { _id: id },
          { $inc: { [`reactionCounts.${type}`]: 1, [`reactionCounts.${changedFrom}`]: -1 } }
        );
        reaction = existing;
      }
    } else {
      await SocialReaction.create({ user: userId, target: id, targetType: "comment", targetModel: "SocialComment", type });
      await SocialComment.updateOne({ _id: id }, { $inc: { [`reactionCounts.${type}`]: 1 } });
      reaction = { type };
    }

    if (reaction && String(comment.author) !== String(userId)) {
      const actor = await User.findById(userId).select("fullname profile.profilePhoto").lean();
      createNotification({
        user: comment.author,
        type: "system",
        title: `${actor?.fullname || "Someone"} ${REACTION_LABELS[type] || "reacted to"} your comment`,
        message: comment.contentText?.slice(0, 80),
        link: `/feed/${comment.post}`,
      });
    }

    const fresh = await SocialComment.findById(id).select("reactionCounts").lean();
    return res.json({
      success: true,
      reaction: reaction ? { type } : null,
      changedFrom,
      counts: getReactionCounts(fresh),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPostReactions = async (req, res) => {
  try {
    const { id } = req.params;
    const reactions = await SocialReaction.find({ target: id, targetType: "post" })
      .sort({ createdAt: -1 })
      .limit(60)
      .populate({ path: "user", select: "fullname profile.profilePhoto profile.headline" })
      .lean();
    return res.json({
      success: true,
      reactions: reactions.map((r) => ({
        id: String(r._id),
        type: r.type,
        user: r.user,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};