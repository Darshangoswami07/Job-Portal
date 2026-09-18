import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const illustration = (variant) => ({
  job: {
    icon: "briefcase",
    gradient: "from-indigo-500 to-blue-600",
    shadow: "shadow-indigo-500/30",
  },
  company: {
    icon: "building",
    gradient: "from-violet-500 to-purple-600",
    shadow: "shadow-violet-500/30",
  },
  applicant: {
    icon: "users",
    gradient: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/30",
  },
  question: {
    icon: "help",
    gradient: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-500/30",
  },
  search: {
    icon: "search",
    gradient: "from-sky-500 to-blue-600",
    shadow: "shadow-sky-500/30",
  },
  notification: {
    icon: "bell",
    gradient: "from-rose-500 to-pink-600",
    shadow: "shadow-rose-500/30",
  },
  default: {
    icon: "sparkles",
    gradient: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-500/30",
  },
}[variant] || illustration("default"));

export default function EmptyState({
  variant = "default",
  title = "Nothing here yet",
  description = "There is no content to display right now.",
  action,
  compact = false,
  className,
}) {
  const spec = illustration(variant);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-background/60 px-6 py-14 text-center",
        compact && "py-10",
        className
      )}
    >
      <div className="relative">
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br text-white shadow-xl",
            spec.gradient,
            spec.shadow
          )}
        >
          <EmptyIcon name={spec.icon} />
        </motion.div>
        <motion.span
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-white text-sm shadow-md dark:bg-gray-800"
          )}
        >
          ✦
        </motion.span>
      </div>

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="mt-6 text-xl font-bold text-foreground"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.35 }}
          className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground"
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.28, duration: 0.3 }}
          className="mt-7"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

function EmptyIcon({ name }) {
  const paths = {
    briefcase: (
      <>
        <path d="M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M3 12h18" />
      </>
    ),
    building: (
      <>
        <rect x="4" y="3" width="10" height="18" rx="1" />
        <path d="M14 7h4a1 1 0 0 1 1 1v13" />
        <path d="M7 7h1M7 11h1M7 15h1M10 7h1M10 11h1M10 15h1M3 21h20" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    sparkles: (
      <>
        <path d="M12 3l1.9 5.7L19.5 10l-5.6 1.3L12 17l-1.9-5.7L4.5 10l5.6-1.3L12 3Z" />
        <path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15Z" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-10"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
