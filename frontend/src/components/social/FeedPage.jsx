import { useEffect, useCallback, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Search, Loader2, X, Sparkles, Users, Building2, Briefcase, AlertTriangle, RefreshCw } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  setPosts, appendPosts, setPage, setHasMore, setLoading, setFeedKey,
} from "@/store/slices/socialSlice";
import { fetchFeed, globalSearch } from "@/api/socialApi";
import PostComposer from "./PostComposer";
import PostCard from "./PostCard";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import FeedCardSkeleton from "./FeedCardSkeleton";
import useSocialSocket from "@/hooks/useSocialSocket";
import { cn } from "@/lib/utils";
import Navbar from "@/components/shared/Navbar";

const FEED_TABS = [
  { key: "forYou", label: "For You" },
  { key: "following", label: "Following" },
  { key: "latest", label: "Latest" },
  { key: "trending", label: "Trending" },
];
const VALID_TABS = FEED_TABS.map((t) => t.key);

const TOPICS = [
  { label: "All Topics", tag: "" },
  { label: "AI", tag: "ai" },
  { label: "React", tag: "react" },
  { label: "JavaScript", tag: "javascript" },
  { label: "TypeScript", tag: "typescript" },
  { label: "Next.js", tag: "nextjs" },
  { label: "Backend", tag: "backend" },
  { label: "System Design", tag: "systemdesign" },
  { label: "DevOps", tag: "devops" },
  { label: "Career", tag: "career" },
  { label: "Interview Prep", tag: "interviewpreparation" },
  { label: "Remote Jobs", tag: "remotejobs" },
];

export default function FeedPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector((s) => s.auth.user);
  const { posts, page, hasMore, loading } = useSelector((s) => s.social);

  const initialTab = VALID_TABS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "forYou";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeTopic, setActiveTopic] = useState(searchParams.get("topic") || "");
  const [error, setError] = useState(null);

  const sentinelRef = useRef(null);

  useSocialSocket();

  const viewerId = user ? String(user._id) : "";

  const loadFeed = useCallback(
    async (tab, topic, loadMore = false) => {
      const targetPage = loadMore ? page + 1 : 1;
      dispatch(setLoading(true));
      if (!loadMore) setError(null);
      try {
        const res = await fetchFeed({ page: targetPage, limit: 10, tab, topic: topic || undefined });
        const data = res.data.posts || [];
        if (loadMore) {
          dispatch(appendPosts(data));
          dispatch(setPage(targetPage));
        } else {
          dispatch(setPosts(data));
          dispatch(setPage(1));
        }
        dispatch(setHasMore(res.data.hasMore ?? data.length >= 10));
        dispatch(setFeedKey(`${tab}:${topic || "all"}`));
      } catch (err) {
        const status = err.response?.status;
        if (status === 401) {
          // Session expired — hand off to the app's auth flow instead of a retry box.
          navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }
        if (!loadMore) setError(status ? `http_${status}` : "network");
        dispatch(setHasMore(false));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [page, dispatch, navigate]
  );

  // Keep local state in sync when the URL changes from elsewhere (e.g. a
  // trending-topic link in the sidebar navigates to /feed?topic=react).
  useEffect(() => {
    const t = searchParams.get("tab");
    const tp = searchParams.get("topic") || "";
    if (t && VALID_TABS.includes(t)) setActiveTab((cur) => (cur === t ? cur : t));
    setActiveTopic((cur) => (cur === tp ? cur : tp));
  }, [searchParams]);

  // Reload whenever the tab or topic changes. Clear first so skeletons show.
  useEffect(() => {
    dispatch(setPosts([]));
    dispatch(setHasMore(true));
    loadFeed(activeTab, activeTopic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeTopic]);

  // Infinite scroll.
  useEffect(() => {
    if (!sentinelRef.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadFeed(activeTab, activeTopic, true);
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, activeTab, activeTopic, loadFeed]);

  const syncParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setSearchParams(next, { replace: true });
  };

  const switchTab = (key) => {
    setActiveTab(key);
    syncParams({ tab: key });
  };

  const selectTopic = (topic) => {
    setActiveTopic(topic);
    syncParams({ topic });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-gradient-to-b from-[#F3F2EF] via-[#F3F2EF] to-white dark:from-[#0D1117] dark:via-[#0D1117] dark:to-[#0D1117]">
        <Navbar />
        <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-5 lg:px-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)_340px] xl:grid-cols-[320px_minmax(0,1fr)_360px] xl:gap-6">
            {/* LEFT */}
            <aside className="hidden md:block">
              <div className="sticky top-24">
                <LeftSidebar />
              </div>
            </aside>

            {/* CENTER */}
            <motion.main
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mx-auto w-full max-w-2xl lg:max-w-none"
            >
              <div className="mb-3 lg:hidden">
                <FeedSearch compact />
              </div>

              <FeedHeader />

              <div className="sticky top-16 z-20 -mx-3 mt-4 mb-3 bg-gradient-to-b from-[#F3F2EF] via-[#F3F2EF] to-transparent px-3 pb-2 pt-1 dark:from-[#0D1117] dark:via-[#0D1117] lg:static lg:mx-0 lg:bg-none lg:p-0">
                <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card p-1 shadow-sm">
                  {FEED_TABS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => switchTab(t.key)}
                      className={cn(
                        "relative flex-1 rounded-full py-2 text-[13px] font-bold transition",
                        activeTab === t.key ? "text-white" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {activeTab === t.key && (
                        <motion.span
                          layoutId="feedTabPill"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0A66C2] to-indigo-600 shadow-md shadow-blue-500/25"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <PostComposer onPosted={() => loadFeed(activeTab, activeTopic)} />

              <TopicBar active={activeTopic} onSelect={selectTopic} />

              <div className="mt-4 space-y-4">
                {loading && posts.length === 0 ? (
                  [1, 2, 3].map((i) => <FeedCardSkeleton key={i} />)
                ) : error && posts.length === 0 ? (
                  <FeedError onRetry={() => loadFeed(activeTab, activeTopic)} />
                ) : posts.length === 0 ? (
                  <FeedEmpty tab={activeTab} topic={activeTopic} onClearTopic={() => selectTopic("")} />
                ) : (
                  <AnimatePresence initial={false}>
                    {posts.map((p, i) => (
                      <motion.div
                        key={String(p.id || p._id)}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(i, 4) * 0.03 }}
                      >
                        <PostCard post={p} viewerId={viewerId} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                <div ref={sentinelRef} className="flex justify-center py-4">
                  {loading && posts.length > 0 && <Loader2 className="size-6 animate-spin text-[#0A66C2]" />}
                  {!hasMore && posts.length > 0 && (
                    <span className="text-sm text-muted-foreground">You're all caught up 🎉</span>
                  )}
                </div>
              </div>
            </motion.main>

            {/* RIGHT */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-3">
                <FeedSearch />
                <Link
                  to="/feed/search"
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#0A66C2]/30 bg-[#0A66C2]/5 px-3 py-2.5 text-xs font-bold text-[#0A66C2] transition hover:bg-[#0A66C2]/10"
                >
                  <Sparkles className="size-4" /> Explore people, companies & posts
                </Link>
                <RightSidebar />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

function FeedHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A66C2] via-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-indigo-500/20 sm:p-6"
    >
      <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute right-16 top-6 hidden sm:block">
        <svg width="120" height="90" viewBox="0 0 120 90" fill="none" aria-hidden="true">
          <g stroke="#fff" strokeOpacity="0.25" strokeWidth="1.5" fill="none">
            <circle cx="90" cy="30" r="28" /><circle cx="90" cy="30" r="46" />
          </g>
          <path d="M20 74 L84 26" stroke="#fff" strokeOpacity="0.6" strokeWidth="5" strokeLinecap="round" />
          <path d="M64 20 L84 26 L78 46" stroke="#fff" strokeOpacity="0.6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      <div className="relative">
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Your Professional Feed</h1>
        <p className="mt-1 max-w-md text-sm text-blue-100">
          Discover ideas, insights, opportunities, and people shaping the future of work.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Learn", "Connect", "Grow", "Get Hired"].map((w) => (
            <span key={w} className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-sm">
              {w}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TopicBar({ active, onSelect }) {
  const navigate = useNavigate();
  return (
    <div className="-mx-3 mt-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max items-center gap-1.5">
        {TOPICS.map((t) => {
          const on = active === t.tag;
          return (
            <button
              key={t.label}
              onClick={() => onSelect(t.tag)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-bold transition",
                on
                  ? "border-transparent bg-gradient-to-r from-[#0A66C2] to-indigo-600 text-white shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-[#0A66C2]/40 hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          );
        })}
        <button
          onClick={() => navigate("/feed/search?type=hashtags")}
          title="Manage topics"
          className="shrink-0 rounded-full border border-dashed border-border bg-card px-2.5 py-1.5 text-[12px] font-bold text-muted-foreground transition hover:border-[#0A66C2]/40 hover:text-foreground"
        >
          +
        </button>
      </div>
    </div>
  );
}

function FeedSearch({ compact }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);
  const timer = useRef(null);

  const onChange = (v) => {
    setValue(v);
    clearTimeout(timer.current);
    if (!v.trim()) {
      setResults([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await globalSearch({ q: v, type: "all", limit: 6 });
        setResults(res.data.results);
      } catch {
        /* ignore */
      } finally {
        setBusy(false);
      }
    }, 350);
  };

  const clear = () => {
    setValue("");
    setResults([]);
    setBusy(false);
  };

  const submit = () => {
    if (value.trim()) navigate(`/feed/search?q=${encodeURIComponent(value.trim())}`);
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={compact ? "Search people, jobs, posts, #tags" : "Search JobPilot…"}
        aria-label="Search people, companies, jobs, posts and hashtags"
        className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-9 text-sm shadow-sm transition focus:border-[#0A66C2]/40 focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/25"
      />
      {(busy || value) && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {busy ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <button onClick={clear} aria-label="Clear search" className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>
      )}
      <AnimatePresence>
        {focused && value && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
          >
            <SearchDropResults results={results} searching={busy} query={value} onNavigate={clear} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeedEmpty({ tab, topic, onClearTopic }) {
  const copy = topic
    ? {
        title: `No posts tagged #${topic} yet`,
        body: "Be the first to post about this topic, or explore another one.",
      }
    : tab === "following"
      ? {
          title: "Follow people to fill this tab",
          body: "You're not following anyone yet. Follow developers, recruiters and companies to see their updates here.",
        }
      : {
          title: "Your professional feed is ready",
          body: "Follow developers, recruiters, companies and industry experts to personalize your feed — or share your first update.",
        };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-8 text-center shadow-sm"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-16 mx-auto h-40 w-40 rounded-full bg-gradient-to-br from-[#0A66C2]/25 to-violet-500/20 blur-3xl" />
      <div className="relative">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#0A66C2] to-indigo-600 text-white shadow-lg shadow-blue-500/25">
          <Sparkles className="size-7" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{copy.title}</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{copy.body}</p>
        {topic && (
          <button
            onClick={onClearTopic}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0A66C2] px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Show all topics
          </button>
        )}
        {!topic && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link to="/feed/search?type=people" className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A66C2] px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700">
            <Users className="size-4" /> Discover People
          </Link>
          <Link to="/browse-companies" className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-bold text-foreground transition hover:bg-muted">
            <Building2 className="size-4" /> Explore Companies
          </Link>
          <Link to="/jobs" className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-bold text-foreground transition hover:bg-muted">
            <Briefcase className="size-4" /> Find Jobs
          </Link>
        </div>
        )}
      </div>
    </motion.div>
  );
}

function FeedError({ onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border/70 bg-card p-8 text-center shadow-sm"
    >
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
        <AlertTriangle className="size-7" />
      </div>
      <h3 className="text-lg font-bold text-foreground">Something went wrong</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">Unable to load your feed right now.</p>
      <button
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#0A66C2] px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
      >
        <RefreshCw className="size-4" /> Retry
      </button>
    </motion.div>
  );
}

function SearchDropResults({ results, searching, query, onNavigate }) {
  const navigate = useNavigate();
  const r = results || {};
  const items = [
    ...(r.people || []).map((p) => ({ label: p.fullname, sub: p.profile?.headline || "Person", to: `/feed/people/${p._id}`, type: "Person" })),
    ...(r.companies || []).map((p) => ({ label: p.profile?.companyName || p.fullname, sub: "Company", to: `/feed/people/${p._id}`, type: "Company" })),
    ...(r.hashtags || []).map((h) => ({ label: `#${h.name}`, sub: `${h.postCount || 0} posts`, to: `/feed/hashtag/${h.name}`, type: "Tag" })),
    ...(r.posts || []).map((p) => ({ label: (p.contentText || p.article?.title || "Post").slice(0, 60), sub: "Post", to: `/feed/${p.id || p._id}`, type: "Post" })),
  ].slice(0, 7);

  return (
    <div className="max-h-96 overflow-y-auto p-1.5">
      {searching ? (
        <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Searching…
        </div>
      ) : items.length === 0 ? (
        <button
          onClick={() => { onNavigate?.(); navigate(`/feed/search?q=${encodeURIComponent(query)}`); }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted"
        >
          <Search className="size-4 text-muted-foreground" /> Search everywhere for “{query}”
        </button>
      ) : (
        <>
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => { onNavigate?.(); navigate(it.to); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-muted"
            >
              <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{it.type}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{it.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{it.sub}</span>
              </span>
            </button>
          ))}
          <button
            onClick={() => { onNavigate?.(); navigate(`/feed/search?q=${encodeURIComponent(query)}`); }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-border/60 px-3 py-2.5 text-left text-xs font-bold text-[#0A66C2] hover:bg-muted"
          >
            <Search className="size-3.5" /> See all results for “{query}”
          </button>
        </>
      )}
    </div>
  );
}
