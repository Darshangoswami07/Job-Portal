import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function OnlineStatusDot({ online, className, withPulse = true }) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <span
        className={cn(
          "block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900",
          online
            ? "bg-emerald-500"
            : "bg-slate-300 dark:bg-slate-600"
        )}
      />
      {online && withPulse && (
        <motion.span
          initial={{ scale: 0.8, opacity: 0.7 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full bg-emerald-500/60"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
