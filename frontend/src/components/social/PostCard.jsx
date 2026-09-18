import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  MoreHorizontal, Share2, Bookmark, BookmarkCheck, MessageSquare,
  BadgeCheck, Globe, Users, Lock, UserCheck, Briefcase, MessageCircle,
  Eye, Pencil, Trash2, Pin, Flag, Link2 as LinkIcon, Copy, Send, Mail,
  Linkedin as LinkedinIcon, Twitter, MessageCircle as WhatsAppIcon, FileText, GraduationCap,
  Github, ExternalLink, ArrowUpRight, ThumbsUp, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { timeAgo, formatCount, REACTIONS, POST_TYPES, totalReactions } from "@/utils/social";
import { useDispatch, useSelector } from "react-redux";
import { applyReaction, upsertPost, removePost, setCommentCount, setLightbox } from "@/store/slices/socialSlice";
import { togglePostReaction, toggleBookmark, deletePost, togglePinPost, sharePost, registerPostView } from "@/api/socialApi";
import { reportTarget } from "@/api/socialApi";
import ReactionPicker, { ReactionPreview } from "./ReactionPicker";
import MediaGallery from "./MediaGallery";
import CommentsSection from "./CommentsSection";
import { sanitizeHtml } from "@/utils/sanitize";
import { useInView } from "@/hooks/useInView";

const VISIBILITY_ICONS = {
  public: Globe,
  connections: Users,
  followers: UserCheck,
  onlyMe: Lock,
  recruitersOnly: Briefcase,
  jobSeekersOnly: Briefcase,
};

function AuthorRow({ post, viewerId }) {
  const navigate = useNavigate();
  const VisibilityIcon = VISIBILITY_ICONS[post.visibility] || Globe;
  const authorId = String(post.author?._id || post.authorId || "");
  return (
    <div className="flex items-start gap-3">
      <button onClick={() => authorId && navigate(`/feed/people/${authorId}`)} className="shrink-0">
        <Avatar className="size-11 cursor-pointer ring-2 ring-transparent transition hover:ring-[#0A66C2]">
          <AvatarImage src={post.authorPhoto} alt={post.authorFullname} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
            {(post.authorFullname || "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => authorId && navigate(`/feed/people/${authorId}`)}
            className="truncate text-[15px] font-bold text-foreground hover:text-[#0A66C2] hover:underline"
          >
            {post.authorFullname || "JobPilot User"}
          </button>
          {post.authorVerified && (
            <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-white" title="Verified professional">
              <BadgeCheck className="size-3" />
            </span>
          )}
          {post.authorRole === "recruiter" && (
            <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-500">RECRUITER</span>
          )}
          {post.isEditorial && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0A66C2]/15 to-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold text-[#0A66C2] dark:text-blue-300" title={post.source?.name || "Featured from JobPilot"}>
              <Sparkles className="size-2.5" /> {post.source?.name || "Featured from JobPilot"}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{post.authorHeadline}</p>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          {post.authorCompany && <span className="truncate max-w-[160px]">{post.authorCompany}</span>}
          {post.authorCompany && <span>·</span>}
          <span>{timeAgo(post.createdAt)}</span>
          {(post.readTime || post.article?.readingTime) > 0 && (
            <>
              <span>·</span>
              <span>{post.readTime || post.article?.readingTime} min read</span>
            </>
          )}
          <span>·</span>
          <VisibilityIcon className="size-3" />
        </div>
      </div>
    </div>
  );
}

function HiringCard({ hiring }) {
  if (!hiring?.title) return null;
  return (
    <div className="mt-3 rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-500/20 dark:from-blue-500/5 dark:to-indigo-500/5">
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#0A66C2] px-2.5 py-1 text-[11px] font-bold text-white">
          <Briefcase className="size-3" /> Hiring
        </span>
        {hiring.salary && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{hiring.salary}</span>}
      </div>
      <h4 className="text-lg font-bold text-foreground">{hiring.title}</h4>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {hiring.companyName && <span>{hiring.companyName}</span>}
        {hiring.location && <span>· {hiring.location}</span>}
        {hiring.employmentType && <span>· {hiring.employmentType}</span>}
        {hiring.isRemote && <span>· Remote friendly</span>}
      </div>
      <a
        href={hiring.applyLink || "#apply"}
        onClick={(e) => { if (!hiring.applyLink) e.preventDefault(); }}
        target={hiring.applyLink ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#0A66C2] px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700"
      >
        Apply Now <ArrowUpRight className="size-4" />
      </a>
    </div>
  );
}

function ProjectCard({ project }) {
  if (!project?.name) return null;
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-transparent p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-violet-500">Project Showcase</p>
            <h4 className="mt-1 text-lg font-bold text-foreground">{project.name}</h4>
          </div>
          <CodeIcon />
        </div>
        {project.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{project.description}</p>}
        {project.techStack?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.techStack.slice(0, 6).map((t) => (
              <span key={t} className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400">{t}</span>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {project.github && <ActionLink href={project.github} icon={<Github className="size-3.5" />} label="GitHub" />}
          {project.demo && <ActionLink href={project.demo} icon={<ExternalLink className="size-3.5" />} label="Live Demo" />}
          {project.url && <ActionLink href={project.url} icon={<LinkIcon className="size-3.5" />} label="Project" />}
        </div>
      </div>
    </div>
  );
}

function CodeIcon() {
  return <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500"><Github className="size-5" /></span>;
}

function ActionLink({ href, icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/[0.04] px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-foreground/10"
    >
      {icon} {label}
    </a>
  );
}

function CertificateCard({ certificate, media }) {
  const file = media?.[0] || certificate;
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-500/20 dark:from-amber-500/5 dark:to-orange-500/5">
      <div className="flex items-center gap-3 p-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
          <GraduationCap className="size-6" />
        </span>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600">VERIFIED CREDENTIAL</span>
          <h4 className="mt-1 truncate text-sm font-bold text-foreground">{certificate.name}</h4>
          {certificate.issuer && <p className="text-xs text-muted-foreground">Issued by {certificate.issuer}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-amber-200/40 px-4 py-2.5 dark:border-amber-500/10">
        {certificate.credentialUrl && (
          <a href={certificate.credentialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline">
            <ExternalLink className="size-3" /> Verify credential
          </a>
        )}
        {file?.url && (
          <a href={file.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600">
            <FileText className="size-3.5" /> View Certificate
          </a>
        )}
      </div>
    </div>
  );
}

function TagChips({ tags, onTag }) {
  if (!tags?.length) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {tags.slice(0, 6).map((t) => (
        <button
          key={t}
          onClick={() => onTag(t)}
          className="rounded-md bg-[#0A66C2]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0A66C2] transition hover:bg-[#0A66C2]/20"
        >
          #{t}
        </button>
      ))}
    </div>
  );
}

/** Article / editorial rendering: cover, title, excerpt, tags, read-more. */
function EditorialBody({ post, navigate }) {
  const cover = post.coverImage || post.article?.coverUrl || "";
  const title = post.article?.title || post.contentText?.split("\n")[0] || "";
  const excerpt = post.excerpt || post.contentText?.slice(0, 240) || "";
  const to = `/feed/${post.id || post._id}`;
  return (
    <div className="mt-2">
      <button onClick={() => navigate(to)} className="block text-left">
        <h3 className="text-lg font-extrabold leading-snug text-foreground transition hover:text-[#0A66C2] sm:text-xl">
          {title}
        </h3>
      </button>
      {excerpt && <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{excerpt}</p>}
      {cover && (
        <button
          onClick={() => navigate(to)}
          className="group mt-3 block w-full overflow-hidden rounded-2xl border border-border/70"
        >
          <img
            src={cover}
            alt={title}
            loading="lazy"
            className="aspect-[1200/560] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </button>
      )}
      <TagChips tags={post.hashtags} onTag={(t) => navigate(`/feed/hashtag/${t}`)} />
      <button
        onClick={() => navigate(to)}
        className="mt-2 text-xs font-bold text-[#0A66C2] hover:underline"
      >
        Read more →
      </button>
    </div>
  );
}

function PollBlock({ post, onVote }) {
  const [voted, setVoted] = useState(() => post.poll?.options?.some((o) => o.voters?.some((v) => String(v?._id || v) === String(post.myId))));
  const poll = post.poll || {};
  const options = poll.options || [];
  const total = Number(poll.totalVotes) || 0;
  const max = Math.max(1, ...options.map((o) => o.votes || 0));

  const handleVote = async (optionId) => {
    if (voted) return;
    try {
      await onVote(optionId);
      setVoted(true);
    } catch { /* toast handled upstream */ }
  };

  return (
    <div className="mt-3 rounded-2xl border border-border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-bold text-foreground">{poll.question || "Poll"}</p>
      <div className="space-y-2">
        {options.map((o) => {
          const pct = total ? Math.round(((o.votes || 0) / total) * 100) : 0;
          const isVoted = voted && o.voters?.some((v) => String(v?._id || v) === String(post.myId));
          return (
            <motion.button
              key={String(o._id)}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleVote(String(o._id))}
              disabled={voted}
              className={cn(
                "relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left text-sm transition",
                isVoted ? "border-indigo-400/60 bg-indigo-50 dark:bg-indigo-500/10" : "border-border bg-card hover:border-indigo-300"
              )}
            >
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: `${voted ? pct : 0}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className="absolute inset-y-0 left-0 bg-indigo-500/10 dark:bg-indigo-500/20"
              />
              <span className="relative z-10 flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">{o.text}</span>
                {voted && <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{pct}%</span>}
              </span>
            </motion.button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{formatCount(total)} votes{voted ? " · tap to see live results" : ""}</p>
    </div>
  );
}

function RichContent({ post, onNavigateHashtag }) {
  const content = post.content;
  const navigate = useNavigate();
  const safe = useMemo(() => {
    if (!content) return "";
    const escaped = String(content)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>")
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#0A66C2] hover:underline">$1</a>')
      .replace(/#([\p{L}\p{N}_]+)/gu, '<a href="#h=$1" data-h="#$1" class="text-[#0A66C2] font-semibold hover:underline">#$1</a>')
      .replace(/@([\p{L}\p{N}_.]+)/gu, '<span class="font-semibold text-foreground">@$1</span>');
    return sanitizeHtml(escaped);
  }, [content]);

  if (!content) return null;

  return (
    <div
      className="feed-content mt-2 text-[15px] leading-relaxed text-foreground"
      onClick={(e) => {
        const a = e.target.closest("a[data-h]");
        if (a) {
          e.preventDefault();
          const tag = a.getAttribute("data-h").replace(/^#/, "");
          onNavigateHashtag?.(tag);
        }
      }}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

function ShareMenu({ post, onClose, viewerId }) {
  const navigate = useNavigate();
  const doShare = async (platform, recipientId) => {
    try {
      const res = await sharePost(String(post.id || post._id), { platform, recipientId, message: "" });
      toast.success("Shared to feed");
      if (platform === "copy") {
        navigator.clipboard?.writeText(window.location.origin + `/feed/${post.id || post._id}`);
        toast.success("Link copied");
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to share");
    }
  };

  const items = [
    { label: "Share to Feed", icon: Share2, action: () => doShare("feed") },
    { label: "Copy Link", icon: Copy, action: () => doShare("copy") },
    { label: "Send via Chat", icon: MessageCircle, action: () => { onClose(); navigate("/chat"); } },
    { label: "Email", icon: Mail, action: () => doShare("email") },
    { label: "WhatsApp", icon: WhatsAppIcon, action: () => doShare("whatsapp") },
    { label: "LinkedIn", icon: LinkedinIcon, action: () => doShare("linkedin") },
    { label: "X (Twitter)", icon: Twitter, action: () => doShare("twitter") },
  ];

  return (
    <div className="absolute right-0 top-full z-40 mt-1 w-56 rounded-2xl border border-border bg-popover p-1.5 shadow-2xl">
      {items.map((it) => (
        <button
          key={it.label}
          onClick={it.action}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          <it.icon className="size-4 text-muted-foreground" /> {it.label}
        </button>
      ))}
    </div>
  );
}

function MoreMenu({ post, viewerId, onClose, dispatch }) {
  const navigate = useNavigate();
  const isOwner = String(post.author?._id || post.authorId) === String(viewerId);

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deletePost(String(post.id || post._id));
      dispatch(removePost(String(post.id || post._id)));
      toast.success("Post deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
    onClose();
  };

  const handlePin = async () => {
    try {
      await togglePinPost(String(post.id || post._id));
      toast.success("Post pin updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
    onClose();
  };

  const handleReport = () => {
    onClose();
    navigate(`/feed/${post.id || post._id}?report=1`);
  };

  const handleCopy = async () => {
    navigator.clipboard?.writeText(window.location.origin + `/feed/${post.id || post._id}`);
    toast.success("Link copied");
    onClose();
  };

  return (
    <div className="absolute right-0 top-full z-40 mt-1 w-56 rounded-2xl border border-border bg-popover p-1.5 shadow-2xl">
      <button onClick={handleCopy} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-muted">
        <LinkIcon className="size-4" /> Copy post link
      </button>
      {isOwner && (
        <>
          <button onClick={() => { onClose(); navigate(`/feed/${post.id || post._id}?edit=1`); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-muted">
            <Pencil className="size-4" /> Edit post
          </button>
          <button onClick={handlePin} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-muted">
            <Pin className="size-4" /> {post.pinned ? "Unpin" : "Pin to profile"}
          </button>
          <button onClick={handleDelete} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
            <Trash2 className="size-4" /> Delete post
          </button>
        </>
      )}
      {!isOwner && (
        <button onClick={handleReport} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10">
          <Flag className="size-4" /> Report post
        </button>
      )}
    </div>
  );
}

export default function PostCard({ post, onCommentsOpen, defaultCommentsOpen = false, viewerId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(defaultCommentsOpen);
  const [reactionsPanel, setReactionsPanel] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const inView = useInView();

  const postId = String(post.id || post._id);
  const isBookmarked = Boolean(post.isBookmarked);

  const handleReaction = async (type) => {
    const previous = post.myReaction;
    const previousCounts = post.reactionCounts;
    const optimistic = { ...(post.reactionCounts || {}) };
    if (previous === type) {
      optimistic[type] = Math.max(0, (optimistic[type] || 0) - 1);
      dispatch(applyReaction({ postId, type: null, counts: optimistic }));
    } else {
      if (previous) optimistic[previous] = Math.max(0, (optimistic[previous] || 0) - 1);
      optimistic[type] = (optimistic[type] || 0) + 1;
      dispatch(applyReaction({ postId, type, counts: optimistic }));
    }
    try {
      const res = await togglePostReaction(postId, type);
      dispatch(applyReaction({ postId, type: res.data.reaction?.type || null, counts: res.data.counts }));
    } catch (err) {
      dispatch(applyReaction({ postId, type: previous, counts: previousCounts }));
      toast.error(err.response?.data?.message || "Failed to react");
    }
  };

  const handleBookmark = async () => {
    const prev = isBookmarked;
    dispatch(upsertPost({ ...post, isBookmarked: !prev, bookmarkCount: Math.max(0, (post.bookmarkCount || 0) + (prev ? -1 : 1)) }));
    try {
      const res = await toggleBookmark(postId);
      dispatch(upsertPost({ ...post, isBookmarked: res.data.saved, bookmarkCount: res.data.bookmarkCount }));
      toast.success(res.data.saved ? "Post saved" : "Removed from saved");
    } catch (err) {
      dispatch(upsertPost({ ...post, isBookmarked: prev }));
      toast.error("Failed to save post");
    }
  };

  const handlePollVote = async (optionId) => {
    try {
      const res = await import("@/api/socialApi").then((m) => m.votePoll(postId, optionId));
      dispatch(upsertPost({ ...post, poll: res.data.poll }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to vote");
    }
  };

  const recordView = () => {
    registerPostView(postId).catch(() => {});
  };

  const totalReactionCount = totalReactions(post.reactionCounts);

  const typeMeta = POST_TYPES[post.type] || POST_TYPES.text;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className={cn(
        "rounded-[20px] border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 dark:shadow-black/20",
        post.isEditorial
          ? "border-[#0A66C2]/25 bg-gradient-to-b from-[#0A66C2]/[0.03] to-transparent dark:from-[#0A66C2]/[0.06]"
          : "border-border/70 hover:border-border"
      )}
    >
      <div className="p-4">
        <div className="relative">
          <AuthorRow post={post} viewerId={viewerId} />
          <div className="absolute right-0 top-0 flex items-center gap-1">
            {post.pinned && <Pin className="size-4 text-muted-foreground/50" />}
            <button onClick={() => { setMenuOpen(!menuOpen); setShareOpen(false); }} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted" aria-label="More options">
              <MoreHorizontal className="size-4" />
            </button>
            {menuOpen && <MoreMenu post={post} viewerId={viewerId} onClose={() => setMenuOpen(false)} dispatch={dispatch} />}
          </div>
        </div>

        {post.isEditorial || (post.type === "article" && post.article?.title) ? (
          <EditorialBody post={post} navigate={navigate} />
        ) : (
          <RichContent post={post} onNavigateHashtag={(tag) => navigate(`/feed/hashtag/${tag}`)} />
        )}

        {post.media?.length > 0 && <MediaGallery media={post.media} onLightbox={setLightbox} lightboxOpen={lightbox} onCloseLightbox={() => setLightbox(null)} />}

        {post.hiring?.title && <HiringCard hiring={post.hiring} />}
        {post.project?.name && <ProjectCard project={post.project} />}
        {post.certificate?.name && <CertificateCard certificate={post.certificate} media={post.media} />}
        {post.isPoll && post.poll?.options?.length > 0 && <PollBlock post={post} onVote={handlePollVote} />}

        <div className="mt-3 flex items-center justify-between border-b border-border/60 pb-3">
          <ReactionPreview counts={post.reactionCounts} onView={() => setReactionsPanel(!reactionsPanel)} />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {post.viewCount > 0 && <span className="flex items-center gap-1"><Eye className="size-3" /> {formatCount(post.viewCount)}</span>}
            <button onClick={() => setCommentsOpen(!commentsOpen)} className="hover:text-foreground">
              {formatCount(post.commentCount)} comments
            </button>
            <span>{formatCount(post.shareCount)} shares</span>
          </div>
        </div>

        {reactionsPanel && (
          <div className="border-b border-border/60 py-2">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Reactions ({formatCount(totalReactionCount)})</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(post.reactionCounts || {}).filter(([, n]) => n > 0).map(([k, n]) => (
                <span key={k} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-semibold">
                  <span>{REACTIONS[k]?.emoji}</span> {REACTIONS[k]?.label} {formatCount(n)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <ReactionPicker current={post.myReaction} onChange={handleReaction} counts={post.reactionCounts} />
          <button
            onClick={() => { setCommentsOpen(!commentsOpen); onCommentsOpen?.(); }}
            className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors", commentsOpen ? "text-[#0A66C2]" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
          >
            <MessageSquare className="size-4" /> Comment
          </button>
          <div className="relative">
            <button
              onClick={() => { setShareOpen(!shareOpen); setMenuOpen(false); }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Share2 className="size-4" /> Share
            </button>
            {shareOpen && <ShareMenu post={post} onClose={() => setShareOpen(false)} viewerId={viewerId} />}
          </div>
          <button
            onClick={handleBookmark}
            className={cn("flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors", isBookmarked ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
          >
            {isBookmarked ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          </button>
        </div>
      </div>

      {commentsOpen && (
        <CommentsSection post={post} viewerId={viewerId} onCountChange={(count) => dispatch(setCommentCount({ postId, count }))} />
      )}
    </motion.article>
  );
}