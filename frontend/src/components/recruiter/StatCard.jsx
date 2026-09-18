import { motion } from "framer-motion";
import CountUp from "react-countup";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const styles = {
  indigo: {
    icon: "from-indigo-500 to-blue-600 text-white",
    glow: "shadow-indigo-500/30",
    ring: "group-hover:ring-indigo-200 dark:group-hover:ring-indigo-500/30",
  },
  emerald: {
    icon: "from-emerald-500 to-teal-600 text-white",
    glow: "shadow-emerald-500/30",
    ring: "group-hover:ring-emerald-200 dark:group-hover:ring-emerald-500/30",
  },
  violet: {
    icon: "from-violet-500 to-purple-600 text-white",
    glow: "shadow-violet-500/30",
    ring: "group-hover:ring-violet-200 dark:group-hover:ring-violet-500/30",
  },
  amber: {
    icon: "from-amber-500 to-orange-600 text-white",
    glow: "shadow-amber-500/30",
    ring: "group-hover:ring-amber-200 dark:group-hover:ring-amber-500/30",
  },
  sky: {
    icon: "from-sky-500 to-cyan-600 text-white",
    glow: "shadow-sky-500/30",
    ring: "group-hover:ring-sky-200 dark:group-hover:ring-sky-500/30",
  },
  rose: {
    icon: "from-rose-500 to-pink-600 text-white",
    glow: "shadow-rose-500/30",
    ring: "group-hover:ring-rose-200 dark:group-hover:ring-rose-500/30",
  },
};

export default function StatCard({
  label,
  value = 0,
  icon: Icon,
  variant = "indigo",
  suffix = "",
  prefix = "",
  trend,
  hint,
  index = 0,
  onClick,
}) {
  const spec = styles[variant] || styles.indigo;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend > 0
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
      : trend < 0
        ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10"
        : "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -5, scale: 1.015 }}
      onClick={onClick}
      className={cn(
        "group relative cursor-default overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-shadow duration-300 hover:shadow-xl",
        onClick && "cursor-pointer"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br opacity-[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.14]",
          spec.icon
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <motion.div
          whileHover={{ rotate: -6, scale: 1.08 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ring-4 ring-transparent transition-all duration-300",
            spec.icon,
            spec.glow,
            spec.ring
          )}
        >
          {Icon && <Icon className="size-5" />}
        </motion.div>

        {trend !== undefined && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              trendColor
            )}
          >
            <TrendIcon className="size-3.5" />
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-baseline gap-1">
          {prefix && <span className="text-xl font-bold text-foreground">{prefix}</span>}
          <CountUp
            end={Number(value) || 0}
            duration={1.6}
            separator=","
            className="text-3xl font-extrabold tracking-tight text-foreground"
          />
          {suffix && <span className="text-lg font-bold text-foreground">{suffix}</span>}
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </motion.div>
  );
}
