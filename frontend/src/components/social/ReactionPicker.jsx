import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { REACTIONS, REACTION_ORDER, totalReactions } from "@/utils/social";
import { cn } from "@/lib/utils";

export function ReactionPreview({ counts, className, onView }) {
  const total = totalReactions(counts);
  if (total === 0) return <span className={cn("text-xs text-muted-foreground", className)}>Be the first to react</span>;

  const reactions = REACTION_ORDER.filter((r) => (counts?.[r] || 0) > 0);
  return (
    <button
      onClick={onView}
      className={cn("flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground", className)}
      title="View reactions"
    >
      <span className="flex -space-x-1.5">
        {reactions.slice(0, 3).map((r) => (
          <span key={r} className="flex size-4 items-center justify-center rounded-full text-[10px]">{REACTIONS[r].emoji}</span>
        ))}
      </span>
      <span>{formatTotal(total)}</span>
    </button>
  );
}

function formatTotal(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export default function ReactionPicker({ current, onChange, counts, className }) {
  const [open, setOpen] = useState(false);
  const [ripple, setRipple] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (type) => {
    setRipple(type);
    setOpen(false);
    onChange(type);
    setTimeout(() => setRipple(null), 700);
  };

  const myReaction = current ? REACTIONS[current] : null;

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.92 }}
        onMouseEnter={() => setOpen(true)}
        onClick={() => handleSelect(current ? current : "like")}
        className={cn(
          "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors",
          current ? REACTIONS[current].cls : "text-muted-foreground hover:bg-muted hover:text-foreground",
          className
        )}
      >
        <span className="relative flex items-center">
          {ripple && (
            <motion.span
              key={ripple}
              initial={{ scale: 0.4, opacity: 1 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex items-center justify-center text-xl"
            >
              {REACTIONS[ripple].emoji}
            </motion.span>
          )}
          <motion.span
            key={current || "none"}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="inline-flex"
          >
            {myReaction ? <span className="text-base">{myReaction.emoji}</span> : <ThumbsUp className="size-4" />}
          </motion.span>
        </span>
        {current ? REACTIONS[current].label : "Like"}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onMouseLeave={() => setOpen(false)}
            className="absolute bottom-full left-0 z-30 mb-2 flex items-center gap-1 rounded-full border border-border bg-popover px-3 py-2 shadow-2xl"
          >
            {REACTION_ORDER.map((r) => (
              <motion.button
                key={r}
                whileHover={{ scale: 1.45, y: -6 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                onClick={() => handleSelect(r)}
                className="flex flex-col items-center gap-0.5"
                aria-label={REACTIONS[r].label}
              >
                <span className="text-xl">{REACTIONS[r].emoji}</span>
                <span className="text-[9px] font-semibold text-muted-foreground">{REACTIONS[r].label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}