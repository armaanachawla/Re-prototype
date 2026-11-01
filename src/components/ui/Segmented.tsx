"use client";

import { useRef } from "react";

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}

/** Accessible segmented control (radio group with arrow-key support). */
export function Segmented<T extends string | number>({ label, options, value, onChange, size = "md", className = "" }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex max-w-full overflow-x-auto rounded-full border border-line bg-cream p-1 ${className}`}>
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => onChange(o.value)}
            className={`shrink-0 whitespace-nowrap rounded-full font-medium transition-all duration-300 ${size === "sm" ? "px-3 py-1.5 text-[13px]" : "px-4 py-2 text-sm"} ${
              active ? "bg-card text-ink shadow-[var(--shadow-soft)]" : "text-taupe hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
