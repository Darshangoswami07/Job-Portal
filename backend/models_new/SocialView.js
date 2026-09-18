import mongoose from "mongoose";

const viewSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "SocialPost", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    viewerIp: { type: String, default: "" },
  },
  { timestamps: true }
);

viewSchema.index({ post: 1, user: 1 });
viewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const SocialView = mongoose.model("SocialView", viewSchema);