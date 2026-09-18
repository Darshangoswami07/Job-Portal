import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Check, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { getJobMatch } from "@/api/recommendationsApi";

/**
 * "Why this job matches you" — Phase 9. Deterministic-signal explanation for the
 * logged-in user only. Renders nothing for anonymous users. Fails quietly.
 */
export default function MatchExplanation({ groupId }) {
  const { user } = useSelector((s) => s.auth);
  // `key={groupId}` on the parent remounts this on each job, so the initial
  // state is the loading state — no synchronous setState inside the effect.
  const [state, setState] = useState({ loading: Boolean(user && groupId), data: null, error: false });

  useEffect(() => {
    if (!user || !groupId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await getJobMatch(groupId);
        if (!cancelled) setState({ loading: false, data: res.data?.data || null, error: false });
      } catch {
        if (!cancelled) setState({ loading: false, data: null, error: true });
      }
    })();
    return () => { cancelled = true; };
  }, [user, groupId]);

  if (!user || !groupId || state.error) return null;

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <Sparkles className="h-4 w-4 text-indigo-500" />
        Why this job matches you
      </div>

      {state.loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking your profile…
        </div>
      ) : !state.data ? null : state.data.personalized === false ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <Link to="/profile" className="font-semibold text-indigo-600 hover:underline">Complete your profile</Link>{" "}
          to see how this role fits your skills and preferences.
        </p>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              {state.data.percent}% match
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{state.data.label}</span>
          </div>
          <ul className="space-y-1.5 text-sm">
            {(state.data.reasons || []).map((r, i) => (
              <li key={`r${i}`} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {r}
              </li>
            ))}
            {(state.data.gaps || []).map((g, i) => (
              <li key={`g${i}`} className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                {g}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
