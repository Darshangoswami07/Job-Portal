import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

export default function FilterDrawer({ open, onClose, resultCount, onClearAll, children }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.3 }}
            className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl border-t border-border bg-background"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <span className="text-sm font-bold text-foreground">Filters</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>

            <div className="flex items-center gap-3 border-t border-border p-4">
              <button
                type="button"
                onClick={onClearAll}
                className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Show {resultCount != null ? resultCount.toLocaleString() : ""} jobs
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
