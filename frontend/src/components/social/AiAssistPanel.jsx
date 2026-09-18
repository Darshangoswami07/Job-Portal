import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, X, Wand2, ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { aiAssist } from "@/api/socialApi";
import { AI_ACTIONS } from "@/utils/social";

export function AiAssistPanel({ open, text, type, extra, onResult, onClose }) {
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(null);

  const run = async (action) => {
    setLoading(true);
    setActive(action);
    try {
      const ctx = {
        title: extra?.title || extra?.name || "",
        company: extra?.company || "",
        location: extra?.location || "",
        type: extra?.employmentType || "",
        salary: extra?.salary || "",
        applyLink: extra?.applyLink || "",
        techStack: extra?.techStack || "",
        github: extra?.github || "",
        demo: extra?.demo || "",
        name: extra?.name || "",
        description: extra?.description || "",
        issuer: extra?.certIssuer || "",
        credentialId: extra?.certId || "",
      };
      const res = await aiAssist({ action, text, context: ctx });
      if (res.data?.success) {
        onResult?.(res.data.result);
        toast.success("AI assist applied");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "AI assist failed");
    } finally {
      setLoading(false);
      setActive(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="mt-3 rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/60 to-indigo-50/40 p-4 dark:border-violet-500/20 dark:from-violet-500/10 dark:to-indigo-500/5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500">
                <Wand2 className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">AI Post Assistant</p>
                <p className="text-[11px] text-muted-foreground">Improve, professionalize & generate content</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-violet-500/10 hover:text-violet-500" aria-label="Close AI panel">
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AI_ACTIONS.map((a) => (
              <button
                key={a.value}
                onClick={() => run(a.value)}
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 rounded-xl border border-violet-200/60 bg-white/60 px-3 py-2 text-xs font-semibold text-foreground transition hover:border-violet-400 hover:bg-white dark:border-violet-500/20 dark:bg-white/5",
                  active === a.value && "ring-2 ring-violet-400/40"
                )}
              >
                {loading && active === a.value ? <Loader2 className="size-3.5 animate-spin text-violet-500" /> : <a.icon className="size-3.5 text-violet-500" />}
                {a.label}
              </button>
            ))}
          </div>

          <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Sparkles className="size-3" /> AI suggestions are generated locally for privacy and speed.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}