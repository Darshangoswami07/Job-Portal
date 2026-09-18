import { useMemo } from "react";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  BellOff,
  Bell,
  Trash2,
  Info,
  ShieldCheck,
} from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const getOtherUser = (conversation, userId) => {
  if (!conversation?.participants) return null;
  const other = conversation.participants.find(
    (p) => String(p?._id || p) !== String(userId)
  );
  return other || null;
};

function MenuAction({ icon: Icon, label, onClick, danger = false, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40",
        danger
          ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default function ChatHeader({
  conversation,
  userId,
  onBack,
  onToggleInfo,
  onTogglePin,
  onToggleArchive,
  onToggleMute,
  onDelete,
}) {
  const other = useMemo(() => getOtherUser(conversation, userId), [conversation, userId]);
  const job = conversation?.job;
  const company = conversation?.company;
  const online = Boolean(conversation?.otherOnline);
  const name = other?.fullname || "User";

  const subtitle = useMemo(() => {
    if (!job) return "";
    const parts = [];
    if (company?.name) parts.push(company.name);
    if (job.title) parts.push(job.title);
    return parts.join(" · ");
  }, [job, company]);

  return (
    <header className="flex items-center gap-2 border-b border-slate-200/80 bg-white/70 px-3 py-2.5 backdrop-blur-xl sm:px-4 dark:border-slate-800 dark:bg-slate-900/60">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Back to conversations"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <ChatAvatar src={other?.profilePhoto || other?.profile?.profilePhoto} name={name} size="md" online={online} showStatus />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h2 className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{name}</h2>
          {online && (
            <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 sm:flex dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          )}
        </div>
        {subtitle && (
          <p className="truncate text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
        )}
        {conversation?.application && (
          <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-indigo-500 dark:text-indigo-400">
            <ShieldCheck className="h-3 w-3" />
            Verified via application
          </p>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled
          className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 sm:flex dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label="Voice call (coming soon)"
          title="Voice call (coming soon)"
        >
          <Phone className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          disabled
          className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 sm:flex dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          aria-label="Video call (coming soon)"
          title="Video call (coming soon)"
        >
          <Video className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          onClick={onToggleInfo}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
            conversation?.infoOpen
              ? "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          )}
          aria-label="Application details"
          title="Application details"
        >
          <Info className="h-4.5 w-4.5" />
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="Conversation options"
            >
              <MoreVertical className="h-4.5 w-4.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-52 p-1.5">
            <MenuAction
              icon={conversation?.isPinned ? PinOff : Pin}
              label={conversation?.isPinned ? "Unpin conversation" : "Pin conversation"}
              onClick={onTogglePin}
            />
            <MenuAction
              icon={conversation?.isArchived ? ArchiveRestore : Archive}
              label={conversation?.isArchived ? "Unarchive conversation" : "Archive conversation"}
              onClick={onToggleArchive}
            />
            <MenuAction
              icon={conversation?.isMuted ? Bell : BellOff}
              label={conversation?.isMuted ? "Unmute notifications" : "Mute notifications"}
              onClick={onToggleMute}
            />
            <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />
            <MenuAction icon={Trash2} label="Delete conversation" onClick={onDelete} danger />
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
