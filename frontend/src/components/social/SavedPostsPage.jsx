import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bookmark, Loader2, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { fetchBookmarks, toggleBookmark } from "@/api/socialApi";
import { useSelector, useDispatch } from "react-redux";
import { upsertPost } from "@/store/slices/socialSlice";
import PostList from "./PostList";
import { cn } from "@/lib/utils";
import Navbar from "@/components/shared/Navbar";

export default function SavedPostsPage() {
  const currentUser = useSelector((s) => s.auth.user);
  const viewerId = currentUser ? String(currentUser._id) : '';
  const dispatch = useDispatch();
  const [posts, setPosts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState("All");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (collection = activeCollection, pg = 1) => {
    setLoading(true);
    try {
      const res = await fetchBookmarks({ page: pg, limit: 12, collection: collection === "All" ? undefined : collection });
      setCollections(res.data.collections || []);
      if (pg === 1) setPosts(res.data.bookmarks || []);
      else setPosts((p) => [...p, ...(res.data.bookmarks || [])]);
      setHasMore(pg < (res.data.pages || 1));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load saved posts");
    } finally {
      setLoading(false);
    }
  }, [activeCollection]);

  useEffect(() => {
    setPage(1);
    load(activeCollection, 1);
  }, [activeCollection]);

  const unsave = async (id) => {
    try {
      await toggleBookmark(id);
      setPosts((p) => p.filter((x) => String(x.id || x._id) !== String(id)));
      toast.success("Removed from saved posts");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500"><Bookmark className="size-5" /></span>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saved Posts</h1>
          <p className="text-sm text-muted-foreground">Your bookmarked posts and collections.</p>
        </div>
      </motion.div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveCollection("All")}
          className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold transition", activeCollection === "All" ? "border-amber-500 bg-amber-500 text-white" : "border-border bg-card text-muted-foreground hover:text-foreground")}
        >
          <FolderPlus className="size-3.5" /> All
        </button>
        {collections.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCollection(c)}
            className={cn("shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition", activeCollection === c ? "border-amber-500 bg-amber-500 text-white" : "border-border bg-card text-muted-foreground hover:text-foreground")}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && page === 1 ? (
        <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-amber-500" /></div>
      ) : (
        <PostList posts={posts} loading={false} viewerId={viewerId} emptyTitle="No saved posts" emptySub="Bookmark posts you want to revisit later." />
      )}

      {hasMore && !loading && posts.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => { const np = page + 1; setPage(np); load(activeCollection, np); }}
            className="rounded-xl border border-border bg-card px-5 py-2 text-sm font-bold text-[#0A66C2] hover:bg-muted"
          >
            Load more
          </button>
        </div>
      )}
    </div>
    </>
  );
}