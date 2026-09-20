import { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Check, ChevronDown, Plus, Search } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function CompanySelector({
  value,
  companies = [],
  onChange,
  onShowCreate,
  label = "Company",
  error,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const selected = companies.find((c) => c._id === value) || null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q)
    );
  }, [companies, query]);

  const recentlyUsed = companies.slice(0, 3);

  const handleSelect = (company) => {
    onChange(company._id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-2 block text-sm font-semibold text-foreground">{label}</label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border bg-card px-3.5 py-3 text-left shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
          open ? "border-primary ring-4 ring-primary/10" : "border-input hover:border-primary/40",
          error && "border-destructive"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        {selected ? (
          <>
            <Avatar className="size-9 rounded-xl">
              <AvatarImage src={selected.logo} alt={selected.name} />
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-bold text-white">
                {(selected.name || "C")[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{selected.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[selected.location, selected.industry].filter(Boolean).join(" · ") || "Company"}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
              <Building2 className="size-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Select a company</p>
          </div>
        )}
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {error && <p className="mt-1.5 text-xs font-medium text-destructive">{error}</p>}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
          >
            <div className="relative border-b border-border p-2.5">
              <Search className="absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search companies..."
                className="w-full rounded-xl bg-muted/60 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Search companies"
              />
            </div>

            <div className="max-h-72 overflow-y-auto p-1.5">
              {!query && recentlyUsed.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Recently used
                  </p>
                  {recentlyUsed.map((c) => (
                    <CompanyOption key={c._id} company={c} selected={value === c._id} onSelect={handleSelect} />
                  ))}
                  <div className="my-1.5 border-t border-border" />
                  <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    All companies
                  </p>
                </>
              )}

              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Building2 className="mx-auto size-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm font-medium text-foreground">No companies found</p>
                  <p className="text-xs text-muted-foreground">Try a different search or create a new company.</p>
                </div>
              ) : (
                filtered.map((c) => (
                  <CompanyOption key={c._id} company={c} selected={value === c._id} onSelect={handleSelect} />
                ))
              )}
            </div>

            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (onShowCreate) onShowCreate();
                  else navigate("/admin/companies/create");
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10">
                  <Plus className="size-3.5" />
                </span>
                Create new company
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CompanyOption({ company, selected, onSelect }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(company)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        selected ? "bg-primary/10" : "hover:bg-muted/60"
      )}
      role="option"
      aria-selected={selected}
    >
      <Avatar className="size-8 rounded-lg">
        <AvatarImage src={company.logo} alt={company.name} />
        <AvatarFallback className="rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-xs font-bold text-white">
          {(company.name || "C")[0]}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{company.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {company.location || company.industry || "Company"}
        </p>
      </div>
      {selected && <Check className="size-4 shrink-0 text-primary" />}
    </motion.button>
  );
}
