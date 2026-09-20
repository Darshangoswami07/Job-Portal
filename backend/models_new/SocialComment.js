import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "SocialPost", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "SocialComment", default: null },
    root: { type: mongoose.Schema.Types.ObjectId, ref: "SocialComment", default: null },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
    contentText: { type: String, default: "" },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    media: [{
      type: { type: String, enum: ["image", "video", "document"], default: "image" },
      url: { type: String, required: true },
      publicId: { type: String, default: "" },
      name: { type: String, default: "" },
    }],
    gif: { url: String, preview: String },
    reactionCounts: {
      like: { type: Number, default: 0 },
      love: { type: Number, default: 0 },
      celebrate: { type: Number, default: 0 },
      insightful: { type: Number, default: 0 },
      support: { type: Number, default: 0 },
      funny: { type: Number, default: 0 },
      applause: { type: Number, default: 0 },
    },
    replyCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "hidden", "deleted"], default: "active" },
    edited: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ post: 1, root: 1, createdAt: 1 });
commentSchema.index({ author: 1, createdAt: -1 });

export const SocialComment = mongoose.model("SocialComment", commentSchema);