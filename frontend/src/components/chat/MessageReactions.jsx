import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏"];

const groupReactions = (reactions = [], userId) => {
  const map = {};
  (reactions || []).forEach((r) => {
    const id = String(r.user?._id || r.user);
    if (!map[r.emoji]) map[r.emoji] = { emoji: r.emoji, count: 0, mine: false, users: [] };
    map[r.emoji].count += 1;
    if (id === String(userId)) map[r.emoji].mine = true;
    map[r.emoji].users.push(id);
  });
  return Object.values(map);
};

export default function MessageReactions({
  message,
  userId,
  onReact,
  className,
  open,
  onOpenChange,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const pickerOpen = open !== undefined ? open : internalOpen;
  const setPickerOpen = (v) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };

  const groups = groupReactions(message.reactions, userId);

  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-wrap items-center gap-1">
        {groups.map((g) => (
          <motion.button
            key={g.emoji}
            layout
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            type="button"
            onClick={() => onReact(g.emoji)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium shadow-sm transition-colors",
              g.mine
                ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
            aria-label={`React with ${g.emoji}`}
            title={g.users.length ? `${g.count} reaction${g.count > 1 ? "s" : ""}` : undefined}
          >
            <span className="text-sm leading-none">{g.emoji}</span>
            <span>{g.count}</span>
          </motion.button>
        ))}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Add reaction"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 opacity-70 transition-opacity hover:text-indigo-500 hover:opacity-100 dark:border-slate-600 dark:bg-slate-800 sm:opacity-0 sm:group-hover:opacity-70 sm:hover:opacity-100"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <AnimatePresence>
        {pickerOpen && (
          <ReactionPicker
            onPick={(emoji) => {
              onReact(emoji);
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ReactionPicker({ onPick, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute bottom-full z-20 mb-1.5 flex items-center gap-0.5 rounded-2xl border border-slate-200 bg-white/95 p-1 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95"
    >
      {REACTION_EMOJIS.map((emoji, i) => (
        <motion.button
          key={emoji}
          type="button"
          onClick={() => {
            onPick(emoji);
            onClose();
          }}
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.03, type: "spring", stiffness: 500, damping: 20 }}
          whileHover={{ scale: 1.3, y: -3 }}
          whileTap={{ scale: 0.9 }}
          className="rounded-lg p-1.5 text-xl leading-none hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label={`React ${emoji}`}
        >
          {emoji}
        </motion.button>
      ))}
    </motion.div>
  );
}
