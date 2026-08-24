import type { ReactNode } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/common/Skeletons";

export interface Column<T> {
  key: string;

  header: string;

  width?: string;
  render: (row: T) => ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  isLoading = false,
  emptyMessage = "Aucune donnée disponible",
}: {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}) {
  const template = columns.map((column) => column.width ?? "minmax(0,1fr)").join(" ");

  return (
    <div className="rounded-lg border border-border">
      <div
        className="hidden gap-4 border-b border-border px-5 py-3 lg:grid"
        style={{ gridTemplateColumns: template }}
      >
        {columns.map((column) => (
          <p key={column.key} className="text-[13px] font-semibold">
            {column.header}
          </p>
        ))}
      </div>

      {isLoading ? (
        <div className="px-5">
          <TableSkeleton rows={6} columns={columns.length} />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-5">
          <EmptyState message={emptyMessage} />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.id}>
              <div
                className="grid grid-cols-1 gap-3 px-5 py-4 lg:items-center lg:gap-4"
                style={{ gridTemplateColumns: undefined }}
              >
                <div
                  className="grid grid-cols-1 gap-3 lg:gap-4"
                  style={{ gridTemplateColumns: template }}
                >
                  {columns.map((column) => (
                    <div key={column.key} className="min-w-0">
                      <p className="mb-1 text-[13px] font-semibold text-muted-foreground lg:hidden">
                        {column.header}
                      </p>
                      {column.render(row)}
                    </div>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
