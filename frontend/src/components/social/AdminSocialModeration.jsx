import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Flag, Loader2, Eye, EyeOff, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  fetchModerationQueue, moderatePost, fetchReports, resolveReport, fetchAdminAnalytics,
} from "@/api/socialApi";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/utils/social";
import Navbar from "@/components/shared/Navbar";

export default function AdminSocialModeration() {
  const [tab, setTab] = useState("queue");
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [q, r, a] = await Promise.all([
        fetchModerationQueue({ limit: 25, flag: "" }),
        fetchReports({ status: "open", limit: 25 }),
        fetchAdminAnalytics(),
      ]);
      setPosts(q.data.posts || []);
      setReports(r.data.reports || []);
      setStats(a.data.stats || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Admin access required");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hidePost = async (id, status) => {
    try {
      await moderatePost(id, { status, reason: "Moderated by admin" });
      setPosts((p) => p.map((x) => (String(x._id) === String(id) ? { ...x, status } : x)));
      toast.success(status === "hidden" ? "Post hidden" : "Post restored");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const resolve = async (id, status) => {
    try {
      await resolveReport(id, { status, action: "Actioned by moderator" });
      setReports((r) => r.filter((x) => String(x._id) !== String(id)));
      toast.success("Report resolved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-500"><ShieldCheck className="size-5" /></span>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Social Moderation</h1>
          <p className="text-sm text-muted-foreground">Manage posts, reports and community analytics.</p>
        </div>
      </motion.div>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Posts", value: stats.totalPosts },
            { label: "Total Comments", value: stats.totalComments },
            { label: "Total Reactions", value: stats.totalReactions },
            { label: "Open Reports", value: stats.reportsOpen },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-5 flex gap-2">
        {[["queue", `Moderation Queue (${posts.length})`], ["reports", `Reports (${reports.length})`]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={cn("flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition", tab === k ? "border-indigo-500 bg-indigo-500 text-white" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
            {k === "queue" ? <Eye className="size-4" /> : <Flag className="size-4" />} {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-indigo-500" /></div>
      ) : tab === "queue" ? (
        <div className="space-y-3">
          {posts.length === 0 ? <Empty text="Moderation queue is clear" /> : posts.map((p) => (
            <div key={String(p._id)} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{p.contentText || "(no text)"}</p>
                  <p className="text-xs text-muted-foreground">
                    by {p.author?.fullname || "Unknown"} · {timeAgo(p.createdAt)} · {p.type}
                    {p.moderation?.flaggedBySystem && <span className="ml-2 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-500">AUTO-FLAGGED</span>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {p.status === "active" ? (
                    <button onClick={() => hidePost(String(p._id), "hidden")} className="flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-600"><EyeOff className="size-3.5" /> Hide</button>
                  ) : (
                    <button onClick={() => hidePost(String(p._id), "active")} className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"><Eye className="size-3.5" /> Restore</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.length === 0 ? <Empty text="No open reports" /> : reports.map((r) => (
            <div key={String(r._id)} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">Report on {r.targetType}</p>
                  <p className="text-sm text-muted-foreground">{r.reason}</p>
                  {r.details && <p className="mt-1 text-xs text-muted-foreground">{r.details}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">by {r.reporter?.fullname || "Anonymous"} · {timeAgo(r.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button onClick={() => resolve(String(r._id), "resolved")} className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-600">Resolve</button>
                  <button onClick={() => resolve(String(r._id), "dismissed")} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground">Dismiss</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <TrendingUp className="mx-auto size-10 text-muted-foreground/30" />
      <p className="mt-3 text-sm font-semibold text-foreground">{text}</p>
    </div>
  );
}