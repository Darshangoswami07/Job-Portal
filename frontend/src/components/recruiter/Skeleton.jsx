import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "shimmer relative overflow-hidden rounded-xl bg-muted",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="premium-card p-6">
      <div className="flex items-start justify-between">
        <Skeleton className="size-12 rounded-2xl" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="mt-6 h-8 w-24" />
      <Skeleton className="mt-3 h-4 w-40" />
      <div className="mt-6 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonJobCard() {
  return (
    <div className="premium-card p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 6 }) {
  return (
    <div className="premium-card overflow-hidden p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
      <div className="mt-6 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="premium-card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <div className="mt-6 flex h-48 items-end gap-3">
        {[40, 70, 55, 90, 65, 100, 75, 85, 60, 95, 80, 70].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-xl" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="premium-card overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="px-6 pb-6">
        <div className="-mt-10 flex items-end justify-between">
          <Skeleton className="size-24 rounded-full ring-4 ring-background" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
        <Skeleton className="mt-5 h-6 w-48" />
        <Skeleton className="mt-3 h-4 w-64" />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonForm({ rows = 5 }) {
  return (
    <div className="premium-card p-8">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="mb-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-11 w-full rounded-xl" />
        </div>
      ))}
      <div className="mt-8 flex justify-end gap-3">
        <Skeleton className="h-11 w-28 rounded-xl" />
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, Item = SkeletonCard }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <Item />
        </motion.div>
      ))}
    </div>
  );
}
