import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import { Card, SimTag } from "../ui/Card";

interface Props {
  id?: string;
  /** Question-based title, e.g. "How far can you bend your knee?" */
  title: string;
  subtitle: string;
  latest?: { label: string; value: string; comparison?: ReactNode };
  controls?: ReactNode;
  legend?: ReactNode;
  /** One-sentence plain-English explanation shown under the chart. */
  explanation: ReactNode;
  why: ReactNode;
  children: ReactNode;
  className?: string;
  chartLabel: string;
}

/** Shared frame that enforces the chart-readability rules across the app. */
export function ChartCard({ id, title, subtitle, latest, controls, legend, explanation, why, children, className = "", chartLabel }: Props) {
  return (
    <Card as="section" id={id} className={`@container ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-xl @3xl:max-w-[60%]">
          <h3 className="font-serif text-2xl leading-tight tracking-[-0.01em] text-ink">{title}</h3>
          <p className="mt-1.5 text-[15px] text-taupe">{subtitle}</p>
        </div>
        {latest ? (
          <div className="w-full text-left @3xl:w-auto @3xl:text-right">
            <p className="text-[13px] text-taupe">{latest.label}</p>
            <p className="tabular font-serif text-4xl leading-none text-ink">{latest.value}</p>
            {latest.comparison ? <div className="mt-1.5 text-[13px] text-taupe">{latest.comparison}</div> : null}
          </div>
        ) : null}
      </div>
      {controls || legend ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div>{controls}</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-taupe">{legend}</div>
        </div>
      ) : null}
      <figure className="mt-5" aria-label={chartLabel}>
        {children}
        <figcaption className="mt-4 text-[15px] leading-relaxed text-ink">{explanation}</figcaption>
      </figure>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-t border-line pt-4">
        <p className="flex max-w-2xl gap-2 text-sm leading-relaxed text-taupe">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-sand-deep" aria-hidden />
          <span>
            <span className="font-medium text-ink">Why this matters: </span>
            {why}
          </span>
        </p>
        <SimTag />
      </div>
    </Card>
  );
}

export function LegendItem({ swatch, label }: { swatch: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {swatch}
      {label}
    </span>
  );
}

export const swatch = {
  line: (color: string, dashed = false) => (
    <svg width="22" height="8" aria-hidden>
      <line x1="1" y1="4" x2="21" y2="4" stroke={color} strokeWidth="2.5" strokeDasharray={dashed ? "4 3" : undefined} strokeLinecap="round" />
    </svg>
  ),
  box: (fill: string, stroke?: string, dashed = false) => (
    <svg width="14" height="14" aria-hidden>
      <rect x="1" y="1" width="12" height="12" rx="3" fill={fill} stroke={stroke ?? "none"} strokeDasharray={dashed ? "2 2" : undefined} />
    </svg>
  ),
  hatch: () => (
    <svg width="14" height="14" aria-hidden>
      <defs>
        <pattern id="legend-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4" height="4" fill="#e6d3b3" />
          <line x1="0" y1="0" x2="0" y2="4" stroke="#8a6a3c" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect x="1" y="1" width="12" height="12" rx="3" fill="url(#legend-hatch)" />
    </svg>
  ),
};
