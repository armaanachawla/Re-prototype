"use client";

import { useState } from "react";
import { ChevronDown, FlaskConical } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { buildObservations } from "@/lib/recovery";
import { formatLong } from "@/lib/dates";
import { Card, Callout, SimTag } from "../ui/Card";
import { StatusPill } from "../ui/StatusPill";

/** "Things to discuss with your physiotherapist": observations generated from the sample data. */
export function Discussion({ id = "discuss" }: { id?: string }) {
  const { data } = useApp();
  const items = buildObservations(data);
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  const physio = data.patient.physiotherapist;

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`${id}-title`} className="font-serif text-3xl tracking-[-0.01em] text-ink">Things to discuss with your physiotherapist</h2>
          <p className="mt-1.5 text-[15px] text-taupe">
            Observations from your sample data to bring to your appointment with {physio} on {formatLong(data.patient.nextAppointment)}.
          </p>
        </div>
        <SimTag />
      </div>

      {items.length === 0 ? (
        <Card className="text-center text-taupe">Nothing in your recent data stands out to discuss. Bring any questions you have to your appointment.</Card>
      ) : (
        <ul className="space-y-3">
          {items.map((o) => {
            const expanded = open === o.id;
            return (
              <li key={o.id} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-soft)]">
                <h3>
                  <button type="button" onClick={() => setOpen(expanded ? null : o.id)} aria-expanded={expanded} aria-controls={`obs-${o.id}`} className="flex w-full items-start gap-4 px-5 py-4 text-left sm:px-6">
                    <span className="flex-1">
                      <span className="block text-[17px] font-medium leading-snug text-ink">{o.title}</span>
                      <span className="mt-2 block">
                        <StatusPill kind={o.kind} />
                      </span>
                    </span>
                    <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-taupe transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} aria-hidden />
                  </button>
                </h3>
                <div id={`obs-${o.id}`} hidden={!expanded} className="re-fade border-t border-line px-5 pb-5 pt-4 sm:px-6">
                  <dl className="grid gap-5 md:grid-cols-2">
                    <div>
                      <dt className="text-[13px] font-medium uppercase tracking-[0.1em] text-sage-deep">What changed</dt>
                      <dd className="mt-1.5 leading-relaxed text-ink">{o.whatChanged}</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] font-medium uppercase tracking-[0.1em] text-sage-deep">Measurements behind this</dt>
                      <dd className="mt-1.5">
                        <ul className="divide-y divide-line rounded-xl border border-line bg-ivory text-sm">
                          {o.evidence.map((e, i) => (
                            <li key={i} className="flex justify-between gap-4 px-3 py-2">
                              <span className="text-taupe">{e.label}</span>
                              <span className="tabular font-medium text-ink">{e.value}</span>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[13px] font-medium uppercase tracking-[0.1em] text-sage-deep">Why it may be worth discussing</dt>
                      <dd className="mt-1.5 leading-relaxed text-ink">{o.whyDiscuss}</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] font-medium uppercase tracking-[0.1em] text-rose-deep">What RE can&apos;t conclude</dt>
                      <dd className="mt-1.5 leading-relaxed text-ink">{o.cannotConclude}</dd>
                    </div>
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Callout tone="sand" icon={<FlaskConical className="h-4 w-4" />} className="mt-4 text-sm">
        <strong className="font-medium">Proposed feature, requiring validation:</strong> in future, pattern detection could flag observations like these automatically. It would only highlight things for review. It would not diagnose, change your exercises or make clinical decisions.
      </Callout>
    </section>
  );
}
