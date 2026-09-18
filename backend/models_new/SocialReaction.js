import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["post", "comment"], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, refPath: "targetModel", required: true, index: true },
    targetModel: { type: String, enum: ["SocialPost", "SocialComment"], required: true },
    type: {
      type: String,
      enum: ["like", "love", "celebrate", "insightful", "support", "funny", "applause"],
      required: true,
    },
  },
  { timestamps: true }
);

reactionSchema.index({ user: 1, target: 1, targetType: 1 }, { unique: true });

export const SocialReaction = mongoose.model("SocialReaction", reactionSchema);