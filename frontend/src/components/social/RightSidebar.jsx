import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Hash, UserPlus, Briefcase, Building2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { fetchTrending, fetchSuggested, toggleFollow } from "@/api/socialApi";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatCount } from "@/utils/social";
import { ListCardSkeleton } from "./SidebarCardSkeleton";
import CareerInsightCard from "./CareerInsightCard";
import AskAiCard from "./AskAiCard";
import FeedJobRecs from "./FeedJobRecs";

function SuggestionCard({ user }) {
  const [followed, setFollowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const id = String(user?._id);

  const follow = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const prev = followed;
    setFollowed(!prev); // optimistic
    try {
      const res = await toggleFollow(id);
      setFollowed(res.data.followed);
    } catch (err) {
      setFollowed(prev);
      toast.error(err.response?.data?.message || "Couldn't update follow");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      <button onClick={() => navigate(`/feed/people/${id}`)} className="shrink-0">
        <Avatar className="size-9">
          <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-xs text-white">
            {(user?.fullname || "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>
      <div className="min-w-0 flex-1">
        <button onClick={() => navigate(`/feed/people/${id}`)} className="block truncate text-left text-[13px] font-bold text-foreground hover:text-[#0A66C2]">
          {user?.fullname}
        </button>
        <p className="truncate text-[11px] text-muted-foreground">
          {user?.profile?.headline || user?.profile?.companyName || (user?.currentRole === "recruiter" ? "Recruiter" : "Professional")}
        </p>
      </div>
      <button
        onClick={follow}
        disabled={busy}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold transition disabled:opacity-60",
          followed
            ? "border-emerald-300 text-emerald-600 dark:border-emerald-500/30"
            : "border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white"
        )}
      >
        {busy && <Loader2 className="size-3 animate-spin" />}
        {followed ? "Following" : "+ Follow"}
      </button>
    </div>
  );
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 px-2 pb-1 pt-2.5">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{children}</span>
    </div>
  );
}

export default function RightSidebar() {
  const [trending, setTrending] = useState({ hashtags: [], jobs: [], recruiters: [], skills: [], posts: [] });
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([fetchTrending(), fetchSuggested({ limit: 5 })]);
      if (t.data?.success) setTrending(t.data.trending);
      if (s.data?.success) setSuggested(s.data.users);
    } catch {
      /* non-critical — cards simply hide */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasTrending =
    trending.hashtags?.length || trending.skills?.length || trending.jobs?.length ||
    trending.recruiters?.length || trending.posts?.length;

  return (
    <div className="space-y-3">
      {/* Trending on JobPilot */}
      {loading ? (
        <ListCardSkeleton rows={5} />
      ) : hasTrending ? (
        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
        >
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <TrendingUp className="size-4 text-rose-500" />
            <h3 className="text-sm font-bold text-foreground">Trending on JobPilot</h3>
          </div>
          <div className="p-2">
            {trending.hashtags?.length > 0 && (
              <>
                <SectionLabel icon={Hash}>Trending Topics</SectionLabel>
                {trending.hashtags.slice(0, 5).map((h, i) => (
                  <button
                    key={h.name}
                    onClick={() => navigate(`/feed?topic=${encodeURIComponent(h.name)}`)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-muted"
                  >
                    <span className="text-[11px] font-bold text-muted-foreground/50">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-foreground">#{h.name}</span>
                      <span className="text-[11px] text-muted-foreground">{formatCount(h.postCount)} posts</span>
                    </span>
                  </button>
                ))}
              </>
            )}

            {trending.posts?.length > 0 && (
              <>
                <SectionLabel icon={TrendingUp}>Trending Posts</SectionLabel>
                {trending.posts.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/feed/${p.id}`)}
                    className="flex w-full flex-col rounded-lg px-2 py-1.5 text-left transition hover:bg-muted"
                  >
                    <span className="line-clamp-2 text-[13px] font-semibold text-foreground">{p.title}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {p.isEditorial ? "JobPilot Insights" : p.authorFullname} · {formatCount(p.reactions + p.commentCount)} reactions
                    </span>
                  </button>
                ))}
              </>
            )}

            {trending.jobs?.length > 0 && (
              <>
                <SectionLabel icon={Briefcase}>Trending Jobs</SectionLabel>
                {trending.jobs.slice(0, 4).map((j) => (
                  <button
                    key={String(j._id)}
                    onClick={() => navigate(`/description/${String(j._id)}`)}
                    className="flex w-full flex-col rounded-lg px-2 py-1.5 text-left transition hover:bg-muted"
                  >
                    <span className="truncate text-[13px] font-semibold text-foreground">{j.title}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {j.location || "Remote"}
                      {j.salary ? ` · ${j.salary}` : ""}
                    </span>
                  </button>
                ))}
              </>
            )}

            {trending.skills?.length > 0 && (
              <>
                <SectionLabel icon={Sparkles}>Popular Skills</SectionLabel>
                <div className="flex flex-wrap gap-1.5 px-2 py-1">
                  {trending.skills.slice(0, 8).map((s) => (
                    <button
                      key={s.name}
                      onClick={() => navigate(`/jobs?q=${encodeURIComponent(s.name)}`)}
                      className="rounded-full bg-[#0A66C2]/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-[#0A66C2] transition hover:bg-[#0A66C2]/20"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {trending.recruiters?.length > 0 && (
              <>
                <SectionLabel icon={Building2}>Top Companies</SectionLabel>
                {trending.recruiters.slice(0, 3).map((r) => (
                  <button
                    key={String(r._id)}
                    onClick={() => navigate(`/feed/people/${String(r._id)}`)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-muted"
                  >
                    <Avatar className="size-6">
                      <AvatarImage src={r?.profile?.profilePhoto} />
                      <AvatarFallback className="text-[10px]">{(r.fullname || "C").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-[13px] font-semibold text-foreground">
                      {r?.profile?.companyName || r.fullname}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        </motion.div>
      ) : null}

      <FeedJobRecs />

      <CareerInsightCard />

      <AskAiCard />

      {/* Suggested Professionals */}
      {loading ? (
        <ListCardSkeleton rows={4} />
      ) : suggested.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <UserPlus className="size-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-foreground">Suggested Professionals</h3>
            </div>
            <Link to="/feed/network" className="text-[11px] font-bold text-[#0A66C2] hover:underline">
              See all
            </Link>
          </div>
          <div className="space-y-3 p-3">
            {suggested.map((u) => (
              <SuggestionCard key={String(u._id)} user={u} />
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
