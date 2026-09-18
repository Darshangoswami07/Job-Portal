import { cn } from "@/lib/utils";

/**
 * Small pill showing where a listing came from. Dynamic — any source label
 * renders with the same visual system; the internal source is tinted.
 */
const LABEL_MAP = {
  "jobpilot ai": "Job-Pilot",
  jobpilot: "Job-Pilot",
  internal: "Job-Pilot",
  "job-pilot": "Job-Pilot",
  "": "Job-Pilot",
  greenhouse: "Greenhouse",
  "company careers": "Company Careers",
};

const INTERNAL_LABELS = new Set(["Job-Pilot"]);

function resolveSourceLabel(source) {
  if (!source) return "Job-Pilot";
  const raw = String(source).trim();
  return LABEL_MAP[raw.toLowerCase()] || raw;
}

export default function SourceBadge({ source, className }) {
  const label = resolveSourceLabel(source);
  const isInternal = INTERNAL_LABELS.has(label);

  return (
    <span
      className={cn(
        "inline-flex max-w-[10rem] items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        isInternal
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground",
        className
      )}
      title={`Source: ${label}`}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          isInternal ? "bg-primary" : "bg-muted-foreground/60"
        )}
      />
      <span className="truncate">{label}</span>
    </span>
  );
}
