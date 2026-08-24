import { Search, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-4 py-3">
      <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" strokeWidth={1.7} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  );
}

export function StatusTabs({
  tabs,
  value,
  onChange,
  counts,
}: {
  tabs: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  counts?: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          aria-pressed={value === tab.value}
          className={
            value === tab.value
              ? "rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground"
              : "rounded-full border border-border px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:bg-accent"
          }
        >
          {tab.label}
          <span className="ml-1.5 text-[13px] font-normal opacity-70">
            {counts?.[tab.value] ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  footer,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  suffix?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 p-5">
      <Icon className="mt-1 h-[21px] w-[21px] shrink-0" strokeWidth={1.6} />
      <div className="min-w-0">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <p className="mt-1 text-[28px] font-bold leading-none">
          {value}
          {suffix ? (
            <span className="text-[14px] font-normal text-muted-foreground">{suffix}</span>
          ) : null}
        </p>
        {footer ? <div className="mt-2.5 text-[13px] text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 divide-y divide-border rounded-lg border border-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon ? <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.7} /> : null}
            <h2 className="text-[15px] font-bold">{title}</h2>
          </div>
          {description ? (
            <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[13px] font-semibold">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      {label}
    </span>
  );
}

export function TextField({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[14px] outline-none focus:border-foreground"
      />
      {error ? <span className="mt-1 block text-[13px] font-semibold">{error}</span> : null}
    </label>
  );
}

export function TextAreaField({
  label,
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <textarea
        {...props}
        className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-[14px] outline-none focus:border-foreground"
      />
      {error ? <span className="mt-1 block text-[13px] font-semibold">{error}</span> : null}
    </label>
  );
}

export function PreferenceRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold">{label}</p>
        {description ? (
          <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
