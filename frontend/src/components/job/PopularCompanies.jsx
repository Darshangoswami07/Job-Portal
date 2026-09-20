import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import useCatalogStats from "@/hooks/useCatalogStats";

export default function PopularCompanies() {
  const navigate = useNavigate();
  const { topCompanies, loading } = useCatalogStats();

  // Real companies with active openings in the catalogue — nothing hardcoded.
  const companies = topCompanies.filter((c) => c.name);
  if (!loading && companies.length === 0) return null;

  return (
    <section className="py-12 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 mb-10 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Companies Hiring Now</h2>
        <p className="text-gray-500 mt-2 max-w-xl mx-auto">
          Organisations with active openings in the Job-Pilot catalogue
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 w-40 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="group overflow-hidden">
          {/* Declarative infinite marquee — no imperative animation loop.
              Pauses on hover via group-hover. */}
          <motion.div
            className="flex items-center gap-16 w-max group-hover:[animation-play-state:paused]"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          >
            {[...companies, ...companies].map((c, i) => (
              <button
                key={`${c.name}-${i}`}
                onClick={() => navigate(`/jobs?q=${encodeURIComponent(c.name)}`)}
                className="shrink-0 w-44 h-16 bg-gray-100 rounded-xl flex flex-col items-center justify-center px-4 hover:bg-blue-50 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-500 tracking-wide select-none truncate max-w-full">
                  {c.name}
                </span>
                <span className="text-[11px] text-gray-400">{c.count} open</span>
              </button>
            ))}
          </motion.div>
        </div>
      )}
    </section>
  );
}
