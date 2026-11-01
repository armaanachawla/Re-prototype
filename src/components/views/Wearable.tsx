"use client";

import { useState } from "react";
import { Check, FlaskConical, Plus } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { KneeSleeve, VIEW_H, VIEW_W, anchors, type Hotspot } from "../product/KneeSleeve";
import { COLOURS, STYLES } from "../product/options";
import { Callout, Card, PageHeader } from "../ui/Card";

const HOTSPOTS: { key: Hotspot; title: string; summary: string; body: string; caveat: string }[] = [
  {
    key: "sensors",
    title: "Movement sensors",
    summary: "Proposed placement around the knee joint.",
    body: "Two slim sensor pods would sit on the outer side of the knee, one on the thigh and one on the shin, joined by a flexible connector. Comparing their orientation could estimate how far the knee bends and count repetitions during selected exercises.",
    caveat: "Placement, accuracy and comfort would need to be tested and validated. Nothing is measured in this prototype.",
  },
  {
    key: "fit",
    title: "Fit and support zones",
    summary: "Designed for comfort and a secure fit.",
    body: "A softly structured zone around the kneecap, gentle grip cuffs at the top and bottom to stop the sleeve slipping, and a stretchier panel behind the knee so it can bend freely. A slim profile is intended to sit unnoticed under trousers.",
    caveat: "Fit, materials and any support effect would need testing with a wide range of body types.",
  },
  {
    key: "platform",
    title: "Connected recovery platform",
    summary: "How recorded movement would reach the app.",
    body: "Session summaries would sync to the RE app, where they would appear as plain-English summaries for you and a more detailed view for your physiotherapist, like the screens in this prototype.",
    caveat: "No device connection exists. This website does not access any sensors on your phone or computer.",
  },
];

export function Wearable() {
  const { data, state, dispatch } = useApp();
  const [open, setOpen] = useState<Hotspot | null>(null);
  const colour = COLOURS.find((c) => c.key === state.colour)!;
  const style = STYLES.find((s) => s.key === state.style)!;
  const pts = anchors(state.style);
  const toggle = (k: Hotspot) => setOpen((o) => (o === k ? null : k));

  return (
    <div>
      <PageHeader
        eyebrow="My Wearable"
        title="Meet the RE wearable."
        intro="A slim, anatomically shaped knee sleeve, designed to be something you'd choose to wear rather than something you've been prescribed. Select the numbered points to see how it's intended to work."
        aside={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3 py-1 text-xs font-medium text-taupe">
            <FlaskConical className="h-3.5 w-3.5" /> Concept illustration
          </span>
        }
      />

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Stage */}
        <div className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-[radial-gradient(ellipse_at_50%_35%,#fffdf9_0%,#f3ece1_70%)] shadow-[var(--shadow-soft)]">
            <div className="relative mx-auto aspect-[4/5] max-h-[640px] w-full">
              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
                <div className="relative h-full" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
                  <div key={`${state.colour}-${state.style}`} className="re-fade h-full w-full">
                    <KneeSleeve colour={colour} style={state.style} highlight={open} className="h-full w-full" />
                  </div>
                  {HOTSPOTS.map((h, i) => {
                    const a = pts[h.key];
                    const active = open === h.key;
                    return (
                      <button
                        key={h.key}
                        type="button"
                        onClick={() => toggle(h.key)}
                        aria-expanded={active}
                        aria-controls={`hotspot-${h.key}`}
                        aria-label={`${h.title}: ${active ? "hide" : "show"} details`}
                        className="group absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${(a.x / VIEW_W) * 100}%`, top: `${(a.y / VIEW_H) * 100}%` }}
                      >
                        {!active ? <span className="absolute inset-0 -m-1.5 animate-ping rounded-full bg-terracotta/30 [animation-duration:2.6s]" aria-hidden /> : null}
                        <span className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-[13px] font-semibold shadow-md transition-all ${active ? "scale-110 border-terracotta-deep bg-terracotta-deep text-ivory" : "border-ivory bg-ink text-ivory"}`}>
                          {i + 1}
                        </span>
                        <span className={`pointer-events-none absolute left-1/2 top-full mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-xs text-ivory sm:block ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                          {h.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-card/70 px-5 py-3 text-[14px]">
              <span className="text-ink">
                RE Sleeve · <strong className="font-medium">{style.name}</strong> · {colour.name}
              </span>
              <span className="text-taupe">Illustration, not to scale</span>
            </div>
          </div>
        </div>

        {/* Annotations */}
        <div className="lg:col-span-5">
          <ul className="space-y-3">
            {HOTSPOTS.map((h, i) => {
              const active = open === h.key;
              return (
                <li key={h.key} className={`overflow-hidden rounded-[var(--radius-card)] border bg-card transition-colors ${active ? "border-terracotta" : "border-line"}`}>
                  <h2>
                    <button type="button" onClick={() => toggle(h.key)} aria-expanded={active} aria-controls={`hotspot-${h.key}`} className="flex w-full items-start gap-4 p-5 text-left">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${active ? "bg-terracotta-deep text-ivory" : "bg-cream text-ink"}`}>{i + 1}</span>
                      <span className="flex-1">
                        <span className="block text-lg font-medium text-ink">{h.title}</span>
                        <span className="block text-[15px] text-taupe">{h.summary}</span>
                      </span>
                      <Plus className={`mt-1 h-5 w-5 shrink-0 text-taupe transition-transform duration-300 ${active ? "rotate-45" : ""}`} aria-hidden />
                    </button>
                  </h2>
                  <div id={`hotspot-${h.key}`} hidden={!active} className="re-fade px-5 pb-5 pl-16">
                    <p className="leading-relaxed text-ink">{h.body}</p>
                    <p className="mt-3 flex gap-2 text-[14px] text-taupe">
                      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-sand-deep" aria-hidden />
                      {h.caveat}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <Callout tone="sand" icon={<FlaskConical className="h-4 w-4" />} className="mt-5 text-[14px]">
            The physical sleeve and its sensors don&apos;t exist yet. Sensor placement, measurement accuracy and comfort would all need to be tested and clinically validated before RE could be used for real.
          </Callout>
        </div>
      </div>

      {/* Customisation */}
      <section aria-labelledby="customise-title" className="mt-16">
        <h2 id="customise-title" className="font-serif text-3xl tracking-[-0.01em] text-ink sm:text-4xl">
          Make it yours.
        </h2>
        <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-taupe">
          Choose the colour and finish you like, whether you want it to blend in with your clothes or stand out. Colours are personal choices; there&apos;s no &quot;right&quot; shade for anyone.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-5">
            <h3 className="text-[15px] font-medium text-ink">Colour</h3>
            <div role="radiogroup" aria-label="Colour" className="mt-4 grid grid-cols-3 gap-3">
              {COLOURS.map((c) => {
                const active = c.key === state.colour;
                return (
                  <button key={c.key} type="button" role="radio" aria-checked={active} onClick={() => dispatch({ type: "colour", colour: c.key })} className="group flex flex-col items-center gap-2 rounded-2xl p-2 text-center transition-colors hover:bg-ivory">
                    <span className={`relative flex h-12 w-12 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-all ${active ? "ring-2 ring-ink" : "ring-1 ring-line-strong"}`} style={{ backgroundColor: c.base }}>
                      {active ? <Check className={`h-5 w-5 ${c.light ? "text-ink" : "text-ivory"}`} aria-hidden /> : null}
                    </span>
                    <span className={`text-[13px] leading-tight ${active ? "font-medium text-ink" : "text-taupe"}`}>{c.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-5 text-[13px] leading-relaxed text-taupe">On-screen shades are illustrations. Real fabric colours, and how they look against your skin or clothes, may differ.</p>
          </Card>

          <Card className="lg:col-span-7">
            <h3 className="text-[15px] font-medium text-ink">Style</h3>
            <div role="radiogroup" aria-label="Style" className="mt-4 grid gap-3 md:grid-cols-3">
              {STYLES.map((s) => {
                const active = s.key === state.style;
                return (
                  <button key={s.key} type="button" role="radio" aria-checked={active} onClick={() => dispatch({ type: "style", style: s.key })} className={`flex flex-col rounded-2xl border p-4 text-left transition-all ${active ? "border-ink bg-ivory" : "border-line hover:border-line-strong"}`}>
                    <span className="flex w-full items-center justify-between">
                      <span className="font-serif text-xl text-ink">{s.name}</span>
                      {active ? <Check className="h-4 w-4 text-ink" aria-hidden /> : null}
                    </span>
                    <span className="mt-1 text-[14px] text-taupe">{s.tagline}</span>
                  </button>
                );
              })}
            </div>

            <div className="re-fade mt-6 rounded-2xl bg-ivory p-5" key={`${state.style}-${state.colour}`} aria-live="polite">
              <p className="text-[13px] font-medium uppercase tracking-[0.1em] text-sage-deep">Your selection</p>
              <p className="mt-1 font-serif text-2xl text-ink">
                {style.name} in {colour.name.toLowerCase()}
              </p>
              <p className="mt-2 leading-relaxed text-ink">{style.description}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {style.details.map((d) => (
                  <li key={d} className="rounded-full border border-line bg-card px-3 py-1 text-[13px] text-taupe">
                    {d}
                  </li>
                ))}
              </ul>
              {style.caveat ? <p className="mt-3 text-[14px] text-taupe">{style.caveat}</p> : null}
            </div>
            <p className="mt-4 text-[13px] text-taupe">
              Proposed options for demonstration. RE isn&apos;t available to buy, and {data.patient.firstName}&apos;s data is the same whichever style is selected.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
