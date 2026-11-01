"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Download, FileText, Printer, Stethoscope, X } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { buildGoals, buildReviewItems, latestBend, programmeWeek, rangeWindow, sessionTotals, sessionsBetween, sideDifference, weekSummaries } from "@/lib/recovery";
import { downloadText, sessionsCsv } from "@/lib/export";
import { formatFull, formatLong, formatShort, formatWeekday } from "@/lib/dates";
import { BendChart } from "../charts/BendChart";
import { SessionsChart } from "../charts/SessionsChart";
import { SideChart } from "../charts/SideChart";
import { ConsistencyChart } from "../charts/ConsistencyChart";
import { ActivityChart } from "../charts/ActivityChart";
import { RangeControl, signed } from "../charts/common";
import { Callout, Card, SimTag } from "../ui/Card";
import { Segmented } from "../ui/Segmented";
import { StatusPill } from "../ui/StatusPill";
import { Term, GLOSSARY } from "../ui/Term";
import { SessionStatusBadge, repsText } from "./ActivityLog";
import { ReportBody } from "./PrintReport";
import { IS_ARTIFACT } from "@/lib/target";

export function Physio() {
  const { data, state, dispatch } = useApp();
  const technical = state.physioDetail === "technical";
  const { patient } = data;
  const { latest, change } = latestBend(data);
  const diff = sideDifference(latest);
  const weeks = weekSummaries(data);
  const thisWeek = weeks[weeks.length - 1];
  const totals = sessionTotals(data.sessions);
  const goals = buildGoals(data);
  const review = buildReviewItems(data);
  const achieved = goals.filter((g) => g.status === "completed");
  const notYet = goals.filter((g) => g.status !== "completed" && g.statusKind === "not-reached");
  const inProgress = goals.filter((g) => !achieved.includes(g) && !notYet.includes(g));

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.14em] text-sage-deep">
            <Stethoscope className="h-4 w-4" aria-hidden /> Physiotherapist View
          </p>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl">Patient recovery overview</h1>
          <p className="mt-3 max-w-2xl text-[17px] text-taupe">The same sample data {patient.firstName} sees, with more detail on the underlying measurements.</p>
        </div>
        {IS_ARTIFACT ? (
          <HostedExports />
        ) : (
          <div className="no-print flex flex-wrap gap-2">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-ivory hover:opacity-90">
              <Printer className="h-4 w-4" /> Print sample report
            </button>
            <button type="button" onClick={() => downloadText("re-sample-sessions-SIMULATED.csv", sessionsCsv(data))} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-sm font-medium text-ink hover:border-line-strong">
              <Download className="h-4 w-4" /> Download sample data (CSV)
            </button>
          </div>
        )}
      </div>

      {/* Patient card */}
      <Card className="grid gap-6 md:grid-cols-[1.2fr_2fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand font-serif text-lg text-ink" aria-hidden>
              {patient.displayName.split(" ").map((p) => p[0]).join("")}
            </span>
            <div>
              <p className="text-lg font-medium text-ink">{patient.displayName}</p>
              <p className="text-[14px] text-taupe">Fictional sample patient</p>
            </div>
          </div>
          <SimTag className="mt-4" label="Simulated record. Not a patient database." />
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[15px] lg:grid-cols-4">
          <Fact label="Context" value={patient.context} wide />
          <Fact label="Recovering knee" value={cap(patient.recoveringKnee)} />
          <Fact label="Plan week" value={`${programmeWeek(data, data.dataEnd)} of ${patient.programmeWeeks}`} />
          <Fact label="Next appointment" value={formatFull(patient.nextAppointment)} />
          <Fact label="Data up to" value={formatFull(data.dataEnd)} />
        </dl>
      </Card>

      {/* Summary + toggle */}
      <section aria-labelledby="review-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="review-title" className="font-serif text-3xl text-ink">Trends that may warrant clinical review</h2>
            <p className="mt-1 text-[15px] text-taupe">Flags for your judgement, not conclusions. Generated from the sample data.</p>
          </div>
          <Segmented
            label="Summary detail"
            value={state.physioDetail}
            onChange={(value) => dispatch({ type: "physioDetail", value })}
            options={[
              { value: "friendly", label: "Patient-friendly" },
              { value: "technical", label: "Technical" },
            ]}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={technical ? `Flexion, ${patient.recoveringKnee} knee` : "Knee bend (recovering)"} value={latest ? `${latest.recovering}°` : "—"} note={change !== null ? `${signed(change)} vs previous assessment` : undefined} />
          <Stat label={technical ? "Side-to-side Δ flexion" : "Difference between knees"} value={diff !== null ? `${diff}°` : "—"} note={`Review threshold ${data.plan.sideDifferenceReview.degrees}°`} />
          <Stat label={technical ? "Adherence (all weeks)" : "Sessions completed overall"} value={technical ? `${Math.round((totals.done / totals.planned) * 100)}%` : `${totals.done} of ${totals.planned}`} note={`This week ${thisWeek.done}/${thisWeek.planned}`} />
          <Stat label="Goals" value={`${achieved.length} achieved`} note={`${inProgress.length} in progress · ${notYet.length} not yet achieved`} />
        </div>

        <ul className="mt-5 divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-soft)]">
          {review.map((r) => (
            <li key={r.id} className="re-fade grid gap-1 px-5 py-4 sm:grid-cols-[220px_1fr] sm:gap-6">
              <p className="font-medium text-ink">{r.title}</p>
              <p className="text-[15px] leading-relaxed text-ink">{technical ? r.technical : r.friendly}</p>
            </li>
          ))}
        </ul>
        {technical ? (
          <p className="mt-3 text-[13px] text-taupe">
            Terms: <Term definition={GLOSSARY.flexion}>flexion</Term> · <Term definition={GLOSSARY.rom}>ROM</Term> · <Term definition={GLOSSARY.sd}>SD</Term> · <Term definition={GLOSSARY.adherence}>adherence</Term>. Δ = difference.
          </p>
        ) : null}
      </section>

      <div className="no-print flex flex-wrap items-center gap-3">
        <p className="text-[15px] text-taupe">Time period for all charts:</p>
        <RangeControl />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BendChart audience="physio" showOther />
        <SideChart audience="physio" />
        <SessionsChart audience="physio" />
        <ConsistencyChart audience="physio" />
      </div>

      <ExerciseCompletion />

      {/* Goals by status */}
      <section aria-labelledby="pgoals">
        <h2 id="pgoals" className="mb-4 font-serif text-3xl text-ink">Goals</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "Achieved", list: achieved },
            { title: "In progress", list: inProgress },
            { title: "Not yet achieved", list: notYet },
          ].map((col) => (
            <Card key={col.title}>
              <h3 className="flex items-baseline justify-between text-[15px] font-medium text-ink">
                {col.title} <span className="tabular text-taupe">{col.list.length}</span>
              </h3>
              {col.list.length === 0 ? (
                <p className="mt-3 text-[14px] text-taupe">None.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {col.list.map((g) => (
                    <li key={g.id} className="rounded-2xl bg-ivory p-3">
                      <p className="text-[15px] text-ink">{g.title}</p>
                      <StatusPill kind={g.statusKind} label={g.statusText} className="mt-2" />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      </section>

      <Timeline />

      {technical ? <AssessmentTable /> : null}

      <ActivityChart audience="physio" />

      <Callout tone="sand" icon={<FileText className="h-4 w-4" />}>
        This view supplements, and never replaces, clinical examination. Values are simulated; a real system would need validated sensors, documented accuracy and appropriate regulatory and privacy controls before clinical use.
      </Callout>
    </div>
  );
}

/** Hosted (Artifact) build: the report opens on screen and the CSV is copied, since printing and downloads are blocked there. */
function HostedExports() {
  const { data } = useApp();
  const [open, setOpen] = useState(false);
  const [copy, setCopy] = useState<"idle" | "done" | "manual">("idle");
  const csvRef = useRef<HTMLTextAreaElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const csv = useMemo(() => sessionsCsv(data), [data]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const onCopy = () => {
    const fallback = () => {
      setCopy("manual");
      requestAnimationFrame(() => csvRef.current?.select());
    };
    if (!navigator.clipboard) return fallback();
    navigator.clipboard.writeText(csv).then(() => setCopy("done"), fallback);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-ivory hover:opacity-90">
          <FileText className="h-4 w-4" /> View sample report
        </button>
        <button type="button" onClick={onCopy} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-sm font-medium text-ink hover:border-line-strong">
          {copy === "done" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copy === "done" ? "Sample data copied" : "Copy sample data (CSV)"}
        </button>
      </div>
      {copy === "manual" ? (
        <div className="w-full max-w-md">
          <label htmlFor="csv-fallback" className="mb-1 block text-[13px] text-taupe">
            Copying isn&apos;t available here. The text is selected: press Ctrl+C (or ⌘C) to copy it.
          </label>
          <textarea id="csv-fallback" ref={csvRef} readOnly value={csv} rows={4} className="w-full rounded-xl border border-line bg-ivory p-2 font-mono text-[11px] text-ink" />
        </div>
      ) : null}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 sm:p-8" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Sample recovery report" className="re-fade relative w-full max-w-3xl rounded-[var(--radius-card)] bg-white p-6 text-[15px] leading-snug text-black shadow-2xl sm:p-10" onClick={(e) => e.stopPropagation()}>
            <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close report" className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-cream">
              <X className="h-4 w-4" />
            </button>
            <ReportBody />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ExerciseCompletion() {
  const { data, state } = useApp();
  const w = rangeWindow(data, state.range);
  const sessions = sessionsBetween(data, w.start, w.end);
  const rows = Object.values(data.exercises)
    .map((ex) => {
      const entries = sessions.flatMap((s) => s.entries.filter((e) => e.exerciseId === ex.id));
      if (!entries.length) return null;
      const done = entries.filter((e) => e.status === "done").length;
      const partial = entries.filter((e) => e.status === "partial").length;
      const planned = entries.reduce((a, e) => a + (e.plannedReps ?? 0), 0);
      const detected = entries.reduce((a, e) => a + (e.detectedReps ?? 0), 0);
      return { ex, scheduled: entries.length, done, partial, planned, detected };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <Card as="section">
      <h2 className="font-serif text-2xl text-ink">How completely was each exercise done?</h2>
      <p className="mt-1.5 text-[15px] text-taupe">Per prescribed exercise, {w.short.replace("over ", "")}. Repetitions are shown only where the sensor can detect them.</p>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-[14px]">
          <thead className="text-[13px] text-taupe">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-4 font-medium">Exercise</th>
              <th scope="col" className="py-2 pr-4 font-medium">Times scheduled</th>
              <th scope="col" className="py-2 pr-4 font-medium">Done fully</th>
              <th scope="col" className="py-2 pr-4 font-medium">Done partly</th>
              <th scope="col" className="py-2 pr-4 font-medium">Repetitions detected / planned</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ex.id} className="border-b border-line last:border-0">
                <td className="py-2.5 pr-4 font-medium text-ink">{r.ex.name}</td>
                <td className="tabular py-2.5 pr-4">{r.scheduled}</td>
                <td className="tabular py-2.5 pr-4">{r.done}</td>
                <td className="tabular py-2.5 pr-4">{r.partial}</td>
                <td className="tabular py-2.5 pr-4 text-ink">
                  {r.ex.detection === "reps" ? `${r.detected} / ${r.planned} (${Math.round((r.detected / Math.max(1, r.planned)) * 100)}%)` : r.ex.detection === "duration" ? "Duration-based" : "Self-reported (not detectable)"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-[14px] text-taupe">Detected counts can be slightly lower than repetitions performed, and a detected repetition doesn&apos;t confirm correct technique.</p>
    </Card>
  );
}

function Timeline() {
  const { data, state } = useApp();
  const w = rangeWindow(data, state.range);
  const sessions = useMemo(() => [...sessionsBetween(data, w.start, w.end)].reverse(), [data, w.start, w.end]);
  const [open, setOpen] = useState<string | null>(null);
  const assessmentsOn = new Map(data.assessments.map((a) => [a.date, a]));

  return (
    <section aria-labelledby="timeline-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="timeline-title" className="font-serif text-3xl text-ink">Session-by-session timeline</h2>
          <p className="mt-1 text-[15px] text-taupe">
            {sessions.length} planned sessions, {w.short}. Select a session to see each exercise.
          </p>
        </div>
        <RangeControl />
      </div>
      <ol className="relative space-y-2 border-l-2 border-line pl-5">
        {sessions.map((s) => {
          const expanded = open === s.id;
          const a = assessmentsOn.get(s.date);
          return (
            <li key={s.id} className="relative">
              <span className={`absolute -left-[27px] top-4 h-3 w-3 rounded-full border-2 border-ivory ${s.status === "completed" ? "bg-sage-deep" : s.status === "partial" ? "bg-sand-deep" : "bg-line-strong"}`} aria-hidden />
              <div className="rounded-2xl border border-line bg-card">
                <button type="button" onClick={() => setOpen(expanded ? null : s.id)} aria-expanded={expanded} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left">
                  <span className="w-28 text-[15px] font-medium text-ink">
                    {formatWeekday(s.date)} {formatShort(s.date)}
                  </span>
                  <SessionStatusBadge status={s.status} />
                  {a ? (
                    <span className="text-[13px] text-taupe">
                      Assessment: {a.recovering}° / {a.other}°
                    </span>
                  ) : null}
                  <ChevronDown className={`ml-auto h-4 w-4 text-taupe transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {expanded ? (
                  <div className="re-fade border-t border-line px-4 pb-4 pt-2">
                    <p className="mb-2 text-[13px] text-taupe">{formatLong(s.date)} · week {s.week}</p>
                    <table className="w-full text-left text-[14px]">
                      <thead className="text-[12px] text-taupe">
                        <tr>
                          <th scope="col" className="py-1 pr-3 font-medium">Exercise</th>
                          <th scope="col" className="py-1 pr-3 font-medium">Reps / time</th>
                          <th scope="col" className="py-1 pr-3 font-medium">Avg peak bend</th>
                          <th scope="col" className="py-1 font-medium">Rep variation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.entries.map((e) => (
                          <tr key={e.exerciseId} className="border-t border-line">
                            <td className="py-1.5 pr-3 text-ink">{data.exercises[e.exerciseId].name}</td>
                            <td className="tabular py-1.5 pr-3">{repsText(data, { key: "", session: s, entry: e })}</td>
                            <td className="tabular py-1.5 pr-3">{e.peakBend !== null ? `${e.peakBend}°` : "—"}</td>
                            <td className="tabular py-1.5">{e.variation !== null ? `±${e.variation.toFixed(1)}°` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function AssessmentTable() {
  const { data } = useApp();
  return (
    <Card as="section">
      <h2 className="font-serif text-2xl text-ink">Assessment data</h2>
      <p className="mt-1.5 text-[15px] text-taupe">All guided flexion assessments (degrees). Simulated.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[14px]">
          <thead className="text-[13px] text-taupe">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-4 font-medium">ID</th>
              <th scope="col" className="py-2 pr-4 font-medium">Date</th>
              <th scope="col" className="py-2 pr-4 font-medium">Recovering ({data.patient.recoveringKnee})</th>
              <th scope="col" className="py-2 pr-4 font-medium">Other ({data.patient.otherKnee})</th>
              <th scope="col" className="py-2 pr-4 font-medium">Δ sides</th>
              <th scope="col" className="py-2 font-medium">Δ vs previous</th>
            </tr>
          </thead>
          <tbody>
            {data.assessments.map((a, i) => {
              const prev = data.assessments[i - 1];
              return (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="py-2 pr-4 font-mono text-[12px] text-taupe">{a.id}</td>
                  <td className="py-2 pr-4">{formatShort(a.date)}</td>
                  <td className="tabular py-2 pr-4 font-medium">{a.recovering}°</td>
                  <td className="tabular py-2 pr-4">{a.other}°</td>
                  <td className="tabular py-2 pr-4">{sideDifference(a)}°</td>
                  <td className="tabular py-2">{prev && prev.recovering !== null && a.recovering !== null ? signed(a.recovering - prev.recovering) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-soft)]">
      <p className="text-[14px] text-taupe">{label}</p>
      <p className="tabular mt-1 font-serif text-4xl text-ink">{value}</p>
      {note ? <p className="mt-1 text-[13px] text-taupe">{note}</p> : null}
    </div>
  );
}

function Fact({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 lg:col-span-4" : ""}>
      <dt className="text-[13px] text-taupe">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
