import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

const FILTER_OPTIONS = {
  location: ["Delhi NCR", "Bangalore", "Hyderabad", "Pune", "Mumbai"],
  industry: ["Frontend", "Backend", "Fullstack", "DevOps", "Data Science"],
  salary: ["0-40k", "42-1lakh", "1-5lakh", "5lakh+"],
  experience: ["Entry", "Mid", "Senior", "Lead"],
};

const FIELD_LABELS = {
  location: "Location",
  industry: "Industry",
  salary: "Salary Range",
  experience: "Experience Level",
};

const FIELD_ICONS = {
  location: "📍",
  industry: "💼",
  salary: "💰",
  experience: "⏱️",
};

const AnimatedSection = motion.div;

export default function FilterCard({
  selectedFilters,
  onToggle,
  onClearAll,
  onRemoveChip,
}) {
  const activeCount = Object.values(selectedFilters).reduce(
    (total, set) => total + set.size,
    0
  );

  const chipList = useMemo(
    () =>
      Object.entries(selectedFilters).flatMap(([category, values]) =>
        [...values].map((value) => ({ category, value }))
      ),
    [selectedFilters]
  );

  const [openSections, setOpenSections] = useState({
    location: true,
    industry: true,
    salary: true,
    experience: true,
  });

  const toggleSection = (category) => {
    setOpenSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const clearButtonClass = activeCount
    ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
    : "bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed";

  return (
    <motion.div
      className="w-full lg:w-[320px]"   // ✅ FIXED WIDTH
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative bg-linear-to-br from-white via-indigo-50 to-slate-100 rounded-3xl border border-indigo-100 shadow-2xl p-6 overflow-hidden">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12)_0,transparent_55%)] pointer-events-none rounded-3xl" />

        <div className="relative z-10 space-y-5">

          {/* Header */}
          <header className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-200 py-3 px-3 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-indigo-800">Job Filters</h2>
                <p className="text-xs text-slate-500">Refine jobs quickly</p>
              </div>

              <button
                onClick={onClearAll}
                disabled={!activeCount}
                className={`text-xs font-bold rounded-full px-4 py-1.5 border transition ${clearButtonClass}`}
              >
                Clear All
              </button>
            </div>
          </header>

          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {chipList.length > 0 ? (
              chipList.map(({ category, value }) => (
                <button
                  key={`${category}-${value}`}
                  onClick={() =>
                    onRemoveChip
                      ? onRemoveChip(category, value)
                      : onToggle(category, value, false)
                  }
                  className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs hover:bg-indigo-200"
                >
                  {value} ×
                </button>
              ))
            ) : (
              <span className="text-xs text-slate-400">
                No active filters
              </span>
            )}
          </div>

          <div className="h-px bg-indigo-100" />

          {/* Sections */}
          {Object.entries(FILTER_OPTIONS).map(([category, values]) => {
            const selected = selectedFilters[category]?.size || 0;
            const isOpen = openSections[category];

            return (
              <section
                key={category}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(category)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-t-2xl"
                >
                  <div className="flex items-center gap-2">
                    <span>{FIELD_ICONS[category]}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {FIELD_LABELS[category]}
                      </p>
                      <p className="text-xs text-slate-400">
                        {selected} selected
                      </p>
                    </div>
                  </div>

                  <span
                    className={`transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                <AnimatedSection
                  initial={false}
                  animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={{
                    height: { duration: 0.22, ease: "easeInOut" },
                    opacity: { duration: 0.18, ease: "easeInOut" },
                  }}
                  className="overflow-hidden px-4 pb-4 pt-2 grid grid-cols-2 gap-2"
                  style={{ pointerEvents: isOpen ? "auto" : "none" }}
                >
                  {values.map((value) => {
                    const checked = selectedFilters[category]?.has(value);

                    return (
                      <button
                        key={value}
                        onClick={() => onToggle(category, value, !checked)}
                        className={`p-2 rounded-lg text-xs border ${
                          checked
                            ? "bg-indigo-600 text-white"
                            : "bg-white hover:bg-indigo-50"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </AnimatedSection>
              </section>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}