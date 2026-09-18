import { cn } from "@/lib/utils";

export default function MessageSkeleton({ rows = 6 }) {
  return (
    <div className="flex flex-1 flex-col justify-end gap-3 p-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => {
        const mine = i % 2 === 1;
        const width = 45 + ((i * 13) % 35);
        return (
          <div key={i} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "animate-pulse rounded-2xl px-3 py-2.5",
                mine
                  ? "bg-gradient-to-br from-indigo-500/20 to-blue-600/20"
                  : "bg-slate-200 dark:bg-slate-800"
              )}
              style={{ width: `${width}%` }}
            >
              <div className={cn("h-3 rounded-full", mine ? "bg-white/40" : "bg-slate-300 dark:bg-slate-700")} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
