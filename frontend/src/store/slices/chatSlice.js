import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        conversations: [],
        unreadCount: 0,
    },
    reducers: {
        setConversations: (state, action) => {
            state.conversations = action.payload;
        },
        setUnreadCount: (state, action) => {
            state.unreadCount = action.payload;
        },
        // Moves the conversation to the top and refreshes its preview whenever a
        // new message arrives (via socket) or is sent, so the list always mirrors
        // "most recently active" without a full refetch.
        upsertConversationPreview: (state, action) => {
            const { conversationId, lastMessage, lastMessageAt, lastMessageSender, unreadDelta = 0 } = action.payload;
            const existing = state.conversations.find((c) => c._id === conversationId);
            if (existing) {
                existing.lastMessage = lastMessage;
                existing.lastMessageAt = lastMessageAt;
                existing.lastMessageSender = lastMessageSender;
                existing.unreadCount = Math.max(0, (existing.unreadCount || 0) + unreadDelta);
                state.conversations = [
                    existing,
                    ...state.conversations.filter((c) => c._id !== conversationId),
                ];
            }
        },
        markConversationRead: (state, action) => {
            const conversationId = action.payload;
            const existing = state.conversations.find((c) => c._id === conversationId);
            if (existing) existing.unreadCount = 0;
        },
        decrementUnreadCount: (state, action) => {
            state.unreadCount = Math.max(0, state.unreadCount - action.payload);
        },
    },
});

export const {
    setConversations,
    setUnreadCount,
    upsertConversationPreview,
    markConversationRead,
    decrementUnreadCount,
} = chatSlice.actions;
export default chatSlice.reducer;
