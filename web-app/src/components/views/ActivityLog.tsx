"use client";

import { useEffect, useMemo, useRef } from "react";
import { CheckCircle2, CircleDashed, CircleSlash, SearchX, X } from "lucide-react";
import { DEFAULT_LOG_FILTERS, useApp, type LogFilters } from "@/lib/app-state";
import { describeEntry, logRows, type LogRow } from "@/lib/recovery";
import { addDays, formatFull, formatLong, formatShort, formatWeekday } from "@/lib/dates";
import type { ExerciseId, SessionStatus } from "@/lib/types";
import { Callout, PageHeader, SimTag } from "../ui/Card";
import { Info } from "lucide-react";

const STATUS_META: Record<SessionStatus, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  completed: { label: "Completed", icon: CheckCircle2, cls: "bg-sage-soft text-sage-deep" },
  partial: { label: "Partly completed", icon: CircleDashed, cls: "bg-sand-soft text-sand-deep" },
  missed: { label: "Not completed", icon: CircleSlash, cls: "bg-cream text-taupe border border-dashed border-line-strong" },
};

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-medium ${m.cls}`}>
      <m.icon className="h-3.5 w-3.5" aria-hidden />
      {m.label}
    </span>
  );
}

export function repsText(data: ReturnType<typeof useApp>["data"], r: LogRow) {
  const ex = data.exercises[r.entry.exerciseId];
  if (r.entry.status === "not-done") return "—";
  if (ex.detection === "duration") return `${r.entry.minutes} of ${r.entry.plannedMinutes} min`;
  if (ex.detection === "self-reported") return "Logged by you";
  return `${r.entry.detectedReps} of ${r.entry.plannedReps}`;
}

function shortObservation(r: LogRow) {
  const e = r.entry;
  if (e.status === "not-done") return "No movement recorded";
  const parts: string[] = [];
  if (e.peakBend !== null) parts.push(`Bend ~${e.peakBend}°`);
  if (e.variation !== null) parts.push(`±${e.variation.toFixed(1)}° between reps`);
  if (e.selfReported) parts.push("Not detectable by sensor");
  if (e.minutes !== null) parts.push("Duration recorded");
  return parts.join(" · ") || "—";
}

export function ActivityLog() {
  const { data, state, dispatch } = useApp();
  const f = state.logFilters;
  const all = useMemo(() => logRows(data), [data]);
  const invalid = f.from > f.to;
  const rows = useMemo(
    () =>
      invalid
        ? []
        : all
            .filter((r) => r.session.date >= f.from && r.session.date <= f.to && (f.exercise === "all" || r.entry.exerciseId === f.exercise) && (f.status === "all" || r.session.status === f.status))
            .reverse(),
    [all, f, invalid],
  );
  const selected = all.find((r) => r.key === state.selectedLogKey) ?? null;
  const set = (filters: Partial<LogFilters>) => dispatch({ type: "logFilters", filters });
  const presets = [
    { label: "Last 7 days", from: addDays(data.dataEnd, -6) },
    { label: "Last 4 weeks", from: addDays(data.dataEnd, -27) },
    { label: "All 8 weeks", from: data.patient.programmeStart },
  ];
  const isDefault = JSON.stringify(f) === JSON.stringify(DEFAULT_LOG_FILTERS);

  return (
    <div>
      <PageHeader eyebrow="Rehabilitation sessions" title="Activity log" intro="Every planned exercise in your sample plan. Select an entry to see its measurements explained in plain English." aside={<SimTag />} />

      <Callout tone="sand" icon={<Info className="h-4 w-4" />} className="mb-6 text-sm">
        These sample exercises are illustrative and are not an exercise prescription. Always follow the plan your own physiotherapist gives you.
      </Callout>

      {/* Filters */}
      <div className="no-print mb-6 grid gap-4 rounded-[var(--radius-card)] border border-line bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5 md:grid-cols-2 xl:grid-cols-[auto_minmax(310px,1.3fr)_1fr_1fr_auto] xl:items-end">
        <div>
          <p className="mb-2 text-[13px] font-medium text-taupe">Date range</p>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const active = f.from === p.from && f.to === data.dataEnd;
              return (
                <button key={p.label} type="button" aria-pressed={active} onClick={() => set({ from: p.from, to: data.dataEnd })} className={`rounded-full px-3 py-1.5 text-[13px] transition-colors ${active ? "bg-ink text-ivory" : "bg-cream text-ink hover:bg-sand-soft"}`}>
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="From">
            <input type="date" value={f.from} min={data.patient.programmeStart} max={data.dataEnd} onChange={(e) => e.target.value && set({ from: e.target.value })} aria-invalid={invalid} className={input(invalid)} />
          </Field>
          <Field label="To">
            <input type="date" value={f.to} min={data.patient.programmeStart} max={data.dataEnd} onChange={(e) => e.target.value && set({ to: e.target.value })} aria-invalid={invalid} className={input(invalid)} />
          </Field>
        </div>
        <Field label="Exercise type">
          <select value={f.exercise} onChange={(e) => set({ exercise: e.target.value as ExerciseId | "all" })} className={input(false)}>
            <option value="all">All exercises</option>
            {Object.values(data.exercises).map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Session status">
          <select value={f.status} onChange={(e) => set({ status: e.target.value as SessionStatus | "all" })} className={input(false)}>
            <option value="all">Any status</option>
            <option value="completed">Completed</option>
            <option value="partial">Partly completed</option>
            <option value="missed">Not completed</option>
          </select>
        </Field>
        <button type="button" disabled={isDefault} onClick={() => dispatch({ type: "resetLogFilters" })} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-sm text-ink hover:border-line-strong disabled:opacity-40">
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      </div>

      {invalid ? (
        <p role="alert" className="mb-4 rounded-2xl border border-terracotta bg-terracotta-soft px-4 py-3 text-[15px] text-ink">
          The start date is after the end date. Change one of the dates to see entries.
        </p>
      ) : null}

      <p className="mb-3 text-[15px] text-taupe" aria-live="polite">
        <span className="font-medium text-ink">{rows.length}</span> {rows.length === 1 ? "entry" : "entries"}
      </p>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line-strong bg-card px-6 py-16 text-center">
              <SearchX className="h-8 w-8 text-muted" aria-hidden />
              <p className="mt-3 text-lg text-ink">No entries match these filters</p>
              <p className="mt-1 max-w-sm text-[15px] text-taupe">Try a wider date range, a different exercise, or any status.</p>
              <button type="button" onClick={() => dispatch({ type: "resetLogFilters" })} className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm text-ivory">
                Reset filters
              </button>
            </div>
          ) : (
            <>
              {/* Table (tablet and up) */}
              <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-soft)] md:block">
                <table className="w-full text-left text-[14px]">
                  <caption className="sr-only">Sample rehabilitation exercise log. Select a row to see details.</caption>
                  <thead className="bg-cream text-[13px] text-taupe">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Date</th>
                      <th scope="col" className="px-4 py-3 font-medium">Exercise</th>
                      <th scope="col" className="px-4 py-3 font-medium">Repetitions</th>
                      <th scope="col" className="px-4 py-3 font-medium">Session</th>
                      <th scope="col" className="px-4 py-3 font-medium">Recorded observations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 80).map((r) => {
                      const active = r.key === state.selectedLogKey;
                      return (
                        <tr
                          key={r.key}
                          tabIndex={0}
                          aria-selected={active}
                          onClick={() => dispatch({ type: "selectLog", key: r.key })}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), dispatch({ type: "selectLog", key: r.key }))}
                          className={`cursor-pointer border-t border-line transition-colors focus:outline-none focus-visible:bg-sage-soft ${active ? "bg-sage-soft" : "hover:bg-ivory"}`}
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-ink">
                            {formatWeekday(r.session.date)} {formatShort(r.session.date)}
                          </td>
                          <td className="px-4 py-3 font-medium text-ink">{data.exercises[r.entry.exerciseId].name}</td>
                          <td className="tabular whitespace-nowrap px-4 py-3 text-ink">{repsText(data, r)}</td>
                          <td className="px-4 py-3">
                            <SessionStatusBadge status={r.session.status} />
                          </td>
                          <td className="px-4 py-3 text-taupe">{shortObservation(r)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {rows.length > 80 ? <p className="border-t border-line px-4 py-3 text-[13px] text-taupe">Showing the 80 most recent of {rows.length} entries. Narrow the filters to see others.</p> : null}
              </div>

              {/* Cards (mobile) */}
              <ul className="space-y-2 md:hidden">
                {rows.slice(0, 40).map((r) => (
                  <li key={r.key}>
                    <button type="button" onClick={() => dispatch({ type: "selectLog", key: r.key })} className="w-full rounded-2xl border border-line bg-card p-4 text-left shadow-[var(--shadow-soft)]">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-ink">{data.exercises[r.entry.exerciseId].name}</p>
                        <SessionStatusBadge status={r.session.status} />
                      </div>
                      <p className="mt-1 text-[14px] text-taupe">
                        {formatWeekday(r.session.date)} {formatShort(r.session.date)} · {repsText(data, r)}
                      </p>
                      <p className="mt-1 text-[13px] text-taupe">{shortObservation(r)}</p>
                    </button>
                  </li>
                ))}
                {rows.length > 40 ? <li className="px-1 text-[13px] text-taupe">Showing 40 of {rows.length}. Narrow the filters to see others.</li> : null}
              </ul>
            </>
          )}
        </div>

        <DetailPanel row={selected} onClose={() => dispatch({ type: "selectLog", key: null })} />
      </div>
    </div>
  );
}

function DetailPanel({ row, onClose }: { row: LogRow | null; onClose: () => void }) {
  const { data } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (row && window.matchMedia("(max-width: 1279px)").matches) ref.current?.focus();
  }, [row]);
  useEffect(() => {
    if (!row) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [row, onClose]);

  if (!row) {
    return (
      <aside className="hidden self-start rounded-[var(--radius-card)] border border-dashed border-line-strong bg-card p-6 text-center text-[15px] text-taupe xl:sticky xl:top-24 xl:block">
        Select an entry to see its measurements and what they mean.
      </aside>
    );
  }
  const ex = data.exercises[row.entry.exerciseId];
  const e = row.entry;
  const facts: { label: string; value: string }[] = [
    { label: "Date", value: formatLong(row.session.date) },
    { label: "Week of plan", value: `Week ${row.session.week}` },
    { label: "Session status", value: STATUS_META[row.session.status].label },
    { label: "How it was recorded", value: ex.detection === "reps" ? "Repetitions detected by sensor" : ex.detection === "duration" ? "Duration recorded" : "Logged by you (sensor can't detect)" },
  ];
  if (e.plannedReps !== null) facts.push({ label: "Planned repetitions", value: String(e.plannedReps) });
  if (e.detectedReps !== null) facts.push({ label: "Detected repetitions", value: String(e.detectedReps) });
  if (e.plannedMinutes !== null) facts.push({ label: "Planned time", value: `${e.plannedMinutes} min` });
  if (e.minutes !== null) facts.push({ label: "Recorded time", value: `${e.minutes} min` });
  if (e.peakBend !== null) facts.push({ label: "Average deepest bend", value: `${e.peakBend}°` });
  if (e.variation !== null) facts.push({ label: "Variation between reps (illustrative)", value: `±${e.variation.toFixed(1)}°` });

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/30 xl:hidden" onClick={onClose} aria-hidden />
      <aside
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-label={`${ex.name}, ${formatFull(row.session.date)}`}
        className="re-fade fixed inset-x-0 bottom-0 z-50 max-h-[85svh] overflow-y-auto rounded-t-[1.75rem] border border-line bg-card p-6 shadow-2xl focus:outline-none xl:sticky xl:top-24 xl:z-auto xl:max-h-none xl:self-start xl:rounded-[var(--radius-card)] xl:shadow-[var(--shadow-soft)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] text-taupe">Session detail</p>
            <h2 className="font-serif text-2xl text-ink">{ex.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close details" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-cream">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-[14px] text-taupe">{ex.description}</p>
        <div className="mt-4 rounded-2xl bg-sage-soft p-4 text-[15px] leading-relaxed text-ink">
          <p className="mb-1 text-[13px] font-medium text-sage-deep">In plain English</p>
          {describeEntry(data, e)}
        </div>
        <dl className="mt-4 divide-y divide-line text-[14px]">
          {facts.map((fct) => (
            <div key={fct.label} className="flex justify-between gap-4 py-2">
              <dt className="text-taupe">{fct.label}</dt>
              <dd className="tabular text-right font-medium text-ink">{fct.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[13px] leading-relaxed text-taupe">
          Simulated entry (ID {row.session.id}). A detected repetition doesn&apos;t confirm the exercise was done correctly, and variation is an illustrative research concept.
        </p>
      </aside>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-[13px] font-medium text-taupe">{label}</span>
      {children}
    </label>
  );
}

const input = (invalid: boolean) => `w-full min-w-0 rounded-full border bg-ivory px-3 py-2 text-[14px] text-ink outline-none focus:border-sage-deep ${invalid ? "border-terracotta" : "border-line"}`;
