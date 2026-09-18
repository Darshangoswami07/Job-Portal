import mongoose from "mongoose";

const muteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    muted: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

muteSchema.index({ user: 1, muted: 1 }, { unique: true });

export const SocialMute = mongoose.model("SocialMute", muteSchema);