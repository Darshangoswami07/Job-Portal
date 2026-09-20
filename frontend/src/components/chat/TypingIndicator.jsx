import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const dots = {
  rest: { y: 0 },
  animate: (i) => ({
    y: [0, -4, 0],
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 0.9,
      repeat: Infinity,
      ease: "easeInOut",
      delay: i * 0.15,
    },
  }),
};

export default function TypingIndicator({ label = "typing", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            variants={dots}
            initial="rest"
            animate="animate"
            custom={i}
            className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-300"
          />
        ))}
      </span>
      {label}
    </span>
  );
}
