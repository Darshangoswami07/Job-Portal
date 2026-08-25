import axios from "@/utils/axios";
import { CHAT_API_END_POINT } from "@/utils/constant";

export const getOrCreateConversation = (applicationId) =>
    axios.post(`${CHAT_API_END_POINT}/conversations`, { applicationId });

export const getConversations = () =>
    axios.get(`${CHAT_API_END_POINT}/conversations`);

export const getConversationById = (conversationId) =>
    axios.get(`${CHAT_API_END_POINT}/conversations/${conversationId}`);

export const getMessages = (conversationId, before) =>
    axios.get(`${CHAT_API_END_POINT}/conversations/${conversationId}/messages`, {
        params: before ? { before } : undefined,
    });

export const sendMessage = (conversationId, content) =>
    axios.post(`${CHAT_API_END_POINT}/conversations/${conversationId}/messages`, { content });

export const markConversationRead = (conversationId) =>
    axios.patch(`${CHAT_API_END_POINT}/conversations/${conversationId}/read`);

export const getUnreadCount = () =>
    axios.get(`${CHAT_API_END_POINT}/messages/unread-count`);
