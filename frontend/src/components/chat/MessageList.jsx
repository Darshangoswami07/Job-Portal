import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, WifiOff } from "lucide-react";
import IncomingMessage from "./IncomingMessage";
import OutgoingMessage from "./OutgoingMessage";
import DateDivider from "./DateDivider";
import MessageSkeleton from "./MessageSkeleton";
import TypingIndicator from "./TypingIndicator";
import { needsDateDivider, messageSenderId, isSameSender } from "@/utils/chat";
import { cn } from "@/lib/utils";

const ESTIMATE_ROW = 78;

export default function MessageList({
  conversationId,
  messages = [],
  hasMore = false,
  loadingOlder = false,
  loadingInitial = false,
  userId,
  typing = false,
  otherUser,
  socketConnected = true,
  onLoadOlder,
  onReact,
  onEdit,
  onDelete,
  onOpenImage,
  onReply,
  onForward,
  onCopy,
  onTogglePin,
}) {
  const scrollRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const [newCount, setNewCount] = useState(0);

  const rows = useMemo(() => {
    const out = [];
    messages.forEach((m, i) => {
      const prev = messages[i - 1];
      if (needsDateDivider(prev?.createdAt, m.createdAt)) {
        out.push({ type: "date", date: m.createdAt, key: `d-${i}` });
      }
      out.push({ type: "msg", message: m, index: i, key: m._id });
    });
    return out;
  }, [messages]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATE_ROW,
    overscan: 12,
    getItemKey: (index) => rows[index]?.key || index,
  });

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distanceFromBottom < 60;
    if (isAtBottomRef.current && newCount > 0) setNewCount(0);

    if (el.scrollTop < 80 && hasMore && !loadingOlder) {
      onLoadOlder?.();
    }
  }, [hasMore, loadingOlder, onLoadOlder, newCount]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const lastMessageId = rows.length ? String(rows[rows.length - 1]?.key || "") : "";
  const prevLastRef = useRef("");
  const prevCountRef = useRef(0);

  useEffect(() => {
    const prev = prevLastRef.current;
    const count = rows.length;
    const grew = count > prevCountRef.current;
    const newTail = lastMessageId && lastMessageId !== prev;

    if ((grew && newTail && isAtBottomRef.current) || (grew && prevCountRef.current === 0 && isAtBottomRef.current)) {
      scrollToBottom();
    }
    prevLastRef.current = lastMessageId;
    prevCountRef.current = count;

    if (newTail && !isAtBottomRef.current) {
      setNewCount((c) => c + 1);
    }
  }, [lastMessageId, rows.length, scrollToBottom]);

  useEffect(() => {
    if (loadingInitial) {
      const t = setTimeout(() => scrollToBottom("auto"), 100);
      return () => clearTimeout(t);
    }
    isAtBottomRef.current = true;
    setNewCount(0);
    scrollToBottom("auto");
  }, [conversationId, loadingInitial, scrollToBottom]);

  if (loadingInitial) {
    return <MessageSkeleton />;
  }

  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/15 to-sky-500/15 text-indigo-500 dark:text-indigo-400"
          >
            <ArrowDown className="h-7 w-7" />
          </motion.div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {otherUser?.fullname ? `Say hi to ${otherUser.fullname.split(" ")[0]}` : "Start the conversation"}
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-slate-400 dark:text-slate-500">
            Send a message about the job, interview, or next steps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={scrollRef} className="relative h-full overflow-y-auto overflow-x-hidden scroll-smooth">
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
          </div>
        )}

        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((row) => {
            const item = rows[row.index];
            if (item.type === "date") {
              return (
                <div
                  key={row.key}
                  data-index={row.index}
                  ref={virtualizer.measureElement}
                  className="absolute left-0 top-0 w-full"
                  style={{ transform: `translateY(${row.start}px)` }}
                >
                  <DateDivider date={item.date} />
                </div>
              );
            }
            const m = item.message;
            const prev = messages[item.index - 1];
            const next = messages[item.index + 1];
            const isMine = messageSenderId(m) === String(userId);
            const sameDayAsPrev = prev && !needsDateDivider(prev.createdAt, m.createdAt);
            const consecutivePrev =
              prev &&
              sameDayAsPrev &&
              isSameSender(prev, m) &&
              new Date(m.createdAt) - new Date(prev.createdAt) < 5 * 60 * 1000;
            const consecutiveNext =
              next &&
              !needsDateDivider(m.createdAt, next.createdAt) &&
              isSameSender(next, m) &&
              new Date(next.createdAt) - new Date(m.createdAt) < 5 * 60 * 1000;

            return (
              <div
                key={row.key}
                data-index={row.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full"
                style={{ transform: `translateY(${row.start}px)` }}
              >
                <div className={cn("w-full", consecutivePrev ? "pt-1.5" : item.index === 0 ? "pt-2" : "pt-[18px]")}>
                  {isMine ? (
                    <OutgoingMessage
                      message={m}
                      userId={userId}
                      isLastInGroup={!consecutiveNext}
                      justSent={Boolean(m.justSent)}
                      onReact={onReact}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onOpenImage={onOpenImage}
                      onReply={onReply}
                      onForward={onForward}
                      onCopy={onCopy}
                      onTogglePin={onTogglePin}
                    />
                  ) : (
                    <IncomingMessage
                      message={m}
                      userId={userId}
                      otherUser={otherUser}
                      isFirstInGroup={!consecutivePrev}
                      isLastInGroup={!consecutiveNext}
                      onReact={onReact}
                      onReply={onReply}
                      onForward={onForward}
                      onCopy={onCopy}
                      onTogglePin={onTogglePin}
                      onOpenImage={onOpenImage}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="pointer-events-none absolute bottom-3 left-4"
            >
              <div className="inline-flex items-center rounded-2xl rounded-bl-md bg-white px-3 py-2 shadow-md dark:bg-slate-800">
                <TypingIndicator label={otherUser?.fullname?.split(" ")[0] ? `${otherUser.fullname.split(" ")[0]} is typing…` : "typing…"} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!socketConnected && (
        <div className="absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          <WifiOff className="h-3 w-3" />
          Reconnecting…
        </div>
      )}

      <AnimatePresence>
        {!isAtBottomRef.current && newCount > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => { setNewCount(0); scrollToBottom(); }}
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-indigo-600 shadow-lg hover:bg-indigo-50 dark:border-indigo-500/40 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {newCount} new
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
