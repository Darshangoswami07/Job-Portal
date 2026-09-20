import mongoose from "mongoose";
import { ChatConversation } from "../models_new/ChatConversation.js";
import { ChatMessage } from "../models_new/ChatMessage.js";
import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { Notification } from "../models_new/Notification.js";
import cloudinary from "../config/cloudinary.js";
import getDataUri from "../utils/datauri.js";
import {
  emitToConversation,
  emitToUser,
  isUserOnline,
  getOnlineUsers,
} from "../services/chatSocket.js";

const MESSAGE_PREVIEW_MAX = 90;

const previewText = (message) => {
  if (message.type === "image") return "📷 Photo";
  if (message.type === "voice") return "🎤 Voice message";
  if (message.type === "resume") return "📄 Resume";
  if (message.type === "file") {
    const name = message.attachment?.name || "Attachment";
    return `📎 ${name}`;
  }
  const body = String(message.body || "").replace(/\s+/g, " ").trim();
  return body.length > MESSAGE_PREVIEW_MAX
    ? `${body.slice(0, MESSAGE_PREVIEW_MAX)}…`
    : body;
};

const serializeMessage = (msg) => {
  const m = msg.toObject ? msg.toObject() : msg;
  m.preview = previewText(m);
  return m;
};

const CONVERSATION_POPULATE = [
  { path: "participants", select: "fullname email profile profilePhoto" },
  { path: "applicant", select: "fullname email profile profilePhoto" },
  { path: "recruiter", select: "fullname email profile profilePhoto" },
  { path: "lastMessage" },
  {
    path: "job",
    select:
      "title company location jobType salary salaryCurrency experienceLevel isActive status",
  },
  { path: "company", select: "name logo location" },
];

const populateConversation = (conversation) =>
  conversation.populate(CONVERSATION_POPULATE);

const assertParticipant = (conversation, userId) => {
  const participants = (conversation.participants || []).map((p) =>
    String(p?._id || p)
  );
  return participants.includes(String(userId));
};

const otherParticipantId = (conversation, userId) => {
  const participants = (conversation.participants || []).map((p) =>
    String(p?._id || p)
  );
  return participants.find((p) => p !== String(userId)) || null;
};

const isConversationVisibleTo = (conversation, userId) => {
  const deletedBy = (conversation.deletedBy || []).map((p) => String(p?._id || p));
  return !deletedBy.includes(String(userId));
};

// Returns an error response when access should be denied, otherwise null.
// Non-participants get 403; soft-deleted (deleted for self) conversations get 404.
const assertAccess = (res, conversation, userId) => {
  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }
  if (!assertParticipant(conversation, userId)) {
    return res.status(403).json({ success: false, message: "You do not have access to this conversation." });
  }
  if (!isConversationVisibleTo(conversation, userId)) {
    return res.status(404).json({ success: false, message: "Conversation not found." });
  }
  return null;
};

const emitDelivered = (senderId, conversationId, messageIds, recipientId) => {
  if (!senderId || !messageIds || !messageIds.length) return;
  emitToUser(String(senderId), "message_delivered", {
    conversationId: String(conversationId),
    messageIds: messageIds.map(String),
    userId: String(recipientId),
  });
};

const incrementUnread = (conversation, recipientId) => {
  const key = String(recipientId);
  const current = Number(conversation.unreadCounts?.get?.(key) || 0);
  if (!conversation.unreadCounts) conversation.unreadCounts = new Map();
  conversation.unreadCounts.set(key, current + 1);
};

const resolveApplicationContext = async (applicationId) => {
  const application = await Application.findById(applicationId);
  if (!application) return { error: "Application not found", status: 404 };
  const job = await Job.findById(application.job);
  if (!job) return { error: "Job not found", status: 404 };

  const applicantId = String(application.applicant);
  const recruiterId = String(job.created_by);
  if (!recruiterId) {
    return { error: "Job has no recruiter assigned", status: 400 };
  }

  return {
    application,
    job,
    applicantId,
    recruiterId,
    companyId: job.company?._id || job.company || null,
  };
};

const createNotification = async ({
  user,
  title,
  message,
  link,
  conversationId,
}) => {
  try {
    const notification = await Notification.create({
      user,
      type: "message",
      title,
      message,
      link,
      metadata: { conversationId: String(conversationId) },
    });
    emitToUser(String(user), "notification:new", notification);
  } catch (error) {
    console.error("Failed to create chat notification:", error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/chat/conversations  { applicationId }
// ---------------------------------------------------------------------------
export const createConversation = async (req, res) => {
  try {
    const { applicationId } = req.body || {};
    if (!applicationId || !mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "A valid application ID is required to start chatting.",
      });
    }

    const context = await resolveApplicationContext(applicationId);
    if (context.error) {
      return res.status(context.status).json({ success: false, message: context.error });
    }
    const { application, job, applicantId, recruiterId, companyId } = context;

    const userId = String(req.id);
    if (userId !== applicantId && userId !== recruiterId) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this application. Chat requires a submitted application.",
      });
    }

    if (applicantId === recruiterId) {
      return res.status(400).json({
        success: false,
        message: "You cannot start a chat with yourself.",
      });
    }

    let conversation = await ChatConversation.findOne({ application: applicationId });
    if (conversation) {
      const deletedIndex = (conversation.deletedBy || []).findIndex(
        (id) => String(id?._id || id) === userId
      );
      if (deletedIndex >= 0) {
        conversation.deletedBy.splice(deletedIndex, 1);
        await conversation.save();
      }
      await populateConversation(conversation);
      return res.status(200).json({ success: true, conversation });
    }

    conversation = await ChatConversation.create({
      application: applicationId,
      job: job._id,
      company: companyId,
      participants: [applicantId, recruiterId],
      applicant: applicantId,
      recruiter: recruiterId,
      unreadCounts: new Map(),
    });

    await populateConversation(conversation);

    return res.status(201).json({ success: true, conversation });
  } catch (error) {
    console.error("Error in createConversation:", error);
    return res.status(500).json({ success: false, message: "Failed to start conversation." });
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/chat/conversations
// ---------------------------------------------------------------------------
export const getConversations = async (req, res) => {
  try {
    const userId = String(req.id);
    const conversations = await ChatConversation.find({
      participants: userId,
    })
      .populate(CONVERSATION_POPULATE)
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const visible = conversations.filter((c) => isConversationVisibleTo(c, userId));

    const result = visible.map((c) => {
      const otherId = otherParticipantId(c, userId);
      return {
        ...c.toObject(),
        unreadCount: Number(c.unreadCounts?.get?.(userId) || 0),
        otherParticipantId: otherId,
        otherOnline: otherId ? isUserOnline(otherId) : false,
        isPinned: (c.pinnedBy || []).some((p) => String(p?._id || p) === userId),
        isArchived: (c.archivedBy || []).some((p) => String(p?._id || p) === userId),
        isMuted: (c.mutedBy || []).some((p) => String(p?._id || p) === userId),
      };
    });

    const unreadTotal = result.reduce((sum, c) => sum + c.unreadCount, 0);

    return res.status(200).json({
      success: true,
      conversations: result,
      unreadTotal,
      onlineUsers: getOnlineUsers(),
    });
  } catch (error) {
    console.error("Error in getConversations:", error);
    return res.status(500).json({ success: false, message: "Failed to load conversations." });
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/chat/conversations/:id
// ---------------------------------------------------------------------------
export const getConversation = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    const conversation = await ChatConversation.findById(req.params.id).populate(
      CONVERSATION_POPULATE
    );
    const denied = assertAccess(res, conversation, req.id);
    if (denied) return denied;

    const userId = String(req.id);
    const otherId = otherParticipantId(conversation, userId);
    return res.status(200).json({
      success: true,
      conversation: {
        ...conversation.toObject(),
        unreadCount: Number(conversation.unreadCounts?.get?.(userId) || 0),
        otherParticipantId: otherId,
        otherOnline: otherId ? isUserOnline(otherId) : false,
        isPinned: (conversation.pinnedBy || []).some((p) => String(p?._id || p) === userId),
        isArchived: (conversation.archivedBy || []).some((p) => String(p?._id || p) === userId),
        isMuted: (conversation.mutedBy || []).some((p) => String(p?._id || p) === userId),
      },
    });
  } catch (error) {
    console.error("Error in getConversation:", error);
    return res.status(500).json({ success: false, message: "Failed to load conversation." });
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/chat/by-application/:applicationId
// ---------------------------------------------------------------------------
export const getConversationByApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({ success: false, message: "Invalid application ID." });
    }
    const conversation = await ChatConversation.findOne({ application: applicationId }).populate(
      CONVERSATION_POPULATE
    );
    if (!conversation) {
      return res.status(200).json({ success: true, conversation: null });
    }
    const denied = assertAccess(res, conversation, req.id);
    if (denied) return denied;
    const userId = String(req.id);
    return res.status(200).json({
      success: true,
      conversation: {
        ...conversation.toObject(),
        unreadCount: Number(conversation.unreadCounts?.get?.(userId) || 0),
        otherParticipantId: otherParticipantId(conversation, userId),
        otherOnline: isUserOnline(otherParticipantId(conversation, userId)),
      },
    });
  } catch (error) {
    console.error("Error in getConversationByApplication:", error);
    return res.status(500).json({ success: false, message: "Failed to load conversation." });
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/chat/conversations/:id/messages
// ---------------------------------------------------------------------------
export const getMessages = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    const conversation = await ChatConversation.findById(req.params.id);
    const denied = assertAccess(res, conversation, req.id);
    if (denied) return denied;

    const limit = Math.min(Number(req.query.limit) || 40, 80);
    const before = req.query.before
      ? new Date(req.query.before)
      : new Date();
    const userId = String(req.id);

    const messages = await ChatMessage.find({
      conversation: conversation._id,
      createdAt: { $lt: before },
      deletedFor: { $ne: userId },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("replyTo");

    const hasMore = messages.length === limit;

    return res.status(200).json({
      success: true,
      messages: messages.reverse().map(serializeMessage),
      hasMore,
      online: isUserOnline(otherParticipantId(conversation, userId)),
    });
  } catch (error) {
    console.error("Error in getMessages:", error);
    return res.status(500).json({ success: false, message: "Failed to load messages." });
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/chat/conversations/:id/messages
// ---------------------------------------------------------------------------
export const sendMessage = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    const conversation = await ChatConversation.findById(req.params.id);
    const denied = assertAccess(res, conversation, req.id);
    if (denied) return denied;

    const senderId = String(req.id);
    const recipientId = otherParticipantId(conversation, senderId);
    const { body = "", type = "text", attachment, audio, replyTo } = req.body || {};

    const trimmed = String(body || "").replace(/\s+/g, " ").trim();
    const hasAttachment = attachment && attachment.url;
    const hasAudio = audio && audio.url;

    if (!trimmed && !hasAttachment && !hasAudio) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    const message = await ChatMessage.create({
      conversation: conversation._id,
      sender: senderId,
      body: trimmed,
      type,
      attachment: hasAttachment ? attachment : undefined,
      audio: hasAudio ? audio : undefined,
      replyTo: replyTo || undefined,
      deliveredTo: [senderId],
      readBy: [senderId],
    });
    await message.populate("replyTo");

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = previewText(message);
    conversation.lastMessageSender = senderId;
    incrementUnread(conversation, recipientId);
    await conversation.save();

    if (isUserOnline(recipientId)) {
      await ChatMessage.updateOne(
        { _id: message._id },
        { $addToSet: { deliveredTo: recipientId } }
      );
      message.deliveredTo = [...(message.deliveredTo || []), recipientId];
      emitDelivered(senderId, conversation._id, [message._id], recipientId);
    }

    const populated = await populateConversation(conversation);
    const serialized = serializeMessage(message);

    emitToConversation(String(conversation._id), "chat:message", serialized);

    emitToUser(String(recipientId), "chat:conversation:update", {
      conversation: {
        ...populated.toObject(),
        unreadCount: Number(conversation.unreadCounts?.get?.(recipientId) || 0),
        otherParticipantId: senderId,
        otherOnline: isUserOnline(senderId),
      },
    });

    await createNotification({
      user: recipientId,
      title: "New message",
      message: serialized.preview || "You have a new message",
      link: `/chat/${conversation._id}`,
      conversationId: conversation._id,
    });

    return res.status(201).json({ success: true, message: serialized });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return res.status(500).json({ success: false, message: "Failed to send message." });
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/chat/conversations/:id/read
// ---------------------------------------------------------------------------
export const markRead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    const conversation = await ChatConversation.findById(req.params.id);
    if (!conversation || !assertParticipant(conversation, req.id)) {
      return res.status(403).json({ success: false, message: "You do not have access to this conversation." });
    }

    const userId = String(req.id);
    const otherId = otherParticipantId(conversation, userId);

    const unread = await ChatMessage.find({
      conversation: conversation._id,
      sender: { $ne: userId },
      readBy: { $ne: userId },
    }).select("_id sender");

    const messageIds = unread.map((m) => String(m._id));

    if (messageIds.length) {
      await ChatMessage.updateMany(
        { _id: { $in: messageIds } },
        { $addToSet: { readBy: userId } }
      );
    }

    const key = String(userId);
    if (conversation.unreadCounts?.has(key)) {
      conversation.unreadCounts.delete(key);
    }
    await conversation.save();

    emitToConversation(String(conversation._id), "chat:read", {
      conversationId: String(conversation._id),
      userId,
      count: messageIds.length,
    });

    const senderIds = [...new Set(unread.map((m) => String(m.sender)))];
    senderIds.forEach((senderId) => {
      emitToUser(String(senderId), "message_seen", {
        conversationId: String(conversation._id),
        userId,
        messageIds,
      });
    });

    if (otherId) {
      emitToUser(String(otherId), "chat:conversation:read", {
        conversationId: String(conversation._id),
        readBy: userId,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in markRead:", error);
    return res.status(500).json({ success: false, message: "Failed to mark as read." });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/v1/chat/messages/:id  { body }
// ---------------------------------------------------------------------------
export const updateMessage = async (req, res) => {
  try {
    const { body } = req.body || {};
    const trimmed = String(body || "").replace(/\s+/g, " ").trim();
    if (!trimmed) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Message not found or not editable." });
    }
    const message = await ChatMessage.findOneAndUpdate(
      { _id: req.params.id, sender: req.id, type: "text" },
      { body: trimmed, isEdited: true, editedAt: new Date() },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found or not editable." });
    }

    const serialized = serializeMessage(message);
    emitToConversation(String(message.conversation), "chat:message:update", serialized);

    return res.status(200).json({ success: true, message: serialized });
  } catch (error) {
    console.error("Error in updateMessage:", error);
    return res.status(500).json({ success: false, message: "Failed to update message." });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/chat/messages/:id  (soft delete for self)
// ---------------------------------------------------------------------------
export const deleteMessage = async (req, res) => {
  try {
    const userId = String(req.id);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }
    const message = await ChatMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    const conversation = await ChatConversation.findById(message.conversation);
    const denied = assertAccess(res, conversation, req.id);
    if (denied) return denied;

    message.deletedFor = message.deletedFor || [];
    if (!message.deletedFor.some((id) => String(id) === userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }

    const otherId = otherParticipantId(conversation, userId);
    const bothDeleted = otherId && (message.deletedFor || []).some((id) => String(id) === otherId);

    emitToConversation(String(message.conversation), "chat:message:delete", {
      messageId: String(message._id),
      deletedBy: userId,
      deletedForEveryone: bothDeleted,
      conversationId: String(message.conversation),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    return res.status(500).json({ success: false, message: "Failed to delete message." });
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/chat/messages/:id/reactions  { emoji }
// ---------------------------------------------------------------------------
export const toggleReaction = async (req, res) => {
  try {
    const { emoji } = req.body || {};
    if (!emoji) {
      return res.status(400).json({ success: false, message: "Emoji is required." });
    }
    const userId = String(req.id);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }
    const message = await ChatMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }
    const conversation = await ChatConversation.findById(message.conversation);
    const denied = assertAccess(res, conversation, req.id);
    if (denied) return denied;

    const existingIndex = (message.reactions || []).findIndex(
      (r) => String(r.user?._id || r.user) === userId
    );

    if (existingIndex >= 0) {
      const existing = message.reactions[existingIndex];
      if (existing.emoji === emoji) {
        message.reactions.splice(existingIndex, 1);
      } else {
        message.reactions[existingIndex] = {
          emoji,
          user: userId,
          createdAt: new Date(),
        };
      }
    } else {
      message.reactions.push({ emoji, user: userId, createdAt: new Date() });
    }
    await message.save();

    const serialized = serializeMessage(message);
    emitToConversation(String(message.conversation), "chat:message:update", serialized);

    return res.status(200).json({ success: true, message: serialized });
  } catch (error) {
    console.error("Error in toggleReaction:", error);
    return res.status(500).json({ success: false, message: "Failed to update reaction." });
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/chat/messages/:id/pin  (toggle pin for self)
// ---------------------------------------------------------------------------
export const toggleMessagePin = async (req, res) => {
  try {
    const userId = String(req.id);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }
    const message = await ChatMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }
    const conversation = await ChatConversation.findById(message.conversation);
    const denied = assertAccess(res, conversation, req.id);
    if (denied) return denied;

    const list = message.pinnedBy || [];
    const index = list.findIndex((id) => String(id?._id || id) === userId);
    if (index >= 0) list.splice(index, 1);
    else list.push(userId);
    message.pinnedBy = list;
    await message.save();

    const serialized = serializeMessage(message);
    emitToConversation(String(message.conversation), "chat:message:update", serialized);

    return res.status(200).json({ success: true, message: serialized });
  } catch (error) {
    console.error("Error in toggleMessagePin:", error);
    return res.status(500).json({ success: false, message: "Failed to update message." });
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/v1/chat/conversations/:id  { action }
// ---------------------------------------------------------------------------
const ACTION_FIELDS = {
  pin: "pinnedBy",
  archive: "archivedBy",
  mute: "mutedBy",
};

export const updateConversation = async (req, res) => {
  try {
    const { action } = req.body || {};
    const userId = String(req.id);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    const conversation = await ChatConversation.findById(req.params.id);
    const denied = assertAccess(res, conversation, req.id);
    if (denied) return denied;

    const [target, verb] = String(action || "").split(":");
    const field = ACTION_FIELDS[target];
    if (!field || !["add", "remove"].includes(verb)) {
      return res.status(400).json({ success: false, message: "Invalid action." });
    }

    const list = conversation[field] || [];
    const index = list.findIndex((id) => String(id?._id || id) === userId);
    if (verb === "add" && index < 0) list.push(userId);
    if (verb === "remove" && index >= 0) list.splice(index, 1);
    conversation[field] = list;
    await conversation.save();

    return res.status(200).json({
      success: true,
      conversation: {
        ...conversation.toObject(),
        isPinned: (conversation.pinnedBy || []).some((p) => String(p?._id || p) === userId),
        isArchived: (conversation.archivedBy || []).some((p) => String(p?._id || p) === userId),
        isMuted: (conversation.mutedBy || []).some((p) => String(p?._id || p) === userId),
      },
    });
  } catch (error) {
    console.error("Error in updateConversation:", error);
    return res.status(500).json({ success: false, message: "Failed to update conversation." });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/chat/conversations/:id  (soft delete for self)
// ---------------------------------------------------------------------------
export const deleteConversation = async (req, res) => {
  try {
    const userId = String(req.id);
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }
    const conversation = await ChatConversation.findById(req.params.id);
    const denied = assertAccess(res, conversation, req.id);
    if (denied) return denied;

    conversation.deletedBy = conversation.deletedBy || [];
    if (!conversation.deletedBy.some((id) => String(id) === userId)) {
      conversation.deletedBy.push(userId);
      await conversation.save();
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in deleteConversation:", error);
    return res.status(500).json({ success: false, message: "Failed to delete conversation." });
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/chat/upload  (multipart form field "files[]")
// ---------------------------------------------------------------------------
export const uploadChatFile = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const uploaded = [];
    for (const file of files) {
      const fileUri = getDataUri(file);
      const isImage = file.mimetype.startsWith("image/");
      const isAudio = file.mimetype.startsWith("audio/");
      const resourceType = isImage ? "image" : isAudio ? "video" : "raw";

      const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
        resource_type: resourceType,
        folder: "chat",
        ...(isImage ? { format: "jpg", quality: "auto" } : {}),
      });

      uploaded.push({
        url: cloudResponse.secure_url,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        resourceType,
      });
    }

    return res.status(201).json({ success: true, files: uploaded });
  } catch (error) {
    console.error("Error in uploadChatFile:", error);
    return res.status(500).json({ success: false, message: "Failed to upload file." });
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/chat/presence?userIds=a,b,c
// ---------------------------------------------------------------------------
export const getPresence = async (req, res) => {
  try {
    const raw = String(req.query.userIds || "");
    const ids = raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const presence = {};
    ids.forEach((id) => {
      presence[id] = isUserOnline(id);
    });
    return res.status(200).json({ success: true, presence });
  } catch (error) {
    console.error("Error in getPresence:", error);
    return res.status(500).json({ success: false, message: "Failed to load presence." });
  }
};
