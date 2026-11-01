"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/lib/app-state";
import { assessmentsBetween, bendStatus, latestBend, rangeWindow } from "@/lib/recovery";
import { formatLong, formatShort } from "@/lib/dates";
import type { Assessment } from "@/lib/types";
import { ChartCard, LegendItem, swatch } from "./ChartCard";
import { TooltipCard } from "./ChartTooltip";
import { AXIS_TICK, C, EmptyChart, RangeControl, axisLabel, signed } from "./common";
import { StatusPill } from "../ui/StatusPill";
import { Term, GLOSSARY } from "../ui/Term";

/** "How far can you bend your knee?" Assessments over time with the physio's goal. */
export function BendChart({ audience = "patient", showOther = false, id }: { audience?: "patient" | "physio"; showOther?: boolean; id?: string }) {
  const { data, state } = useApp();
  const w = rangeWindow(data, state.range);
  const points = assessmentsBetween(data, w.start, w.end);
  const before = data.assessments.filter((a) => a.date < w.start && a.recovering !== null);
  const baseline = before[before.length - 1] ?? null;
  const valid = points.filter((a) => a.recovering !== null) as (Assessment & { recovering: number })[];
  const first = valid[0];
  const last = valid[valid.length - 1];
  const { change } = latestBend(data);
  const goal = data.plan.bendGoal.target;
  const you = audience === "patient";
  const physio = data.patient.physiotherapist.split(" ")[0];

  const explanation = !last
    ? "There are no assessments in this period."
    : valid.length === 1
      ? `One assessment in this period, at ${last.recovering}°.`
      : `${you ? "Your" : "The"} recorded bend ${last.recovering > first.recovering ? "increased" : last.recovering < first.recovering ? "decreased" : "stayed at"} ${
          last.recovering !== first.recovering ? `from ${first.recovering}° to ${last.recovering}°` : `${last.recovering}°`
        } between ${formatShort(first.date)} and ${formatShort(last.date)}${baseline ? ` (it was ${baseline.recovering}° at the end of the previous period)` : ""}. ${
          you ? `${physio} can interpret whether this change meets your recovery goals.` : `Goal set in plan: ${goal}° by week ${data.plan.bendGoal.byWeek}.`
        }`;

  const yMin = Math.floor(Math.min(...valid.map((v) => v.recovering), goal) / 10) * 10 - 10;
  const yMax = showOther ? 145 : Math.max(goal + 5, ...valid.map((v) => v.recovering + 5));

  return (
    <ChartCard
      id={id}
      chartLabel="Line chart of measured knee bend at each assessment"
      title={you ? "How far can you bend your knee?" : "Knee flexion over time"}
      subtitle={you ? "Measured knee bend across your recent assessments." : "Peak flexion at each guided assessment, recovering knee vs the other knee."}
      latest={
        last
          ? {
              label: "Latest assessment",
              value: `${last.recovering}°`,
              comparison: change !== null ? <span>{signed(change)} vs previous assessment</span> : undefined,
            }
          : undefined
      }
      controls={<RangeControl />}
      legend={
        <>
          <LegendItem swatch={swatch.line(C.recovering)} label={`Recovering (${data.patient.recoveringKnee}) knee`} />
          {showOther ? <LegendItem swatch={swatch.line(C.other, true)} label={`Other (${data.patient.otherKnee}) knee`} /> : null}
          <LegendItem swatch={swatch.line(C.goal, true)} label={`Goal set by ${physio}: ${goal}°`} />
        </>
      }
      explanation={
        <>
          {explanation}{" "}
          {last && change !== null && bendStatus(change) ? <StatusPill kind={bendStatus(change)!} className="mt-2 align-middle" /> : null}
        </>
      }
      why={
        <>
          The angle your knee can <Term definition={GLOSSARY.flexion}>bend</Term> to is one of the things {you ? `${physio} uses` : "clinicians use"} to follow recovery. It is read alongside a physical examination; goals depend on the injury, surgery and recovery stage.
        </>
      }
    >
      <div className="h-[280px] sm:h-[320px]">
        {valid.length === 0 ? (
          <EmptyChart message="No assessments were recorded in this period. Try a longer time period." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 10, right: 16, left: 8, bottom: 18 }}>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatShort} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: C.grid }} minTickGap={18} label={axisLabel("Assessment date", "x")} height={44} />
              <YAxis domain={[yMin, yMax]} tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}°`} width={64} label={axisLabel("Knee bend (degrees)", "y")} />
              <Tooltip
                cursor={{ stroke: C.axis, strokeOpacity: 0.25 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const a = payload[0].payload as Assessment;
                  const idx = data.assessments.findIndex((x) => x.id === a.id);
                  const prev = idx > 0 ? data.assessments[idx - 1] : null;
                  return (
                    <TooltipCard
                      title={`Assessment · ${formatLong(a.date)}`}
                      rows={[
                        { label: `Recovering (${data.patient.recoveringKnee})`, value: a.recovering === null ? "Not recorded" : `${a.recovering}°`, swatch: swatch.line(C.recovering) },
                        ...(showOther ? [{ label: `Other (${data.patient.otherKnee})`, value: a.other === null ? "Not recorded" : `${a.other}°`, swatch: swatch.line(C.other, true) }] : []),
                      ]}
                      context={
                        prev && a.recovering !== null && prev.recovering !== null
                          ? `${signed(a.recovering - prev.recovering)} compared with the assessment on ${formatShort(prev.date)}. Goal set by ${physio}: ${goal}°.`
                          : `First assessment in the plan. Goal set by ${physio}: ${goal}°.`
                      }
                    />
                  );
                }}
              />
              <ReferenceLine y={goal} stroke={C.goal} strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `Goal ${goal}°`, position: "insideTopRight", fill: C.goal, fontSize: 12 }} />
              {showOther ? <Line type="monotone" dataKey="other" stroke={C.other} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: C.ivory, stroke: C.other, strokeWidth: 1.5 }} isAnimationActive={false} /> : null}
              <Line type="monotone" dataKey="recovering" stroke={C.recovering} strokeWidth={2.5} dot={{ r: 4.5, fill: C.ivory, stroke: C.recovering, strokeWidth: 2 }} activeDot={{ r: 7, fill: C.recovering, stroke: C.ivory, strokeWidth: 2 }} animationDuration={500} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
