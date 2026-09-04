import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Plus, X } from "lucide-react";

/**
 * Sélecteur multiple avec recherche + option "Autre" — utilisé pour les
 * champs "Compétences", "Technologies" et "Langues de travail" de
 * l'inscription agence (auparavant des zones de texte libre séparées par
 * des virgules).
 *
 * - La liste se filtre dès la première lettre tapée (recherche par
 *   sous-chaîne, insensible à la casse).
 * - Si `allowCustom` est vrai (par défaut), une entrée "Autre..." reste
 *   toujours visible en bas de la liste (même sans recherche en cours) :
 *   cliquer dessus ouvre un petit champ dédié pour écrire une valeur libre,
 *   pour les compétences/technologies qui ne seraient pas dans la liste.
 *   Mettre `allowCustom={false}` (cas des langues) désactive entièrement
 *   cette possibilité : seules les valeurs de la liste sont sélectionnables.
 *
 * Le format de données reste une chaîne unique "a, b, c" (pas un tableau)
 * pour rester compatible avec le schéma Zod existant et le code de
 * soumission qui fait déjà `languages.split(",").map(trim)`.
 */
export function TagSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Rechercher...",
  error,
  allowCustom = true,
}: {
  label: string;
  /** Valeurs sélectionnées sous forme de chaîne "a, b, c" (comme l'ancien champ texte libre). */
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  error?: string | undefined;
  /** Autorise l'ajout d'une valeur hors liste (entrée "Autre..." + saisie libre). Par défaut : oui. */
  allowCustom?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [value],
  );

  const trimmedQuery = query.trim();

  // Filtre par sous-chaîne dès la première lettre tapée (insensible à la
  // casse), sur les options pas encore sélectionnées.
  const filtered = useMemo(() => {
    const lowerSelected = new Set(selected.map((item) => item.toLowerCase()));
    const pool = options.filter((option) => !lowerSelected.has(option.toLowerCase()));
    if (!trimmedQuery) return pool;
    const lowerQuery = trimmedQuery.toLowerCase();
    return pool.filter((option) => option.toLowerCase().includes(lowerQuery));
  }, [trimmedQuery, options, selected]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCustomMode(false);
        setCustomText("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isCustomMode) {
      customInputRef.current?.focus();
    }
  }, [isCustomMode]);

  function addValue(item: string) {
    const trimmed = item.trim();
    if (!trimmed || selected.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    onChange([...selected, trimmed].join(", "));
  }

  function removeValue(item: string) {
    onChange(selected.filter((existing) => existing !== item).join(", "));
  }

  function submitCustomValue() {
    if (customText.trim()) {
      addValue(customText);
      setCustomText("");
      setIsCustomMode(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-1.5 block text-[13.5px] font-semibold">{label}</label>
      <div
        onClick={() => {
          setIsOpen(true);
          if (!isCustomMode) inputRef.current?.focus();
        }}
        className={
          "flex min-h-[42px] w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border bg-background px-2.5 py-2 text-left transition-colors " +
          (error ? "border-destructive" : "border-border hover:border-primary/40")
        }
      >
        {selected.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[12.5px] font-medium text-primary"
          >
            {item}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                removeValue(item);
              }}
              className="rounded-full transition-colors hover:bg-primary/20"
              aria-label={`Retirer ${item}`}
            >
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !query && selected.length > 0) {
              removeValue(selected[selected.length - 1]!);
            }
          }}
          placeholder={selected.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground"
        />
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
      </div>

      {error ? <p className="mt-1 text-[12.5px] text-destructive">{error}</p> : null}

      {isOpen ? (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-md border border-border bg-background shadow-lg">
          {isCustomMode ? (
            // AJOUT : mode "Autre" — champ dédié pour écrire une valeur hors
            // liste, distinct de la recherche ci-dessus.
            <div className="p-2">
              <button
                type="button"
                onClick={() => {
                  setIsCustomMode(false);
                  setCustomText("");
                  inputRef.current?.focus();
                }}
                className="mb-2 flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" strokeWidth={2} />
                Retour à la liste
              </button>
              <div className="flex items-center gap-1.5">
                <input
                  ref={customInputRef}
                  type="text"
                  value={customText}
                  onChange={(event) => setCustomText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitCustomValue();
                    }
                  }}
                  placeholder="Écrivez votre réponse..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={submitCustomValue}
                  disabled={!customText.trim()}
                  className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2} />
                  Ajouter
                </button>
              </div>
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-[13px] text-muted-foreground">
                  {options.length === selected.length
                    ? "Toutes les options ont été ajoutées."
                    : "Aucun résultat."}
                </li>
              ) : (
                filtered.map((option) => (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => {
                        addValue(option);
                        setQuery("");
                      }}
                      className="flex w-full items-center px-3 py-2 text-left text-[13.5px] transition-colors hover:bg-accent"
                    >
                      {option}
                    </button>
                  </li>
                ))
              )}
              {allowCustom ? (
                <li className="border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(true)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13.5px] font-medium text-primary transition-colors hover:bg-accent"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    Autre...
                  </button>
                </li>
              ) : null}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
