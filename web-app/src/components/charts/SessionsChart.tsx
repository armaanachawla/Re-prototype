"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/lib/app-state";
import { dailySessionRows, rangeWindow, sessionTotals, sessionsBetween, weekSummaries } from "@/lib/recovery";
import { formatLong, formatShort, formatSpan, formatWeekday } from "@/lib/dates";
import { ChartCard, LegendItem, swatch } from "./ChartCard";
import { TooltipCard } from "./ChartTooltip";
import { AXIS_TICK, C, RangeControl, axisLabel } from "./common";
import { StatusPill } from "../ui/StatusPill";
import { Term, GLOSSARY } from "../ui/Term";

interface Row {
  key: string;
  label: string;
  completed: number;
  partial: number;
  missed: number;
  planned: number;
  date?: string;
  start?: string;
  end?: string;
}

/** "How consistently are you completing your exercises?" Completed vs planned sessions. */
export function SessionsChart({ audience = "patient", id }: { audience?: "patient" | "physio"; id?: string }) {
  const { data, state } = useApp();
  const w = rangeWindow(data, state.range);
  const you = audience === "patient";
  const daily = state.range === "week";

  const rows: Row[] = daily
    ? dailySessionRows(data, w.start, w.end)
    : weekSummaries(data)
        .filter((wk) => wk.start >= w.start && wk.end <= w.end)
        .map((wk) => ({ key: String(wk.week), label: `Week ${wk.week}`, completed: wk.completed, partial: wk.partial, missed: wk.missed, planned: wk.planned, start: wk.start, end: wk.end }));

  const totals = sessionTotals(sessionsBetween(data, w.start, w.end));
  const prev = w.previous ? sessionTotals(sessionsBetween(data, w.previous.start, w.previous.end)) : null;
  const notDone = sessionsBetween(data, w.start, w.end).filter((s) => s.status === "missed");

  const explanation = `${you ? "You" : `${data.patient.firstName}`} completed ${totals.done} of the ${totals.planned} sessions planned ${w.short}${
    totals.partial ? ` (${totals.partial} of them partly)` : ""
  }. ${
    totals.missed === 0
      ? "Every planned session has some recorded exercise."
      : daily
        ? `${totals.missed === 1 ? "One session" : `${totals.missed} sessions`} remained incomplete: ${notDone.map((s) => `${formatWeekday(s.date)} ${formatShort(s.date)}`).join(", ")}.`
        : `${totals.missed} planned ${totals.missed === 1 ? "session was" : "sessions were"} not completed.`
  }`;

  return (
    <ChartCard
      id={id}
      chartLabel="Stacked bar chart of exercise sessions completed, partly completed and not completed"
      title={you ? "How consistently are you completing your exercises?" : "Exercise adherence"}
      subtitle={you ? "Sessions completed out of sessions planned." : "Planned sessions by outcome. Partial means at least one exercise in the session was incomplete."}
      latest={{
        label: daily ? "This week" : w.label,
        value: `${totals.done} of ${totals.planned}`,
        comparison: prev ? <span>Previous period: {prev.done} of {prev.planned}</span> : <span>No earlier period to compare</span>,
      }}
      controls={<RangeControl />}
      legend={
        <>
          <LegendItem swatch={swatch.box(C.recovering)} label="Completed" />
          <LegendItem swatch={swatch.hatch()} label="Partly completed" />
          <LegendItem swatch={swatch.box("#fffdf9", C.other, true)} label="Not completed" />
        </>
      }
      explanation={
        <>
          {explanation}{" "}
          <StatusPill kind={totals.done >= totals.planned ? "reached" : "not-reached"} label={totals.done >= totals.planned ? "All planned sessions done" : "Goal not yet reached"} className="mt-2 align-middle" />
        </>
      }
      why={
        <>
          Doing the exercises in your plan is a big part of rehabilitation. <Term definition={GLOSSARY.adherence}>Adherence</Term> shows {you ? `${data.patient.physiotherapist.split(" ")[0]}` : "you"} where the plan may need talking through, such as time, pain or motivation. It doesn&apos;t show how well each exercise was done.
        </>
      }
    >
      <div className="h-[260px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 10, right: 8, left: 8, bottom: 18 }} barCategoryGap={daily ? "30%" : "24%"}>
            <defs>
              <pattern id="bar-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill={C.sand} />
                <line x1="0" y1="0" x2="0" y2="6" stroke={C.sandDeep} strokeWidth="1.5" />
              </pattern>
            </defs>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: C.grid }} interval={0} angle={0} minTickGap={4} label={axisLabel(daily ? "Planned day" : "Week of your plan", "x")} height={44} />
            <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} domain={[0, daily ? 1 : data.plan.sessionsPerWeek]} label={axisLabel("Sessions", "y")} />
            <Tooltip
              cursor={{ fill: "rgba(94,84,75,0.06)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const r = payload[0].payload as Row;
                return (
                  <TooltipCard
                    title={r.date ? formatLong(r.date) : `${r.label} · ${formatSpan(r.start!, r.end!)}`}
                    rows={
                      r.date
                        ? [{ label: "Session", value: r.completed ? "Completed" : r.partial ? "Partly completed" : "Not completed" }]
                        : [
                            { label: "Completed", value: r.completed, swatch: swatch.box(C.recovering) },
                            { label: "Partly completed", value: r.partial, swatch: swatch.hatch() },
                            { label: "Not completed", value: r.missed, swatch: swatch.box("#fffdf9", C.other, true) },
                          ]
                    }
                    context={r.date ? "1 session planned on this day." : `${r.completed + r.partial} of ${r.planned} planned sessions had recorded exercise.`}
                  />
                );
              }}
            />
            <Bar dataKey="completed" stackId="s" fill={C.recovering} name="Completed" animationDuration={500} />
            <Bar dataKey="partial" stackId="s" fill="url(#bar-hatch)" name="Partly completed" animationDuration={500} />
            <Bar dataKey="missed" stackId="s" fill="#fffdf9" stroke={C.other} strokeDasharray="3 3" name="Not completed" radius={[4, 4, 0, 0]} animationDuration={500} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
