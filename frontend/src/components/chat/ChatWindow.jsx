import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  fetchConversation,
  fetchMessages,
  sendMessageApi,
  markReadApi,
  editMessageApi,
  deleteMessageApi,
  toggleReactionApi,
  toggleMessagePinApi,
  updateConversationApi,
  deleteConversationApi,
  uploadChatFilesApi,
} from "@/api/chatApi";
import {
  setActiveConversation,
  upsertConversation,
  setMessages,
  prependMessages,
  setHasMore,
  setMessagesLoading,
  addMessage,
  replaceMessage,
  failMessage,
  updateMessage,
  removeMessageFromState,
  removeConversation,
  markConversationRead,
  setLightbox,
} from "@/store/slices/chatSlice";
import ChatHeader from "./ChatHeader";
import ApplicationInfoCard from "./ApplicationInfoCard";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import QuickActions from "./QuickActions";
import ChatBackground from "./ChatBackground";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const isGoneError = (error) => {
  const status = error?.response?.status;
  return status === 403 || status === 404;
};

export default function ChatWindow({ conversationId, onBack, onDeleted }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const userId = String(user?._id || "");

  const conversation = useSelector((s) =>
    s.chat.conversations.find((c) => String(c._id) === String(conversationId))
  );
  const messages = useSelector((s) => s.chat.messages[conversationId] || []);
  const hasMore = useSelector((s) => Boolean(s.chat.hasMore[conversationId]));
  const messagesLoading = useSelector((s) => Boolean(s.chat.messagesLoading[conversationId]));
  const typing = useSelector((s) => Boolean(s.chat.typing[conversationId]));
  const socketConnected = useSelector((s) => s.chat.socketConnected);
  const onlineUsers = useSelector((s) => s.chat.onlineUsers);

  const [infoOpen, setInfoOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadingOlderRef = useRef(false);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardTarget, setForwardTarget] = useState(null);
  const onDeletedRef = useRef(onDeleted);

  useEffect(() => {
    onDeletedRef.current = onDeleted;
  });

  const handleGone = useCallback(() => {
    dispatch(removeConversation(conversationId));
    toast.error("This conversation is no longer available.");
    onDeletedRef.current?.();
  }, [conversationId, dispatch]);

  const otherId = conversation?.otherParticipantId || null;
  const otherUser = (conversation?.participants || []).find(
    (p) => String(p?._id || p) === String(otherId)
  );
  const otherOnline =
    otherId !== null && onlineUsers[otherId] !== undefined
      ? Boolean(onlineUsers[otherId])
      : Boolean(conversation?.otherOnline);

  useEffect(() => {
    if (!conversationId) return;
    setInfoOpen(false);
    dispatch(setActiveConversation(conversationId));
    dispatch(setMessagesLoading({ conversationId, loading: true }));
    dispatch(markConversationRead(conversationId));

    markReadApi(conversationId).catch(() => {});
    fetchConversation(conversationId)
      .then((res) => {
        if (res.data?.success) {
          dispatch(upsertConversation(res.data.conversation));
        }
      })
      .catch((error) => {
        if (isGoneError(error)) handleGone();
      });

    fetchMessages({ conversationId })
      .then((res) => {
        if (res.data?.success) {
          dispatch(setMessages({ conversationId, messages: res.data.messages }));
          dispatch(setHasMore({ conversationId, hasMore: res.data.hasMore }));
        }
      })
      .catch((error) => {
        if (isGoneError(error)) handleGone();
      })
      .finally(() => {
        dispatch(setMessagesLoading({ conversationId, loading: false }));
      });
  }, [conversationId, dispatch, handleGone]);

  const loadOlder = useCallback(() => {
    if (!conversationId || loadingOlderRef.current) return;
    const first = messages[0];
    if (!first) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    fetchMessages({ conversationId, before: first.createdAt })
      .then((res) => {
        if (res.data?.success) {
          dispatch(prependMessages({ conversationId, messages: res.data.messages }));
          dispatch(setHasMore({ conversationId, hasMore: res.data.hasMore }));
        }
      })
      .catch(() => {})
      .finally(() => {
        loadingOlderRef.current = false;
        setLoadingOlder(false);
      });
  }, [conversationId, messages, dispatch]);

  const sendMessage = useCallback(
    async ({ body, type, attachment, audio }) => {
      if (!conversationId) return;
      const payload = { body: body || "", type: type || "text" };
      if (attachment) payload.attachment = attachment;
      if (replyTo?._id) payload.replyTo = replyTo._id;

      if (audio?.blob) {
        try {
          const file = new File([audio.blob], "voice-message.webm", {
            type: audio.mime || "audio/webm",
          });
          const up = await uploadChatFilesApi([file]);
          const uploaded = up.data?.files?.[0];
          if (!uploaded) throw new Error("Upload failed");
          payload.audio = { url: uploaded.url, duration: audio.duration };
          payload.type = "voice";
        } catch {
          toast.error("Failed to upload voice message");
          return;
        }
      }

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const temp = {
        _id: tempId,
        tempId,
        conversation: conversationId,
        sender: userId,
        senderName: user?.fullname || "You",
        body: payload.body,
        type: payload.type,
        attachment: payload.attachment,
        audio: payload.audio,
        replyTo: replyTo?._id ? { _id: replyTo._id, body: replyTo.body } : undefined,
        createdAt: new Date().toISOString(),
        status: "sending",
        justSent: true,
        readBy: [],
        deliveredTo: [userId],
      };
      dispatch(addMessage({ conversationId, message: temp }));

      try {
        const res = await sendMessageApi({ conversationId, payload });
        if (res.data?.success) {
          dispatch(
            replaceMessage({ conversationId, tempId, message: { ...res.data.message, status: "sent" } })
          );
          dispatch(
            upsertConversation({
              _id: conversationId,
              lastMessagePreview: res.data.message.preview,
              lastMessageAt: res.data.message.createdAt,
              lastMessageSender: userId,
            })
          );
        }
        setReplyTo(null);
      } catch (error) {
        if (isGoneError(error)) {
          handleGone();
        } else {
          dispatch(failMessage({ conversationId, tempId }));
          toast.error("Failed to send message. Please try again.");
        }
      }
    },
    [conversationId, userId, user?.fullname, replyTo, dispatch, handleGone]
  );

  const handleForward = useCallback(
    async (message, targetConversationId) => {
      try {
        const payload = { body: message.body || "", type: message.type === "text" ? "text" : message.type };
        if (message.attachment?.url) payload.attachment = message.attachment;
        if (message.audio?.url) payload.audio = message.audio;
        await sendMessageApi({ conversationId: targetConversationId, payload });
        toast.success("Message forwarded");
        setForwardTarget(null);
      } catch {
        toast.error("Failed to forward message");
      }
    },
    []
  );

  const handleCopy = useCallback(
    async (message) => {
      const text =
        message.type === "text"
          ? message.body
          : message.type === "image"
            ? message.attachment?.url
            : message.attachment?.name || "";
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
      } catch {
        toast.error("Failed to copy");
      }
    },
    []
  );

  const handleTogglePin = useCallback(
    (messageId) => {
      toggleMessagePinApi(messageId)
        .then((res) => {
          if (res.data?.success) {
            dispatch(updateMessage({ conversationId, message: res.data.message }));
          }
        })
        .catch(() => toast.error("Failed to update message"));
    },
    [conversationId, dispatch]
  );

  const handleReact = useCallback(
    (messageId, emoji) => {
      toggleReactionApi(messageId, emoji)
        .then((res) => {
          if (res.data?.success) {
            dispatch(updateMessage({ conversationId, message: res.data.message }));
          }
        })
        .catch(() => {});
    },
    [conversationId, dispatch]
  );

  const handleEdit = useCallback(
    (messageId, body) => {
      editMessageApi(messageId, body)
        .then((res) => {
          if (res.data?.success) {
            dispatch(updateMessage({ conversationId, message: res.data.message }));
          }
        })
        .catch(() => toast.error("Failed to edit message"));
    },
    [conversationId, dispatch]
  );

  const handleDelete = useCallback(
    (messageId) => {
      deleteMessageApi(messageId)
        .then(() => {
          dispatch(removeMessageFromState({ conversationId, messageId }));
        })
        .catch(() => toast.error("Failed to delete message"));
    },
    [conversationId, dispatch]
  );

  const handleOpenImage = useCallback(
    (url) => dispatch(setLightbox({ url, name: "Chat image" })),
    [dispatch]
  );

  const toggleAction = useCallback(
    (action) => {
      updateConversationApi(conversationId, action)
        .then((res) => {
          if (res.data?.success) {
            dispatch(
              upsertConversation({
                ...conversation,
                isPinned: res.data.conversation.isPinned,
                isArchived: res.data.conversation.isArchived,
                isMuted: res.data.conversation.isMuted,
              })
            );
          }
        })
        .catch(() => toast.error("Failed to update conversation"));
    },
    [conversationId, conversation, dispatch]
  );

  const handleDeleteConversation = async () => {
    setConfirmDelete(false);
    try {
      await deleteConversationApi(conversationId);
      dispatch(removeConversation(conversationId));
      toast.success("Conversation deleted");
      onDeleted?.();
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  const role = user?.currentRole === "recruiter" ? "recruiter" : "applicant";

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <ChatBackground />
      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <ChatHeader
          conversation={{ ...conversation, infoOpen, otherOnline }}
          userId={userId}
          onBack={onBack}
          onToggleInfo={() => setInfoOpen((v) => !v)}
          onTogglePin={() => toggleAction(conversation?.isPinned ? "pin:remove" : "pin:add")}
          onToggleArchive={() => toggleAction(conversation?.isArchived ? "archive:remove" : "archive:add")}
          onToggleMute={() => toggleAction(conversation?.isMuted ? "mute:remove" : "mute:add")}
          onDelete={() => setConfirmDelete(true)}
        />

        <ApplicationInfoCard
          conversation={{ ...conversation, infoOpen }}
          onClose={() => setInfoOpen(false)}
          onViewJob={(id) => id && navigate(`/description/${id}`)}
        />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <MessageList
            conversationId={conversationId}
            messages={messages}
            hasMore={hasMore}
            loadingOlder={loadingOlder}
            loadingInitial={messagesLoading}
            userId={userId}
            typing={typing}
            otherUser={otherUser}
            socketConnected={socketConnected}
            onLoadOlder={loadOlder}
            onReact={handleReact}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenImage={handleOpenImage}
            onReply={setReplyTo}
            onForward={setForwardTarget}
            onCopy={handleCopy}
            onTogglePin={handleTogglePin}
          />
        </div>

        <div className="relative z-10">
          <QuickActions role={role} onSend={(t) => sendMessage({ body: t, type: "text" })} visible={!messagesLoading && messages.length === 0} />
          <MessageInput
            conversationId={conversationId}
            onSend={sendMessage}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
            disabled={Boolean(conversation?.deletedBy?.length)}
          />
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
            <DialogDescription>
              This conversation will be removed from your list. The other person can still see it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConversation}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ForwardDialog
        open={Boolean(forwardTarget)}
        message={forwardTarget}
        currentConversationId={conversationId}
        userId={userId}
        onClose={() => setForwardTarget(null)}
        onForward={handleForward}
      />
    </div>
  );
}

function ForwardDialog({ open, message, currentConversationId, userId, onClose, onForward }) {
  const conversations = useSelector((s) => s.chat.conversations);
  const targets = (conversations || []).filter(
    (c) => String(c._id) !== String(currentConversationId)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Forward message</DialogTitle>
          <DialogDescription>
            Choose a conversation to forward this message to.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] space-y-1 overflow-y-auto">
          {targets.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No other conversations available.
            </p>
          ) : (
            targets.map((c) => {
              const other = (c.participants || []).find(
                (p) => String(p?._id || p) !== String(userId)
              );
              return (
                <button
                  key={String(c._id)}
                  type="button"
                  onClick={() => onForward(message, String(c._id))}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {((other?.fullname || "U").split(" ")[0] || "U")[0].toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {other?.fullname || "User"}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {c.job?.title || c.lastMessagePreview || "Conversation"}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
