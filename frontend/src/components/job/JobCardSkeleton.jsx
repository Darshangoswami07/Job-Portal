import { cn } from "@/lib/utils";

function PulseBlock({ className }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-gray-200",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        className
      )}
    />
  );
}

export default function JobCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg card-shadow p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <PulseBlock className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <PulseBlock className="h-3.5 w-24" />
            <PulseBlock className="h-3 w-16" />
          </div>
        </div>
        <PulseBlock className="h-3 w-14" />
      </div>

      <div className="space-y-3 mb-4">
        <PulseBlock className="h-5 w-3/4" />
        <PulseBlock className="h-4 w-full" />
        <PulseBlock className="h-4 w-2/3" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <PulseBlock className="h-6 w-20 rounded-full" />
        <PulseBlock className="h-6 w-24 rounded-full" />
        <PulseBlock className="h-6 w-16 rounded-full" />
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <PulseBlock className="h-8 w-28 rounded-lg" />
        <PulseBlock className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}
