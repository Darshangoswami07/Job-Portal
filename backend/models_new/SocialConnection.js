import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    message: { type: String, default: "", trim: true, maxlength: 500 },
    connectedAt: Date,
  },
  { timestamps: true }
);

connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
connectionSchema.index({ recipient: 1, status: 1, createdAt: -1 });

export const SocialConnection = mongoose.model("SocialConnection", connectionSchema);