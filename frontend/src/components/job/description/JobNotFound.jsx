import { motion } from "framer-motion";
import { Building2, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JobNotFound({ onBrowse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-slate-200/80 bg-white/80 px-8 py-16 text-center shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/15 to-blue-500/15 ring-1 ring-inset ring-indigo-500/20"
      >
        <Building2 className="h-12 w-12 text-indigo-400" />
        <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg dark:bg-slate-800">
          <SearchX className="h-5 w-5 text-rose-500" />
        </span>
      </motion.div>

      <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Job not found</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        This job may have been removed, expired, or the link is incorrect. Browse other
        opportunities to keep exploring.
      </p>
      <Button
        onClick={onBrowse}
        className="mt-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
      >
        Browse Jobs
      </Button>
    </motion.div>
  );
}
