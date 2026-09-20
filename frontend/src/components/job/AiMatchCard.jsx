import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

/**
 * Compact "AI Job Match" call-to-action shown beside the search hero.
 * Logged in → triggers the recommended ordering. Logged out → login prompt.
 * Never shows a fabricated score.
 */
export default function AiMatchCard({ user, onFindMatches }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
      className="flex flex-col justify-between gap-4 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6"
    >
      <div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="h-4.5 w-4.5" />
        </span>
        <h2 className="mt-3 text-base font-bold text-foreground">AI Job Match</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Get jobs ranked by how well they match your skills and profile.
        </p>
      </div>

      {user ? (
        <button
          type="button"
          onClick={onFindMatches}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Find My Matches
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <Link
          to="/login?redirect=/jobs"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          Log in to match
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </motion.div>
  );
}
