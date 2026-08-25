import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Search, MessageSquare } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ConversationList({ className }) {
  const { conversationId: activeId } = useParams();
  const { conversations } = useSelector((store) => store.chat);
  const { user } = useSelector((store) => store.auth);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const isSeeker = String(c.jobSeeker?._id) === String(user?._id);
      const other = isSeeker ? c.recruiter : c.jobSeeker;
      const haystack = [
        other?.fullname,
        c.job?.title,
        c.job?.company?.name,
        other?.profile?.companyName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [conversations, query, user]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="border-b border-gray-200 p-4">
        <h2 className="mb-3 text-lg font-bold text-gray-900">Messages</h2>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations..."
            aria-label="Search conversations"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <MessageSquare className="h-6 w-6 text-gray-300" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">
              {conversations.length === 0 ? "No messages yet" : "No matches"}
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              {conversations.length === 0
                ? "Your conversations will appear here after you apply for jobs."
                : "Try a different search term."}
            </p>
          </div>
        ) : (
          filtered.map((c) => {
            const isSeeker = String(c.jobSeeker?._id) === String(user?._id);
            const other = isSeeker ? c.recruiter : c.jobSeeker;
            const isActive = activeId === c._id;
            return (
              <Link
                key={c._id}
                to={`/messages/${c._id}`}
                className={cn(
                  "flex items-start gap-3 border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50",
                  isActive && "bg-blue-50 hover:bg-blue-50"
                )}
              >
                <Avatar size="lg" className="shrink-0">
                  <AvatarImage src={other?.profile?.profilePhoto} alt={other?.fullname} />
                  <AvatarFallback>{(other?.fullname || "?").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{other?.fullname || "Unknown"}</p>
                    <span className="shrink-0 text-xs text-gray-400">{timeAgo(c.lastMessageAt || c.updatedAt)}</span>
                  </div>
                  <p className="truncate text-xs font-medium text-gray-500">{c.job?.title}</p>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className={cn("truncate text-xs", c.unreadCount > 0 ? "font-semibold text-gray-800" : "text-gray-400")}>
                      {c.lastMessage || "Start the conversation"}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] px-1.5 text-[11px] font-semibold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
