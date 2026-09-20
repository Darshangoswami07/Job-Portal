import { motion } from "framer-motion";
import { Waypoints, Check, FileText, Search, MessagesSquare, BadgeCheck, PartyPopper } from "lucide-react";
import { fadeUp, viewportOnce } from "./motion";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: FileText,
    title: "Application",
    desc: "Submit your profile and resume",
    duration: "Instant",
  },
  {
    icon: Search,
    title: "Resume Review",
    desc: "Our team evaluates your background",
    duration: "1-2 days",
  },
  {
    icon: MessagesSquare,
    title: "Interview",
    desc: "Technical and culture-fit rounds",
    duration: "3-5 days",
  },
  {
    icon: BadgeCheck,
    title: "Offer",
    desc: "Receive your offer letter",
    duration: "~1 week",
  },
  {
    icon: PartyPopper,
    title: "Joining",
    desc: "Welcome aboard! Onboarding begins",
    duration: "2 weeks",
  },
];

export default function HiringTimeline({ applied }) {
  const completedCount = applied ? 1 : 0;

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl hover:border-indigo-200/80 transition-colors duration-300 sm:p-8 dark:border-slate-700/60 dark:bg-slate-900/70 dark:hover:border-indigo-500/30"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 text-indigo-600 ring-1 ring-inset ring-indigo-500/20 dark:text-indigo-400">
          <Waypoints className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            Hiring Process
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">What happens after you apply</p>
        </div>
      </div>

      <ol className="relative ml-3 border-l-2 border-slate-100 dark:border-slate-800">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < completedCount;
          const isLast = idx === STEPS.length - 1;
          const Icon = step.icon;
          return (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.45, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative pb-8 pl-10 last:pb-0"
            >
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={viewportOnce}
                transition={{ type: "spring", stiffness: 300, damping: 16, delay: idx * 0.12 }}
                className={cn(
                  "absolute -left-[21px] top-0 flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-sm",
                  isCompleted
                    ? "border-transparent bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/30"
                    : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-4.5 w-4.5" />}
              </motion.span>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3
                  className={cn(
                    "text-base font-semibold",
                    isCompleted
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-800 dark:text-slate-100"
                  )}
                >
                  {step.title}
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {step.duration}
                </span>
                {isCompleted && !isLast && (
                  <span className="text-xs font-semibold text-emerald-500">Complete</span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{step.desc}</p>
            </motion.li>
          );
        })}
      </ol>
    </motion.section>
  );
}
