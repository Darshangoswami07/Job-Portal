export const formatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export const timeAgo = (date) => {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
};

const isSameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

export const formatDateDivider = (date) => {
  if (!date) return "";
  const now = new Date();
  const d = new Date(date);
  const dayDiff = Math.floor((now.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) / 86400000);

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return d.toLocaleDateString([], { weekday: "long" });

  const sameYear = now.getFullYear() === d.getFullYear();
  return d.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
};

export const needsDateDivider = (prev, current) => {
  if (!prev) return true;
  return !isSameDay(prev, current);
};

export const formatDuration = (seconds) => {
  const s = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
};

export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
};

export const fileIcon = (mimeType, name = "") => {
  if (!mimeType) return "file";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf")) return "pdf";
  if (name.toLowerCase().endsWith(".doc") || name.toLowerCase().endsWith(".docx")) return "doc";
  if (name.toLowerCase().endsWith(".xls") || name.toLowerCase().endsWith(".xlsx")) return "sheet";
  if (name.toLowerCase().endsWith(".ppt") || name.toLowerCase().endsWith(".pptx")) return "slides";
  return "file";
};

export const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const messageSenderId = (message) =>
  String(message?.sender?._id || message?.sender || message?.senderId || "");

export const isSameSender = (a, b) =>
  Boolean(a && b && messageSenderId(a) === messageSenderId(b));

export const APPLICATION_STATUS_META = {
  pending: { label: "Pending", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" },
  reviewed: { label: "Reviewed", dot: "bg-sky-500", text: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20" },
  interviewing: { label: "Interviewing", dot: "bg-violet-500", text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20" },
  accepted: { label: "Accepted", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
  rejected: { label: "Rejected", dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20" },
  hired: { label: "Hired", dot: "bg-green-600", text: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20" },
};

export const getStatusMeta = (status) =>
  APPLICATION_STATUS_META[status] || APPLICATION_STATUS_META.pending;
