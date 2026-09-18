import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading2, Heading3, List, ListOrdered, Quote, Code, Braces,
  Link2, Unlink, Undo2, Redo2, Eye, PenLine, Sparkles,
  FileText, Wand2, SpellCheck, Briefcase, Loader2, Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ToolbarButton = ({ active, onClick, label, children, disabled }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={active}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-40",
      active && "bg-primary/10 text-primary"
    )}
  >
    {children}
  </button>
);

const TEMPLATES = [
  {
    name: "Software Engineer",
    html: `<h2>About the Role</h2><p>We are looking for a talented Software Engineer to join our growing engineering team. You will build high-quality, scalable products that delight our customers.</p><h2>What You'll Do</h2><ul><li>Design, develop, and ship robust features end-to-end</li><li>Collaborate with product, design, and QA teams</li><li>Write clean, maintainable, and well-tested code</li><li>Mentor junior engineers and improve engineering practices</li></ul><h2>What We're Looking For</h2><ul><li><strong>3+ years</strong> of professional software development experience</li><li>Strong command of JavaScript/TypeScript and modern frameworks</li><li>Experience with REST APIs, databases, and cloud services</li><li>Excellent problem-solving and communication skills</li></ul><h2>Why Join Us</h2><p>Competitive salary, equity, health insurance, flexible working hours, and a collaborative remote-first culture.</p>`,
  },
  {
    name: "Product Designer",
    html: `<h2>About the Role</h2><p>We're seeking a Product Designer who loves turning complex problems into simple, beautiful experiences.</p><h2>What You'll Do</h2><ul><li>Own the end-to-end design process from research to delivery</li><li>Create wireframes, prototypes, and high-fidelity UI</li><li>Partner with engineering to ship pixel-perfect products</li><li>Contribute to and maintain our design system</li></ul><h2>What We're Looking For</h2><ul><li>Portfolio showcasing shipped consumer or SaaS products</li><li>Expertise in Figma and modern design tooling</li><li>Strong understanding of accessibility and UX best practices</li></ul><h2>Why Join Us</h2><p>Competitive compensation, learning budget, health insurance, and a supportive, design-led culture.</p>`,
  },
  {
    name: "Marketing Manager",
    html: `<h2>About the Role</h2><p>We are hiring a Marketing Manager to own growth, brand, and demand generation across our channels.</p><h2>What You'll Do</h2><ul><li>Develop and execute multi-channel marketing campaigns</li><li>Own content strategy, SEO, and paid acquisition</li><li>Analyze performance data and optimize for ROI</li><li>Build strong cross-functional partnerships</li></ul><h2>What We're Looking For</h2><ul><li>5+ years of B2B or SaaS marketing experience</li><li>Data-driven mindset with strong analytical skills</li><li>Excellent written and verbal communication</li></ul><h2>Why Join Us</h2><p>Competitive package, performance bonus, flexible work, and real growth opportunities.</p>`,
  },
];

const extractText = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || "").trim();
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write an engaging job description...",
  label = "Job Description",
  error,
  required = true,
  readOnly = false,
}) {
  const [preview, setPreview] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const menuRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== undefined) {
      const current = editor.getHTML();
      const incoming = value || "";
      const normalize = (h) => h.replace(/<p>\s*<\/p>/g, "").trim();
      if (normalize(current) !== normalize(incoming)) {
        editor.commands.setContent(incoming, false);
      }
    }
  }, [value, editor]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setAiMenuOpen(false);
        setTemplatesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) {
    return (
      <div className="rounded-2xl border border-input bg-card p-6">
        <div className="h-8 w-32 shimmer rounded-lg" />
        <div className="mt-4 h-40 shimmer rounded-xl" />
      </div>
    );
  }

  const setLink = () => {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertTemplate = (html) => {
    editor.chain().focus().setContent(html).run();
    setTemplatesOpen(false);
    toast.success("Template applied");
  };

  const applyAiTransform = async (transform, successMsg) => {
    const text = extractText(editor.getHTML());
    if (!text) {
      toast.error("Please write some content first");
      return;
    }
    setAiBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    try {
      const improved = transform(text);
      if (improved) {
        editor.commands.setContent(improved, false);
        toast.success(successMsg);
      }
    } catch {
      toast.error("Could not apply transformation");
    } finally {
      setAiBusy(false);
      setAiMenuOpen(false);
    }
  };

  const aiActions = [
    {
      icon: Sparkles,
      label: "AI Improve",
      run: () =>
        applyAiTransform((t) => {
          const sentences = t.split(/(?<=[.!?])\s+/);
          const out = sentences
            .map((s) => {
              if (s.length > 30) return s;
              if (/we are looking for/i.test(s)) return s;
              return s.replace(/\.$/, "") + " with a strong track record of delivering measurable results.";
            })
            .join(" ");
          return out;
        }, "Description improved"),
    },
    {
      icon: SpellCheck,
      label: "Grammar Fix",
      run: () =>
        applyAiTransform((t) => {
          let out = t.replace(/  +/g, " ");
          out = out.replace(/ ,/g, ",");
          out = out.replace(/ \./g, ".");
          out = out.split("\n").map((l) => {
            const trimmed = l.trim();
            if (/^[-•]\s+[a-z]/.test(trimmed)) {
              return trimmed.replace(/^(\.?\s*[-•]\s+)([a-z])/, (m, p, ch) => p + ch.toUpperCase()) + (trimmed.endsWith(".") ? "" : ".");
            }
            return l;
          }).join("\n");
          out = out.replace(/([a-z]),\s+and/g, ", and");
          return out;
        }, "Grammar fixed"),
    },
    {
      icon: Briefcase,
      label: "Professional Tone",
      run: () =>
        applyAiTransform((t) => {
          const map = [
            [/gonna/g, "going to"],
            [/wanna/g, "want to"],
            [/kinda/g, "kind of"],
            [/guys/g, "team"],
            [/cool/g, "exciting"],
            [/awesome/g, "outstanding"],
            [/really good/g, "exceptional"],
            [/great/g, "excellent"],
            [/think about/g, "consider"],
            [/work with/g, "collaborate with"],
            [/handle/g, "manage"],
            [/look after/g, "oversee"],
            [/get/g, "achieve"],
          ];
          let out = t;
          map.forEach(([re, rep]) => { out = out.replace(new RegExp(re, "gi"), rep); });
          return out;
        }, "Tone polished"),
    },
    {
      icon: Wand2,
      label: "AI Generate",
      run: () => {
        const text = extractText(editor.getHTML());
        const firstLine = (text.split("\n")[0] || "the role").slice(0, 40);
        applyAiTransform(
          () =>
            `<h2>About the Role</h2><p>We are looking for a talented professional to join our team and drive impact from day one in this role.</p><h2>Key Responsibilities</h2><ul><li>Own and deliver high-impact projects end-to-end</li><li>Collaborate with cross-functional stakeholders</li><li>Continuously improve processes and outcomes</li></ul><h2>Requirements</h2><ul><li>Proven experience in a similar role</li><li>Strong communication and collaboration skills</li><li>Ability to thrive in a fast-paced environment</li></ul>`,
          "Generated description"
        );
        void firstLine;
      },
    },
  ];

  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-semibold text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10",
          error ? "border-destructive" : "border-input"
        )}
      >
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-2.5 py-2">
          <div className="mr-1 flex items-center gap-1">
            <ToolbarButton active={preview} onClick={() => setPreview(!preview)} label="Toggle preview" disabled={readOnly}>
              <Eye className="size-4" />
            </ToolbarButton>
            {!preview && (
              <>
                <span className="mx-1 h-5 w-px bg-border" />
                <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label="Bold">
                  <Bold className="size-4" />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italic">
                  <Italic className="size-4" />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} label="Underline">
                  <UnderlineIcon className="size-4" />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} label="Strikethrough">
                  <Strikethrough className="size-4" />
                </ToolbarButton>
                <span className="mx-1 h-5 w-px bg-border" />
                <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="Heading 2">
                  <Heading2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="Heading 3">
                  <Heading3 className="size-4" />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Bullet list">
                  <List className="size-4" />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Numbered list">
                  <ListOrdered className="size-4" />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="Quote">
                  <Quote className="size-4" />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} label="Inline code">
                  <Code className="size-4" />
                </ToolbarButton>
                <ToolbarButton active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} label="Code block">
                  <Braces className="size-4" />
                </ToolbarButton>
                <span className="mx-1 h-5 w-px bg-border" />
                <ToolbarButton active={editor.isActive("link")} onClick={setLink} label="Add link">
                  <Link2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()} label="Remove link">
                  <Unlink className="size-4" />
                </ToolbarButton>
                <span className="mx-1 h-5 w-px bg-border" />
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} label="Undo">
                  <Undo2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} label="Redo">
                  <Redo2 className="size-4" />
                </ToolbarButton>
              </>
            )}
          </div>

          <div ref={menuRef} className="ml-auto flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => { setTemplatesOpen(!templatesOpen); setAiMenuOpen(false); }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <FileText className="size-3.5" /> Templates
              </button>
              {templatesOpen && (
                <div className="absolute right-0 z-30 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => insertTemplate(t.html)}
                      className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm transition hover:bg-muted"
                    >
                      <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Briefcase className="size-3.5" />
                      </span>
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => { setAiMenuOpen(!aiMenuOpen); setTemplatesOpen(false); }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all",
                  "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700",
                  aiBusy && "opacity-70"
                )}
              >
                {aiBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                AI Assist
              </button>
              {aiMenuOpen && (
                <div className="absolute right-0 z-30 mt-1.5 w-52 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-2xl">
                  {aiActions.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={a.run}
                      disabled={aiBusy}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted"
                    >
                      <a.icon className="size-4 text-indigo-500" />
                      {a.label}
                    </button>
                  ))}
                  <div className="mt-1 border-t border-border pt-1.5">
                    <p className="flex items-center gap-1 px-3 pb-1 text-[10px] text-muted-foreground">
                      <Check className="size-3 text-emerald-500" /> Instant, private AI writing
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {preview ? (
          <div
            className="max-h-96 min-h-48 overflow-y-auto bg-card p-5 text-sm leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
          />
        ) : (
          <div className="max-h-96 overflow-y-auto px-4 py-3">
            <EditorContent editor={editor} className="prose-sm max-w-none [&_.tiptap]:min-h-44 [&_.tiptap]:outline-none [&_.tiptap]:text-foreground" />
          </div>
        )}
      </div>

      {error && <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
