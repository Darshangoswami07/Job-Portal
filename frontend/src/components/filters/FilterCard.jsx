import { useMemo, useState } from "react";
import { ChevronDown, MapPin, Briefcase, DollarSign, Clock, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const SALARY_RANGES = [
  { label: "0-3 LPA", min: 0, max: 3 },
  { label: "3-6 LPA", min: 3, max: 6 },
  { label: "6-12 LPA", min: 6, max: 12 },
  { label: "12-20 LPA", min: 12, max: 20 },
  { label: "20+ LPA", min: 20, max: null },
];

const FILTER_OPTIONS = {
  location: ["Delhi NCR", "Bangalore", "Hyderabad", "Pune", "Mumbai", "Chennai", "Kolkata", "Remote"],
  industry: ["Frontend", "Backend", "Fullstack", "DevOps", "Data Science", "AI/ML", "Mobile", "QA"],
  salary: SALARY_RANGES.map((r) => r.label),
  experience: ["Entry (0-1 yrs)", "Mid (2-4 yrs)", "Senior (5-8 yrs)", "Lead (8+ yrs)"],
};

const FIELD_LABELS = {
  location: "Location",
  industry: "Industry / Role",
  salary: "Salary Range",
  experience: "Experience Level",
};

const FIELD_ICONS = {
  location: MapPin,
  industry: Briefcase,
  salary: DollarSign,
  experience: Clock,
};

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35 },
  }),
};

export default function FilterCard({
  selectedFilters,
  onToggle,
  onClearAll,
  salaryRange,
  onSalaryRangeChange,
}) {
  const activeCount = useMemo(
    () => Object.values(selectedFilters).reduce((total, set) => total + set.size, 0),
    [selectedFilters]
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
    setOpenSections((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-gray-200 rounded-xl card-shadow overflow-hidden"
    >
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          </div>
          <button
            onClick={onClearAll}
            disabled={!activeCount}
            className={cn(
              "text-xs font-semibold rounded-full px-3.5 py-1.5 border transition-all",
              activeCount
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                : "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
            )}
          >
            Clear All
          </button>
        </div>

        {chipList.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chipList.map(({ category, value }) => (
              <motion.span
                key={`${category}-${value}`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200"
              >
                {value}
                <button
                  onClick={() => onToggle(category, value, false)}
                  className="hover:text-gray-900 ml-0.5"
                >
                  &#x2715;
                </button>
              </motion.span>
            ))}
          </div>
        )}

        <hr className="border-gray-200" />

        <div className="space-y-3">
          {Object.entries(FILTER_OPTIONS).map(([category, values], index) => {
            const Icon = FIELD_ICONS[category];
            const selectedCount = selectedFilters[category]?.size || 0;
            const isOpen = openSections[category];

            return (
              <motion.div
                key={category}
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(category)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-700">
                        {FIELD_LABELS[category]}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {selectedCount} selected
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-gray-400 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-2">
                    {values.map((value) => {
                      const checked = selectedFilters[category]?.has(value);
                      return (
                        <button
                          key={value}
                          onClick={() => onToggle(category, value, !checked)}
                          className={cn(
                            "flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium border transition-all",
                            checked
                              ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                              : "bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                              checked
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-white border-gray-300"
                            )}
                          >
                            {checked && (
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          {value}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
