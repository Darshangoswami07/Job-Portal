import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, CheckCheck, Search, Users, CalendarDays, MessageSquare,
  ShieldCheck, Briefcase, CreditCard, Filter, Trash2, Loader2,
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { NOTIFICATION_API_END_POINT } from "@/utils/constant";
import { cn } from "@/lib/utils";

const TYPE_META = {
  application: { icon: Users, cls: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  interview: { icon: CalendarDays, cls: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  message: { icon: MessageSquare, cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  job: { icon: Briefcase, cls: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  system: { icon: ShieldCheck, cls: "bg-slate-500/15 text-slate-600 dark:text-slate-400" },
  subscription: { icon: CreditCard, cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${NOTIFICATION_API_END_POINT}?limit=50`, { withCredentials: true });
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnread(res.data.unreadCount || 0);
      }
    } catch {
      /* notification fetch is non-critical */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await axios.patch(`${NOTIFICATION_API_END_POINT}/read-all`, {}, { withCredentials: true });
      setNotifications((n) => n.map((x) => ({ ...x, isRead: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  const markRead = async (n) => {
    if (n.isRead) return;
    try {
      await axios.patch(`${NOTIFICATION_API_END_POINT}/${n._id}/read`, {}, { withCredentials: true });
      setNotifications((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    } catch { /* ignore */ }
  };

  const removeOne = async (id) => {
    try {
      await axios.delete(`${NOTIFICATION_API_END_POINT}/${id}`, { withCredentials: true });
      setNotifications((list) => list.filter((x) => x._id !== id));
    } catch { /* ignore */ }
  };

  const filtered = notifications.filter((n) => {
    if (filter !== "all" && n.type !== filter) return false;
    if (search && !`${n.title} ${n.message}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const types = ["all", ...new Set(notifications.map((n) => n.type))];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex size-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="size-[18px]" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-1 text-[10px] font-bold text-white shadow"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] origin-top-right overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-bold text-foreground">Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {unread > 0 ? `${unread} unread` : "You're all caught up"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={markAllRead}
                  disabled={unread === 0}
                  className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
                  title="Mark all as read"
                  aria-label="Mark all as read"
                >
                  <CheckCheck className="size-4" />
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  title="View settings"
                  aria-label="View settings"
                >
                  <Filter className="size-4" />
                </button>
              </div>
            </div>

            <div className="relative border-b border-border px-3 py-2">
              <Search className="absolute left-6 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications..."
                className="w-full rounded-xl bg-muted/60 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Search notifications"
              />
            </div>

            {types.length > 1 && (
              <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
                {types.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition",
                      filter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="size-9 shimmer rounded-xl" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 shimmer rounded" />
                        <div className="h-2.5 w-1/2 shimmer rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Bell className="size-8 text-muted-foreground/30" />
                  <p className="text-sm font-semibold text-foreground">No notifications</p>
                  <p className="text-xs text-muted-foreground">New updates will appear here.</p>
                </div>
              ) : (
                filtered.map((n) => {
                  const meta = TYPE_META[n.type] || TYPE_META.system;
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={n._id}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "group relative flex gap-3 border-b border-border/60 px-4 py-3 transition-colors",
                        !n.isRead ? "bg-primary/[0.04]" : "hover:bg-muted/40"
                      )}
                    >
                      <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", meta.cls)}>
                        <Icon className="size-4" />
                      </span>
                      <button
                        onClick={() => {
                          markRead(n);
                          if (n.link) navigate(n.link);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className={cn("text-sm leading-snug", n.isRead ? "font-medium text-muted-foreground" : "font-bold text-foreground")}>
                          {n.title}
                        </p>
                        {n.message && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>}
                        <p className="mt-1 text-[10px] font-medium text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                      </button>
                      {!n.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                      <button
                        onClick={() => removeOne(n._id)}
                        className="absolute right-2 top-2 hidden rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-destructive group-hover:block"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
