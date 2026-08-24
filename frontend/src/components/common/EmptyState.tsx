export function EmptyState({ message = "Aucune donnée à afficher." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-border px-6 py-14">
      <p className="text-[15px] text-muted-foreground">{message}</p>
    </div>
  );
}
