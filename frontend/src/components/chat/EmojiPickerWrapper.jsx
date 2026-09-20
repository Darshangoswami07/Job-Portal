import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

export default function EmojiPickerWrapper({ onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${open ? "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400"}`}
        aria-label="Emoji picker"
      >
        <Smile className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 z-30 mb-2"
          >
            <EmojiPicker
              width={320}
              height={380}
              lazyLoadEmojis
              theme="auto"
              onEmojiClick={(data) => {
                onSelect(data.emoji);
                setOpen(false);
              }}
              previewConfig={{ showPreview: false }}
              searchPlaceHolder="Search emojis…"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
