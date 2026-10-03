import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

const LIST_CONTROLS_TEXT = {
  "Filtre indisponible pour le moment": {
    en: "Filter currently unavailable",
    ar: "عامل التصفية غير متوفر حاليًا",
    es: "Filtro no disponible por el momento",
  },
  Pagination: { en: "Pagination", ar: "التنقل بين الصفحات", es: "Paginación" },
  Précédent: { en: "Previous", ar: "السابق", es: "Anterior" },
  Suivant: { en: "Next", ar: "التالي", es: "Siguiente" },
} satisfies PageTextDict;

export function FilterSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  options?: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
}) {
  const { tt } = usePageText(LIST_CONTROLS_TEXT);
  const hasOptions = Boolean(options && options.length > 0 && onChange);

  if (hasOptions) {
    return (
      <div className="border-b border-border pb-2">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <select
          value={value ?? ""}
          onChange={(event) => onChange?.(event.target.value)}
          className="mt-1 w-full bg-transparent text-left text-[14px] outline-none"
        >
          <option value="">{placeholder}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="border-b border-border pb-2">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <button
        type="button"
        disabled
        title={tt("Filtre indisponible pour le moment")}
        className="mt-1 flex w-full items-center justify-between gap-2 text-left text-[14px] text-muted-foreground opacity-60"
      >
        {placeholder}
        <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={1.7} />
      </button>
    </div>
  );
}

export function ListPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number | null;
  onPageChange?: (page: number) => void;
}) {
  const { tt } = usePageText(LIST_CONTROLS_TEXT);
  const pages = totalPages ?? 1;
  const visible = Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1);
  const canNavigate = Boolean(onPageChange) && pages > 1;

  return (
    <nav
      aria-label={tt("Pagination")}
      className="mt-10 flex flex-wrap items-center justify-center gap-3"
    >
      <button
        onClick={() => onPageChange?.(Math.max(1, page - 1))}
        type="button"
        disabled={!canNavigate || page === 1}
        className="flex items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
        {tt("Précédent")}
      </button>

      {visible.map((p) => (
        <button
          onClick={() => onPageChange?.(p)}
          key={p}
          type="button"
          disabled={!canNavigate}
          aria-current={p === page ? "page" : undefined}
          className={
            p === page
              ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[13.5px] font-semibold text-primary-foreground"
              : "flex h-7 w-7 items-center justify-center rounded-full text-[13.5px] transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          }
        >
          {p}
        </button>
      ))}
      {pages > 5 ? (
        <>
          <span className="text-[13.5px] text-muted-foreground">...</span>
          <button
            onClick={() => onPageChange?.(pages)}
            type="button"
            disabled={!canNavigate}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[13.5px] transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pages}
          </button>
        </>
      ) : null}

      <button
        onClick={() => onPageChange?.(Math.min(pages, page + 1))}
        type="button"
        disabled={!canNavigate || page >= pages}
        className="flex items-center gap-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        {tt("Suivant")}
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
      </button>
    </nav>
  );
}
