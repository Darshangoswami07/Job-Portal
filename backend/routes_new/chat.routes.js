import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { chatUploadMiddleware } from "../middlewares/chatUpload.js";
import {
  createConversation,
  getConversations,
  getConversation,
  getConversationByApplication,
  getMessages,
  sendMessage,
  markRead,
  updateMessage,
  deleteMessage,
  toggleReaction,
  toggleMessagePin,
  updateConversation,
  deleteConversation,
  uploadChatFile,
  getPresence,
} from "../controllers_new/chatController.js";

const router = express.Router();

router.post("/conversations", isAuthenticated, createConversation);
router.get("/conversations", isAuthenticated, getConversations);
router.get("/conversations/:id", isAuthenticated, getConversation);
router.get(
  "/by-application/:applicationId",
  isAuthenticated,
  getConversationByApplication
);
router.get("/conversations/:id/messages", isAuthenticated, getMessages);
router.post("/conversations/:id/messages", isAuthenticated, sendMessage);
router.post("/conversations/:id/read", isAuthenticated, markRead);
router.patch("/messages/:id", isAuthenticated, updateMessage);
router.delete("/messages/:id", isAuthenticated, deleteMessage);
router.post("/messages/:id/reactions", isAuthenticated, toggleReaction);
router.post("/messages/:id/pin", isAuthenticated, toggleMessagePin);
router.patch("/conversations/:id", isAuthenticated, updateConversation);
router.delete("/conversations/:id", isAuthenticated, deleteConversation);
router.post("/upload", isAuthenticated, chatUploadMiddleware, uploadChatFile);
router.get("/presence", isAuthenticated, getPresence);

export default router;
