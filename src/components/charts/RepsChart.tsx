"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/lib/app-state";
import { formatLong, formatShort, formatWeekday } from "@/lib/dates";
import { ChartCard, LegendItem, swatch } from "./ChartCard";
import { TooltipCard } from "./ChartTooltip";
import { AXIS_TICK, C, axisLabel } from "./common";
import { Term, GLOSSARY } from "../ui/Term";

/** "How many repetitions did you complete?" Planned vs detected for one session. */
export function RepsChart({ audience = "patient", id }: { audience?: "patient" | "physio"; id?: string }) {
  const { data } = useApp();
  const recorded = data.sessions.filter((s) => s.status !== "missed");
  const [sessionId, setSessionId] = useState(recorded[recorded.length - 1].id);
  const session = recorded.find((s) => s.id === sessionId) ?? recorded[recorded.length - 1];
  const you = audience === "patient";

  const rows = session.entries
    .filter((e) => e.plannedReps !== null)
    .map((e) => ({
      name: data.exercises[e.exerciseId].name,
      planned: e.plannedReps ?? 0,
      detected: e.detectedReps ?? 0,
      detectable: data.exercises[e.exerciseId].detection === "reps",
      selfReported: e.selfReported,
      status: e.status,
    }));
  const detectable = rows.filter((r) => r.detectable);
  const planned = detectable.reduce((a, r) => a + r.planned, 0);
  const detected = detectable.reduce((a, r) => a + r.detected, 0);
  const undetectable = rows.filter((r) => !r.detectable);

  return (
    <ChartCard
      id={id}
      chartLabel="Bar chart of planned and detected repetitions per exercise in one session"
      title={you ? "How many repetitions did you complete?" : "Repetitions: planned vs detected"}
      subtitle={`Planned repetitions compared with repetitions the sensor detected, ${formatWeekday(session.date)} ${formatShort(session.date)}.`}
      latest={{ label: "Detected this session", value: `${detected} of ${planned}`, comparison: <span>across exercises the sensor can count</span> }}
      controls={
        <label className="flex items-center gap-2 text-[13px] text-taupe">
          Session
          <select value={session.id} onChange={(e) => setSessionId(e.target.value)} className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] text-ink">
            {[...recorded].reverse().map((s) => (
              <option key={s.id} value={s.id}>
                {formatWeekday(s.date)} {formatShort(s.date)}
                {s.status === "partial" ? " (partly completed)" : ""}
              </option>
            ))}
          </select>
        </label>
      }
      legend={
        <>
          <LegendItem swatch={swatch.box("#fffdf9", C.other, true)} label="Planned" />
          <LegendItem swatch={swatch.box(C.recovering)} label="Detected by sensor" />
        </>
      }
      explanation={
        <>
          The sensor detected {detected} of {planned} planned <Term definition={GLOSSARY.repetition}>repetitions</Term> in this session.{" "}
          {detected < planned ? "A lower count can mean part of an exercise was skipped, or that the sensor missed some repetitions. " : ""}
          {undetectable.length ? `${undetectable.map((r) => r.name).join(", ")} can't be counted by the sensor, so ${you ? "you logged" : "the patient logged"} ${undetectable.length > 1 ? "them" : "it"} instead.` : ""}
        </>
      }
      why={`Repetition counts help ${you ? "you and your physiotherapist" : "you"} see how much of the plan was done. A detected repetition doesn't mean the exercise was performed correctly.`}
    >
      <div className="h-[260px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 10, right: 8, left: 8, bottom: 18 }} barGap={4} barCategoryGap="25%">
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 11 }} tickLine={false} axisLine={{ stroke: C.grid }} interval={0} label={axisLabel("Exercise", "x")} height={44} />
            <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} label={axisLabel("Repetitions", "y")} />
            <Tooltip
              cursor={{ fill: "rgba(94,84,75,0.06)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const r = payload[0].payload as (typeof rows)[number];
                return (
                  <TooltipCard
                    title={`${r.name} · ${formatLong(session.date)}`}
                    rows={[
                      { label: "Planned", value: `${r.planned} reps` },
                      { label: "Detected", value: r.detectable ? `${r.detected} reps` : r.selfReported ? "Logged by you" : "Not done" },
                    ]}
                    context={r.detectable ? "Counted from knee movement. Counts are approximate." : "Too little knee movement for the sensor to count; logged manually."}
                  />
                );
              }}
            />
            <Bar dataKey="planned" fill="#fffdf9" stroke={C.other} strokeDasharray="3 3" radius={[4, 4, 0, 0]} maxBarSize={28} animationDuration={400} />
            <Bar dataKey="detected" fill={C.recovering} radius={[4, 4, 0, 0]} maxBarSize={28} animationDuration={500} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
