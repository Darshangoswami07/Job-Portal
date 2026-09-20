import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Building2 } from "lucide-react";
import { getCatalogStats } from "@/api/jobsApi";

/**
 * "Hiring Now" — real companies with their real open-group counts from the
 * catalog stats endpoint. Clicking one filters the results by that company.
 */
export default function HiringCompanies({ onSelectCompany }) {
  const reduceMotion = useReducedMotion();
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getCatalogStats()
      .then((res) => {
        if (cancelled) return;
        const list = (res.data?.topCompanies || []).filter((c) => c.name && c.count > 0);
        setCompanies(list.slice(0, 8));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (companies.length === 0) return null;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
        <Building2 className="h-4.5 w-4.5 text-primary" />
        Hiring Now
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {companies.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => onSelectCompany(c.name)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-sm font-bold text-primary">
              {c.name[0]?.toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">{c.name}</span>
              <span className="block text-xs text-muted-foreground">
                {c.count} open role{c.count !== 1 ? "s" : ""}
              </span>
            </span>
          </button>
        ))}
      </div>
    </motion.section>
  );
}
