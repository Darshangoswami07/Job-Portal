import { Sparkles, Send } from "lucide-react";
import { motion } from "framer-motion";

const SUGGESTIONS = {
  applicant: [
    "Thank you for the opportunity! I'm excited about this role.",
    "I'd love to learn more about the day-to-day responsibilities.",
    "When would be a good time for an interview?",
    "Is there anything else you need from me to move forward?",
  ],
  recruiter: [
    "Thanks for applying! Your application looks great.",
    "Can we schedule a quick call to discuss the role?",
    "Please share your availability for an interview.",
    "Let me know if you have any questions about the role.",
  ],
};

export default function QuickActions({ role = "applicant", onSend, visible }) {
  if (!visible) return null;
  const suggestions = SUGGESTIONS[role] || SUGGESTIONS.applicant;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-slate-200/60 bg-slate-50/60 px-3 py-2.5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/40"
    >
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        <Sparkles className="h-3 w-3" />
        Quick replies
      </p>
      <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSend(s)}
            className="group flex shrink-0 items-center gap-1.5 rounded-full border border-indigo-200/70 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-indigo-400 hover:text-indigo-600 hover:shadow-sm dark:border-indigo-500/30 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-indigo-300"
          >
            {s}
            <Send className="h-3 w-3 opacity-40 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
