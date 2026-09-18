import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, UserPlus, Inbox, Loader2, Check, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPendingRequests, respondConnectionRequest, fetchSuggested,
  fetchConnections, fetchFollowers, fetchFollowing,
} from "@/api/socialApi";
import { useSelector } from "react-redux";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Navbar from "@/components/shared/Navbar";

const TABS = [
  { key: "requests", label: "Requests", icon: Inbox },
  { key: "connections", label: "Connections", icon: UserCheck },
  { key: "followers", label: "Followers", icon: Users },
  { key: "following", label: "Following", icon: UserPlus },
  { key: "suggested", label: "Suggested", icon: UserPlus },
];

export default function NetworkPage() {
  const user = useSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(false);

  const myId = user ? String(user._id) : "";

  const loadRequests = useCallback(async () => {
    const res = await fetchPendingRequests();
    setRequests(res.data.requests || []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [conns, follows, fings, sugg] = await Promise.all([
        fetchConnections(myId),
        fetchFollowers(myId),
        fetchFollowing(myId),
        fetchSuggested({ limit: 8 }),
      ]);
      setConnections(conns.data.users || []);
      setFollowers(follows.data.users || []);
      setFollowing(fings.data.users || []);
      setSuggested(sugg.data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load network");
    } finally {
      setLoading(false);
    }
  }, [myId]);

  useEffect(() => {
    if (tab === "requests") loadRequests();
    else loadAll();
  }, [tab, loadRequests, loadAll]);

  const handleRequest = async (id, action) => {
    try {
      const res = await respondConnectionRequest(id, action);
      toast.success(res.data.message);
      setRequests((r) => r.filter((x) => String(x._id) !== String(id)));
      if (action === "accept") loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const PersonRow = ({ p, onAction, actionLabel }) => {
    const pid = String(p._id);
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
        <button onClick={() => navigate(`/feed/people/${pid}`)} className="shrink-0">
          <Avatar className="size-11">
            <AvatarImage src={p.profile?.profilePhoto} alt={p.fullname} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white">{(p.fullname || "U").charAt(0)}</AvatarFallback>
          </Avatar>
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={() => navigate(`/feed/people/${pid}`)} className="block truncate text-left text-sm font-bold text-foreground hover:text-[#0A66C2]">
            {p.fullname}
          </button>
          <p className="truncate text-xs text-muted-foreground">{p.profile?.headline || p.profile?.companyName || "Professional"}</p>
        </div>
        {onAction && onAction}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Network</h1>
        <p className="text-sm text-muted-foreground">Manage connections, follow professionals and grow your circle.</p>
      </motion.div>

      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const badge = t.key === "requests" ? requests.length : 0;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                tab === t.key ? "border-[#0A66C2] bg-[#0A66C2] text-white shadow-md shadow-blue-500/25" : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" /> {t.label}
              {badge > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{badge}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-[#0A66C2]" /></div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-3">
            {tab === "requests" && (
              requests.length === 0 ? (
                <Empty text="No pending connection requests" />
              ) : (
                requests.map((r) => (
                  <PersonRow
                    key={String(r._id)}
                    p={r.requester}
                    onAction={
                      <div className="flex shrink-0 gap-1.5">
                        <button onClick={() => handleRequest(String(r._id), "accept")} className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"><Check className="size-3.5" /> Accept</button>
                        <button onClick={() => handleRequest(String(r._id), "decline")} className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-red-50 hover:text-red-500"><X className="size-3.5" /> Decline</button>
                      </div>
                    }
                  />
                ))
              )
            )}

            {tab === "connections" && (connections.length === 0 ? <Empty text="No connections yet — send connection requests to grow your network" /> : connections.map((p) => <PersonRow key={String(p._id)} p={p} />))}
            {tab === "followers" && (followers.length === 0 ? <Empty text="No followers yet" /> : followers.map((p) => <PersonRow key={String(p._id)} p={p} />))}
            {tab === "following" && (following.length === 0 ? <Empty text="You aren't following anyone yet" /> : following.map((p) => <PersonRow key={String(p._id)} p={p} />))}
            {tab === "suggested" && (
              suggested.length === 0 ? <Empty text="No suggestions yet" /> : (
                suggested.map((p) => (
                  <PersonRow
                    key={String(p._id)}
                    p={p}
                    onAction={
                      <button onClick={() => navigate(`/feed/people/${String(p._id)}`)} className="shrink-0 rounded-lg border border-[#0A66C2] px-3 py-1.5 text-xs font-bold text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white">
                        View profile
                      </button>
                    }
                  />
                ))
              )
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
    </>
  );
}

function Empty({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <Users className="mx-auto size-10 text-muted-foreground/30" />
      <p className="mt-3 text-sm font-semibold text-foreground">{text}</p>
    </div>
  );
}