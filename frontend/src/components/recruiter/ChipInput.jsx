import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChipInput({
  value = [],
  onChange,
  placeholder = "Type and press Enter...",
  label,
  hint,
  suggestions = [],
  accent = "indigo",
  className,
  id,
}) {
  const [text, setText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const accents = {
    indigo: "from-indigo-500 to-blue-600",
    emerald: "from-emerald-500 to-teal-600",
    violet: "from-violet-500 to-purple-600",
    amber: "from-amber-500 to-orange-600",
  };

  const addChip = (chip) => {
    const clean = String(chip || "").trim();
    if (!clean) return;
    if (value.some((v) => v.toLowerCase() === clean.toLowerCase())) {
      setText("");
      return;
    }
    onChange([...value, clean]);
    setText("");
    inputRef.current?.focus();
  };

  const removeChip = (chip) => {
    onChange(value.filter((v) => v !== chip));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip(text);
    } else if (e.key === "Backspace" && !text && value.length > 0) {
      removeChip(value[value.length - 1]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !value.some((v) => v.toLowerCase() === s.toLowerCase()) &&
      (!text || s.toLowerCase().includes(text.toLowerCase()))
  );

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-2 block text-sm font-semibold text-foreground">
          {label}
        </label>
      )}

      <div
        ref={containerRef}
        className={cn(
          "group rounded-2xl border border-input bg-card px-3 py-2.5 shadow-sm transition-all duration-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10",
          className && value.length > 0 && ""
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <AnimatePresence initial={false}>
            {value.map((chip) => (
              <motion.span
                key={chip}
                layout
                initial={{ opacity: 0, scale: 0.7, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-semibold text-white shadow-sm",
                  accents[accent]
                )}
              >
                {chip}
                <button
                  type="button"
                  onClick={() => removeChip(chip)}
                  className="rounded-full p-0.5 text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label={`Remove ${chip}`}
                >
                  <X className="size-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>

          <input
            ref={inputRef}
            id={id}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={value.length === 0 ? placeholder : "Add another..."}
            className="min-w-[140px] flex-1 bg-transparent py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label={label || placeholder}
          />
        </div>
      </div>

      <AnimatePresence>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="mt-2 rounded-2xl border border-border bg-card p-3 shadow-xl"
          >
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Lightbulb className="size-3.5 text-amber-500" /> Suggestions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {filteredSuggestions.slice(0, 12).map((s) => (
                <motion.button
                  key={s}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => addChip(s)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <Plus className="size-3" />
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
