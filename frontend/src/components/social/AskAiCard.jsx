import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, FileSearch, Sparkles, FileText, MessagesSquare } from "lucide-react";

/**
 * "Ask JobPilot AI" — routes to the app's existing Career Tools. These are real
 * pages; nothing here fakes an AI response inline.
 */
const ACTIONS = [
  { label: "Analyze My Profile", icon: FileSearch, to: "/resume-checker" },
  { label: "Find Matching Jobs", icon: Sparkles, to: "/recommended-jobs" },
  { label: "Improve My Resume", icon: FileText, to: "/ai-resume" },
  { label: "Prepare for Interview", icon: MessagesSquare, to: "/mock-interview" },
];

export default function AskAiCard() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="overflow-hidden rounded-2xl border border-violet-300/40 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-transparent shadow-sm dark:border-violet-500/20"
    >
      <div className="flex items-center gap-2 px-4 pt-4">
        <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <Bot className="size-4" />
        </span>
        <h3 className="text-sm font-bold text-foreground">Ask JobPilot AI</h3>
      </div>
      <p className="px-4 pt-1.5 text-xs text-muted-foreground">Need help with your career? Jump into an AI tool.</p>
      <div className="grid grid-cols-1 gap-1.5 p-3">
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.to)}
            className="group flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-left text-[13px] font-semibold text-foreground transition hover:border-violet-400/40 hover:bg-card"
          >
            <a.icon className="size-4 text-violet-500 transition-transform group-hover:scale-110" />
            {a.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
