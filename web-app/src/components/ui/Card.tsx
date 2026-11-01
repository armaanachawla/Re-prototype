import type { ReactNode } from "react";

export function Card({ children, className = "", as: Tag = "div", id }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" | "li"; id?: string }) {
  return (
    <Tag id={id} className={`rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-7 ${className}`}>
      {children}
    </Tag>
  );
}

export function PageHeader({ eyebrow, title, intro, aside }: { eyebrow: string; title: ReactNode; intro?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-6 sm:mb-10">
      <div className="max-w-3xl">
        <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.14em] text-sage-deep">{eyebrow}</p>
        <h1 className="font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl">{title}</h1>
        {intro ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-taupe sm:text-lg">{intro}</p> : null}
      </div>
      {aside}
    </header>
  );
}

export function SimTag({ label = "Illustrative sample data", className = "" }: { label?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-strong bg-ivory px-2.5 py-0.5 text-xs font-medium text-taupe ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-terracotta" aria-hidden />
      {label}
    </span>
  );
}

export function Callout({ icon, children, tone = "sand", className = "" }: { icon?: ReactNode; children: ReactNode; tone?: "sand" | "sage" | "rose"; className?: string }) {
  const tones = { sand: "bg-sand-soft border-sand", sage: "bg-sage-soft border-sage", rose: "bg-rose-soft border-rose" };
  return (
    <div className={`flex gap-3 rounded-2xl border px-4 py-3.5 text-[15px] leading-relaxed text-ink ${tones[tone]} ${className}`}>
      {icon ? <span className="mt-0.5 shrink-0 text-taupe">{icon}</span> : null}
      <div>{children}</div>
    </div>
  );
}

export function ProgressBar({ pct, label, tone = "sage" }: { pct: number; label: string; tone?: "sage" | "terracotta" | "sand" }) {
  const fill = { sage: "bg-sage-deep", terracotta: "bg-terracotta", sand: "bg-sand-deep" }[tone];
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-2.5 w-full overflow-hidden rounded-full bg-cream">
      <div className={`h-full rounded-full ${fill} transition-[width] duration-700 ease-[var(--ease-soft)]`} style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
    </div>
  );
}
