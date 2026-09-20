import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";
import { DollarSign, TrendingUp } from "lucide-react";
import { getSalaryRange } from "./format";
import { fadeUp, viewportOnce } from "./motion";

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-4 text-center backdrop-blur dark:border-slate-700/70 dark:bg-slate-800/50">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent}`}>
        ₹<CountUp end={value} duration={1.2} separator="," />
      </p>
    </div>
  );
}

export default function SalaryCard({ job }) {
  const range = getSalaryRange(job);
  const span = Math.max(1, range.max - range.min);
  const avgPos = ((range.avg - range.min) / span) * 100;
  const maxPos = 100;

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-white/80 to-teal-50/80 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-8 dark:border-emerald-500/20 dark:from-emerald-500/5 dark:via-slate-900/70 dark:to-teal-500/5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10"
      />

      <div className="relative mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-emerald-600 ring-1 ring-inset ring-emerald-500/25 dark:text-emerald-400">
          <DollarSign className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            Salary Range
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {range.derived ? "Estimated compensation band" : "Compensation offered"}
          </p>
        </div>
        <span className="ml-auto hidden items-center gap-1 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex dark:bg-emerald-500/10 dark:text-emerald-300">
          <TrendingUp className="h-3.5 w-3.5" />
          Competitive
        </span>
      </div>

      <div className="relative grid grid-cols-3 gap-3">
        <Stat label="Min" value={range.min} accent="text-slate-700 dark:text-slate-200" />
        <Stat label="Average" value={range.avg} accent="text-emerald-600 dark:text-emerald-400" />
        <Stat label="Max" value={range.max} accent="text-slate-700 dark:text-slate-200" />
      </div>

      <div className="relative mt-6">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
          <motion.div
            initial={{ width: 0 }}
            animate={inView ? { width: `${maxPos}%` } : {}}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500"
          />
        </div>
        <motion.div
          initial={{ left: "0%" }}
          animate={inView ? { left: `${avgPos}%` } : {}}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="absolute -top-1 -translate-x-1/2"
        >
          <motion.span
            animate={inView ? { scale: [1, 1.25, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2.4 }}
            className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-emerald-500 dark:bg-slate-900"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </motion.span>
        </motion.div>
        <div className="mt-3 flex justify-between text-xs font-medium text-slate-400 dark:text-slate-500">
          <span>₹{range.min.toLocaleString("en-IN")}</span>
          <span>Avg ₹{range.avg.toLocaleString("en-IN")}</span>
          <span>₹{range.max.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </motion.section>
  );
}
