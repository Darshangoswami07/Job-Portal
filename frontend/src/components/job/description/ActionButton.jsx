import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ActionButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  activeClass = "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30",
  className,
  tooltipPlacement = "top",
  disabled = false,
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const tooltipPos =
    tooltipPlacement === "bottom"
      ? { top: "100%", left: "50%", x: "-50%", y: 8 }
      : { bottom: "100%", left: "50%", x: "-50%", y: -8 };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      aria-label={label}
      whileHover={{ scale: 1.06, y: -2, rotate: 4 }}
      whileTap={{ scale: 0.9, rotate: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        "border border-slate-200 bg-white/80 text-slate-500 shadow-sm backdrop-blur",
        "dark:border-slate-700/70 dark:bg-slate-800/70 dark:text-slate-300",
        "hover:shadow-lg hover:shadow-indigo-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60",
        "transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40",
        active && activeClass,
        className
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      <AnimatePresence>
        {showTooltip && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9, ...tooltipPos }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
