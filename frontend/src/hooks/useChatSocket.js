import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { connectSocket, getSocket, disconnectSocket } from "@/utils/socket";
import { fetchConversation, markReadApi } from "@/api/chatApi";
import {
  setSocketConnected,
  addMessage,
  updateMessage,
  removeMessageFromState,
  markDeliveredByRemote,
  markReadByRemote,
  setTyping,
  setOnline,
  upsertConversation,
} from "@/store/slices/chatSlice";

const notifyDesktop = (title, body, url) => {
  if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
    try {
      const n = new Notification(title, { body, icon: "/logo.png" });
      n.onclick = () => {
        window.focus();
        window.location.href = url;
        n.close();
      };
    } catch {
      /* ignore */
    }
  }
};

export default function useChatSocket() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const token = useSelector((s) => s.auth.token);
  const activeConversationId = useSelector((s) => s.chat.activeConversationId);
  const typingTimers = useRef({});
  const activeRef = useRef(activeConversationId);

  useEffect(() => {
    activeRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if (!user || !token) return;
    const socket = connectSocket(token);
    const userId = String(user._id);
    dispatch(setSocketConnected(socket.connected));

    const handleConnect = () => {
      dispatch(setSocketConnected(true));
      if (activeRef.current) socket.emit("chat:join", activeRef.current);
    };
    const handleDisconnect = () => dispatch(setSocketConnected(false));

    const handleMessage = (message) => {
      const conversationId = String(message.conversation);
      const isActive = conversationId === activeRef.current;
      const isOwn = String(message.sender?._id || message.sender) === userId;

      dispatch(
        upsertConversation({
          _id: conversationId,
          lastMessagePreview: message.preview,
          lastMessageAt: message.createdAt,
          lastMessageSender: message.sender,
        })
      );

      if (isOwn) return;

      dispatch(addMessage({ conversationId, message }));

      if (isActive) {
        markReadApi(conversationId).catch(() => {});
        fetchConversation(conversationId)
          .then((res) => {
            if (res.data?.success) {
              dispatch(upsertConversation({ ...res.data.conversation, unreadCount: 0 }));
            }
          })
          .catch(() => {});
      } else {
        const senderName = message.senderName || "New message";
        toast.info(`${senderName}: ${message.preview || "Message"}`, {
          description: "Tap to open conversation",
          action: {
            label: "Open",
            onClick: () => {
              window.location.href = `/chat/${conversationId}`;
            },
          },
        });
        notifyDesktop(senderName, message.preview || "New message", `/chat/${conversationId}`);
      }
    };

    const handleConversationUpdate = ({ conversation }) => {
      if (String(conversation._id) === activeRef.current) {
        dispatch(upsertConversation({ ...conversation, unreadCount: 0 }));
      } else {
        dispatch(upsertConversation(conversation));
      }
    };

    const handleTyping = ({ conversationId, userId: senderId, isTyping }) => {
      if (String(senderId) === userId) return;
      dispatch(setTyping({ conversationId, isTyping: Boolean(isTyping) }));
      if (isTyping) {
        clearTimeout(typingTimers.current[conversationId]);
        typingTimers.current[conversationId] = setTimeout(() => {
          dispatch(setTyping({ conversationId, isTyping: false }));
        }, 4000);
      }
    };

    const handleRead = ({ conversationId, userId: readerId }) => {
      dispatch(markReadByRemote({ conversationId, userId: readerId }));
    };

    const handleDelivered = ({ conversationId, messageIds, userId: deliveredBy }) => {
      dispatch(markDeliveredByRemote({ conversationId, userId: deliveredBy, messageIds }));
    };

    const handleSeen = ({ conversationId, userId: seenBy, messageIds }) => {
      dispatch(markReadByRemote({ conversationId, userId: seenBy, messageIds }));
    };

    const handleMessageUpdate = (message) => {
      dispatch(updateMessage({ conversationId: String(message.conversation), message }));
    };

    const handleMessageDelete = ({ conversationId, messageId, deletedBy, deletedForEveryone }) => {
      if (deletedForEveryone || String(deletedBy) === userId) {
        dispatch(removeMessageFromState({ conversationId, messageId }));
      }
    };

    const handlePresence = ({ userId: onlineId, online }) => {
      dispatch(setOnline({ userId: onlineId, online }));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("chat:message", handleMessage);
    socket.on("chat:conversation:update", handleConversationUpdate);
    socket.on("chat:typing", handleTyping);
    socket.on("chat:read", handleRead);
    socket.on("message_delivered", handleDelivered);
    socket.on("message_seen", handleSeen);
    socket.on("chat:message:update", handleMessageUpdate);
    socket.on("chat:message:delete", handleMessageDelete);
    socket.on("chat:presence", handlePresence);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("chat:message", handleMessage);
      socket.off("chat:conversation:update", handleConversationUpdate);
      socket.off("chat:typing", handleTyping);
      socket.off("chat:read", handleRead);
      socket.off("message_delivered", handleDelivered);
      socket.off("message_seen", handleSeen);
      socket.off("chat:message:update", handleMessageUpdate);
      socket.off("chat:message:delete", handleMessageDelete);
      socket.off("chat:presence", handlePresence);
    };
  }, [user, token, dispatch]);

  useEffect(() => {
    if (!activeConversationId) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("chat:join", activeConversationId);
    return () => socket.emit("chat:leave", activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
    }
  }, [user]);

  return null;
}
