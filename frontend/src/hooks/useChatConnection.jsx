import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { setUnreadCount, upsertConversationPreview } from "@/store/slices/chatSlice";
import { getUnreadCount } from "@/services/chat.api";

const POLL_INTERVAL_MS = 30000;

// Mounted once near the app root. Keeps a single socket connection alive for
// the logged-in user's whole session so the "Messages" nav badge stays live
// everywhere, not just while a chat page is open. Falls back to polling the
// unread-count endpoint in case the socket is ever down.
export default function useChatConnection() {
    const dispatch = useDispatch();
    const token = useSelector((store) => store.auth.token);
    const user = useSelector((store) => store.auth.user);

    useEffect(() => {
        if (!token || !user) {
            disconnectSocket();
            return;
        }

        const socket = connectSocket(token);

        const refreshUnreadCount = async () => {
            try {
                const res = await getUnreadCount();
                if (res.data.success) dispatch(setUnreadCount(res.data.unreadCount));
            } catch {
                // Non-fatal — badge just stays stale until the next tick.
            }
        };

        refreshUnreadCount();

        const handleNewMessage = ({ message, conversationId }) => {
            const isReceiver = String(message.receiver) === String(user._id);
            dispatch(
                upsertConversationPreview({
                    conversationId,
                    lastMessage: message.content,
                    lastMessageAt: message.createdAt,
                    lastMessageSender: message.sender,
                    unreadDelta: isReceiver ? 1 : 0,
                })
            );
            if (isReceiver) refreshUnreadCount();
        };

        socket?.on("chat:new-message", handleNewMessage);

        const pollId = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);

        return () => {
            getSocket()?.off("chat:new-message", handleNewMessage);
            clearInterval(pollId);
        };
    }, [token, user, dispatch]);
}
