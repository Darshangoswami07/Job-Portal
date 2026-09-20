import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Newspaper, Users, Bookmark, MessageSquare, Briefcase, Sparkles,
  Compass, Building2, Hash, MapPin, BadgeCheck, ArrowRight,
} from "lucide-react";
import { useSelector } from "react-redux";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { fetchPublicProfile } from "@/api/socialApi";
import { formatCount } from "@/utils/social";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Feed", icon: Newspaper, to: "/feed" },
  { label: "My Network", icon: Users, to: "/feed/network" },
  { label: "Saved Posts", icon: Bookmark, to: "/feed/saved" },
  { label: "Messages", icon: MessageSquare, to: "/chat" },
  { label: "Find Jobs", icon: Briefcase, to: "/jobs" },
  { label: "Career Tools", icon: Sparkles, to: "/recommended-jobs" },
  { label: "Explore People", icon: Compass, to: "/feed/search?type=people" },
  { label: "Explore Companies", icon: Building2, to: "/browse-companies" },
  { label: "Trending Skills", icon: Hash, to: "/feed/search?type=hashtags" },
];

function Stat({ label, value, to }) {
  const inner = (
    <>
      <p className="text-sm font-extrabold text-foreground">{formatCount(value)}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </>
  );
  return to ? (
    <Link to={to} className="rounded-lg py-1 transition hover:bg-muted">{inner}</Link>
  ) : (
    <div className="py-1">{inner}</div>
  );
}

export default function LeftSidebar() {
  const user = useSelector((s) => s.auth.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  const viewerId = user?._id ? String(user._id) : "";

  useEffect(() => {
    if (!viewerId) return;
    let alive = true;
    fetchPublicProfile(viewerId)
      .then((res) => {
        if (alive && res.data?.success) setStats(res.data.profile);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [viewerId]);

  const score = Math.max(0, Math.min(100, Math.round(user?.profileCompletionScore ?? 0)));
  const isJobSeeker = user?.currentRole !== "recruiter";
  const headline = user?.profile?.headline || (isJobSeeker ? "Job seeker on JobPilot" : "Recruiter on JobPilot");
  const subtitle = user?.profile?.companyName || (isJobSeeker ? "Open to opportunities" : "");
  const loc = user?.profile?.location;

  const isActive = (to) => {
    const path = to.split("?")[0];
    if (path === "/feed") return location.pathname === "/feed";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <div className="space-y-3">
      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm"
      >
        <div className="relative h-16 bg-gradient-to-r from-[#0A66C2] via-indigo-600 to-violet-600">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-20%,rgba(255,255,255,0.35),transparent_60%)]" />
        </div>
        <div className="px-4 pb-4">
          <button onClick={() => navigate("/profile")} className="-mt-9 mb-2 block rounded-2xl">
            <Avatar className="size-16 rounded-2xl ring-4 ring-card">
              <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
              <AvatarFallback className="rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-xl text-white">
                {(user?.fullname || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="flex items-center gap-1.5">
            <Link to="/profile" className="truncate text-[15px] font-bold text-foreground hover:text-[#0A66C2] hover:underline">
              {user?.fullname}
            </Link>
            {stats?.profile?.verificationStatus === "verified" && (
              <BadgeCheck className="size-4 shrink-0 text-[#0A66C2]" />
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{headline}</p>
          {subtitle && <p className="mt-1 text-[11px] font-semibold text-[#0A66C2]">{subtitle}</p>}
          {loc && (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="size-3" /> {loc}
            </p>
          )}

          {isJobSeeker && (
            <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Available for opportunities
            </span>
          )}

          {/* Profile completion */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>Profile completion</span>
              <span className="text-foreground">{score}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#0A66C2] to-indigo-500"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1 border-t border-border/60 pt-2.5 text-center">
            <Stat label="Followers" value={stats?.followerCount ?? user?.profile?.followCount ?? 0} to="/profile?tab=followers" />
            <Stat label="Following" value={stats?.followingCount ?? 0} to="/profile?tab=following" />
            <Stat label="Posts" value={stats?.postCount ?? 0} to="/profile?tab=posts" />
          </div>

          <button
            onClick={() => navigate("/profile")}
            className="mt-3 w-full rounded-xl bg-[#0A66C2]/10 py-2 text-xs font-bold text-[#0A66C2] transition hover:bg-[#0A66C2]/20"
          >
            View Profile
          </button>
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="rounded-2xl border border-border/70 bg-card p-1.5 shadow-sm"
      >
        {NAV.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all",
                active
                  ? "bg-[#0A66C2]/10 text-[#0A66C2]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("size-4 transition-transform group-hover:scale-110", active && "text-[#0A66C2]")} />
              {item.label}
              {active && <span className="ml-auto size-1.5 rounded-full bg-[#0A66C2]" />}
            </Link>
          );
        })}
      </motion.nav>

      {/* Career upgrade promo */}
      <motion.div
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E1B4B] p-4 text-white shadow-sm"
      >
        <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-[#0A66C2]/30 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-white/10">
              <Sparkles className="size-4 text-blue-300" />
            </span>
            <p className="text-sm font-bold">Upgrade Your Career with JobPilot AI</p>
          </div>
          <p className="mt-2 text-xs text-blue-100/80">
            AI resume builder, interview prep, and job matches tuned to your profile.
          </p>
          <button
            onClick={() => navigate("/recommended-jobs")}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/95 py-2 text-xs font-bold text-[#0F172A] transition hover:bg-white"
          >
            Explore Career Tools <ArrowRight className="size-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
