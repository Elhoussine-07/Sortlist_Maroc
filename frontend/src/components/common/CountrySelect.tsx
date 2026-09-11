import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { dialCodeFor, flagEmoji } from "@/lib/countries";
import { getCountries, type CountryOption } from "@/services/countries.service";

export interface SelectedCountry {
  name: string;
  code: string;
  dialCode: string;
}

export function CountrySelect({
  label,
  value,
  onSelect,
  error,
  placeholder = "Rechercher un pays...",
}: {
  label: string;
  value: string;
  onSelect: (country: SelectedCountry) => void;
  error?: string | undefined;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getCountries()
      .then((list) => {
        if (!cancelled) setCountries(list);
      })
      .catch(() => {
        // Best-effort : la liste reste vide, l'utilisateur peut réessayer
        // en rouvrant le menu (pas de retry automatique ici).
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = countries.find((country) => country.name === value) ?? null;

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return countries;
    return countries.filter((country) => country.name.toLowerCase().includes(trimmed));
  }, [query, countries]);

  function handleSelect(country: CountryOption) {
    onSelect({ name: country.name, code: country.code, dialCode: dialCodeFor(country.code) });
    setIsOpen(false);
    setQuery("");
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-1.5 block text-[13.5px] font-semibold">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={
          "flex w-full items-center justify-between rounded-md border bg-background px-3 py-2.5 text-left text-[14px] transition-colors " +
          (error ? "border-destructive" : "border-border hover:bg-accent")
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? (
            <>
              <span aria-hidden>{flagEmoji(selected.code)}</span>
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span className="truncate text-muted-foreground">
              {isLoading ? "Chargement..." : "Sélectionner un pays"}
            </span>
          )}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
      </button>

      {error ? <p className="mt-1 text-[12.5px] text-destructive">{error}</p> : null}

      {isOpen ? (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-md border border-border bg-background shadow-lg">
          <div className="border-b border-border p-2">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-primary"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-[13px] text-muted-foreground">
                {isLoading ? "Chargement..." : "Aucun pays trouvé."}
              </li>
            ) : (
              filtered.map((country) => (
                <li key={country.code || country.name}>
                  <button
                    type="button"
                    onClick={() => handleSelect(country)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13.5px] transition-colors hover:bg-accent"
                  >
                    <span aria-hidden>{flagEmoji(country.code)}</span>
                    <span className="min-w-0 flex-1 truncate">{country.name}</span>
                    <span className="shrink-0 text-[12.5px] text-muted-foreground">
                      {dialCodeFor(country.code)}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden />
      ) : null}
    </div>
  );
}
