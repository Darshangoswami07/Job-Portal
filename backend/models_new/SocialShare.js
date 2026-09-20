import mongoose from "mongoose";

const shareSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "SocialPost", required: true, index: true },
    platform: {
      type: String,
      enum: ["feed", "connection", "chat", "copy", "email", "whatsapp", "linkedin", "twitter"],
      default: "feed",
    },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    message: { type: String, default: "", maxlength: 1000 },
  },
  { timestamps: true }
);

shareSchema.index({ post: 1, createdAt: -1 });
shareSchema.index({ user: 1, createdAt: -1 });

export const SocialShare = mongoose.model("SocialShare", shareSchema);