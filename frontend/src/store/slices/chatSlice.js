import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  conversations: [],
  messages: {},
  hasMore: {},
  messagesLoading: {},
  conversationsLoading: false,
  activeConversationId: null,
  socketConnected: false,
  typing: {},
  onlineUsers: {},
  lightbox: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setConversationsLoading(state, action) {
      state.conversationsLoading = action.payload;
    },
    setConversations(state, action) {
      state.conversations = action.payload;
    },
    upsertConversation(state, action) {
      const incoming = action.payload;
      const index = state.conversations.findIndex(
        (c) => String(c._id) === String(incoming._id)
      );
      if (index >= 0) {
        state.conversations[index] = {
          ...state.conversations[index],
          ...incoming,
        };
      } else {
        state.conversations = [incoming, ...state.conversations];
      }
    },
    removeConversation(state, action) {
      const id = action.payload;
      state.conversations = state.conversations.filter(
        (c) => String(c._id) !== String(id)
      );
      delete state.messages[id];
    },
    setActiveConversation(state, action) {
      state.activeConversationId = action.payload;
    },
    setMessages(state, action) {
      const { conversationId, messages } = action.payload;
      state.messages[conversationId] = messages;
    },
    prependMessages(state, action) {
      const { conversationId, messages } = action.payload;
      const existing = state.messages[conversationId] || [];
      const existingIds = new Set(existing.map((m) => String(m._id)));
      const fresh = messages.filter((m) => !existingIds.has(String(m._id)));
      state.messages[conversationId] = [...fresh, ...existing];
    },
    setHasMore(state, action) {
      const { conversationId, hasMore } = action.payload;
      state.hasMore[conversationId] = hasMore;
    },
    setMessagesLoading(state, action) {
      const { conversationId, loading } = action.payload;
      state.messagesLoading[conversationId] = loading;
    },
    addMessage(state, action) {
      const { conversationId, message } = action.payload;
      const list = state.messages[conversationId] || [];
      if (list.some((m) => String(m._id) === String(message._id))) return;
      state.messages[conversationId] = [...list, message];
    },
    replaceMessage(state, action) {
      const { conversationId, tempId, message } = action.payload;
      const list = state.messages[conversationId] || [];
      const idx = list.findIndex(
        (m) => String(m._id) === String(tempId) || String(m.tempId) === String(tempId)
      );
      if (idx >= 0) {
        state.messages[conversationId] = [
          ...list.slice(0, idx),
          message,
          ...list.slice(idx + 1),
        ];
      } else {
        state.messages[conversationId] = [...list, message];
      }
    },
    failMessage(state, action) {
      const { conversationId, tempId } = action.payload;
      const list = state.messages[conversationId] || [];
      const idx = list.findIndex((m) => String(m.tempId) === String(tempId));
      if (idx >= 0) {
        state.messages[conversationId][idx] = { ...list[idx], status: "error" };
      }
    },
    updateMessage(state, action) {
      const { conversationId, message } = action.payload;
      const list = state.messages[conversationId] || [];
      const idx = list.findIndex((m) => String(m._id) === String(message._id));
      if (idx >= 0) {
        state.messages[conversationId][idx] = message;
      }
    },
    removeMessageFromState(state, action) {
      const { conversationId, messageId } = action.payload;
      const list = state.messages[conversationId] || [];
      state.messages[conversationId] = list.filter(
        (m) => String(m._id) !== String(messageId)
      );
    },
    markDeliveredByRemote(state, action) {
      const { conversationId, userId, messageIds } = action.payload || {};
      const list = state.messages[conversationId] || [];
      state.messages[conversationId] = list.map((m) => {
        if (messageIds?.length && !messageIds.includes(String(m._id))) return m;
        if ((m.deliveredTo || []).some((r) => String(r?._id || r) === String(userId))) return m;
        return { ...m, deliveredTo: [...(m.deliveredTo || []), userId] };
      });
    },
    markReadByRemote(state, action) {
      const { conversationId, userId, messageIds } = action.payload || {};
      const list = state.messages[conversationId] || [];
      state.messages[conversationId] = list.map((m) => {
        if (messageIds?.length && !messageIds.includes(String(m._id))) return m;
        if ((m.readBy || []).some((r) => String(r?._id || r) === String(userId))) return m;
        return { ...m, readBy: [...(m.readBy || []), userId] };
      });
    },
    markConversationRead(state, action) {
      const conversationId = action.payload;
      const conv = state.conversations.find((c) => String(c._id) === String(conversationId));
      if (conv) conv.unreadCount = 0;
    },
    setTyping(state, action) {
      const { conversationId, isTyping } = action.payload;
      state.typing[conversationId] = isTyping;
    },
    setOnline(state, action) {
      const { userId, online } = action.payload;
      state.onlineUsers[userId] = online;
    },
    setPresence(state, action) {
      state.onlineUsers = { ...state.onlineUsers, ...action.payload };
    },
    setSocketConnected(state, action) {
      state.socketConnected = action.payload;
    },
    setLightbox(state, action) {
      state.lightbox = action.payload;
    },
    resetChat(state) {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setConversationsLoading,
  setConversations,
  upsertConversation,
  removeConversation,
  setActiveConversation,
  setMessages,
  prependMessages,
  setHasMore,
  setMessagesLoading,
  addMessage,
  replaceMessage,
  failMessage,
  updateMessage,
  removeMessageFromState,
  markDeliveredByRemote,
  markReadByRemote,
  markConversationRead,
  setTyping,
  setOnline,
  setPresence,
  setSocketConnected,
  setLightbox,
  resetChat,
} = chatSlice.actions;

export const selectUnreadTotal = (state) =>
  state.chat.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

export default chatSlice.reducer;
