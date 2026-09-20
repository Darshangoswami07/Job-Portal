import { Send, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The apply options for one deduped vacancy, one button per source that is
 * actually available. "Apply via [Company Careers] [Greenhouse] …" — named
 * links, never a raw URL as the primary UI. Responsive: the buttons wrap on a
 * narrow screen instead of collapsing into a dropdown.
 *
 * Props:
 *   sources          group.sources[] from the grouped search / detail DTO
 *   currentJobId     the Job._id currently shown (its source is the primary CTA
 *                    elsewhere, so it can optionally be de-emphasised here)
 *   primaryJobId     same as currentJobId by default; that row renders first
 *   onApplyInternal  () => void            — in-app application flow
 *   onApplyExternal  (jobId, sourceName)   — goes through /apply-redirect
 *   variant          "list" (stacked, sidebar) | "inline" (wrapping row)
 *   heading          optional label above the options
 */
export default function SourceOptions({
  sources = [],
  currentJobId,
  primaryJobId,
  onApplyInternal,
  onApplyExternal,
  variant = "list",
  heading,
  className,
}) {
  const available = (sources || []).filter(
    (s) => (s.status ? s.status === "active" : true) && (s.applyType === "internal" || s.applyUrl)
  );
  if (available.length <= 1) return null;

  const anchor = primaryJobId || currentJobId;
  const ordered = [...available].sort((a, b) => {
    if (String(a.jobId) === String(anchor)) return -1;
    if (String(b.jobId) === String(anchor)) return 1;
    return (a.sourceName || "").localeCompare(b.sourceName || "");
  });

  const label = (s) =>
    s.applyType === "internal"
      ? `Apply on ${s.sourceName || "Job-Pilot"}`
      : `Apply via ${s.sourceName || "the employer"}`;

  const activate = (s) =>
    s.applyType === "internal"
      ? onApplyInternal?.()
      : onApplyExternal?.(s.jobId, s.sourceName);

  return (
    <div
      className={cn(
        variant === "inline" ? "flex flex-wrap gap-2" : "space-y-2",
        className
      )}
    >
      {heading && (
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {heading}
        </p>
      )}
      {ordered.map((s) => (
        <button
          key={String(s.jobId)}
          type="button"
          onClick={() => activate(s)}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition-colors",
            variant === "inline"
              ? "px-3 py-2 text-xs"
              : "w-full py-2.5 text-sm",
            "border-slate-200 bg-white/70 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700",
            "dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800"
          )}
        >
          {s.applyType === "internal" ? (
            <Send className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">{label(s)}</span>
        </button>
      ))}
    </div>
  );
}
