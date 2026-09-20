import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Info, ClipboardList, AlignLeft, Banknote, ListChecks,
  Code2, Gift, Users2, Send, Check, ChevronRight, ChevronLeft,
  Loader2, Cloud, CloudOff, Rocket, Sparkles, Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ChipInput from "./ChipInput";
import CompanySelector from "./CompanySelector";
import SalaryField from "./SalaryField";
import RichTextEditor from "./RichTextEditor";
import { sanitizeHtml } from "@/utils/sanitize";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
const WORK_TYPES = ["On-site", "Remote", "Hybrid"];

const BENEFIT_OPTIONS = [
  { id: "remote", label: "Remote Work", icon: "🏠", desc: "Work from anywhere" },
  { id: "wfh", label: "Work From Home", icon: "🛋️", desc: "Flexible WFH days" },
  { id: "insurance", label: "Insurance", icon: "🛡️", desc: "Health coverage" },
  { id: "stock", label: "Stock Options", icon: "📈", desc: "Own a piece of the pie" },
  { id: "flexible", label: "Flexible Hours", icon: "⏰", desc: "Own your schedule" },
  { id: "learning", label: "Learning Budget", icon: "📚", desc: "Courses & conferences" },
  { id: "gym", label: "Gym Membership", icon: "💪", desc: "Stay healthy" },
  { id: "bonus", label: "Performance Bonus", icon: "💸", desc: "Reward for impact" },
  { id: "relocation", label: "Relocation Support", icon: "✈️", desc: "Move made easy" },
  { id: "health", label: "Health Insurance", icon: "🏥", desc: "Family coverage" },
];

const SKILL_SUGGESTIONS = [
  "React", "Next.js", "Node.js", "Python", "TypeScript", "JavaScript",
  "Docker", "AWS", "FastAPI", "PostgreSQL", "MongoDB", "Redis",
  "GraphQL", "REST APIs", "Tailwind CSS", "Vue.js", "Angular", "Kubernetes",
  "CI/CD", "Terraform", "System Design", "Microservices", "TensorFlow", "Kafka",
  "Selenium", "Jest", "Cypress", "Git", "Linux", "Figma",
];

const SECTIONS = [
  { id: "basic", label: "Basic Information", icon: Info },
  { id: "details", label: "Job Details", icon: ClipboardList },
  { id: "description", label: "Description", icon: AlignLeft },
  { id: "compensation", label: "Compensation", icon: Banknote },
  { id: "requirements", label: "Requirements", icon: ListChecks },
  { id: "skills", label: "Skills", icon: Code2 },
  { id: "benefits", label: "Benefits", icon: Gift },
  { id: "process", label: "Recruitment Process", icon: Users2 },
  { id: "publish", label: "Review & Publish", icon: Send },
];

const emptyForm = {
  title: "", location: "", city: "", country: "India",
  jobType: "", workType: "On-site", experience: "", position: "",
  department: "", industry: "",
  description: "",
  requirements: [], responsibilities: [], niceToHave: [],
  skills: [], benefits: [],
  interviewDifficulty: "medium", workAuthorization: "Any",
  easyApply: false, remoteFriendly: false, visaSponsorship: false,
  tags: [],
  companyId: "",
  salaryData: { currency: "INR", min: "", max: "", base: "", negotiable: false },
};

function Field({ label, required, error, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-xs font-medium text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200",
        checked
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-input bg-card hover:border-primary/30"
      )}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <span
        className={cn(
          "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200",
          checked ? "bg-gradient-to-r from-indigo-500 to-blue-600" : "bg-muted"
        )}
      >
        <motion.span
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="size-5 rounded-full bg-white shadow"
        />
      </span>
    </button>
  );
}

export default function JobForm({ mode = "create", companies = [], initial, onSubmit, submitting }) {
  const [form, setForm] = useState({ ...emptyForm });
  const [activeSection, setActiveSection] = useState("basic");
  const [errors, setErrors] = useState({});
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [showPreview, setShowPreview] = useState(false);
  const topRef = useRef(null);

  useEffect(() => {
    if (initial) {
      setForm({
        ...emptyForm,
        title: initial.title || "",
        location: initial.location || "",
        city: initial.city || "",
        country: initial.country || "India",
        jobType: initial.jobType || "",
        workType: initial.workType || "On-site",
        experience: initial.experienceLevel ?? initial.experience ?? "",
        position: initial.position ?? "",
        department: initial.department || "",
        industry: initial.industry || "",
        description: initial.description || "",
        requirements: initial.requirements || [],
        responsibilities: initial.responsibilities || [],
        niceToHave: initial.niceToHave || [],
        skills: initial.skills || [],
        benefits: initial.benefits || [],
        interviewDifficulty: initial.interviewDifficulty || "medium",
        workAuthorization: initial.workAuthorization || "Any",
        easyApply: !!initial.easyApply,
        remoteFriendly: !!initial.remoteFriendly,
        visaSponsorship: !!initial.visaSponsorship,
        tags: initial.tags || [],
        companyId: initial.company?._id || initial.company || "",
        salaryData: {
          currency: initial.salaryCurrency || "INR",
          min: initial.salaryMin ?? "",
          max: initial.salaryMax ?? "",
          base: initial.salary ?? "",
          negotiable: false,
        },
      });
    }
  }, [initial]);

  const update = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaveState("idle");
  };

  const updateSalary = (salaryData) => {
    setForm((prev) => ({ ...prev, salaryData }));
    setSaveState("idle");
  };

  const completedSections = useMemo(() => {
    const set = new Set();
    if (form.title && form.location) set.add("basic");
    if (form.jobType && form.position) set.add("details");
    if (form.description && form.description.replace(/<[^>]*>/g, "").trim()) set.add("description");
    if (form.salaryData.base) set.add("compensation");
    set.add("requirements");
    set.add("skills");
    set.add("benefits");
    set.add("process");
    return set;
  }, [form]);

  const progress = Math.round((completedSections.size / (SECTIONS.length - 1)) * 100);

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Job title is required";
    if (!form.location.trim()) next.location = "Location is required";
    if (!form.jobType) next.jobType = "Job type is required";
    if (!form.position) next.position = "Open positions are required";
    if (!form.description || !form.description.replace(/<[^>]*>/g, "").trim()) {
      next.description = "Job description is required";
    }
    if (!form.salaryData.base) next.salary = "Base salary is required";
    if (!form.companyId) next.companyId = "Please select a company";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const firstKey = Object.keys(next)[0];
      const sectionMap = {
        title: "basic", location: "basic", jobType: "details", position: "details",
        description: "description", salary: "compensation", companyId: "basic",
      };
      setActiveSection(sectionMap[firstKey] || "basic");
    }
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => {
    const s = form.salaryData;
    return {
      title: form.title.trim(),
      description: form.description,
      requirements: form.requirements,
      responsibilities: form.responsibilities,
      niceToHave: form.niceToHave,
      skills: form.skills,
      benefits: form.benefits,
      location: form.location.trim(),
      city: form.city.trim(),
      country: form.country.trim() || "India",
      jobType: form.jobType,
      workType: form.workType,
      salary: Number(s.base) || 0,
      salaryMin: s.min !== "" ? Number(s.min) : undefined,
      salaryMax: s.max !== "" ? Number(s.max) : undefined,
      salaryCurrency: s.currency,
      experience: Number(form.experience) || 0,
      position: Number(form.position) || 0,
      companyId: form.companyId,
      industry: form.industry,
      department: form.department,
      tags: form.tags,
      interviewDifficulty: form.interviewDifficulty,
      workAuthorization: form.workAuthorization,
      easyApply: form.easyApply,
      remoteFriendly: form.remoteFriendly,
      visaSponsorship: form.visaSponsorship,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
      return;
    }
    await onSubmit(buildPayload());
  };

  // Debounced auto-save (edit mode only)
  useEffect(() => {
    if (mode !== "edit" || !initial) return;
    if (saveState !== "idle") return;
    const hasRequired =
      form.title && form.location && form.jobType && form.position &&
      form.description && form.salaryData.base && form.companyId;
    if (!hasRequired) return;
    const t = setTimeout(() => {
      setSaveState("saving");
      onSubmit(buildPayload(), { silent: true })
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, mode, initial, saveState]);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderSection = () => {
    switch (activeSection) {
      case "basic":
        return (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Job Title" required error={errors.title} className="sm:col-span-2">
              <Input
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="e.g. Senior Frontend Engineer"
                className={cn("h-11 rounded-xl", errors.title && "border-destructive")}
              />
            </Field>
            <Field label="Location" required error={errors.location}>
              <Input
                value={form.location}
                onChange={(e) => update({ location: e.target.value })}
                placeholder="e.g. Bengaluru / Remote"
                className={cn("h-11 rounded-xl", errors.location && "border-destructive")}
              />
            </Field>
            <Field label="City">
              <Input
                value={form.city}
                onChange={(e) => update({ city: e.target.value })}
                placeholder="e.g. Bengaluru"
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Country">
              <Input
                value={form.country}
                onChange={(e) => update({ country: e.target.value })}
                placeholder="India"
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Company" required error={errors.companyId} className="sm:col-span-2">
              <CompanySelector
                value={form.companyId}
                companies={companies}
                onChange={(id) => update({ companyId: id })}
              />
            </Field>
          </div>
        );

      case "details":
        return (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Job Type" required error={errors.jobType}>
              <select
                value={form.jobType}
                onChange={(e) => update({ jobType: e.target.value })}
                className={cn(
                  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10",
                  errors.jobType && "border-destructive"
                )}
              >
                <option value="">Select job type</option>
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Work Type">
              <select
                value={form.workType}
                onChange={(e) => update({ workType: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              >
                {WORK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Experience (years)" error={errors.experience}>
              <Input
                type="number"
                min="0"
                value={form.experience}
                onChange={(e) => update({ experience: e.target.value })}
                placeholder="2"
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Open Positions" required error={errors.position}>
              <Input
                type="number"
                min="1"
                value={form.position}
                onChange={(e) => update({ position: e.target.value })}
                placeholder="3"
                className={cn("h-11 rounded-xl", errors.position && "border-destructive")}
              />
            </Field>
            <Field label="Department">
              <Input
                value={form.department}
                onChange={(e) => update({ department: e.target.value })}
                placeholder="e.g. Engineering"
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Industry">
              <Input
                value={form.industry}
                onChange={(e) => update({ industry: e.target.value })}
                placeholder="e.g. Technology"
                className="h-11 rounded-xl"
              />
            </Field>
          </div>
        );

      case "description":
        return (
          <div className="space-y-5">
            <Field label="Job Description" required error={errors.description}>
              <RichTextEditor
                value={form.description}
                onChange={(html) => update({ description: html })}
              />
            </Field>
          </div>
        );

      case "compensation":
        return (
          <div className="space-y-5">
            <SalaryField
              value={form.salaryData}
              onChange={updateSalary}
              error={errors.salary}
            />
          </div>
        );

      case "requirements":
        return (
          <div className="space-y-6">
            <ChipInput
              label="Requirements"
              value={form.requirements}
              onChange={(requirements) => update({ requirements })}
              placeholder="Type a requirement and press Enter"
              hint="Press Enter to add each requirement"
              accent="indigo"
            />
            <ChipInput
              label="Responsibilities"
              value={form.responsibilities}
              onChange={(responsibilities) => update({ responsibilities })}
              placeholder="Add key responsibilities..."
              accent="emerald"
            />
            <ChipInput
              label="Nice to Have"
              value={form.niceToHave}
              onChange={(niceToHave) => update({ niceToHave })}
              placeholder="Bonus qualifications..."
              accent="amber"
            />
          </div>
        );

      case "skills":
        return (
          <ChipInput
            label="Required Skills"
            value={form.skills}
            onChange={(skills) => update({ skills })}
            placeholder="e.g. React"
            suggestions={SKILL_SUGGESTIONS}
            hint="Popular skills are suggested below as you type"
            accent="violet"
          />
        );

      case "benefits":
        return (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">Select the benefits this role offers</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence>
                {BENEFIT_OPTIONS.map((b) => {
                  const selected = form.benefits.includes(b.label);
                  return (
                    <motion.button
                      key={b.id}
                      type="button"
                      layout
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        const next = selected
                          ? form.benefits.filter((x) => x !== b.label)
                          : [...form.benefits, b.label];
                        update({ benefits: next });
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
                        selected
                          ? "border-primary/50 bg-primary/5 shadow-md"
                          : "border-input bg-card hover:border-primary/30"
                      )}
                    >
                      <span className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl text-lg transition-transform duration-200",
                        selected ? "scale-110" : "grayscale"
                      )}>
                        {b.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{b.label}</p>
                        <p className="text-xs text-muted-foreground">{b.desc}</p>
                      </div>
                      <motion.span
                        animate={{ scale: selected ? 1 : 0.6, opacity: selected ? 1 : 0.3 }}
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          selected ? "border-transparent bg-gradient-to-r from-indigo-500 to-blue-600" : "border-muted-foreground/30"
                        )}
                      >
                        {selected && <Check className="size-3.5 text-white" />}
                      </motion.span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        );

      case "process":
        return (
          <div className="grid gap-4">
            <Field label="Interview Difficulty">
              <select
                value={form.interviewDifficulty}
                onChange={(e) => update({ interviewDifficulty: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </Field>
            <Field label="Work Authorization">
              <Input
                value={form.workAuthorization}
                onChange={(e) => update({ workAuthorization: e.target.value })}
                placeholder="Any"
                className="h-11 rounded-xl"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle
                checked={form.easyApply}
                onChange={(v) => update({ easyApply: v })}
                label="Easy Apply"
                desc="One-click applications"
              />
              <Toggle
                checked={form.remoteFriendly}
                onChange={(v) => update({ remoteFriendly: v })}
                label="Remote Friendly"
                desc="Open to remote candidates"
              />
              <Toggle
                checked={form.visaSponsorship}
                onChange={(v) => update({ visaSponsorship: v })}
                label="Visa Sponsorship"
                desc="Support visa applications"
              />
            </div>
          </div>
        );

      case "publish":
        return (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow">
                <Rocket className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Ready to publish!</p>
                <p className="text-xs text-muted-foreground">
                  Review the summary below, then hit {mode === "edit" ? "Save Changes" : "Create Job"}.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="flex items-center justify-between bg-muted/40 px-4 py-3">
                <p className="text-sm font-bold text-foreground">{form.title || "Untitled Role"}</p>
                {form.jobType && (
                  <span className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 px-3 py-1 text-[11px] font-bold text-white">
                    {form.jobType}
                  </span>
                )}
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <SummaryItem label="Company" value={companies.find((c) => c._id === form.companyId)?.name || "—"} />
                <SummaryItem label="Location" value={[form.location, form.city].filter(Boolean).join(", ") || "—"} />
                <SummaryItem label="Experience" value={form.experience ? `${form.experience}+ yrs` : "—"} />
                <SummaryItem label="Positions" value={form.position ? `${form.position} open` : "—"} />
                <SummaryItem label="Work Type" value={form.workType || "—"} />
                <SummaryItem
                  label="Salary"
                  value={
                    form.salaryData.base
                      ? `${form.salaryData.currency} ${form.salaryData.base} LPA${form.salaryData.negotiable ? " (negotiable)" : ""}`
                      : "—"
                  }
                />
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
                {form.skills.length > 0 && (
                  <p className="w-full pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Skills ({form.skills.length})
                  </p>
                )}
                {form.skills.slice(0, 10).map((s) => (
                  <span key={s} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentIndex = SECTIONS.findIndex((s) => s.id === activeSection);
  const isLast = currentIndex === SECTIONS.length - 1;

  const goTo = (id) => {
    setActiveSection(id);
    setErrors({});
    scrollToTop();
  };

  return (
    <div ref={topRef} className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Section sidebar */}
      <aside className="order-2 lg:order-1">
        <div className="premium-card p-4 lg:sticky lg:top-24">
          <div className="mb-4 px-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Form completion</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500"
              />
            </div>
          </div>
          <nav className="space-y-0.5" aria-label="Form sections">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const done = completedSections.has(s.id);
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(s.id)}
                  className={cn(
                    "group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-indigo-500/10 to-blue-500/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <span className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg border transition-all",
                    active ? "border-transparent bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow" : "border-border bg-muted/50",
                    done && !active && "border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                  )}>
                    {done && !active ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Form body */}
      <div className="order-1 lg:order-2">
        <form onSubmit={handleSubmit}>
          <div className="premium-card p-5 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <div className="mb-6 flex items-center gap-3">
                  {(() => {
                    const Icon = SECTIONS[currentIndex].icon;
                    return (
                      <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow">
                        <Icon className="size-5" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{SECTIONS[currentIndex].label}</h2>
                    <p className="text-xs text-muted-foreground">
                      Step {currentIndex + 1} of {SECTIONS.length}
                    </p>
                  </div>
                </div>

                {renderSection()}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <SaveIndicator state={saveState} mode={mode} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeSection !== "publish" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    className="rounded-xl"
                  >
                    <Eye className="size-4" /> Preview
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentIndex === 0}
                  onClick={() => goTo(SECTIONS[currentIndex - 1].id)}
                  className="rounded-xl"
                >
                  <ChevronLeft className="size-4" /> Back
                </Button>
                {!isLast ? (
                  <Button
                    type="button"
                    onClick={() => goTo(SECTIONS[currentIndex + 1].id)}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-blue-700"
                  >
                    Continue <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitting || companies.length === 0}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-blue-700 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {submitting ? "Publishing..." : mode === "edit" ? "Save Changes" : "Create Job"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>

        {companies.length === 0 && (
          <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm font-medium text-destructive">
            Please register a company first before creating a job. Use the company selector above to create one.
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl sm:p-8"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Job Preview</h3>
                <button onClick={() => setShowPreview(false)} className="rounded-lg p-1.5 hover:bg-muted" aria-label="Close preview">
                  ✕
                </button>
              </div>
              <div className="prose-sm max-w-none">
                {form.description ? (
                  <div
                    className="space-y-3 text-sm leading-relaxed text-foreground [&_h2]:text-lg [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.description) }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No description yet.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SaveIndicator({ state, mode }) {
  if (mode === "create") return <span>Your details are kept safely on your device.</span>;
  const map = {
    idle: { icon: CloudOff, text: "Unsaved changes", cls: "text-muted-foreground" },
    saving: { icon: Loader2, text: "Auto-saving...", cls: "text-amber-600 dark:text-amber-400" },
    saved: { icon: Cloud, text: "All changes saved", cls: "text-emerald-600 dark:text-emerald-400" },
    error: { icon: CloudOff, text: "Save failed — retrying", cls: "text-destructive" },
  };
  const item = map[state] || map.idle;
  const Icon = item.icon;
  return (
    <span className={cn("flex items-center gap-1.5", item.cls)}>
      <Icon className={cn("size-3.5", state === "saving" && "animate-spin")} />
      {item.text}
    </span>
  );
}
