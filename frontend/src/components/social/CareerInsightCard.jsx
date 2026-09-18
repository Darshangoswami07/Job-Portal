import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Gauge, ArrowRight, Sparkles } from "lucide-react";
import { useSelector } from "react-redux";

/**
 * "Your Career Insight" — a compact premium card driven entirely by real
 * profile data (completion score + skills on the user record). No invented
 * analytics: if a signal is missing we simply don't show that line.
 */
export default function CareerInsightCard() {
  const user = useSelector((s) => s.auth.user);
  if (!user) return null;

  const score = Math.max(0, Math.min(100, Math.round(user.profileCompletionScore ?? 0)));
  const skills = Array.isArray(user.profile?.skills) ? user.profile.skills.filter(Boolean) : [];
  const skillCount = skills.length;

  let tip;
  if (score >= 90 && skillCount >= 5) {
    tip = "Your profile is in great shape. Keep posting to grow your reach.";
  } else if (skillCount < 5) {
    tip = `Adding ${5 - skillCount} more skill${5 - skillCount === 1 ? "" : "s"} could improve your profile visibility.`;
  } else {
    tip = `Your profile is ${score}% complete — finishing it helps recruiters find you.`;
  }

  const ring = `conic-gradient(#0A66C2 ${score * 3.6}deg, var(--border) 0deg)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
    >
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <Gauge className="size-4 text-[#0A66C2]" />
        <h3 className="text-sm font-bold text-foreground">Your Career Insight</h3>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div
            className="grid size-16 shrink-0 place-items-center rounded-full"
            style={{ background: ring }}
          >
            <div className="grid size-12 place-items-center rounded-full bg-card">
              <span className="text-sm font-extrabold text-foreground">{score}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profile strength</p>
            <p className="mt-1 text-[13px] leading-snug text-foreground">{tip}</p>
          </div>
        </div>

        {skillCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.slice(0, 4).map((s) => (
              <span key={s} className="rounded-md bg-[#0A66C2]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0A66C2]">
                {s}
              </span>
            ))}
            {skillCount > 4 && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                +{skillCount - 4}
              </span>
            )}
          </div>
        )}

        <Link
          to="/profile"
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0A66C2]/10 py-2 text-xs font-bold text-[#0A66C2] transition hover:bg-[#0A66C2]/20"
        >
          <Sparkles className="size-3.5" /> Improve Profile <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
