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

/** Mirrors <JobCard /> so nothing shifts when results load. */
export default function JobResultSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Bar className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="space-y-2">
            <Bar className="h-3.5 w-28" />
            <Bar className="h-3 w-36" />
          </div>
        </div>
        <Bar className="h-8 w-8 rounded-lg" />
      </div>

      <Bar className="mt-4 h-4 w-4/5" />
      <Bar className="mt-2 h-4 w-3/5" />

      <Bar className="mt-3 h-3 w-full" />
      <Bar className="mt-2 h-3 w-2/3" />

      <div className="mt-4 flex gap-1.5">
        <Bar className="h-6 w-20 rounded-lg" />
        <Bar className="h-6 w-16 rounded-lg" />
        <Bar className="h-6 w-14 rounded-lg" />
      </div>

      <div className="mt-auto flex items-center justify-between pt-5">
        <Bar className="h-4 w-24 rounded-full" />
        <Bar className="h-7 w-28 rounded-lg" />
      </div>
    </div>
  );
}
