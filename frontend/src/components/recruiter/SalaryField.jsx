import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

export default function SalaryField({
  value = {},
  onChange,
  label = "Salary",
  error,
  required = true,
}) {
  const [openCurrency, setOpenCurrency] = useState(false);
  const [activeTab, setActiveTab] = useState("lpa");

  const currency = value.currency || "INR";
  const min = value.min ?? "";
  const max = value.max ?? "";
  const base = value.base ?? "";
  const negotiable = value.negotiable ?? false;

  const symbolMap = { INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", SGD: "S$" };
  const symbol = symbolMap[currency] || "";

  const update = (patch) => onChange({ ...value, ...patch });

  const lpaToMonthly = (val) => {
    const n = Number(val);
    if (!n) return "";
    return Math.round((n * 100000) / 12);
  };

  const displayBase = activeTab === "lpa" ? base : lpaToMonthly(base);
  const displayMin = activeTab === "lpa" ? min : lpaToMonthly(min);
  const displayMax = activeTab === "lpa" ? max : lpaToMonthly(max);

  const handleBase = (e) => update({ base: e.target.value });
  const handleMin = (e) => update({ min: e.target.value });
  const handleMax = (e) => update({ max: e.target.value });

  const sliderPos = (() => {
    const lo = Number(displayMin) || 0;
    const hi = Number(displayMax) || 0;
    const top = Number(displayBase) || 0;
    const limit = Math.max(top, hi, lo, 1) * 1.3 || 100;
    return {
      lo: Math.min(100, Math.max(2, (lo / limit) * 100)),
      hi: Math.min(100, Math.max(2, (hi / limit) * 100)),
      base: Math.min(100, Math.max(2, (top / limit) * 100)),
    };
  })();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Banknote className="size-4 text-primary" />
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>

        <div className="flex rounded-xl bg-muted p-0.5">
          {[
            { id: "lpa", label: "LPA" },
            { id: "monthly", label: "Monthly" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "relative rounded-[10px] px-3 py-1 text-xs font-semibold transition-colors",
                activeTab === t.id ? "text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {activeTab === t.id && (
                <motion.span
                  layoutId="salary-unit"
                  className="absolute inset-0 rounded-[10px] bg-gradient-to-r from-indigo-500 to-blue-600 shadow"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-input bg-card p-4 shadow-sm transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Currency</span>
            <div className="relative mt-1">
              <button
                type="button"
                onClick={() => setOpenCurrency(!openCurrency)}
                className="flex w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium transition hover:border-primary/40"
                aria-haspopup="listbox"
                aria-expanded={openCurrency}
              >
                {currency}
                <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", openCurrency && "rotate-180")} />
              </button>
              <AnimatePresence>
                {openCurrency && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.14 }}
                    className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
                  >
                    {CURRENCIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          update({ currency: c });
                          setOpenCurrency(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-muted",
                          c === currency && "bg-primary/10 font-semibold text-primary"
                        )}
                      >
                        <span className="w-4 text-center">{symbolMap[c]}</span>
                        {c}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Min</span>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {symbol}
              </span>
              <Input
                type="number"
                min="0"
                value={displayMin}
                onChange={handleMin}
                placeholder="0"
                className="rounded-xl pl-8"
                aria-label="Minimum salary"
              />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-muted-foreground">Max</span>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {symbol}
              </span>
              <Input
                type="number"
                min="0"
                value={displayMax}
                onChange={handleMax}
                placeholder="0"
                className="rounded-xl pl-8"
                aria-label="Maximum salary"
              />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {required ? "Base" : "Fixed"}
            </span>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {symbol}
              </span>
              <Input
                type="number"
                min="0"
                value={displayBase}
                onChange={handleBase}
                placeholder="0"
                className="rounded-xl pl-8"
                aria-label="Base salary"
              />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="relative h-1.5 rounded-full bg-muted">
            <div
              className="absolute inset-y-0 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300"
              style={{ left: `${Math.min(sliderPos.lo, sliderPos.base)}%`, right: `${100 - Math.max(sliderPos.hi, sliderPos.base)}%` }}
            />
            <motion.span
              animate={{ left: `${sliderPos.lo}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-500 shadow"
            />
            <motion.span
              animate={{ left: `${sliderPos.hi}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-500 shadow"
            />
            <motion.span
              animate={{ left: `${sliderPos.base}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-violet-500 shadow"
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted-foreground">
            <span>0</span>
            <span>Range ({activeTab === "lpa" ? "LPA" : "monthly"})</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => update({ negotiable: !negotiable })}
          className={cn(
            "mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
            negotiable
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground hover:bg-muted"
          )}
          aria-pressed={negotiable}
        >
          <span
            className={cn(
              "flex h-4 w-7 items-center rounded-full p-0.5 transition-colors",
              negotiable ? "bg-emerald-500" : "bg-muted"
            )}
          >
            <motion.span
              animate={{ x: negotiable ? 12 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="size-3 rounded-full bg-white shadow"
            />
          </span>
          Negotiable
        </button>
      </div>

      {error && <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
