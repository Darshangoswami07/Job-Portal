import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { getJwtSecret, getAllowedOrigins } from "../config/runtimeUrls.js";
import { ChatConversation } from "../models_new/ChatConversation.js";
import { ChatMessage } from "../models_new/ChatMessage.js";
import {
  setChatSocket,
  setUserOnline,
  setUserOffline,
  emitPresence,
  emitToUser,
} from "../services/chatSocket.js";
import { setSocialSocket } from "../services/socialSocket.js";

const socketsByUser = new Map();

const deliverPendingMessages = async (userId) => {
  try {
    const pending = await ChatMessage.find({
      sender: { $ne: userId },
      deliveredTo: { $ne: userId },
    })
      .select("conversation sender")
      .limit(50);
    if (!pending.length) return;

    const ids = pending.map((m) => m._id);
    await ChatMessage.updateMany(
      { _id: { $in: ids } },
      { $addToSet: { deliveredTo: userId } }
    );

    const byKey = {};
    pending.forEach((m) => {
      const key = `${String(m.sender)}|${String(m.conversation)}`;
      if (!byKey[key]) {
        byKey[key] = {
          sender: String(m.sender),
          conversationId: String(m.conversation),
          messageIds: [],
        };
      }
      byKey[key].messageIds.push(String(m._id));
    });

    Object.values(byKey).forEach(({ sender, conversationId, messageIds }) => {
      emitToUser(sender, "message_delivered", { conversationId, messageIds, userId: String(userId) });
    });
  } catch (error) {
    console.error("Error in deliverPendingMessages:", error);
  }
};

const removeSocket = (userId, socketId) => {
  const set = socketsByUser.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) {
    socketsByUser.delete(userId);
    setUserOffline(userId);
    emitPresence(userId, false);
  }
};

const isConversationParticipant = async (conversationId, userId) => {
  try {
    const conversation = await ChatConversation.findById(conversationId).select(
      "participants"
    );
    if (!conversation) return false;
    return (conversation.participants || [])
      .map((p) => String(p?._id || p))
      .includes(String(userId));
  } catch {
    return false;
  }
};

export const initChatSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [...getAllowedOrigins()],
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  setChatSocket(io);
  setSocialSocket(io);

  io.use((socket, next) => {
    try {
      const secret = getJwtSecret();
      if (!secret) return next(new Error("Auth not configured"));
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, secret);
      if (!decoded?.userId) return next(new Error("Invalid token"));

      socket.userId = String(decoded.userId);
      return next();
    } catch (error) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    socket.join("presence");
    socket.join(`user:${userId}`);

    if (!socketsByUser.has(userId)) {
      socketsByUser.set(userId, new Set());
    }
    socketsByUser.get(userId).add(socket.id);
    setUserOnline(userId);
    emitPresence(userId, true);
    deliverPendingMessages(userId);

    socket.on("chat:join", async (conversationId, callback = () => {}) => {
      const ok = await isConversationParticipant(conversationId, userId);
      if (ok) {
        socket.join(`conversation:${conversationId}`);
      }
      callback?.({ ok });
    });

    socket.on("chat:leave", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("chat:typing", ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit("chat:typing", {
        conversationId,
        userId,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on("chat:stop", () => {});

    socket.on("disconnect", () => {
      removeSocket(userId, socket.id);
    });
  });

  return io;
};
