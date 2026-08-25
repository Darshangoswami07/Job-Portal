import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { ArrowLeft, Send, Briefcase, ExternalLink, AlertCircle, RotateCw } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket";
import {
  getConversationById,
  getMessages,
  sendMessage as sendMessageApi,
  markConversationRead,
} from "@/services/chat.api";
import {
  markConversationRead as markConversationReadAction,
  upsertConversationPreview,
  decrementUnreadCount,
} from "@/store/slices/chatSlice";

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  interviewing: "bg-purple-100 text-purple-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  hired: "bg-green-100 text-green-800",
};

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function MessageBubble({ message, isMine, isRead }) {
  const isFailed = message._status === "failed";
  const isSending = message._status === "sending";
  return (
    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[75%] sm:max-w-[65%]")}>
        <div
          className={cn(
            "whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isMine
              ? "rounded-br-sm bg-[#0A66C2] text-white"
              : "rounded-bl-sm bg-gray-100 text-gray-800",
            isFailed && "border border-red-300 bg-red-50 text-red-700"
          )}
        >
          {message.content}
        </div>
        <div className={cn("mt-1 flex items-center gap-1 text-[11px] text-gray-400", isMine ? "justify-end" : "justify-start")}>
          {isSending ? (
            <span>Sending…</span>
          ) : isFailed ? (
            <button
              onClick={message._retry}
              className="flex items-center gap-1 font-medium text-red-500 hover:text-red-600"
            >
              <RotateCw className="h-3 w-3" /> Failed — retry
            </button>
          ) : (
            <>
              <span>{formatTime(message.createdAt)}</span>
              {isMine && <span>{isRead ? "· Read" : "· Sent"}</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ conversationId }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [readByOther, setReadByOther] = useState(false);

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  const isSeeker = conversation && String(conversation.jobSeeker?._id) === String(user?._id);
  const other = conversation ? (isSeeker ? conversation.recruiter : conversation.jobSeeker) : null;

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setConversation(null);
    setMessages([]);

    (async () => {
      try {
        const [convRes, msgRes] = await Promise.all([
          getConversationById(conversationId),
          getMessages(conversationId),
        ]);
        if (cancelled) return;
        setConversation(convRes.data.conversation);
        setMessages(msgRes.data.messages);
        setTimeout(() => scrollToBottom(false), 0);

        const readRes = await markConversationRead(conversationId);
        dispatch(markConversationReadAction(conversationId));
        if (readRes.data.updatedCount > 0) {
          dispatch(decrementUnreadCount(readRes.data.updatedCount));
        }
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 403) {
          setError("You don't have access to this conversation.");
        } else if (err.response?.status === 404) {
          setError("This conversation could not be found.");
        } else {
          setError("Something went wrong while loading this conversation.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, dispatch, scrollToBottom]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (payload) => {
      if (payload.conversationId !== conversationId) return;
      // The server echoes this event to both participants (so a sender's other
      // open tabs stay in sync). On the tab that just sent it, this can race
      // the REST response that swaps the optimistic temp message in: reconcile
      // against a matching pending temp message first, then fall back to an
      // id check, so the message never ends up rendered twice.
      setMessages((prev) => {
        if (prev.some((m) => m._id === payload.message._id)) return prev;
        const pendingIndex = prev.findIndex(
          (m) =>
            m._status === "sending" &&
            String(m.sender) === String(payload.message.sender) &&
            m.content === payload.message.content
        );
        if (pendingIndex !== -1) {
          const next = [...prev];
          next[pendingIndex] = payload.message;
          return next;
        }
        return [...prev, payload.message];
      });
      setTimeout(() => scrollToBottom(true), 0);

      if (String(payload.message.receiver) === String(user._id)) {
        markConversationRead(conversationId)
          .then((res) => {
            if (res.data.updatedCount > 0) dispatch(decrementUnreadCount(res.data.updatedCount));
          })
          .catch(() => {});
        dispatch(markConversationReadAction(conversationId));
      }
    };

    const handleRead = (payload) => {
      if (payload.conversationId !== conversationId) return;
      setReadByOther(true);
    };

    socket.on("chat:new-message", handleNewMessage);
    socket.on("chat:read", handleRead);
    return () => {
      socket.off("chat:new-message", handleNewMessage);
      socket.off("chat:read", handleRead);
    };
  }, [conversationId, user, dispatch, scrollToBottom]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      conversation: conversationId,
      sender: user._id,
      receiver: other?._id,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      _status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setDraft("");
    setSending(true);
    setTimeout(() => scrollToBottom(true), 0);

    const doSend = async () => {
      try {
        const res = await sendMessageApi(conversationId, content);
        setMessages((prev) => prev.map((m) => (m._id === tempId ? res.data.message : m)));
        dispatch(
          upsertConversationPreview({
            conversationId,
            lastMessage: content,
            lastMessageAt: res.data.message.createdAt,
            lastMessageSender: user._id,
            unreadDelta: 0,
          })
        );
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to send message");
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempId ? { ...m, _status: "failed", _retry: doSend } : m
          )
        );
      } finally {
        setSending(false);
      }
    };

    doSend();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0A66C2] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle className="h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium text-gray-600">{error}</p>
        <Button variant="outline" onClick={() => navigate("/messages")}>
          Back to Messages
        </Button>
      </div>
    );
  }

  const applicationStatus = (conversation?.application?.status || "pending").toLowerCase();
  const lastMineIndex = [...messages].map((m) => String(m.sender) === String(user._id)).lastIndexOf(true);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
        <button
          onClick={() => navigate("/messages")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Avatar size="default" className="shrink-0">
          <AvatarImage src={other?.profile?.profilePhoto} alt={other?.fullname} />
          <AvatarFallback>{(other?.fullname || "?").charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{other?.fullname}</p>
          <p className="truncate text-xs text-gray-500">
            {isSeeker ? conversation?.job?.company?.name || "Recruiter" : conversation?.job?.title}
          </p>
        </div>
        <Badge className={cn("shrink-0 font-medium", statusStyles[applicationStatus] || "bg-gray-100 text-gray-600")}>
          {applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50/60 px-4 py-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" />
          {conversation?.job?.title}
        </span>
        {conversation?.job?._id && (
          <Link
            to={`/description/${conversation.job._id}`}
            className="flex items-center gap-1 font-medium text-[#0A66C2] hover:underline"
          >
            View Job <ExternalLink className="h-3 w-3" />
          </Link>
        )}
        <Link
          to={isSeeker ? "/profile" : `/admin/jobs/${conversation?.job?._id}/applicants`}
          className="flex items-center gap-1 font-medium text-[#0A66C2] hover:underline"
        >
          View Application <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold text-gray-700">Start the conversation</p>
            <p className="mt-1 text-xs text-gray-400">
              Send a message {isSeeker ? "to the recruiter" : "to the applicant"} regarding this application.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => (
            <MessageBubble
              key={m._id}
              message={m}
              isMine={String(m.sender) === String(user._id)}
              isRead={idx === lastMineIndex ? readByOther || m.isRead : m.isRead}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            aria-label="Message"
            maxLength={5000}
            rows={1}
            className="max-h-32 min-h-10 flex-1 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            size="icon"
            className="btn-primary h-10 w-10 shrink-0 rounded-lg"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
