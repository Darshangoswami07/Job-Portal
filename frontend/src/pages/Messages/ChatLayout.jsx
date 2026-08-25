import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { MessageSquare } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { getConversations } from "@/services/chat.api";
import { setConversations } from "@/store/slices/chatSlice";

export default function ChatLayout() {
  const { conversationId } = useParams();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getConversations();
        if (!cancelled && res.data.success) {
          dispatch(setConversations(res.data.conversations));
        }
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl flex-1 overflow-hidden px-0 sm:px-4 sm:py-4 lg:px-8">
        <div className="flex w-full overflow-hidden rounded-none border-gray-200 bg-white sm:rounded-lg sm:border sm:card-shadow">
          <div className={conversationId ? "hidden w-full shrink-0 border-r border-gray-200 md:block md:w-[360px]" : "w-full shrink-0 border-r border-gray-200 md:block md:w-[360px]"}>
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0A66C2] border-t-transparent" />
              </div>
            ) : loadError ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-gray-500">
                Couldn't load your conversations. Please refresh the page.
              </div>
            ) : (
              <ConversationList />
            )}
          </div>

          <div className={conversationId ? "flex w-full flex-1" : "hidden flex-1 md:flex"}>
            {conversationId ? (
              <ChatWindow key={conversationId} conversationId={conversationId} />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <MessageSquare className="h-7 w-7 text-gray-300" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">Select a conversation</h3>
                <p className="mt-1 max-w-xs text-xs text-gray-400">
                  Choose a conversation from the list to view messages.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
