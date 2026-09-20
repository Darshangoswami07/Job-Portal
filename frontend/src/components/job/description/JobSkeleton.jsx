import { cn } from "@/lib/utils";

function SkeletonBlock({ className }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-slate-200/70 dark:bg-slate-800/70",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_1.6s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        "dark:before:via-white/10",
        className
      )}
    />
  );
}

export default function JobSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SkeletonBlock className="h-6 w-24" />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 p-6 sm:p-8 backdrop-blur">
            <div className="flex flex-col sm:flex-row gap-6">
              <SkeletonBlock className="h-24 w-24 rounded-2xl" />
              <div className="flex-1 space-y-4">
                <SkeletonBlock className="h-9 w-2/3 max-w-lg" />
                <SkeletonBlock className="h-5 w-1/2 max-w-sm" />
                <div className="flex flex-wrap gap-2 pt-2">
                  <SkeletonBlock className="h-7 w-24 rounded-full" />
                  <SkeletonBlock className="h-7 w-28 rounded-full" />
                  <SkeletonBlock className="h-7 w-20 rounded-full" />
                  <SkeletonBlock className="h-7 w-24 rounded-full" />
                  <SkeletonBlock className="h-7 w-16 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 p-6 sm:p-8 backdrop-blur space-y-4"
            >
              <SkeletonBlock className="h-7 w-48" />
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
              <SkeletonBlock className="h-4 w-4/6" />
              <SkeletonBlock className="h-4 w-full" />
            </div>
          ))}
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 self-start">
          <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 p-6 backdrop-blur space-y-5">
            <SkeletonBlock className="h-14 w-full rounded-2xl" />
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-4 w-1/2" />
          </div>
          <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/70 p-6 backdrop-blur space-y-4">
            <SkeletonBlock className="h-16 w-16 rounded-2xl" />
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
