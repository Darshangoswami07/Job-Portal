import { useState } from "react";
import { motion } from "framer-motion";
import MessageReactions from "./MessageReactions";
import { HoverActions, ReplyPreview, EditComposer, MessageMenu, MessageContent, MessageTimestamp, PinnedBadge } from "./messageParts";
import { cn } from "@/lib/utils";

export default function OutgoingMessage({
  message,
  userId,
  isLastInGroup = true,
  justSent = false,
  onReact,
  onEdit,
  onDelete,
  onReply,
  onCopy,
  onForward,
  onTogglePin,
  onOpenImage,
}) {
  const [reactOpen, setReactOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const isPinned = (message.pinnedBy || []).some((id) => String(id) === String(userId));

  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="group relative flex w-full justify-end px-1 pl-6 pr-2"
    >
      <div className="relative min-w-0 max-w-[90%] sm:max-w-[80%] lg:max-w-[65%]">
        <div className="relative">
          <HoverActions
            onReply={() => onReply?.(message)}
            onReact={() => setReactOpen(true)}
            onCopy={() => onCopy?.(message)}
            onForward={() => onForward?.(message)}
            className="-left-16"
          />

          <div className="absolute -left-10 top-1/2 z-30 -translate-y-1/2">
            <MessageMenu
              canEdit
              canDelete
              isText={message.type === "text"}
              isPinned={isPinned}
              onReact={() => setReactOpen(true)}
              onReply={() => onReply?.(message)}
              onCopy={() => onCopy?.(message)}
              onForward={() => onForward?.(message)}
              onTogglePin={() => onTogglePin?.(message._id)}
              onEdit={() => setEditing(true)}
              onDelete={() => onDelete?.(message._id)}
            />
          </div>

          <div
            className={cn(
              "relative rounded-[20px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 px-3.5 py-2.5 text-white shadow-lg shadow-indigo-500/20",
              isLastInGroup && "rounded-br-[6px]",
              justSent && "ring-2 ring-indigo-300/60 dark:ring-indigo-500/50",
              isPinned && "ring-2 ring-amber-300/70 dark:ring-amber-500/50"
            )}
          >
            {isLastInGroup && (
              <span className="absolute -bottom-[5px] right-2 h-2.5 w-2.5 rotate-45 rounded-[2px] bg-indigo-600" />
            )}
            {isPinned && <PinnedBadge />}
            <ReplyPreview message={message} isMine />
            <MessageContent message={message} isMine onOpenImage={onOpenImage} />
            {editing && (
              <EditComposer
                initial={message.body || ""}
                onCancel={() => setEditing(false)}
                onSubmit={(value) => {
                  setEditing(false);
                  onEdit?.(value);
                }}
              />
            )}
            <MessageTimestamp message={message} isMine showReceipts />
          </div>
        </div>

        <MessageReactions
          message={message}
          userId={userId}
          onReact={onReact}
          open={reactOpen}
          onOpenChange={setReactOpen}
          className="mt-1 flex justify-end pr-1"
        />
      </div>
    </motion.div>
  );
}
