import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Hash, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";
import { fetchHashtagPosts, followHashtag } from "@/api/socialApi";
import PostList from "./PostList";
import { useSelector } from "react-redux";
import { cn } from "@/lib/utils";
import Navbar from "@/components/shared/Navbar";

export default function HashtagPage() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.auth.user);
  const viewerId = currentUser ? String(currentUser._id) : '';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchHashtagPosts(tag, { page, limit: 10 });
      if (page === 1) setPosts(res.data.posts || []);
      else setPosts((p) => [...p, ...(res.data.posts || [])]);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load posts");
      navigate("/feed");
    } finally {
      setLoading(false);
    }
  }, [tag, navigate]);

  useEffect(() => { load(1); }, [load]);

  const handleFollow = async () => {
    try {
      const res = await followHashtag(tag);
      setFollowing(res.data.followed);
      toast.success(res.data.followed ? `Following #${tag}` : `Unfollowed #${tag}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl border border-border/70 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Hash className="size-6 text-violet-500" />
              <h1 className="text-2xl font-bold text-foreground">{tag}</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{total} posts with #{tag}</p>
          </div>
          <button
            onClick={handleFollow}
            className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition", following ? "border-violet-300 text-violet-500 dark:border-violet-500/40" : "border-violet-500 bg-violet-500 text-white hover:bg-violet-600")}
          >
            <Bell className="size-3.5" /> {following ? "Following" : "Follow"}
          </button>
        </div>
      </motion.div>

      <PostList posts={posts} loading={loading} viewerId={viewerId} emptyTitle={`No posts with #${tag}`} emptySub="Be the first to share something with this hashtag." />
      {!loading && posts.length > 0 && (
        <div className="mt-6 text-center">
          <button onClick={() => load(Math.floor(posts.length / 10) + 1)} className="rounded-xl border border-border bg-card px-5 py-2 text-sm font-bold text-[#0A66C2] hover:bg-muted">
            Load more
          </button>
        </div>
      )}
    </div>
    </>
  );
}