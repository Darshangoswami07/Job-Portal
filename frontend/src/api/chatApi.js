import axios from "@/utils/axios";
import { CHAT_API_END_POINT } from "@/utils/constant";

export const createConversation = (applicationId) =>
  axios.post(`${CHAT_API_END_POINT}/conversations`, { applicationId });

export const fetchConversations = () =>
  axios.get(`${CHAT_API_END_POINT}/conversations`);

export const fetchConversation = (conversationId) =>
  axios.get(`${CHAT_API_END_POINT}/conversations/${conversationId}`);

export const fetchConversationByApplication = (applicationId) =>
  axios.get(`${CHAT_API_END_POINT}/by-application/${applicationId}`);

export const fetchMessages = ({ conversationId, before, limit = 40 }) =>
  axios.get(`${CHAT_API_END_POINT}/conversations/${conversationId}/messages`, {
    params: { before, limit },
  });

export const sendMessageApi = ({ conversationId, payload }) =>
  axios.post(`${CHAT_API_END_POINT}/conversations/${conversationId}/messages`, payload);

export const markReadApi = (conversationId) =>
  axios.post(`${CHAT_API_END_POINT}/conversations/${conversationId}/read`);

export const editMessageApi = (messageId, body) =>
  axios.patch(`${CHAT_API_END_POINT}/messages/${messageId}`, { body });

export const deleteMessageApi = (messageId) =>
  axios.delete(`${CHAT_API_END_POINT}/messages/${messageId}`);

export const toggleReactionApi = (messageId, emoji) =>
  axios.post(`${CHAT_API_END_POINT}/messages/${messageId}/reactions`, { emoji });

export const toggleMessagePinApi = (messageId) =>
  axios.post(`${CHAT_API_END_POINT}/messages/${messageId}/pin`);

export const updateConversationApi = (conversationId, action) =>
  axios.patch(`${CHAT_API_END_POINT}/conversations/${conversationId}`, { action });

export const deleteConversationApi = (conversationId) =>
  axios.delete(`${CHAT_API_END_POINT}/conversations/${conversationId}`);

export const uploadChatFilesApi = (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return axios.post(`${CHAT_API_END_POINT}/upload`, formData);
};

export const fetchPresence = (userIds) =>
  axios.get(`${CHAT_API_END_POINT}/presence`, { params: { userIds: userIds.join(",") } });
