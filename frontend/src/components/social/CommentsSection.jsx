import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, Reply, Pencil, Trash2, ChevronDown, AtSign,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import {
  setComments, appendComments, addCommentToState, setCommentLoading,
  updateCommentInState, removeCommentFromState, setReplies,
} from "@/store/slices/socialSlice";
import {
  fetchComments, addComment, updateComment, deleteComment,
  fetchCommentReplies, toggleCommentReaction,
} from "@/api/socialApi";
import { timeAgo, REACTIONS, REACTION_ORDER } from "@/utils/social";
import { EmojiPicker } from "./EmojiPicker";

function CommentActions({ comment, viewerId, onReply, onEdit }) {
  const dispatch = useDispatch();
  const [menu, setMenu] = useState(false);
  const isOwner = String(comment.author?._id) === String(viewerId);

  const handleDelete = async () => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(String(comment.id || comment._id));
      dispatch(removeCommentFromState({ postId: String(comment.post), commentId: String(comment.id || comment._id) }));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="relative flex items-center gap-1">
      <button onClick={() => onReply?.()} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
        <Reply className="size-3" /> Reply
      </button>
      {isOwner && (
        <>
          <button onClick={() => onEdit?.()} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Edit comment">
            <Pencil className="size-3" />
          </button>
          <button onClick={handleDelete} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-red-500" aria-label="Delete comment">
            <Trash2 className="size-3" />
          </button>
        </>
      )}
    </div>
  );
}

function ReactionChip({ comment, viewerId }) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const react = async (type) => {
    setOpen(false);
    try {
      const res = await toggleCommentReaction(String(comment.id || comment._id), type);
      dispatch(updateCommentInState({ postId: String(comment.post), comment: { id: comment.id, reactionCounts: res.data.counts, myReaction: res.data.reaction?.type || null } }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const my = comment.myReaction;
  const total = REACTION_ORDER.reduce((s, k) => s + (comment.reactionCounts?.[k] || 0), 0);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted">
        {my ? `${REACTIONS[my].emoji} ${REACTIONS[my].label}` : "React"}
        {total > 0 && <span className="ml-1">{total}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            className="absolute bottom-full left-0 z-30 mb-1 flex gap-0.5 rounded-full border border-border bg-popover px-2 py-1.5 shadow-xl"
          >
            {REACTION_ORDER.map((r) => (
              <motion.button key={r} whileHover={{ scale: 1.4 }} whileTap={{ scale: 0.9 }} onClick={() => react(r)} className="text-base" aria-label={REACTIONS[r].label}>
                {REACTIONS[r].emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommentItem({ comment, viewerId, onReply, depth = 0 }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [replies, setRepliesState] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replying, setReplying] = useState(false);
  const dispatch = useDispatch();

  const isOwner = String(comment.author?._id) === String(viewerId);

  const toggleReplies = useCallback(async () => {
    if (showReplies || replies.length) { setShowReplies(!showReplies); return; }
    setLoadingReplies(true);
    try {
      const res = await fetchCommentReplies(String(comment.id || comment._id));
      setRepliesState(res.data.comments || []);
      setShowReplies(true);
    } catch { /* ignore */ } finally { setLoadingReplies(false); }
  }, [showReplies, replies.length, comment.id]);

  const saveEdit = async () => {
    try {
      const res = await updateComment(String(comment.id || comment._id), editText);
      dispatch(updateCommentInState({ postId: String(comment.post), comment: res.data.comment }));
      setEditing(false);
      toast.success("Comment updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  };

  const handleReply = async (text) => {
    const postId = String(comment.post);
    const res = await addComment(postId, { content: text, parent: String(comment.id || comment._id), root: String(comment.root || comment.id || comment._id) });
    dispatch(addCommentToState({ postId, comment: res.data.comment }));
    setReplying(false);
    setShowReplies(true);
    setRepliesState((r) => [...r, res.data.comment]);
    return res.data.comment;
  };

  return (
    <div className={cn("flex gap-2.5", depth > 0 && "ml-8")}>
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={comment.authorPhoto} alt={comment.authorFullname} />
        <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white text-xs">
          {(comment.authorFullname || "U").charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold text-foreground">{comment.authorFullname}</span>
            {comment.authorRole === "recruiter" && <span className="rounded-full bg-blue-500/10 px-1.5 text-[9px] font-bold text-blue-500">RECRUITER</span>}
          </div>
          {editing ? (
            <div className="mt-1">
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/30" rows={2} />
              <div className="mt-1 flex gap-1.5">
                <button onClick={saveEdit} className="rounded-md bg-[#0A66C2] px-2.5 py-1 text-[11px] font-bold text-white">Save</button>
                <button onClick={() => setEditing(false)} className="rounded-md bg-muted px-2.5 py-1 text-[11px] font-semibold">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
          )}
          {comment.media?.length > 0 && (
            <img src={comment.media[0].url} alt="attachment" className="mt-2 max-h-48 rounded-xl object-cover" loading="lazy" />
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
          <span>{timeAgo(comment.createdAt)}{comment.edited && " · edited"}</span>
          <ReactionChip comment={comment} viewerId={viewerId} />
          <CommentActions comment={comment} viewerId={viewerId} onReply={() => setReplying(!replying)} onEdit={() => { setEditText(comment.content); setEditing(true); }} />
        </div>

        {replying && (
          <CommentInput postId={String(comment.post)} parent={String(comment.id || comment._id)} root={String(comment.root || comment.id || comment._id)} autoFocus onSubmit={handleReply} onCancel={() => setReplying(false)} viewerId={viewerId} compact />
        )}

        {comment.replyCount > 0 && (
          <button onClick={toggleReplies} className="mt-1 flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-bold text-[#0A66C2] hover:underline">
            <ChevronDown className={cn("size-3 transition-transform", showReplies && "rotate-180")} />
            {loadingReplies ? "Loading..." : showReplies ? "Hide replies" : `View ${comment.replyCount} repl${comment.replyCount === 1 ? "y" : "ies"}`}
          </button>
        )}
        {showReplies && (
          <div className="mt-1 space-y-2">
            {replies.map((r) => (
              <CommentItem key={String(r.id || r._id)} comment={r} viewerId={viewerId} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentInput({ postId, parent, root, autoFocus, onSubmit, onCancel, viewerId, compact }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      if (onSubmit) {
        await onSubmit(trimmed);
      } else {
        const res = await addComment(postId, { content: trimmed, parent, root });
        return res.data.comment;
      }
      setText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to comment");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn("flex items-start gap-2.5", compact ? "mt-2" : "mt-3")}>
      <Avatar className={cn("shrink-0", compact ? "size-7" : "size-9")}>
        <AvatarImage src={viewerPhoto(viewerId)} alt="You" />
        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white">Y</AvatarFallback>
      </Avatar>
      <div className="relative flex-1">
        <div className={cn("flex items-end gap-1 rounded-2xl border border-border bg-muted/40 px-2 py-1.5 transition focus-within:border-[#0A66C2]/50", compact && "rounded-xl")}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            autoFocus={autoFocus}
            rows={1}
            placeholder="Add a comment..."
            className="max-h-28 min-h-0 flex-1 resize-none bg-transparent text-sm focus:outline-none"
          />
          <div className="flex items-center gap-0.5">
            <EmojiPicker onPick={(emoji) => setText((t) => t + emoji)} />
            {onCancel && (
              <button onClick={onCancel} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Cancel">
                <AtSign className="size-4 rotate-0" />
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={send}
              disabled={sending || !text.trim()}
              className="rounded-xl bg-[#0A66C2] p-2 text-white transition disabled:opacity-40"
              aria-label="Send comment"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </motion.button>
          </div>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="mt-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">Cancel reply</button>
        )}
      </div>
    </div>
  );
}

function viewerPhoto(viewerId) {
  try {
    const state = window.__store?.getState?.();
    return state?.auth?.user?.profile?.profilePhoto || "";
  } catch { return ""; }
}

export default function CommentsSection({ post, viewerId, onCountChange }) {
  const dispatch = useDispatch();
  const postId = String(post.id || post._id);
  const comments = useSelector((s) => s.social.comments[postId]) || [];
  const page = useSelector((s) => s.social.commentsPage[postId]) || 1;
  const hasMore = useSelector((s) => s.social.commentsHasMore[postId]) ?? true;
  const loading = useSelector((s) => s.social.commentsLoading[postId]);
  const [fetching, setFetching] = useState(false);

  const load = useCallback(async (loadMore = false) => {
    const targetPage = loadMore ? page + 1 : 1;
    dispatch(setCommentLoading({ postId, loading: !loadMore }));
    try {
      const res = await fetchComments(postId, { page: targetPage, limit: 15 });
      const payload = { postId, comments: res.data.comments, page: res.data.page, hasMore: res.data.comments.length >= 15 && targetPage * 15 < res.data.total };
      if (loadMore) dispatch(appendComments(payload));
      else dispatch(setComments({ ...payload, total: res.data.total }));
      onCountChange?.(res.data.total);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load comments");
    } finally {
      dispatch(setCommentLoading({ postId, loading: false }));
    }
  }, [postId, page, dispatch, onCountChange]);

  useEffect(() => {
    load();
  }, [postId]);

  const handleAdd = async (text) => {
    const res = await addComment(postId, { content: text });
    dispatch(addCommentToState({ postId, comment: res.data.comment }));
    const count = (post.commentCount || 0) + 1;
    onCountChange?.(count);
    return res.data.comment;
  };

  return (
    <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
      <CommentInput postId={postId} onSubmit={handleAdd} viewerId={viewerId} />
      <div className="mt-3 space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-2.5">
                <div className="size-8 rounded-full shimmer" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-8 w-3/4 rounded-xl shimmer" />
                  <div className="h-3 w-1/4 shimmer rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">Be the first to comment</p>
        ) : (
          comments.map((c) => (
            <CommentItem key={String(c.id || c._id)} comment={c} viewerId={viewerId} />
          ))
        )}
        {hasMore && !loading && (
          <button onClick={() => load(true)} className="w-full rounded-xl py-1.5 text-xs font-bold text-[#0A66C2] hover:underline">
            Load more comments
          </button>
        )}
      </div>
    </div>
  );
}