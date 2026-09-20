import { motion } from "framer-motion";
import PostCard from "./PostCard";
import FeedCardSkeleton from "./FeedCardSkeleton";

export default function PostList({ posts, loading, emptyTitle = "No posts yet", emptySub = "", viewerId, onEmpty }) {
  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <FeedCardSkeleton key={i} />)}</div>;
  }

  if (!posts || posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-dashed border-border bg-card p-10 text-center"
      >
        <p className="text-lg font-bold text-foreground">{emptyTitle}</p>
        {emptySub && <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{emptySub}</p>}
        {onEmpty}
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((p) => (
        <PostCard key={String(p.id || p._id)} post={p} viewerId={viewerId} />
      ))}
    </div>
  );
}