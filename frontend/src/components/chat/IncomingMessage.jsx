import { useState } from "react";
import { motion } from "framer-motion";
import ChatAvatar from "./ChatAvatar";
import MessageReactions from "./MessageReactions";
import { HoverActions, ReplyPreview, MessageMenu, MessageContent, MessageTimestamp, PinnedBadge } from "./messageParts";
import { cn } from "@/lib/utils";

export default function IncomingMessage({
  message,
  userId,
  otherUser,
  isFirstInGroup = true,
  isLastInGroup = true,
  onReact,
  onReply,
  onCopy,
  onForward,
  onTogglePin,
  onOpenImage,
}) {
  const [reactOpen, setReactOpen] = useState(false);
  const senderName = message.senderName || message.sender?.fullname || otherUser?.fullname || "User";
  const senderPhoto =
    message.senderPhoto ||
    message.sender?.profile?.profilePhoto ||
    otherUser?.profilePhoto ||
    otherUser?.profile?.profilePhoto;
  const isPinned = (message.pinnedBy || []).some((id) => String(id) === String(userId));

  return (
    <motion.div
      initial={{ opacity: 0, x: -24, y: 6 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="group relative flex w-full items-end gap-2 px-1 pl-2 pr-6"
    >
      <div className="w-7 shrink-0">
        {isLastInGroup && (
          <ChatAvatar src={senderPhoto} name={senderName} size="xs" rounded="rounded-full" />
        )}
      </div>

      <div className="relative min-w-0 max-w-[90%] sm:max-w-[80%] lg:max-w-[65%]">
        {isFirstInGroup && (
          <p className="mb-1 pl-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            {senderName}
          </p>
        )}

        <div className="relative">
          <HoverActions
            onReply={() => onReply?.(message)}
            onReact={() => setReactOpen(true)}
            onCopy={() => onCopy?.(message)}
            onForward={() => onForward?.(message)}
            className="-right-16"
          />

          <div className="absolute -right-10 top-1/2 z-30 -translate-y-1/2">
            <MessageMenu
              canEdit={false}
              canDelete={false}
              isPinned={isPinned}
              onReact={() => setReactOpen(true)}
              onReply={() => onReply?.(message)}
              onCopy={() => onCopy?.(message)}
              onForward={() => onForward?.(message)}
              onTogglePin={() => onTogglePin?.(message._id)}
            />
          </div>

          <div
            className={cn(
              "relative rounded-[20px] bg-white px-3.5 py-2.5 text-slate-800 shadow-md shadow-slate-900/5 dark:bg-slate-800 dark:text-slate-100",
              isLastInGroup && "rounded-bl-[6px]",
              isPinned && "ring-2 ring-amber-300/70 dark:ring-amber-500/50"
            )}
          >
            {isLastInGroup && (
              <span className="absolute -bottom-[5px] left-2 h-2.5 w-2.5 rotate-45 rounded-[2px] bg-white dark:bg-slate-800" />
            )}
            {isPinned && <PinnedBadge />}
            <ReplyPreview message={message} isMine={false} />
            <MessageContent message={message} isMine={false} onOpenImage={onOpenImage} />
            <MessageTimestamp message={message} isMine={false} />
          </div>
        </div>

        <MessageReactions
          message={message}
          userId={userId}
          onReact={onReact}
          open={reactOpen}
          onOpenChange={setReactOpen}
          className="mt-1 flex justify-start pl-1"
        />
      </div>
    </motion.div>
  );
}
