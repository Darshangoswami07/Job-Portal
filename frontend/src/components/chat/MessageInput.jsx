import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip,
  Send,
  X,
  FileText,
  Loader2,
  Play,
  Trash2,
  Film,
  UploadCloud,
} from "lucide-react";
import axios from "@/utils/axios";
import { CHAT_API_END_POINT } from "@/utils/constant";
import { getSocket } from "@/utils/socket";
import EmojiPickerWrapper from "./EmojiPickerWrapper";
import VoiceRecorder from "./VoiceRecorder";
import { formatDuration, formatBytes } from "@/utils/chat";
import { cn } from "@/lib/utils";

const typingState = { active: false, timer: null };

const stopTyping = (conversationId) => {
  const socket = getSocket();
  if (socket && typingState.active) {
    socket.emit("chat:typing", { conversationId, isTyping: false });
  }
  typingState.active = false;
  clearTimeout(typingState.timer);
};

const emitTyping = (conversationId) => {
  const socket = getSocket();
  if (!socket) return;
  if (!typingState.active) {
    typingState.active = true;
    socket.emit("chat:typing", { conversationId, isTyping: true });
  }
  clearTimeout(typingState.timer);
  typingState.timer = setTimeout(() => {
    if (typingState.active) {
      typingState.active = false;
      socket.emit("chat:typing", { conversationId, isTyping: false });
    }
  }, 2200);
};

export default function MessageInput({ conversationId, onSend, disabled, replyTo, onClearReply }) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const textareaRef = useRef(null);
  const inputRef = useRef(null);
  const voiceAudioRef = useRef(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }
  }, [text]);

  const canSend = Boolean(text.trim() || attachments.some((a) => a.status === "ready") || voiceBlob);

  const handleSend = useCallback(() => {
    if (disabled || !canSend) return;
    stopTyping(conversationId);

    const body = text.trim();
    const readyAttachments = attachments.filter((a) => a.status === "ready");

    if (readyAttachments.length) {
      readyAttachments.forEach((a, i) => {
        onSend({
          body: i === 0 ? body : "",
          type: a.attachment.resourceType === "image" ? "image" : a.attachment.name?.toLowerCase().includes("resume") || a.attachment.mimeType?.includes("pdf") ? "resume" : "file",
          attachment: a.attachment,
        });
      });
    } else if (body) {
      onSend({ body, type: "text" });
    }

    if (voiceBlob) {
      onSend({
        body: "",
        type: "voice",
        audio: voiceBlob,
      });
      if (voiceAudioRef.current) voiceAudioRef.current.pause();
      setVoicePlaying(false);
      setVoiceBlob(null);
    }

    setText("");
    setAttachments([]);
    setVoiceBlob(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [disabled, canSend, text, attachments, voiceBlob, conversationId, onSend]);

  const insertEmoji = useCallback(
    (emoji) => {
      const el = textareaRef.current;
      const start = el?.selectionStart ?? text.length;
      const end = el?.selectionEnd ?? text.length;
      const next = text.slice(0, start) + emoji + text.slice(end);
      setText(next);
      requestAnimationFrame(() => {
        el?.focus();
        const pos = start + emoji.length;
        el?.setSelectionRange(pos, pos);
      });
    },
    [text]
  );

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault();
      handleSend();
    }
  };

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const items = files.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      progress: 0,
      status: "uploading",
      attachment: null,
      error: null,
    }));
    setAttachments((prev) => [...prev, ...items]);

    for (const item of items) {
      try {
        const formData = new FormData();
        formData.append("files", item.file);
        const res = await axios.post(`${CHAT_API_END_POINT}/upload`, formData, {
          onUploadProgress: (ev) => {
            if (ev.total) {
              setAttachments((prev) =>
                prev.map((p) => (p.id === item.id ? { ...p, progress: Math.round((ev.loaded / ev.total) * 100) } : p))
              );
            }
          },
        });
        if (res.data?.success && res.data.files?.length) {
          setAttachments((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? { ...p, status: "ready", attachment: res.data.files[0], progress: 100 }
                : p
            )
          );
        } else {
          throw new Error("Upload failed");
        }
      } catch (err) {
        setAttachments((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: "error", error: err?.response?.data?.message || "Upload failed" } : p
          )
        );
      }
    }
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  };

  const handleVoiceCaptured = (blob, duration, url, mime) => {
    setVoiceBlob({ blob, duration, url, mime });
  };

  const toggleVoicePlay = () => {
    const audio = voiceAudioRef.current;
    if (!audio) return;
    if (voicePlaying) {
      audio.pause();
      setVoicePlaying(false);
    } else {
      audio.play();
      setVoicePlaying(true);
    }
  };

  useEffect(() => {
    const audio = voiceAudioRef.current;
    if (!audio) return;
    const onEnd = () => setVoicePlaying(false);
    audio.addEventListener("ended", onEnd);
    return () => audio.removeEventListener("ended", onEnd);
  }, [voiceBlob]);

  return (
    <div
      className="relative border-t border-slate-200/80 bg-white/70 px-3 py-3 backdrop-blur-xl sm:px-4 dark:border-slate-800 dark:bg-slate-900/60"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-1 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/90 backdrop-blur-sm dark:border-indigo-500 dark:bg-indigo-500/10"
          >
            <div className="text-center">
              <UploadCloud className="mx-auto mb-2 h-8 w-8 text-indigo-500" />
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">Drop files to send</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex items-center gap-3 overflow-hidden rounded-xl border border-indigo-200 bg-indigo-50/70 p-2.5 dark:border-indigo-500/30 dark:bg-indigo-500/10"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
                Replying to {replyTo.senderName || replyTo.sender?.fullname || "message"}
              </p>
              <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                {replyTo.body || (replyTo.type === "image" ? "📷 Photo" : replyTo.type === "voice" ? "🎤 Voice message" : replyTo.attachment?.name ? `📎 ${replyTo.attachment.name}` : "Attachment")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearReply}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-100 hover:text-slate-600 dark:hover:bg-indigo-500/20"
              aria-label="Cancel reply"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 space-y-2 overflow-hidden"
          >
            {attachments.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                {item.attachment?.resourceType === "image" || (item.url && item.status === "ready") ? (
                  <img src={item.url} alt="preview" className="h-11 w-11 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10">
                    <FileText className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{item.file.name}</p>
                  <p className="text-[11px] text-slate-400">{formatBytes(item.file.size)}</p>
                  {item.status === "uploading" && (
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                        animate={{ width: `${item.progress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  )}
                  {item.status === "error" && (
                    <p className="text-[11px] font-medium text-rose-500">{item.error || "Upload failed"}</p>
                  )}
                </div>
                {item.status === "uploading" ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
                ) : (
                  <button type="button" onClick={() => removeAttachment(item.id)} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700" aria-label="Remove file">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {voiceBlob && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <audio ref={voiceAudioRef} src={voiceBlob.url} />
            <button
              type="button"
              onClick={toggleVoicePlay}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md"
              aria-label={voicePlaying ? "Pause" : "Play"}
            >
              {voicePlaying ? <span className="flex h-3.5 items-end gap-[2px]">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ height: [3, 12, 3] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                    className="w-[3px] rounded-full bg-white"
                  />
                ))}
              </span> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Voice message</p>
              <p className="text-[11px] text-slate-400">{formatDuration(voiceBlob.duration)}</p>
            </div>
            <button
              type="button"
              onClick={() => { setVoiceBlob(null); setVoicePlaying(false); if (voiceAudioRef.current) voiceAudioRef.current.pause(); }}
              className="shrink-0 rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              aria-label="Discard voice message"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-1.5">
        <div className="flex items-center gap-0.5">
          <VoiceRecorder onCaptured={handleVoiceCaptured} disabled={disabled} />
          <EmojiPickerWrapper
            onSelect={insertEmoji}
          />
        </div>

        <div className="relative flex min-h-[42px] flex-1 items-end rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-indigo-500/50">
          <textarea
            ref={textareaRef}
            value={text}
            rows={1}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            onChange={(e) => {
              setText(e.target.value);
              emitTyping(conversationId);
            }}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder="Type a message…"
            className="max-h-[140px] w-full resize-none bg-transparent px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
            aria-label="Message"
          />
          <div className="flex items-center gap-0.5 px-1.5 pb-1">
            <button
              type="button"
              disabled
              className="hidden items-center justify-center rounded-xl p-2 text-slate-300 dark:text-slate-600 sm:flex"
              aria-label="GIF (coming soon)"
              title="GIF (coming soon)"
            >
              <Film className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-500 dark:text-slate-400 dark:hover:bg-slate-700"
              aria-label="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => { uploadFiles(e.target.files); e.target.value = ""; }}
            />
          </div>
        </div>

        <motion.button
          type="button"
          onClick={handleSend}
          disabled={disabled || !canSend}
          whileTap={canSend ? { scale: 0.85 } : {}}
          animate={canSend ? { scale: [1, 1.06, 1] } : {}}
          transition={canSend ? { duration: 0.5, repeat: Infinity, repeatDelay: 2 } : {}}
          className={cn(
            "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl transition-all",
            canSend
              ? "bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
              : "bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600"
          )}
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}
