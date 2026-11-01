import type { ReactNode } from "react";

export function TooltipCard({ title, rows, context }: { title: string; rows: { label: string; value: ReactNode; swatch?: ReactNode }[]; context?: string }) {
  return (
    <div className="max-w-[260px] rounded-2xl border border-line bg-card px-4 py-3 text-[13px] shadow-[var(--shadow-soft)]">
      <p className="mb-1.5 font-medium text-ink">{title}</p>
      <dl className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-5">
            <dt className="flex items-center gap-2 text-taupe">
              {r.swatch}
              {r.label}
            </dt>
            <dd className="tabular font-semibold text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
      {context ? <p className="mt-2 border-t border-line pt-2 text-xs leading-snug text-taupe">{context}</p> : null}
      <p className="mt-1.5 text-[11px] text-muted">Illustrative sample data</p>
    </div>
  );
}
