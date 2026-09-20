import { motion } from "framer-motion";

export default function FeedCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 shimmer rounded" />
            <div className="h-2.5 w-1/2 shimmer rounded" />
          </div>
        </div>
        <div className="h-3 w-full shimmer rounded" />
        <div className="h-3 w-4/5 shimmer rounded" />
        <div className="h-40 w-full shimmer rounded-xl" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-4 w-24 shimmer rounded" />
          <div className="flex gap-2">
            <div className="size-7 shimmer rounded-lg" />
            <div className="size-7 shimmer rounded-lg" />
            <div className="size-7 shimmer rounded-lg" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}