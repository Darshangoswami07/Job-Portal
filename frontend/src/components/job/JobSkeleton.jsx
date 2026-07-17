import { cn } from "@/lib/utils";

function PulseBlock({ className }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-slate-200",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        className
      )}
    />
  );
}

export default function JobSkeleton() {
  return (
    <div className="glass-card rounded-[2rem] overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <PulseBlock className="h-4 w-20" />
          <PulseBlock className="h-9 w-9 rounded-full" />
        </div>

        <div className="border-b border-slate-200/60 pb-5 mb-5">
          <div className="flex items-center gap-4">
            <PulseBlock className="h-14 w-14 rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <PulseBlock className="h-4 w-28" />
              <PulseBlock className="h-3.5 w-20" />
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <PulseBlock className="h-6 w-3/4" />
          <PulseBlock className="h-4 w-full" />
          <PulseBlock className="h-4 w-2/3" />
        </div>

        <div className="flex gap-2 mb-5">
          <PulseBlock className="h-7 w-24 rounded-full" />
          <PulseBlock className="h-7 w-20 rounded-full" />
          <PulseBlock className="h-7 w-22 rounded-full" />
        </div>
      </div>

      <div className="border-t border-slate-200/60 px-6 py-4">
        <div className="flex gap-3">
          <PulseBlock className="h-10 flex-1 rounded-xl" />
          <PulseBlock className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
