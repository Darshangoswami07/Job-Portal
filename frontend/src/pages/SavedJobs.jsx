import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "@/components/shared/Navbar";
import { SAVED_JOB_API_END_POINT } from "@/utils/constant";
import { copyToClipboard } from "@/utils/clipboard";
import {
  Bookmark, Briefcase, MapPin, Clock, TrendingUp, Sparkles,
  Award, Building2, Star, Target, Rocket, ArrowUpRight,
  Search, X, SlidersHorizontal, ChevronDown, ExternalLink,
  Trash2, Share2, Eye, GraduationCap, Bell, Calendar,
  ChevronRight, Filter, Loader2, CheckCircle, AlertCircle,
  FileText, BarChart3, Users, Zap, Flag, Timer,
  Lightbulb, ArrowRight, RefreshCw, Heart, Settings,
  LayoutGrid, List as ListIcon, Sun, Moon,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const daysAgo = (date) => {
  if (!date) return "Recently";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const formatSalary = (job) => {
  if (!job) return "";
  if (job.salaryMin && job.salaryMax) return `$${job.salaryMin}K-$${job.salaryMax}K`;
  if (job.salary) return `$${job.salary}K`;
  return "";
};

const getInitials = (name) => (name || "C")[0].toUpperCase();

function useCountUp(end, duration = 1500) {
  const [count, setCount] = useState(0);
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current || end === 0) {
      setCount(end);
      return;
    }
    counted.current = true;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return count;
}

function CountUp({ end, suffix = "", prefix = "", decimals = 0 }) {
  const count = useCountUp(end);
  return <>{prefix}{count.toLocaleString()}{suffix}</>;
}

function Skeleton({ className }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, trend, color, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 dark:hover:border-blue-800"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/30 dark:to-blue-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${gradient} shadow-lg shadow-${color}-500/20 transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              <CountUp end={value} />
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${
            trend >= 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            <TrendingUp className={`h-3 w-3 ${trend < 0 ? "rotate-180" : ""}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3">{sub}</p>}
    </motion.div>
  );
}

function SkillTag({ skill, index }) {
  const colors = [
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
    "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  ];
  const c = colors[index % colors.length];
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: 1.05, y: -1 }}
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all duration-200 ${c} hover:shadow-sm`}
    >
      {skill}
    </motion.span>
  );
}

function MatchBadge({ score }) {
  if (!score && score !== 0) return null;
  const color = score >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                score >= 60 ? "text-amber-600 dark:text-amber-400" :
                "text-gray-500 dark:text-gray-400";
  const barColor = score >= 80 ? "bg-emerald-500" :
                   score >= 60 ? "bg-amber-500" :
                   "bg-gray-400";
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-bold ${color}`}>{score}%</span>
      <div className="h-1.5 w-16 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
    </div>
  );
}

function PremiumJobCard({ job, isSaved, onToggleSaved, onViewDetails, index = 0 }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const navigate = useNavigate();

  const company = job?.company || {};
  const companyName = company?.name || job?.companyName || "Company";
  const companyLogo = company?.logo || job?.companyLogoUrl || "";
  const location = job?.location || company?.location || "Remote";
  const jobTitle = job?.title || "Position";
  const description = job?.description || "";
  const skills = job?.skills || job?.requirements || [];
  const salary = formatSalary(job);
  const jobType = job?.jobType || "Full-time";
  const workType = job?.workType || "";
  const experience = job?.experienceLevel || job?.experienceMin || "";
  const postedDate = job?.createdAt || job?.publishedAt;
  const matchScore = job?.aiMatch || job?.skillMatch || 0;
  const urgency = job?.urgent;
  const easyApply = job?.easyApply;
  const verified = job?.verified || company?.verified;
  const applicants = job?.applicantsCount || job?.applications?.length || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-200 dark:hover:border-blue-700 hover:-translate-y-1.5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/20 dark:to-blue-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="relative shrink-0"
            >
              <Avatar className="h-12 w-12 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <AvatarImage src={companyLogo} alt={companyName} />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                  {getInitials(companyName)}
                </AvatarFallback>
              </Avatar>
              {verified && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[200px]">
                  {companyName}
                </h3>
                {verified && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-[10px] px-1.5 py-0 rounded-full">
                    <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Verified
                  </Badge>
                )}
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mt-1 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {jobTitle}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </span>
                {workType && (
                  <span className={`flex items-center gap-1 ${
                    workType === "Remote" ? "text-emerald-600 dark:text-emerald-400" :
                    workType === "Hybrid" ? "text-amber-600 dark:text-amber-400" : ""
                  }`}>
                    <Briefcase className="h-3 w-3" />
                    {workType}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {daysAgo(postedDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-1.5 shrink-0">
            {urgency && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-2 py-1 text-[10px] font-medium">
                <Flag className="h-2.5 w-2.5" /> Urgent
              </span>
            )}
          </div>
        </div>

        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {salary && (
            <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-medium text-xs rounded-lg px-2.5 py-1">
              <BarChart3 className="h-3 w-3 mr-1" />
              {salary}
            </Badge>
          )}
          <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-medium text-xs rounded-lg px-2.5 py-1">
            <Briefcase className="h-3 w-3 mr-1" />
            {jobType}
          </Badge>
          {experience ? (
            <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-medium text-xs rounded-lg px-2.5 py-1">
              <Award className="h-3 w-3 mr-1" />
              {experience}+ yrs
            </Badge>
          ) : null}
          {applicants > 0 && (
            <Badge variant="secondary" className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 font-medium text-xs rounded-lg px-2.5 py-1">
              <Users className="h-3 w-3 mr-1" />
              {applicants} applicants
            </Badge>
          )}
          {easyApply && (
            <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-medium text-xs rounded-lg px-2.5 py-1">
              <Zap className="h-3 w-3 mr-0.5" /> Easy Apply
            </Badge>
          )}
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {skills.slice(0, 5).map((skill, i) => (
              <SkillTag key={i} skill={skill} index={i} />
            ))}
            {skills.length > 5 && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500 self-center">+{skills.length - 5}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
          <MatchBadge score={matchScore} />
          <div className="text-[10px] text-gray-400 dark:text-gray-500">
            Saved {daysAgo(job?.savedAt || job?.createdAt)}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => { e.stopPropagation(); navigate(`/description/${job._id}`); }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            <Eye className="h-4 w-4" />
            View Details
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onToggleSaved(job._id, true); }}
            className="inline-flex items-center justify-center rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-300 p-2.5 transition-all duration-200"
            aria-label="Remove from saved"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(`${window.location.origin}/description/${job._id}`);
              toast.success("Link copied");
            }}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 p-2.5 transition-all duration-200"
            aria-label="Share job"
          >
            <Share2 className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ onBrowse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative col-span-full flex flex-col items-center justify-center py-20 px-6"
    >
      <motion.div
        animate={{
          y: [0, -8, 0],
          rotate: [0, -3, 3, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/25">
          <Bookmark className="h-10 w-10 text-white" />
        </div>
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        No saved jobs yet
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-8 leading-relaxed">
        Start exploring opportunities and bookmark the ones that interest you.
        Your saved jobs will appear here for easy access.
      </p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onBrowse}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
      >
        <Search className="h-4 w-4" />
        Browse Jobs
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}

function ProfileCompletionCard({ user }) {
  const p = user?.profile || {};
  const fields = [
    !!user?.fullname, !!p.headline, !!p.location, !!p.skills?.length,
    !!p.resume, !!p.profilePhoto, !!p.bio,
  ];
  const completed = fields.filter(Boolean).length;
  const total = fields.length;
  const percent = Math.min(Math.round((completed / total) * 100), 100);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Profile Completion</h3>
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
        />
      </div>
      <div className="space-y-1.5 mb-4">
        {["Full Name", "Headline", "Location", "Skills", "Resume", "Photo", "Bio"].map((label, i) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${fields[i] ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
              {fields[i] ? <CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> : <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />}
            </div>
            <span className={fields[i] ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}>{label}</span>
          </div>
        ))}
      </div>
      {percent < 100 && (
        <Button onClick={() => navigate("/profile")} size="sm" className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold">
          Complete Profile
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      )}
    </motion.div>
  );
}

function ResumeScoreCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Resume Score</h3>
        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">89</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "89%" }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
        />
      </div>
      <div className="space-y-1.5">
        {[
          { label: "Add projects", done: false },
          { label: "Update skills", done: true },
          { label: "Upload latest resume", done: false },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            {item.done ? (
              <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
            )}
            <span className={item.done ? "text-gray-500 dark:text-gray-400 line-through" : "text-gray-600 dark:text-gray-300"}>{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function QuickActionsCard() {
  const navigate = useNavigate();
  const actions = [
    { icon: FileText, label: "Upload Resume", color: "from-blue-500 to-indigo-600", path: "/profile" },
    { icon: Search, label: "Browse Jobs", color: "from-emerald-500 to-teal-600", path: "/jobs" },
    { icon: GraduationCap, label: "Career Roadmap", color: "from-purple-500 to-pink-600", path: "/career-roadmap" },
    { icon: Zap, label: "Interview Prep", color: "from-amber-500 to-orange-600", path: "/mock-interview" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <motion.button
            key={action.label}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3 transition-all duration-200 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700"
          >
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm`}>
              <action.icon className="h-4 w-4 text-white" />
            </div>
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 leading-tight text-center">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function CareerTipsCard() {
  const tips = [
    { icon: Lightbulb, text: "Customize your resume for each application to increase match rates.", type: "Resume" },
    { icon: Target, text: "Set a goal of 5-10 applications per week to stay on track.", type: "Goal" },
    { icon: Star, text: "Follow up within 48 hours after applying to stand out.", type: "Follow-up" },
  ];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((p) => (p + 1) % tips.length), 8000);
    return () => clearInterval(t);
  }, []);

  const tip = tips[current];
  const Icon = tip.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.4 }}
      className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Career Tip</h3>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">{tip.type}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{tip.text}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-1 mt-3 justify-center">
        {tips.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-blue-500" : "w-1.5 bg-gray-300 dark:bg-gray-600"}`} />
        ))}
      </div>
    </motion.div>
  );
}

function RecentlyViewedCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Application Goal</h3>
      <div className="relative flex items-center justify-center py-3">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f3f4f6" strokeWidth="2.5" className="dark:stroke-gray-800" />
          <motion.circle
            cx="18" cy="18" r="15.5" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${(4 / 10) * 97.4} 97.4`}
            className="text-blue-500"
            initial={{ strokeDasharray: "0 97.4" }}
            animate={{ strokeDasharray: `${(4 / 10) * 97.4} 97.4` }}
            transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white">4<span className="text-sm text-gray-400">/10</span></p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Weekly Goal</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function SavedJobs() {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const loadSavedJobs = useCallback(async () => {
    setLoading(true);
    if (!user) {
      setSavedJobs([]);
      setSavedJobIds(new Set());
      setLoading(false);
      navigate("/login");
      return;
    }
    try {
      const url = `${SAVED_JOB_API_END_POINT}/me`;
      const res = await axios.get(url, { withCredentials: true });
      if (!res.data?.success) {
        setSavedJobs([]);
        setSavedJobIds(new Set());
        return;
      }
      const saved = res.data.savedJobs || res.data?.data || [];
      const jobs = saved.map((item) => item.jobId || item.job || item).filter(Boolean);
      setSavedJobs(jobs);
      setSavedJobIds(
        new Set(jobs.map((job) => job?._id || job?.id).filter(Boolean).map(String))
      );
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }
      setSavedJobs([]);
      setSavedJobIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [navigate, user]);

  useEffect(() => {
    loadSavedJobs();
  }, [loadSavedJobs]);

  const handleToggleSaved = async (jobId, currentlySaved) => {
    const normalizedJobId = String(jobId);
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      currentlySaved ? next.delete(normalizedJobId) : next.add(normalizedJobId);
      return next;
    });
    setSavedJobs((prev) => prev.filter((job) => String(job._id) !== normalizedJobId));

    try {
      await axios.delete(`${SAVED_JOB_API_END_POINT}/${normalizedJobId}`, {
        withCredentials: true,
      });
      toast.success("Job removed from saved");
    } catch (error) {
      console.error("Unable to remove saved job:", error);
      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }
      loadSavedJobs();
    }
  };

  const filteredJobs = useMemo(() => {
    let jobs = [...savedJobs];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      jobs = jobs.filter((j) =>
        (j.title || "").toLowerCase().includes(q) ||
        (j.company?.name || j.companyName || "").toLowerCase().includes(q) ||
        (j.location || "").toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") {
      jobs = jobs.filter((j) => {
        const type = (j.jobType || "").toLowerCase();
        const work = (j.workType || "").toLowerCase();
        if (filterType === "remote") return work === "remote";
        if (filterType === "hybrid") return work === "hybrid";
        if (filterType === "onsite") return work === "on-site" || work === "onsite";
        if (filterType === "fulltime") return type === "full-time" || type === "fulltime";
        if (filterType === "internship") return type === "internship";
        return true;
      });
    }
    if (sortBy === "recent") jobs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    else if (sortBy === "salary") jobs.sort((a, b) => (b.salary || 0) - (a.salary || 0));
    else if (sortBy === "experience") jobs.sort((a, b) => (b.experienceLevel || 0) - (a.experienceLevel || 0));
    return jobs;
  }, [savedJobs, searchQuery, filterType, sortBy]);

  const stats = useMemo(() => {
    const total = savedJobs.length;
    const today = savedJobs.filter((j) => {
      const d = new Date(j.createdAt || 0);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;
    const remote = savedJobs.filter((j) => (j.workType || "").toLowerCase() === "remote").length;
    const urgent = savedJobs.filter((j) => j.urgent).length;
    return { total, today, remote, urgent };
  }, [savedJobs]);

  const userName = user?.fullname?.split(" ")[0] || "there";
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";

  const filters = [
    { id: "all", label: "All Jobs" },
    { id: "remote", label: "Remote" },
    { id: "hybrid", label: "Hybrid" },
    { id: "onsite", label: "On-site" },
    { id: "fulltime", label: "Full Time" },
    { id: "internship", label: "Internship" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/20">
      <Navbar />

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/3 to-purple-500/3 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] bg-[length:24px_24px] opacity-30" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-2">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-sm font-medium text-blue-600 dark:text-blue-400"
              >
                {greeting}, {userName} 👋
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-1"
              >
                Saved Jobs
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-sm text-gray-500 dark:text-gray-400 mt-1"
              >
                Keep track of opportunities you&apos;re interested in.
              </motion.p>
            </div>
            {!loading && savedJobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 px-4 py-2"
              >
                <Bookmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {filteredJobs.length} saved
                </span>
              </motion.div>
            )}
          </div>

          {!loading && savedJobs.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-xs text-gray-400 dark:text-gray-500 mt-1"
            >
              Great choices! Keep building your dream career.
            </motion.p>
          )}
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : savedJobs.length === 0 ? (
          <EmptyState onBrowse={() => navigate("/jobs")} />
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8"
            >
              <StatCard
                icon={Bookmark}
                label="Saved Jobs"
                value={stats.total}
                trend={12}
                color="blue"
                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                delay={0.1}
              />
              <StatCard
                icon={Sparkles}
                label="Saved Today"
                value={stats.today}
                color="emerald"
                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                delay={0.15}
              />
              <StatCard
                icon={Briefcase}
                label="Remote Jobs"
                value={stats.remote}
                color="purple"
                gradient="bg-gradient-to-br from-purple-500 to-pink-600"
                delay={0.2}
              />
              <StatCard
                icon={Flag}
                label="Urgent"
                value={stats.urgent}
                color="amber"
                gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                delay={0.25}
              />
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="mb-5 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search saved jobs..."
                        className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`h-11 px-3 rounded-xl border transition-all duration-200 flex items-center gap-2 text-sm ${
                        showFilters || filterType !== "all"
                          ? "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span className="hidden sm:inline">Filters</span>
                    </button>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-11 pl-3 pr-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-all duration-200"
                      >
                        <option value="recent">Recently Saved</option>
                        <option value="salary">Highest Salary</option>
                        <option value="experience">Most Experience</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
                        aria-label="Grid view"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
                        aria-label="List view"
                      >
                        <ListIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-2 pt-1">
                          {filters.map((f) => (
                            <motion.button
                              key={f.id}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setFilterType(f.id)}
                              className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                                filterType === f.id
                                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400"
                              }`}
                            >
                              {f.label}
                            </motion.button>
                          ))}
                          {filterType !== "all" && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={() => { setFilterType("all"); setSearchQuery(""); }}
                              className="px-3 py-2 rounded-xl text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200"
                            >
                              <X className="h-3 w-3" />
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="space-y-4"
                >
                  {filteredJobs.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-16"
                    >
                      <Search className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No results found</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Try adjusting your search or filters.</p>
                      <Button
                        onClick={() => { setSearchQuery(""); setFilterType("all"); }}
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" /> Clear filters
                      </Button>
                    </motion.div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {filteredJobs.map((job, index) => (
                        <PremiumJobCard
                          key={job._id}
                          job={job}
                          isSaved={savedJobIds.has(String(job?._id))}
                          onToggleSaved={handleToggleSaved}
                          onViewDetails={() => navigate(`/description/${job._id}`)}
                          index={index}
                        />
                      ))}
                    </AnimatePresence>
                  )}
                </motion.div>
              </div>

              <div className="lg:w-80 shrink-0 space-y-4">
                <ProfileCompletionCard user={user} />
                <ResumeScoreCard />
                <QuickActionsCard />
                <CareerTipsCard />
                <RecentlyViewedCard />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
