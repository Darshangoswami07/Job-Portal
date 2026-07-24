import mongoose from "mongoose";

const ticketMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderName: { type: String },
  message: { type: String, required: true },
  isStaff: { type: Boolean, default: false },
  attachments: [{ type: String }],
}, { timestamps: true });

const supportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  category: { type: String, default: "general" },
  message: { type: String, required: true },
  status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  messages: [ticketMessageSchema],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  resolvedAt: { type: Date },
}, { timestamps: true });

supportTicketSchema.index({ user: 1 });
supportTicketSchema.index({ status: 1, priority: -1 });
supportTicketSchema.index({ email: 1 });

export const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
