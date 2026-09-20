import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  ListChecks,
  ClipboardCheck,
  Gift,
  Wrench,
  Check,
  Sparkles,
} from "lucide-react";
import { highlightKeywords } from "./format";
import { fadeUp, slideLeft, staggerContainer, viewportOnce } from "./motion";
import RichText from "@/components/shared/RichText";
import { stripHtmlToText } from "@/utils/sanitize";
import { cn } from "@/lib/utils";

function HighlightText({ text }) {
  const parts = useMemo(() => highlightKeywords(text), [text]);
  if (!parts) return null;
  return (
    <>
      {parts.map((part, i) =>
        part.highlight ? (
          <mark
            key={i}
            className="mx-0.5 rounded-md bg-gradient-to-r from-indigo-50 to-sky-50 px-1.5 py-0.5 font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200/60 dark:from-indigo-500/15 dark:to-sky-500/15 dark:text-indigo-300 dark:ring-indigo-500/30"
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 text-indigo-600 ring-1 ring-inset ring-indigo-500/20 dark:text-indigo-400">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function GlassCard({ children, className, delay = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delay }}
      className={cn(
        "rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl hover:border-indigo-200/80 transition-colors duration-300 sm:p-8 dark:border-slate-700/60 dark:bg-slate-900/70 dark:hover:border-indigo-500/30",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

const BENEFIT_EMOJI = {
  "salary": "💰",
  "insurance": "🏥",
  "leave": "🏖",
  "vacation": "🏖",
  "pto": "🏖",
  "learning": "📚",
  "certification": "🎓",
  "meals": "🍱",
  "food": "🍱",
  "remote": "🏡",
  "equity": "📈",
  "stock": "📈",
  "bonus": "🎉",
  "gym": "🏋️",
  "wellness": "🧘",
  "wfh": "🏡",
  "transport": "🚗",
  "relocation": "✈️",
  "healthcare": "🏥",
  "401k": "🏦",
  "pension": "🏦",
  "flexible": "🕐",
};

function benefitEmoji(benefit) {
  const text = String(benefit).toLowerCase();
  for (const [key, emoji] of Object.entries(BENEFIT_EMOJI)) {
    if (text.includes(key)) return emoji;
  }
  return "🎁";
}

function isSkillLike(text) {
  return highlightKeywords(text)?.some((p) => p.highlight) || false;
}

function RequirementsBlock({ requirements }) {
  return (
    <GlassCard delay={0.1}>
      <SectionTitle
        icon={ListChecks}
        title="Requirements"
        subtitle="What we are looking for"
      />
      <motion.ol
        variants={staggerContainer(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="space-y-3"
      >
        {requirements.map((req, idx) => {
          const skilled = isSkillLike(req);
          return (
            <motion.li
              key={idx}
              variants={slideLeft}
              className="group flex items-start gap-4 rounded-2xl border border-transparent px-3 py-3 transition-colors duration-200 hover:border-indigo-100 hover:bg-indigo-50/40 dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/5"
            >
              <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-bold text-white shadow-md shadow-indigo-500/25">
                {idx + 1}
                {skilled && (
                  <span className="absolute -right-1 -bottom-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </span>
              <p className="text-[15px] leading-relaxed text-slate-600 group-hover:text-slate-800 dark:text-slate-300 dark:group-hover:text-slate-100">
                <HighlightText text={req} />
              </p>
            </motion.li>
          );
        })}
      </motion.ol>
    </GlassCard>
  );
}

function ResponsibilitiesBlock({ responsibilities }) {
  return (
    <GlassCard delay={0.15}>
      <SectionTitle
        icon={ClipboardCheck}
        title="Responsibilities"
        subtitle="What you will own"
      />
      <motion.ul
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="space-y-3"
      >
        {responsibilities.map((resp, idx) => (
          <motion.li
            key={idx}
            variants={slideLeft}
            className="group flex items-start gap-3.5 rounded-2xl border border-transparent px-3 py-3 transition-colors duration-200 hover:border-emerald-100 hover:bg-emerald-50/40 dark:hover:border-emerald-500/20 dark:hover:bg-emerald-500/5"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-transform duration-200 group-hover:scale-110 dark:bg-emerald-500/15 dark:text-emerald-400">
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
            <p className="text-[15px] leading-relaxed text-slate-600 group-hover:text-slate-800 dark:text-slate-300 dark:group-hover:text-slate-100">
              {resp}
            </p>
          </motion.li>
        ))}
      </motion.ul>
    </GlassCard>
  );
}

function BenefitsBlock({ benefits }) {
  return (
    <GlassCard delay={0.2}>
      <SectionTitle icon={Gift} title="Benefits & Perks" subtitle="What we offer you" />
      <motion.div
        variants={staggerContainer(0.07)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {benefits.map((benefit, idx) => (
          <motion.div
            key={idx}
            variants={fadeUp}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 px-4 py-4 shadow-sm transition-shadow hover:shadow-lg hover:shadow-indigo-500/10 dark:border-slate-700/70 dark:from-slate-800/80 dark:to-slate-800/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl dark:bg-indigo-500/10">
              {benefitEmoji(benefit)}
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{benefit}</span>
          </motion.div>
        ))}
      </motion.div>
    </GlassCard>
  );
}

function SkillsBlock({ skills }) {
  if (!skills?.length) return null;
  return (
    <GlassCard delay={0.25}>
      <SectionTitle icon={Wrench} title="Skills Required" subtitle="Tech stack & expertise" />
      <motion.div
        variants={staggerContainer(0.06)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="flex flex-wrap gap-2.5"
      >
        {skills.map((skill, idx) => (
          <motion.span
            key={idx}
            variants={fadeUp}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/70 bg-gradient-to-r from-indigo-50 to-sky-50 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition-shadow duration-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/20 dark:border-indigo-500/30 dark:from-indigo-500/15 dark:to-sky-500/15 dark:text-indigo-300"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {skill}
          </motion.span>
        ))}
      </motion.div>
    </GlassCard>
  );
}

export default function JobSections({ job }) {
  const description = job.description;
  const descriptionText = useMemo(() => stripHtmlToText(description), [description]);
  const extractedTags = useMemo(
    () =>
      highlightKeywords(descriptionText)
        ?.filter((p) => p.highlight)
        .map((p) => p.text)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .slice(0, 12) || [],
    [descriptionText]
  );

  return (
    <div className="space-y-6">
      <GlassCard delay={0.05}>
        <SectionTitle
          icon={FileText}
          title="About this role"
          subtitle="The opportunity at a glance"
        />
        <RichText
          html={description}
          className="text-base leading-[1.85]"
        />
        {extractedTags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
            {extractedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-50 to-sky-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-200/60 dark:from-indigo-500/15 dark:to-sky-500/15 dark:text-indigo-300 dark:ring-indigo-500/30"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </GlassCard>

      {job.requirements?.length > 0 && <RequirementsBlock requirements={job.requirements} />}
      {job.responsibilities?.length > 0 && (
        <ResponsibilitiesBlock responsibilities={job.responsibilities} />
      )}
      {job.benefits?.length > 0 && <BenefitsBlock benefits={job.benefits} />}
      <SkillsBlock skills={job.skills} />
    </div>
  );
}
