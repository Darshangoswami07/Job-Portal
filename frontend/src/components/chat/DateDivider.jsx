import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDateDivider } from "@/utils/chat";

export default function DateDivider({ date, className }) {
  const label = formatDateDivider(date);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={cn("flex items-center gap-3 py-3", className)}
      role="separator"
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-slate-200 dark:via-slate-700 dark:to-slate-700" />
      <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-400">
        {label}
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 to-slate-200 dark:via-slate-700 dark:to-slate-700" />
    </motion.div>
  );
}
