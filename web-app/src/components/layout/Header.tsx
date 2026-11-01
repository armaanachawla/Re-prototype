"use client";

import { useEffect, useState } from "react";
import { Menu, Stethoscope, User, X } from "lucide-react";
import { VIEWS, useApp, type ViewKey } from "@/lib/app-state";

export function Header() {
  const { state, go } = useApp();
  const [open, setOpen] = useState(false);
  const physio = state.view === "physio";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const nav = (v: ViewKey) => {
    setOpen(false);
    go(v);
  };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-ivory/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => nav("overview")} className="flex items-baseline gap-2" aria-label="RE home">
          <span className="font-serif text-2xl tracking-tight text-ink">RE</span>
          <span className="hidden text-[13px] text-taupe sm:inline xl:hidden 2xl:inline">Recovery, in motion.</span>
        </button>

        {/* Audience switch */}
        <div role="radiogroup" aria-label="Choose experience" className="ml-auto flex rounded-full border border-line bg-cream p-1 xl:order-last xl:ml-0">
          {[
            { key: "overview" as const, label: "My Recovery", icon: User, active: !physio },
            { key: "physio" as const, label: "Physiotherapist View", icon: Stethoscope, active: physio },
          ].map((o) => (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={o.active}
              aria-label={o.label}
              onClick={() => nav(o.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-all sm:px-3.5 ${o.active ? "bg-ink text-ivory" : "text-taupe hover:text-ink"}`}
            >
              <o.icon className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">{o.label}</span>
              <span className="sm:hidden" aria-hidden>{o.key === "physio" ? "Physio" : "Patient"}</span>
            </button>
          ))}
        </div>

        <nav aria-label="Main" className="hidden flex-1 justify-center xl:flex">
          <ul className="flex items-center gap-1">
            {VIEWS.map((v) => (
              <li key={v.key}>
                <button
                  type="button"
                  onClick={() => nav(v.key)}
                  aria-current={state.view === v.key ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-[14px] transition-colors ${state.view === v.key ? "bg-sage-soft font-medium text-sage-deep" : "text-taupe hover:bg-cream hover:text-ink"}`}
                >
                  {v.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-cream xl:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <nav id="mobile-menu" aria-label="Main (mobile)" className="re-fade absolute inset-x-0 top-full border-b border-line bg-ivory px-4 pb-6 pt-2 shadow-[var(--shadow-soft)] sm:px-6 xl:hidden">
          <ul className="divide-y divide-line">
            {VIEWS.map((v) => (
              <li key={v.key}>
                <button
                  type="button"
                  onClick={() => nav(v.key)}
                  aria-current={state.view === v.key ? "page" : undefined}
                  className={`flex w-full items-center justify-between py-3.5 text-left text-lg ${state.view === v.key ? "font-medium text-sage-deep" : "text-ink"}`}
                >
                  {v.label}
                  {state.view === v.key ? <span className="h-2 w-2 rounded-full bg-sage-deep" aria-hidden /> : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
