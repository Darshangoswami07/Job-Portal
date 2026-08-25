import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  getOrCreateConversation,
  getConversations,
  getConversationById,
  getMessages,
  sendMessage,
  markConversationRead,
  getUnreadCount,
} from "../controllers_new/chatController.js";

const router = express.Router();

router.route("/conversations").get(isAuthenticated, getConversations).post(isAuthenticated, getOrCreateConversation);
router.route("/conversations/:id").get(isAuthenticated, getConversationById);
router.route("/conversations/:id/messages").get(isAuthenticated, getMessages).post(isAuthenticated, sendMessage);
router.route("/conversations/:id/read").patch(isAuthenticated, markConversationRead);
router.route("/messages/unread-count").get(isAuthenticated, getUnreadCount);

export default router;
