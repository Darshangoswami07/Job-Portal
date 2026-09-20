import {
  Type, Image, Video, FileText, Link2, Briefcase, Trophy, Award,
  GraduationCap, Code2, BarChart3, Users, MessageSquare, Bookmark,
  Share2, Star, Target, Rocket, Coffee, Brain, HelpCircle, ClipboardList,
} from "lucide-react";

export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatCount(n) {
  const num = Number(n || 0);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(num);
}

export const REACTIONS = {
  like: { label: "Like", emoji: "👍", color: "#0A66C2", cls: "text-[#0A66C2]" },
  love: { label: "Love", emoji: "❤️", color: "#E0245E", cls: "text-rose-500" },
  celebrate: { label: "Celebrate", emoji: "🎉", color: "#F59E0B", cls: "text-amber-500" },
  insightful: { label: "Insightful", emoji: "💡", color: "#8B5CF6", cls: "text-violet-500" },
  support: { label: "Support", emoji: "🤝", color: "#10B981", cls: "text-emerald-500" },
  funny: { label: "Funny", emoji: "😂", color: "#F97316", cls: "text-orange-500" },
  applause: { label: "Applause", emoji: "👏", color: "#0D9488", cls: "text-teal-500" },
};

export const REACTION_ORDER = ["like", "love", "celebrate", "insightful", "support", "funny", "applause"];

export function totalReactions(counts) {
  if (!counts) return 0;
  return REACTION_ORDER.reduce((sum, k) => sum + (Number(counts[k]) || 0), 0);
}

export const POST_TYPES = {
  text: { label: "Text", icon: Type, cls: "text-slate-500 bg-slate-500/10" },
  image: { label: "Image", icon: Image, cls: "text-emerald-500 bg-emerald-500/10" },
  video: { label: "Video", icon: Video, cls: "text-rose-500 bg-rose-500/10" },
  document: { label: "Document", icon: FileText, cls: "text-orange-500 bg-orange-500/10" },
  project: { label: "Project", icon: Code2, cls: "text-violet-500 bg-violet-500/10" },
  portfolio: { label: "Portfolio", icon: Star, cls: "text-indigo-500 bg-indigo-500/10" },
  github: { label: "GitHub", icon: Code2, cls: "text-slate-600 bg-slate-600/10 dark:text-slate-300" },
  hiring: { label: "Hiring", icon: Briefcase, cls: "text-blue-500 bg-blue-500/10" },
  openToWork: { label: "Open to Work", icon: Target, cls: "text-emerald-500 bg-emerald-500/10" },
  promotion: { label: "Promotion", icon: Rocket, cls: "text-fuchsia-500 bg-fuchsia-500/10" },
  certificate: { label: "Certificate", icon: GraduationCap, cls: "text-amber-500 bg-amber-500/10" },
  hackathon: { label: "Hackathon", icon: Trophy, cls: "text-violet-500 bg-violet-500/10" },
  internship: { label: "Internship", icon: ClipboardList, cls: "text-cyan-500 bg-cyan-500/10" },
  referral: { label: "Referral", icon: Users, cls: "text-sky-500 bg-sky-500/10" },
  poll: { label: "Poll", icon: BarChart3, cls: "text-indigo-500 bg-indigo-500/10" },
  achievement: { label: "Achievement", icon: Trophy, cls: "text-amber-500 bg-amber-500/10" },
  interview: { label: "Interview Experience", icon: Brain, cls: "text-purple-500 bg-purple-500/10" },
  advice: { label: "Career Advice", icon: Coffee, cls: "text-orange-500 bg-orange-500/10" },
  article: { label: "Article", icon: FileText, cls: "text-slate-600 bg-slate-600/10 dark:text-slate-300" },
};

export const COMPOSER_TYPES = [
  { value: "text", label: "Text", icon: Type, desc: "Share a thought" },
  { value: "image", label: "Image", icon: Image, desc: "Photos & visuals" },
  { value: "video", label: "Video", icon: Video, desc: "Video updates" },
  { value: "document", label: "Document", icon: FileText, desc: "PDF, DOCX, PPT" },
  { value: "link", label: "Link", icon: Link2, desc: "Share a URL" },
  { value: "hiring", label: "Hiring", icon: Briefcase, desc: "Post a job" },
  { value: "achievement", label: "Achievement", icon: Trophy, desc: "Milestones & wins" },
  { value: "certificate", label: "Certificate", icon: GraduationCap, desc: "Show credentials" },
  { value: "project", label: "Project", icon: Code2, desc: "Showcase your work" },
  { value: "poll", label: "Poll", icon: BarChart3, desc: "Ask your network" },
];

export const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", desc: "Anyone on JobPilot can see it" },
  { value: "connections", label: "Connections", desc: "Your connections only" },
  { value: "followers", label: "Followers", desc: "Your followers only" },
  { value: "onlyMe", label: "Only Me", desc: "Private to you" },
  { value: "recruitersOnly", label: "Recruiters Only", desc: "Recruiters only" },
  { value: "jobSeekersOnly", label: "Job Seekers Only", desc: "Job seekers only" },
];

export const AI_ACTIONS = [
  { value: "improve", label: "Improve Writing", icon: SparkleIcon },
  { value: "professional", label: "Make Professional", icon: Briefcase },
  { value: "grammar", label: "Fix Grammar", icon: HelpCircle },
  { value: "hashtags", label: "Generate Hashtags", icon: HashIcon },
  { value: "summarize", label: "Summarize", icon: BarChart3 },
  { value: "translate", label: "Translate", icon: LanguagesIcon },
  { value: "careerTips", label: "Career Tips", icon: Coffee },
  { value: "hiring", label: "Hiring Post", icon: Briefcase },
  { value: "project", label: "Project Showcase", icon: Code2 },
  { value: "certificate", label: "Certificate Post", icon: GraduationCap },
];

import { Sparkles as SparkleIcon, Hash as HashIcon, Languages as LanguagesIcon } from "lucide-react";

export function linkify(text = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 underline underline-offset-2">$1</a>')
    .replace(/#([\p{L}\p{N}_]+)/gu, '<a href="#hashtag=$1" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline" data-hashtag="$1">#$1</a>')
    .replace(/@([\p{L}\p{N}_.]+)/gu, '<span class="font-semibold text-slate-700 dark:text-slate-200">@$1</span>');
}

export function extractHashtagsFromText(text = "") {
  const matches = String(text).match(/#([\p{L}\p{N}_]+)/gu) || [];
  return [...new Set(matches.map((m) => m.slice(1)))].slice(0, 15);
}

export const POST_TYPE_LABEL = (type) => POST_TYPES[type]?.label || "Post";

export const SOCKET_EVENTS = {
  NEW_POST: "social:new_post",
  REACTION: "social:reaction",
  COMMENT: "social:comment",
  FOLLOW: "social:follow",
  CONNECTION_REQUEST: "social:connection_request",
  NOTIFICATION: "social:notification",
};