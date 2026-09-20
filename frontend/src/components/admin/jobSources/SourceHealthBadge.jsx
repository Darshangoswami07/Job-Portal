import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, PauseCircle, Loader2 } from "lucide-react";

const SPEC = {
  healthy: { label: "Healthy", Icon: CheckCircle2, cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300", dot: "bg-emerald-500" },
  warning: { label: "Warning", Icon: AlertTriangle, cls: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300", dot: "bg-amber-500" },
  error: { label: "Error", Icon: XCircle, cls: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300", dot: "bg-rose-500" },
  disabled: { label: "Disabled", Icon: PauseCircle, cls: "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-400" },
  running: { label: "Running", Icon: Loader2, cls: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300", dot: "bg-indigo-500" },
};

export default function SourceHealthBadge({ status = "warning", className, showLabel = true }) {
  const spec = SPEC[status] || SPEC.warning;
  const { Icon } = spec;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        spec.cls,
        className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "running" && "animate-spin")} />
      {showLabel && spec.label}
    </span>
  );
}
