import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  children,
  gradient = "from-indigo-500 via-blue-500 to-violet-500",
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -left-24 -top-24 size-64 rounded-full bg-gradient-to-br opacity-10 blur-3xl",
          gradient
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute -bottom-32 -right-16 size-72 rounded-full bg-gradient-to-tl opacity-[0.08] blur-3xl",
          gradient
        )}
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          {Icon && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4, type: "spring", stiffness: 260, damping: 18 }}
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                gradient
              )}
            >
              <Icon className="size-7" />
            </motion.div>
          )}
          <div className="space-y-1.5">
            {eyebrow && (
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                {eyebrow}
              </p>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="flex flex-wrap items-center gap-3"
          >
            {children}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
