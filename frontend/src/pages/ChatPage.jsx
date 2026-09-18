import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PenSquare, MessageSquare } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ConversationCard from "@/components/chat/ConversationCard";
import ChatWindow from "@/components/chat/ChatWindow";
import StartChatSheet from "@/components/chat/StartChatSheet";
import ImageLightbox from "@/components/chat/ImageLightbox";
import { EmptyConversationList, EmptyChatWindow } from "@/components/chat/EmptyStates";
import { fetchConversations } from "@/api/chatApi";
import { createConversation } from "@/api/chatApi";
import useChatSocket from "@/hooks/useChatSocket";
import {
  setConversations,
  setConversationsLoading,
  setActiveConversation,
  markConversationRead,
} from "@/store/slices/chatSlice";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const conversationMatches = (conversation, query, userId) => {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const other = (conversation.participants || []).find(
    (p) => String(p?._id || p) !== String(userId)
  );
  const name = other?.fullname || "";
  const jobTitle = conversation.job?.title || "";
  const company = conversation.company?.name || "";
  return `${name} ${jobTitle} ${company}`.toLowerCase().includes(q);
};

export default function ChatPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("conversation");

  const user = useSelector((s) => s.auth.user);
  const userId = String(user?._id || "");
  const conversations = useSelector((s) => s.chat.conversations);
  const conversationsLoading = useSelector((s) => s.chat.conversationsLoading);
  const socketConnected = useSelector((s) => s.chat.socketConnected);

  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  useChatSocket();

  const activeId = urlConversationId || queryId;

  useEffect(() => {
    if (activeId) dispatch(setActiveConversation(activeId));
  }, [activeId, dispatch]);

  useEffect(() => {
    let cancelled = false;
    dispatch(setConversationsLoading(true));
    fetchConversations()
      .then((res) => {
        if (!cancelled && res.data?.success) {
          dispatch(setConversations(res.data.conversations || []));
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load conversations");
      })
      .finally(() => {
        if (!cancelled) dispatch(setConversationsLoading(false));
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const filtered = useMemo(() => {
    return conversations
      .filter((c) => conversationMatches(c, search, userId))
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return (
          new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt)
        );
      });
  }, [conversations, search, userId]);

  const openConversation = (id) => {
    dispatch(setActiveConversation(id));
    dispatch(markConversationRead(id));
    navigate(`/chat/${id}`);
  };

  const handleStart = async (application) => {
    try {
      const res = await createConversation(String(application._id));
      if (res.data?.success) {
        dispatch(setActiveConversation(res.data.conversation._id));
        dispatch(setConversations([res.data.conversation, ...conversations]));
        setSheetOpen(false);
        navigate(`/chat/${res.data.conversation._id}`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to start chat");
    }
  };

  const showList = !activeId;
  const showChat = Boolean(activeId);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F3F2EF] dark:bg-[#0D1117]">
      <Navbar />
      <div className="flex min-h-0 flex-1">
        <ChatSidebar unreadTotal={0} />

        <section
          className={cn(
            "min-h-0 w-full flex-col bg-white dark:bg-slate-950 lg:flex lg:w-80 lg:shrink-0 lg:border-r lg:border-slate-200/80 lg:dark:border-slate-800 xl:w-[360px]",
            showList ? "flex" : "hidden"
          )}
        >
          <div className="border-b border-slate-200/80 px-3 py-3 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">Messages</h1>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-105"
                aria-label="Start a new chat"
                title="Start a new chat"
              >
                <PenSquare className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-indigo-500/50 dark:focus:bg-slate-800 dark:focus:ring-indigo-500/20"
                aria-label="Search conversations"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="space-y-1 p-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl p-3">
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded-full bg-slate-100 dark:bg-slate-800" />
                      <div className="h-3 w-1/3 rounded-full bg-slate-100 dark:bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyConversationList showNewChat={() => setSheetOpen(true)} />
            ) : (
              <div className="py-1">
                {filtered.map((c) => (
                  <ConversationCard
                    key={String(c._id)}
                    conversation={c}
                    userId={userId}
                    active={String(c._id) === String(activeId)}
                    onClick={() => openConversation(String(c._id))}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          className={cn(
            "min-h-0 flex-1",
            showChat ? "flex flex-col" : "hidden",
            "lg:flex lg:flex-col"
          )}
        >
          {showChat ? (
            <ChatWindow
              key={activeId}
              conversationId={activeId}
              onBack={() => navigate("/chat")}
              onDeleted={() => navigate("/chat")}
            />
          ) : (
            <div className="hidden h-full flex-col items-center justify-center lg:flex">
              <EmptyChatWindow />
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {showList && !sheetOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            type="button"
            onClick={() => setSheetOpen(true)}
            className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-2xl shadow-indigo-500/40 lg:hidden"
            aria-label="Start a new chat"
          >
            <MessageSquare className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <StartChatSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onStart={handleStart} />
      <ImageLightbox />

      {!socketConnected && conversations.length > 0 && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-600 shadow-lg dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          Connecting to chat…
        </div>
      )}
    </div>
  );
}
