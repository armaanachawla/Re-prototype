"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/lib/app-state";
import { consistencyPoints, consistencyTrend, rangeWindow } from "@/lib/recovery";
import { formatLong, formatShort } from "@/lib/dates";
import type { ExerciseId } from "@/lib/types";
import { ChartCard, LegendItem, swatch } from "./ChartCard";
import { TooltipCard } from "./ChartTooltip";
import { AXIS_TICK, C, EmptyChart, RangeControl, axisLabel } from "./common";
import { Segmented } from "../ui/Segmented";
import { StatusPill } from "../ui/StatusPill";
import { Term, GLOSSARY } from "../ui/Term";

/** "Are you performing the movement consistently?" Illustrative research concept. */
export function ConsistencyChart({ audience = "patient", id }: { audience?: "patient" | "physio"; id?: string }) {
  const { data, state } = useApp();
  const options = data.plan.consistencyExercises;
  const [exercise, setExercise] = useState<ExerciseId>(options[0]);
  const w = rangeWindow(data, state.range);
  const pts = consistencyPoints(data, exercise, w.start, w.end);
  const trend = consistencyTrend(data, exercise);
  const you = audience === "patient";
  const name = data.exercises[exercise].name;
  const last = pts[pts.length - 1];

  const sentence = !trend
    ? `There aren't enough ${name.toLowerCase()} sessions yet to describe a pattern.`
    : trend.kind === "same"
      ? `${name}: movement was similarly consistent in recent sessions (about ±${trend.recentAvg.toFixed(1)}°, compared with ±${trend.beforeAvg.toFixed(1)}° before).`
      : trend.kind === "more"
        ? `${name}: movement was more consistent in recent sessions. Depth varied by about ±${trend.recentAvg.toFixed(1)}°, compared with ±${trend.beforeAvg.toFixed(1)}° before.`
        : `${name}: movement was less consistent in the last two sessions. Depth varied by about ±${trend.recentAvg.toFixed(1)}°, compared with ±${trend.beforeAvg.toFixed(1)}° in the six sessions before.`;

  return (
    <ChartCard
      id={id}
      chartLabel={`Line chart of rep-to-rep variation for ${name}`}
      title={you ? "Movement consistency" : "Rep-to-rep variation (illustrative)"}
      subtitle={
        you
          ? "How similar the depth of each repetition was within a session. Lower means repetitions reached a more similar depth."
          : "Mean spread of peak flexion between repetitions, per session. Illustrative research concept; not validated."
      }
      latest={last ? { label: "Latest session", value: `±${last.variation.toFixed(1)}°`, comparison: <span>{formatShort(last.date)}</span> } : undefined}
      controls={
        <div className="flex flex-wrap gap-2">
          <Segmented<ExerciseId> size="sm" label="Exercise" value={exercise} onChange={setExercise} options={options.map((o) => ({ value: o, label: data.exercises[o].name }))} />
          <RangeControl />
        </div>
      }
      legend={<LegendItem swatch={swatch.line(C.sandDeep)} label="Variation per session (± degrees)" />}
      explanation={
        <>
          {sentence}{" "}
          {trend ? <StatusPill kind={trend.kind === "less" ? "discuss" : "consistent"} label={trend.kind === "less" ? "Worth discussing at your next appointment" : trend.kind === "more" ? "More consistent recently" : "Staying consistent"} className="mt-2 align-middle" /> : null}
        </>
      }
      why={
        <>
          <Term definition={GLOSSARY.variation}>Variation</Term> can point to sessions worth a closer look, but it is an <strong className="font-medium text-ink">illustrative research concept</strong>, not a validated score. It can&apos;t tell whether an exercise was done correctly; {you ? "your physiotherapist" : "clinical observation"} remains the reference.
        </>
      }
    >
      <div className="h-[240px] sm:h-[280px]">
        {pts.length === 0 ? (
          <EmptyChart message={`No ${name.toLowerCase()} sessions with this measurement in the selected period.`} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pts} margin={{ top: 10, right: 16, left: 8, bottom: 18 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatShort} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: C.grid }} minTickGap={18} label={axisLabel("Session date", "x")} height={44} />
              <YAxis domain={[0, 8]} tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => `±${v}°`} width={64} label={axisLabel("Variation (± degrees)", "y")} />
              <Tooltip
                cursor={{ stroke: C.axis, strokeOpacity: 0.25 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof pts)[number];
                  return (
                    <TooltipCard
                      title={`${name} · ${formatLong(p.date)}`}
                      rows={[
                        { label: "Variation between reps", value: `±${p.variation.toFixed(1)}°` },
                        ...(p.peakBend !== null ? [{ label: "Average deepest bend", value: `${p.peakBend}°` }] : []),
                      ]}
                      context="Lower values mean the repetitions reached a more similar depth. Illustrative research concept."
                    />
                  );
                }}
              />
              <Line type="monotone" dataKey="variation" stroke={C.sandDeep} strokeWidth={2} dot={{ r: 3.5, fill: C.ivory, stroke: C.sandDeep, strokeWidth: 1.5 }} activeDot={{ r: 6, fill: C.sandDeep }} animationDuration={500} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
