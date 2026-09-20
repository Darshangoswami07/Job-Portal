import { memo } from "react";
import { motion } from "framer-motion";
import { Pin, BellOff, CheckCheck } from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import { timeAgo } from "@/utils/chat";
import { cn } from "@/lib/utils";

function ConversationCard({ conversation, userId, active, onClick }) {
  const other = (conversation.participants || []).find(
    (p) => String(p?._id || p) !== String(userId)
  );
  const name = other?.fullname || "User";
  const photo = other?.profilePhoto || other?.profile?.profilePhoto;
  const preview = conversation.lastMessagePreview || "No messages yet";
  const time = timeAgo(conversation.lastMessageAt || conversation.updatedAt);
  const unread = conversation.unreadCount || 0;
  const mine = String(conversation.lastMessageSender?._id || conversation.lastMessageSender) === String(userId);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors",
        active
          ? "bg-indigo-50 dark:bg-indigo-500/10"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
      )}
    >
      <ChatAvatar src={photo} name={name} size="md" online={conversation.otherOnline} showStatus />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("truncate text-sm", active ? "font-bold text-indigo-900 dark:text-indigo-100" : unread ? "font-bold text-slate-800 dark:text-slate-100" : "font-semibold text-slate-700 dark:text-slate-200")}>
            {name}
          </p>
          <span className={cn("shrink-0 text-[11px]", unread ? "font-bold text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500")}>
            {time}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={cn("flex min-w-0 items-center gap-1 truncate text-xs", unread ? "font-semibold text-slate-700 dark:text-slate-200" : "text-slate-500 dark:text-slate-400")}>
            {mine && <CheckCheck className="h-3.5 w-3.5 shrink-0 text-indigo-400" />}
            {!mine && conversation.isMuted && <BellOff className="h-3 w-3 shrink-0 text-slate-400" />}
            <span className="truncate">{preview}</span>
          </p>
          <span className="flex shrink-0 items-center gap-1.5">
            {conversation.isPinned && <Pin className="h-3 w-3 text-indigo-400" fill="currentColor" />}
            {unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 px-1.5 text-[10px] font-bold text-white shadow-sm">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default memo(ConversationCard);
