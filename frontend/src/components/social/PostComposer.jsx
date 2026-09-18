import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, UploadCloud, Loader2, Sparkles, ChevronDown, Check, Hash,
  ImageIcon, Link2, Briefcase, Trophy, PenLine, Bot,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSelector, useDispatch } from "react-redux";
import { COMPOSER_TYPES, VISIBILITY_OPTIONS, extractHashtagsFromText } from "@/utils/social";
import { createPost } from "@/api/socialApi";
import { upsertPost } from "@/store/slices/socialSlice";
import { AiAssistPanel } from "./AiAssistPanel";

const MAX_CHARS = 3000;
const MEDIA_TYPES = ["image", "video", "document"];

/** Quick-action chips under the collapsed composer. */
const QUICK_ACTIONS = [
  { label: "Create Post", icon: PenLine, type: "text" },
  { label: "Photo", icon: ImageIcon, type: "image" },
  { label: "Link", icon: Link2, type: "link" },
  { label: "Job", icon: Briefcase, type: "hiring" },
  { label: "Achievement", icon: Trophy, type: "achievement" },
  { label: "Ask AI", icon: Bot, type: "text", ai: true },
];

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/30"
      />
    </label>
  );
}

export default function PostComposer({ onPosted }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [type, setType] = useState("text");
  const [visibility, setVisibility] = useState("public");
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [extra, setExtra] = useState({});
  const [aiOpen, setAiOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef(null);

  const hashtags = extractHashtagsFromText(text);
  const selectedVisibility = VISIBILITY_OPTIONS.find((v) => v.value === visibility) || VISIBILITY_OPTIONS[0];
  const over = text.length > MAX_CHARS;

  const reset = () => {
    setText("");
    setType("text");
    setVisibility("public");
    setFiles([]);
    setPreviews([]);
    setExtra({});
    setAiOpen(false);
    setVisibilityOpen(false);
  };

  const close = () => {
    if (posting) return;
    setOpen(false);
    reset();
  };

  const launch = (preset) => {
    reset();
    setType(preset.type || "text");
    setAiOpen(Boolean(preset.ai));
    setOpen(true);
  };

  const handleFiles = useCallback((list) => {
    const accepted = Array.from(list || []).filter((f) => {
      const ok =
        f.type.startsWith("image/") ||
        f.type.startsWith("video/") ||
        [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.ms-powerpoint",
          "application/msword",
          "text/plain",
        ].includes(f.type);
      if (!ok) toast.error(`Unsupported file: ${f.name}`);
      return ok;
    });
    setFiles((prev) => {
      const next = [...prev, ...accepted].slice(0, 10);
      setPreviews(next.map((f) => URL.createObjectURL(f)));
      return next;
    });
  }, []);

  const removeFile = (idx) => {
    setFiles((f) => f.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleAiResult = (payload) => {
    if (payload.text) setText(payload.text);
    if (payload.hashtags) setText((t) => `${t} ${payload.hashtags.join(" ")}`.trim());
    if (payload.tips?.length) {
      setText(payload.tips.map((t) => `• ${t}`).join("\n"));
      toast.info("AI career tips added");
    }
  };

  const publish = async () => {
    const content = text.trim();
    const noBodyNeeded = ["hiring", "project", "certificate", "achievement", "poll", "link"].includes(type);
    if (!content && files.length === 0 && !noBodyNeeded) {
      toast.error("Write something to post");
      return;
    }
    if (over) {
      toast.error(`Post is too long (max ${MAX_CHARS.toLocaleString()} characters)`);
      return;
    }

    setPosting(true);
    try {
      const fd = new FormData();
      fd.append("type", type);
      fd.append("content", content);
      fd.append("visibility", visibility);
      files.forEach((f) => fd.append("files", f));

      if (type === "hiring") {
        fd.append("hiringTitle", extra.title || content);
        fd.append("hiringCompany", extra.company || user?.profile?.companyName || "");
        fd.append("hiringLocation", extra.location || "");
        fd.append("hiringType", extra.employmentType || "");
        fd.append("hiringSalary", extra.salary || "");
        fd.append("hiringApplyLink", extra.applyLink || "");
        fd.append("hiringRemote", extra.isRemote ? "true" : "false");
      }
      if (type === "project") {
        fd.append("projectName", extra.name || "");
        fd.append("projectDescription", content || extra.description || "");
        fd.append("projectGithub", extra.github || "");
        fd.append("projectDemo", extra.demo || "");
        fd.append("techStack", extra.techStack || "");
        fd.append("projectStatus", extra.status || "");
      }
      if (type === "certificate") {
        fd.append("certName", extra.certName || "");
        fd.append("certIssuer", extra.certIssuer || "");
        fd.append("certDate", extra.certDate || "");
        fd.append("certCredentialId", extra.certId || "");
        fd.append("certCredentialUrl", extra.certUrl || "");
      }
      if (type === "achievement") {
        fd.append("achievementTitle", extra.achievementTitle || content || "");
        fd.append("achievementCategory", extra.achievementCategory || "other");
        fd.append("achievementDescription", extra.achievementDescription || "");
      }
      if (type === "link") {
        fd.append("linkUrl", extra.linkUrl || "");
        fd.append("linkTitle", extra.linkTitle || "");
        fd.append("linkDescription", extra.linkDescription || "");
      }
      if (type === "poll") {
        fd.append("pollQuestion", content || extra.pollQuestion || "");
        fd.append("pollOptions", JSON.stringify((extra.pollOptions || []).filter(Boolean)));
        fd.append("pollEndsAt", extra.pollEndsAt || "");
      }

      const res = await createPost(fd);
      dispatch(upsertPost(res.data.post));
      toast.success(res.data.moderation === "flagged" ? "Post submitted — pending review" : "Post published 🎉");
      setOpen(false);
      reset();
      onPosted?.(res.data.post);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      {/* Collapsed composer */}
      <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:p-4">
        <div className="mb-2 text-[13px] font-bold text-foreground">Share something with your professional network</div>
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
              {(user?.fullname || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => launch({ type: "text" })}
            className="flex-1 rounded-full border border-border bg-muted/40 px-4 py-2.5 text-left text-sm text-muted-foreground transition hover:border-[#0A66C2]/50 hover:bg-muted/60"
          >
            What do you want to share?
          </button>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1 border-t border-border/60 pt-2.5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => launch(a)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                a.ai ? "text-violet-500 hover:bg-violet-500/10" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <a.icon className="size-3.5" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] gap-0 overflow-y-auto rounded-2xl border-border bg-card p-0 sm:max-w-xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3 sm:px-5">
            <DialogTitle className="text-base">Create a post</DialogTitle>
            <DialogDescription className="sr-only">
              Compose and publish a post to your professional network
            </DialogDescription>
            <button
              onClick={close}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="px-4 py-4 sm:px-5">
            <div className="mb-3 flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
                  {(user?.fullname || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{user?.fullname}</p>
                <div className="relative">
                  <button
                    onClick={() => setVisibilityOpen((o) => !o)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                  >
                    {selectedVisibility.label} <ChevronDown className="size-3" />
                  </button>
                  <AnimatePresence>
                    {visibilityOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute left-0 z-50 mt-1.5 w-64 rounded-xl border border-border bg-popover p-1.5 shadow-2xl"
                      >
                        {VISIBILITY_OPTIONS.map((v) => (
                          <button
                            key={v.value}
                            onClick={() => {
                              setVisibility(v.value);
                              setVisibilityOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left",
                              visibility === v.value ? "bg-muted" : "hover:bg-muted/60"
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold text-foreground">{v.label}</span>
                              <span className="block text-[10px] text-muted-foreground">{v.desc}</span>
                            </span>
                            {visibility === v.value && <Check className="ml-auto size-3.5 text-[#0A66C2]" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Post type */}
            <div className="mb-3 flex flex-wrap gap-1">
              {COMPOSER_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors",
                    type === t.value ? "bg-[#0A66C2]/10 text-[#0A66C2]" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <t.icon className="size-3" />
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              autoFocus
              placeholder="Share your professional thoughts, wins, questions… use #hashtags to reach more people"
              className="w-full resize-y rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/30"
            />

            <div className="mt-1 flex items-center justify-between">
              {hashtags.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {hashtags.slice(0, 6).map((h) => (
                    <span key={h} className="inline-flex items-center gap-0.5 rounded-full bg-[#0A66C2]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0A66C2]">
                      <Hash className="size-2.5" />
                      {h}
                    </span>
                  ))}
                </div>
              ) : (
                <span />
              )}
              <span className={cn("text-[11px] font-semibold tabular-nums", over ? "text-red-500" : "text-muted-foreground")}>
                {text.length.toLocaleString()}/{MAX_CHARS.toLocaleString()}
              </span>
            </div>

            {/* Type-specific fields */}
            {type === "hiring" && (
              <div className="mt-3 grid gap-2 rounded-xl border border-blue-200/50 bg-blue-50/40 p-3 dark:border-blue-500/20 dark:bg-blue-500/5 sm:grid-cols-2">
                <Field label="Job title" value={extra.title || ""} onChange={(e) => setExtra({ ...extra, title: e.target.value })} placeholder="Software Engineer" />
                <Field label="Company" value={extra.company || ""} onChange={(e) => setExtra({ ...extra, company: e.target.value })} placeholder="Company name" />
                <Field label="Location" value={extra.location || ""} onChange={(e) => setExtra({ ...extra, location: e.target.value })} placeholder="Remote / City" />
                <Field label="Employment type" value={extra.employmentType || ""} onChange={(e) => setExtra({ ...extra, employmentType: e.target.value })} placeholder="Full-time" />
                <Field label="Salary range" value={extra.salary || ""} onChange={(e) => setExtra({ ...extra, salary: e.target.value })} placeholder="₹12–18 LPA" />
                <Field label="Apply link" value={extra.applyLink || ""} onChange={(e) => setExtra({ ...extra, applyLink: e.target.value })} placeholder="https://…" />
                <label className="col-span-full flex items-center gap-2 text-sm font-medium text-foreground">
                  <input type="checkbox" checked={extra.isRemote || false} onChange={(e) => setExtra({ ...extra, isRemote: e.target.checked })} className="size-4" />
                  Remote friendly
                </label>
              </div>
            )}
            {type === "project" && (
              <div className="mt-3 grid gap-2 rounded-xl border border-violet-200/50 bg-violet-50/40 p-3 dark:border-violet-500/20 dark:bg-violet-500/5 sm:grid-cols-2">
                <Field label="Project name" value={extra.name || ""} onChange={(e) => setExtra({ ...extra, name: e.target.value })} placeholder="My project" />
                <Field label="GitHub" value={extra.github || ""} onChange={(e) => setExtra({ ...extra, github: e.target.value })} placeholder="https://github.com/…" />
                <Field label="Live demo" value={extra.demo || ""} onChange={(e) => setExtra({ ...extra, demo: e.target.value })} placeholder="https://demo.com" />
                <Field label="Tech stack" value={extra.techStack || ""} onChange={(e) => setExtra({ ...extra, techStack: e.target.value })} placeholder="React, Node, MongoDB" />
              </div>
            )}
            {type === "certificate" && (
              <div className="mt-3 grid gap-2 rounded-xl border border-amber-200/50 bg-amber-50/40 p-3 dark:border-amber-500/20 dark:bg-amber-500/5 sm:grid-cols-2">
                <Field label="Certificate name" value={extra.certName || ""} onChange={(e) => setExtra({ ...extra, certName: e.target.value })} placeholder="AWS Certified Developer" />
                <Field label="Issuer" value={extra.certIssuer || ""} onChange={(e) => setExtra({ ...extra, certIssuer: e.target.value })} placeholder="Amazon" />
                <Field label="Issue date" type="date" value={extra.certDate || ""} onChange={(e) => setExtra({ ...extra, certDate: e.target.value })} />
                <Field label="Verify URL" value={extra.certUrl || ""} onChange={(e) => setExtra({ ...extra, certUrl: e.target.value })} placeholder="https://verify…" />
              </div>
            )}
            {type === "achievement" && (
              <div className="mt-3 grid gap-2 rounded-xl border border-amber-200/50 bg-amber-50/40 p-3 dark:border-amber-500/20 dark:bg-amber-500/5 sm:grid-cols-2">
                <Field label="Achievement" value={extra.achievementTitle || ""} onChange={(e) => setExtra({ ...extra, achievementTitle: e.target.value })} placeholder="Won Smart India Hackathon" />
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Category</span>
                  <select
                    value={extra.achievementCategory || "other"}
                    onChange={(e) => setExtra({ ...extra, achievementCategory: e.target.value })}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none"
                  >
                    {["hackathon", "award", "certification", "placement", "graduation", "promotion", "other"].map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {type === "link" && (
              <div className="mt-3 grid gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:grid-cols-2">
                <Field label="URL" value={extra.linkUrl || ""} onChange={(e) => setExtra({ ...extra, linkUrl: e.target.value })} placeholder="https://…" />
                <Field label="Title" value={extra.linkTitle || ""} onChange={(e) => setExtra({ ...extra, linkTitle: e.target.value })} placeholder="Link title" />
              </div>
            )}
            {type === "poll" && (
              <div className="mt-3 space-y-2 rounded-xl border border-indigo-200/50 bg-indigo-50/40 p-3 dark:border-indigo-500/20 dark:bg-indigo-500/5">
                <Field label="Poll question" value={extra.pollQuestion || ""} onChange={(e) => setExtra({ ...extra, pollQuestion: e.target.value })} placeholder="What do you think?" />
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    value={(extra.pollOptions || [])[i] || ""}
                    onChange={(e) => {
                      const opts = [...(extra.pollOptions || [])];
                      opts[i] = e.target.value;
                      setExtra({ ...extra, pollOptions: opts });
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
                  />
                ))}
              </div>
            )}

            {/* Media */}
            {files.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {previews.map((p, i) => (
                  <div key={p} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                    {files[i].type.startsWith("image/") ? (
                      <img src={p} alt={files[i].name} className="h-full w-full object-cover" />
                    ) : files[i].type.startsWith("video/") ? (
                      <video src={p} muted className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1 p-2">
                        <UploadCloud className="size-5 text-muted-foreground" />
                        <span className="truncate text-[10px] font-semibold text-muted-foreground">{files[i].name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Remove file"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {MEDIA_TYPES.includes(type) && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground transition hover:border-[#0A66C2]/50 hover:text-foreground"
              >
                <UploadCloud className="size-5" />
                <span className="font-semibold">Click to upload</span>
                <span className="text-xs">Images, video, PDF, DOCX, PPT — up to 50MB</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <AiAssistPanel open={aiOpen} text={text} type={type} extra={extra} onResult={handleAiResult} onClose={() => setAiOpen(false)} />
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-border/60 bg-card px-4 py-3 sm:px-5">
            <button
              onClick={() => setAiOpen((o) => !o)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors",
                aiOpen ? "bg-violet-500/10 text-violet-500" : "text-violet-500 hover:bg-violet-500/10"
              )}
            >
              <Sparkles className="size-3.5" /> Ask AI
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={close}
                disabled={posting}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={publish}
                disabled={posting || over}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0A66C2] to-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
              >
                {posting && <Loader2 className="size-4 animate-spin" />}
                {posting ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
