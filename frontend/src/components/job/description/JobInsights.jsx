import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";
import {
  Users,
  Eye,
  MessageCircle,
  Timer,
  Zap,
  Layers,
  BarChart3,
} from "lucide-react";
import {
  getApplicantCount,
  getResponseRate,
  getInterviewDuration,
  getHiringUrgency,
} from "./format";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";
import { cn } from "@/lib/utils";

const URGENCY_TONES = {
  red: "bg-rose-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
};

function CountStat({ icon: Icon, label, end, suffix = "", iconClass }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div
      ref={ref}
      className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200/80 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-slate-700/70 dark:bg-slate-800/50 dark:hover:border-indigo-500/30"
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconClass)}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
        {inView ? (
          <CountUp end={end} duration={1.2} suffix={suffix} separator="," />
        ) : (
          `0${suffix}`
        )}
      </p>
    </div>
  );
}

function UrgencyCard({ urgency }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-slate-700/70 dark:bg-slate-800/50">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <Zap className="h-4.5 w-4.5" />
        </span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Hiring urgency</span>
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-white">{urgency.label}</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${urgency.value}%` }}
          viewport={viewportOnce}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className={cn("h-full rounded-full", URGENCY_TONES[urgency.tone])}
        />
      </div>
    </div>
  );
}

export default function JobInsights({ job, relatedCount = 0 }) {
  const applicants = getApplicantCount(job);
  const views = job.views || 0;
  const responseRate = getResponseRate(job);
  const duration = getInterviewDuration(job);
  const urgency = getHiringUrgency(job);

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
          <BarChart3 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            Job Insights
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Real-time signals about this role</p>
        </div>
      </div>

      <motion.div
        variants={staggerContainer(0.07)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      >
        <CountStat
          icon={Users}
          label="Applicants"
          end={applicants}
          iconClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
        />
        <CountStat
          icon={Eye}
          label="Views"
          end={views}
          iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
        />
        <CountStat
          icon={MessageCircle}
          label="Response rate"
          end={responseRate}
          suffix="%"
          iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
        />
        <CountStat
          icon={Timer}
          label="Avg interview"
          end={duration}
          suffix="m"
          iconClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
        />
        <UrgencyCard urgency={urgency} />
        <CountStat
          icon={Layers}
          label="Similar jobs"
          end={relatedCount}
          iconClass="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
        />
      </motion.div>
    </motion.section>
  );
}
