import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  defaultLocationProvider,
  type LocationProvider,
  type LocationResult,
} from "@/lib/locationProvider";

interface LocationAutocompleteProps {
  value: LocationResult | null;
  onChange: (loc: LocationResult | null) => void;
  placeholder?: string;
  provider?: LocationProvider;
  debounceMs?: number;
  className?: string;
  inputClassName?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Search village, town, or city…",
  provider = defaultLocationProvider,
  debounceMs = 350,
  className,
  inputClassName,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value?.locationName ?? "");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Keep input synced when value cleared externally.
  useEffect(() => {
    if (!value) return;
    setQuery((q) => (q === value.locationName ? q : value.locationName));
  }, [value]);

  // Debounced search.
  useEffect(() => {
    const q = query.trim();
    if (value && q === value.locationName) {
      setResults([]);
      return;
    }
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const r = await provider.search(q, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setResults(r);
        setHighlight(0);
        setOpen(true);
      } catch (e) {
        if ((e as { name?: string })?.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Search failed");
        setResults([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [query, debounceMs, provider, value]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const select = (r: LocationResult) => {
    onChange(r);
    setQuery(r.locationName);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      if (e.key === "ArrowDown" && results.length > 0) setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          className={cn("h-12 pl-9 pr-9 text-base", inputClassName)}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            if (value) onChange(null);
            setOpen(true);
          }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showPanel && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-72 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {loading && results.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}
          {!loading && error && (
            <div className="px-3 py-3 text-sm text-destructive">{error}</div>
          )}
          {!loading && !error && results.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No locations found for “{query.trim()}”.
            </div>
          )}
          {results.map((r, i) => {
            const parts = [r.district, r.state, r.country].filter(Boolean).join(", ");
            return (
              <button
                type="button"
                key={r.id}
                role="option"
                aria-selected={i === highlight}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(r);
                }}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors",
                  i === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                )}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.locationName}</div>
                  {parts && (
                    <div className="truncate text-xs text-muted-foreground">{parts}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
