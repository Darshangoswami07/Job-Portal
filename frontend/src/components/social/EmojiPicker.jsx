import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import EmojiPickerReact from "emoji-picker-react";
import { Smile } from "lucide-react";

export function EmojiPicker({ onPick, className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className={className || "relative"}>
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Add emoji"
      >
        <Smile className="size-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="absolute bottom-full right-0 z-50 mb-2"
          >
            <EmojiPickerReact
              onEmojiClick={(emojiData) => { onPick(emojiData.emoji); setOpen(false); }}
              height={320}
              width={280}
              searchPlaceHolder="Search emoji..."
              lazyLoadEmojis
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}