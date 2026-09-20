/**
 * Skeleton placeholders for the Feed side rails. Dimensions intentionally mirror
 * the real cards so the layout does not jump when data arrives.
 */
export function ProfileCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      <div className="h-16 shimmer" />
      <div className="px-4 pb-4">
        <div className="-mt-8 mb-3 size-16 rounded-2xl shimmer ring-4 ring-card" />
        <div className="h-4 w-32 shimmer rounded" />
        <div className="mt-2 h-3 w-40 shimmer rounded" />
        <div className="mt-1.5 h-3 w-28 shimmer rounded" />
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="mx-auto h-4 w-8 shimmer rounded" />
              <div className="mx-auto h-2.5 w-12 shimmer rounded" />
            </div>
          ))}
        </div>
        <div className="mt-3 h-9 w-full shimmer rounded-xl" />
      </div>
    </div>
  );
}

export function ListCardSkeleton({ rows = 4, title = true }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      {title && <div className="mb-3 h-3.5 w-36 shimmer rounded" />}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="size-9 shrink-0 rounded-full shimmer" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-2/3 shimmer rounded" />
              <div className="h-2.5 w-1/2 shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ListCardSkeleton;
