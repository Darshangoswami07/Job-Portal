import mongoose from "mongoose";
import { Conversation } from "../models_new/Conversation.js";
import { Message } from "../models_new/Message.js";
import { Application } from "../models/application.model.js";
import { Notification } from "../models_new/Notification.js";
import { emitToUser } from "../config/socket.js";

const USER_PREVIEW_FIELDS = "fullname email profile.profilePhoto profile.headline profile.companyName";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// Loads a conversation and verifies the authenticated user is one of its two
// participants. Returns null (with the response already sent) on any failure
// so callers can just `if (!conversation) return;`.
const loadAuthorizedConversation = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400).json({ success: false, message: "Invalid conversation ID" });
    return null;
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    res.status(404).json({ success: false, message: "Conversation not found" });
    return null;
  }

  const userId = String(req.id);
  if (String(conversation.jobSeeker) !== userId && String(conversation.recruiter) !== userId) {
    res.status(403).json({ success: false, message: "You do not have access to this conversation" });
    return null;
  }

  return conversation;
};

export const getOrCreateConversation = async (req, res) => {
  try {
    const { applicationId } = req.body || {};
    if (!applicationId || !isValidObjectId(applicationId)) {
      return res.status(400).json({ success: false, message: "A valid applicationId is required" });
    }

    const application = await Application.findById(applicationId).populate({
      path: "job",
      select: "title created_by company",
    });
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }
    if (!application.job) {
      return res.status(404).json({ success: false, message: "The job for this application no longer exists" });
    }

    const jobSeekerId = String(application.applicant);
    const recruiterId = String(application.job.created_by);
    const requesterId = String(req.id);

    if (requesterId !== jobSeekerId && requesterId !== recruiterId) {
      return res.status(403).json({ success: false, message: "You are not part of this application" });
    }

    let conversation = await Conversation.findOne({ application: applicationId });
    if (!conversation) {
      try {
        conversation = await Conversation.create({
          application: applicationId,
          job: application.job._id,
          jobSeeker: jobSeekerId,
          recruiter: recruiterId,
        });
      } catch (error) {
        // Unique index on `application` — a concurrent request may have
        // created it a moment ago. Fetch and use that one instead of erroring.
        if (error.code === 11000) {
          conversation = await Conversation.findOne({ application: applicationId });
        } else {
          throw error;
        }
      }
    }

    return res.status(200).json({ success: true, conversation });
  } catch (error) {
    console.error("Error in getOrCreateConversation:", error);
    return res.status(500).json({ success: false, message: "Server error while starting conversation" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.id;
    const conversations = await Conversation.find({
      $or: [{ jobSeeker: userId }, { recruiter: userId }],
    })
      .sort({ updatedAt: -1 })
      .populate({ path: "job", select: "title company", populate: { path: "company", select: "name logo" } })
      .populate({ path: "jobSeeker", select: USER_PREVIEW_FIELDS })
      .populate({ path: "recruiter", select: USER_PREVIEW_FIELDS })
      .populate({ path: "application", select: "status" })
      .lean();

    const conversationIds = conversations.map((c) => c._id);
    const unreadAgg = await Message.aggregate([
      { $match: { conversation: { $in: conversationIds }, receiver: new mongoose.Types.ObjectId(userId), isRead: false } },
      { $group: { _id: "$conversation", count: { $sum: 1 } } },
    ]);
    const unreadMap = new Map(unreadAgg.map((row) => [String(row._id), row.count]));

    const result = conversations.map((c) => ({
      ...c,
      unreadCount: unreadMap.get(String(c._id)) || 0,
    }));

    return res.status(200).json({ success: true, conversations: result });
  } catch (error) {
    console.error("Error in getConversations:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching conversations" });
  }
};

export const getConversationById = async (req, res) => {
  try {
    const conversation = await loadAuthorizedConversation(req, res);
    if (!conversation) return;

    const populated = await Conversation.findById(conversation._id)
      .populate({ path: "job", select: "title company", populate: { path: "company", select: "name logo location" } })
      .populate({ path: "jobSeeker", select: USER_PREVIEW_FIELDS })
      .populate({ path: "recruiter", select: USER_PREVIEW_FIELDS })
      .populate({ path: "application", select: "status createdAt" });

    return res.status(200).json({ success: true, conversation: populated });
  } catch (error) {
    console.error("Error in getConversationById:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching conversation" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const conversation = await loadAuthorizedConversation(req, res);
    if (!conversation) return;

    const { before, limit = 50 } = req.query;
    const query = { conversation: conversation._id };
    if (before && isValidObjectId(before)) {
      const beforeMessage = await Message.findById(before).select("createdAt");
      if (beforeMessage) query.createdAt = { $lt: beforeMessage.createdAt };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 100))
      .lean();

    messages.reverse();

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Error in getMessages:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching messages" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const conversation = await loadAuthorizedConversation(req, res);
    if (!conversation) return;

    const rawContent = typeof req.body?.content === "string" ? req.body.content : "";
    const content = rawContent.trim();
    if (!content) {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }
    if (content.length > 5000) {
      return res.status(400).json({ success: false, message: "Message is too long (max 5000 characters)" });
    }

    const senderId = String(req.id);
    const receiverId = senderId === String(conversation.jobSeeker)
      ? String(conversation.recruiter)
      : String(conversation.jobSeeker);

    const message = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content,
    });

    conversation.lastMessage = content;
    conversation.lastMessageAt = message.createdAt;
    conversation.lastMessageSender = senderId;
    await conversation.save();

    emitToUser(receiverId, "chat:new-message", { message, conversationId: String(conversation._id) });
    emitToUser(senderId, "chat:new-message", { message, conversationId: String(conversation._id) });

    Notification.create({
      user: receiverId,
      type: "message",
      title: "New message",
      message: content.length > 140 ? `${content.slice(0, 140)}...` : content,
      link: `/messages/${conversation._id}`,
      metadata: { conversationId: String(conversation._id) },
    }).catch((error) => console.error("Failed to create message notification:", error));

    return res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return res.status(500).json({ success: false, message: "Server error while sending message" });
  }
};

export const markConversationRead = async (req, res) => {
  try {
    const conversation = await loadAuthorizedConversation(req, res);
    if (!conversation) return;

    const userId = req.id;
    const result = await Message.updateMany(
      { conversation: conversation._id, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );

    if (result.modifiedCount > 0) {
      const otherUserId = String(userId) === String(conversation.jobSeeker)
        ? String(conversation.recruiter)
        : String(conversation.jobSeeker);
      emitToUser(otherUserId, "chat:read", { conversationId: String(conversation._id), readBy: String(userId) });
    }

    return res.status(200).json({ success: true, updatedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error in markConversationRead:", error);
    return res.status(500).json({ success: false, message: "Server error while marking conversation as read" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.id, isRead: false });
    return res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching unread count" });
  }
};
