import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  ImageIcon,
  FileDown,
  Check,
  Pencil,
  Trash2,
  MoreVertical,
  Mic,
  Reply,
  Copy,
  Forward,
  Pin,
  PinOff,
  SmilePlus,
} from "lucide-react";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import ReadReceipts from "./ReadReceipts";
import { formatTime, formatBytes, fileIcon } from "@/utils/chat";
import { cn } from "@/lib/utils";

const FILE_META = {
  pdf: { icon: FileText, color: "text-rose-500 bg-rose-50 dark:bg-rose-500/10" },
  doc: { icon: FileText, color: "text-sky-500 bg-sky-50 dark:bg-sky-500/10" },
  sheet: { icon: FileSpreadsheet, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" },
  slides: { icon: FileCode, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
  image: { icon: ImageIcon, color: "text-violet-500 bg-violet-50 dark:bg-violet-500/10" },
  audio: { icon: Mic, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" },
  file: { icon: File, color: "text-slate-500 bg-slate-100 dark:bg-slate-700" },
};

export function FileAttachment({ message, isMine }) {
  const kind = fileIcon(message.attachment?.mimeType, message.attachment?.name);
  const meta = FILE_META[kind] || FILE_META.file;
  const Icon = meta.icon;
  return (
    <a
      href={message.attachment?.url}
      target="_blank"
      rel="noopener noreferrer"
      download={message.attachment?.name || true}
      className="group flex items-center gap-3 rounded-2xl p-2.5 transition-colors"
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.color)}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm font-semibold", isMine ? "text-white" : "text-slate-800 dark:text-slate-100")}>
          {message.attachment?.name || "Attachment"}
        </span>
        <span className={cn("text-xs", isMine ? "text-white/70" : "text-slate-500 dark:text-slate-400")}>
          {message.attachment?.size ? formatBytes(message.attachment.size) : ""}
          {message.type === "resume" && " · Resume"}
        </span>
      </span>
      <FileDown className={cn("h-4 w-4 shrink-0 transition-transform", isMine ? "text-white/70" : "text-slate-400", "group-hover:scale-110")} />
    </a>
  );
}

export function ReplyPreview({ message, isMine }) {
  if (!message.replyTo) return null;
  const quoted =
    message.replyTo.body ||
    (message.replyTo.type === "image"
      ? "📷 Photo"
      : message.replyTo.type === "voice"
        ? "🎤 Voice message"
        : message.replyTo.attachment?.name
          ? `📎 ${message.replyTo.attachment.name}`
          : "Attachment");
  return (
    <div className={cn("mb-1.5 rounded-lg border-l-2 px-2.5 py-1.5 text-xs", isMine ? "border-white/50 bg-white/10 text-white/80" : "border-indigo-300 bg-indigo-50 text-slate-500 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-slate-300")}>
      <span className="block truncate italic">{quoted}</span>
    </div>
  );
}

export function EditComposer({ initial, onCancel, onSubmit }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(value); }
          if (e.key === "Escape") onCancel();
        }}
        className="flex-1 rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-400 dark:border-indigo-500/50 dark:bg-slate-800 dark:text-white"
        aria-label="Edit message"
      />
      <button
        type="button"
        onClick={() => onSubmit(value)}
        disabled={!value.trim()}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition-transform hover:scale-105 disabled:opacity-40"
        aria-label="Save edit"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700"
      >
        Cancel
      </button>
    </div>
  );
}

export function MessageContent({ message, isMine, onOpenImage }) {
  if (message.type === "system") {
    return (
      <div className="flex items-center justify-center py-1 text-xs font-medium text-slate-400 dark:text-slate-500">
        {message.body}
      </div>
    );
  }
  if (message.type === "voice") {
    return <VoiceMessagePlayer url={message.audio?.url} duration={message.audio?.duration} isMine={isMine} />;
  }
  if (message.type === "image" && message.attachment?.url) {
    return (
      <>
        <button
          type="button"
          onClick={() => onOpenImage?.(message.attachment.url)}
          className="group relative block overflow-hidden rounded-xl"
          aria-label="Open image"
        >
          <img
            src={message.attachment.url}
            alt={message.attachment?.name || "Image"}
            loading="lazy"
            className="max-h-72 w-full max-w-[280px] object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </button>
        {message.body && (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
        )}
      </>
    );
  }
  if (message.type === "file" || message.type === "resume") {
    return (
      <div className="min-w-[220px]">
        <FileAttachment message={message} isMine={isMine} />
        {message.body && (
          <p className={cn("mt-1 whitespace-pre-wrap px-1 text-sm leading-relaxed", isMine ? "text-white/90" : "text-slate-600 dark:text-slate-300")}>
            {message.body}
          </p>
        )}
      </div>
    );
  }
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.body}</p>
  );
}

function HoverActionBtn({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export function HoverActions({ onReply, onReact, onCopy, onForward, className }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute top-1/2 z-20 hidden -translate-y-1/2 items-center gap-0.5 rounded-full border border-slate-200/90 bg-white/95 p-1 opacity-0 shadow-xl backdrop-blur transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800/95 sm:flex",
        className
      )}
    >
      <HoverActionBtn icon={Reply} label="Reply" onClick={onReply} />
      <HoverActionBtn icon={SmilePlus} label="React" onClick={onReact} />
      <HoverActionBtn icon={Copy} label="Copy" onClick={onCopy} />
      <HoverActionBtn icon={Forward} label="Forward" onClick={onForward} />
    </div>
  );
}

export function MessageTimestamp({ message, isMine, showReceipts = false }) {
  return (
    <span className={cn("mt-1 flex items-center gap-1 text-[10px] font-medium", isMine ? "justify-end text-white/70" : "justify-end text-slate-400 dark:text-slate-500")}>
      {message.isEdited && <span className="italic">edited</span>}
      <span className="opacity-70">{formatTime(message.createdAt)}</span>
      {showReceipts && <ReadReceipts message={message} isMine />}
    </span>
  );
}

export function PinnedBadge() {
  return (
    <span className="absolute -top-2 right-2 flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 shadow-sm dark:bg-amber-500/20 dark:text-amber-300">
      <Pin className="h-2.5 w-2.5" fill="currentColor" />
      Pinned
    </span>
  );
}

export function MessageMenu({
  canEdit = false,
  canDelete = false,
  isPinned = false,
  isText = false,
  onReact,
  onReply,
  onCopy,
  onForward,
  onTogglePin,
  onEdit,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const close = () => setOpen(false);

  const Item = ({ icon: Icon, label, onClick, danger = false }) => (
    <button
      type="button"
      onClick={() => {
        close();
        onClick?.();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700",
        danger && "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-opacity hover:opacity-100 hover:text-slate-600 sm:opacity-0 sm:group-hover:opacity-100 dark:text-slate-500 dark:hover:text-slate-300"
        aria-label="Message options"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-800"
          >
            {Item({ icon: SmilePlus, label: "React", onClick: onReact })}
            {Item({ icon: Reply, label: "Reply", onClick: onReply })}
            {Item({ icon: Copy, label: "Copy", onClick: onCopy })}
            {Item({ icon: Forward, label: "Forward", onClick: onForward })}
            {Item({
              icon: isPinned ? PinOff : Pin,
              label: isPinned ? "Unpin message" : "Pin message",
              onClick: onTogglePin,
            })}
            {canEdit &&
              isText &&
              Item({ icon: Pencil, label: "Edit", onClick: onEdit })}
            {(canEdit || canDelete) && <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />}
            {canDelete && Item({ icon: Trash2, label: "Delete", onClick: onDelete, danger: true })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
