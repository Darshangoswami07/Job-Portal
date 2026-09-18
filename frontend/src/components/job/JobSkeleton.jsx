import { cn } from "@/lib/utils";

function Bar({ className }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r",
        "before:from-transparent before:via-foreground/[0.06] before:to-transparent",
        "before:animate-[shimmer_1.6s_infinite] motion-reduce:before:animate-none",
        className
      )}
    />
  );
}

/** Mirrors the real <Job /> card structure so nothing shifts on load. */
export default function JobSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Bar className="h-11 w-11 shrink-0 rounded-lg" />
            <Bar className="h-4 w-28" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Bar className="h-4 w-16 rounded-full" />
            <Bar className="h-4 w-20 rounded-full" />
          </div>
        </div>

        <Bar className="mt-4 h-4 w-4/5" />
        <Bar className="mt-2 h-4 w-3/5" />

        <div className="mt-3 flex gap-3">
          <Bar className="h-3 w-24" />
          <Bar className="h-3 w-16" />
        </div>

        <Bar className="mt-4 h-3 w-full" />
        <Bar className="mt-2 h-3 w-2/3" />

        <div className="mt-auto flex gap-1.5 pt-5">
          <Bar className="h-6 w-16 rounded-md" />
          <Bar className="h-6 w-14 rounded-md" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <Bar className="h-8 w-28 rounded-lg" />
        <Bar className="h-6 w-6 rounded-lg" />
      </div>
    </div>
  );
}
