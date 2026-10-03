import { usePageText, type PageTextDict } from "@/i18n/useTranslation";

const EMPTY_STATE_TEXT = {
  "Aucune donnée à afficher.": {
    en: "No data to display.",
    ar: "لا توجد بيانات لعرضها.",
    es: "No hay datos para mostrar.",
  },
} satisfies PageTextDict;

export function EmptyState({ message = "Aucune donnée à afficher." }: { message?: string }) {
  const { tt } = usePageText(EMPTY_STATE_TEXT);
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-border px-6 py-14">
      <p className="text-[15px] text-muted-foreground">{tt(message)}</p>
    </div>
  );
}
