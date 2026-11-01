"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/lib/app-state";
import { assessmentsBetween, rangeWindow, sideDifference } from "@/lib/recovery";
import { formatLong, formatShort } from "@/lib/dates";
import type { Assessment } from "@/lib/types";
import { ChartCard, LegendItem, swatch } from "./ChartCard";
import { TooltipCard } from "./ChartTooltip";
import { AXIS_TICK, C, EmptyChart, RangeControl, axisLabel } from "./common";
import { StatusPill } from "../ui/StatusPill";

/** "How does your recovering knee compare with the other knee?" */
export function SideChart({ audience = "patient", id }: { audience?: "patient" | "physio"; id?: string }) {
  const { data, state } = useApp();
  const w = rangeWindow(data, state.range);
  const points = assessmentsBetween(data, w.start, w.end).map((a) => ({ ...a, diff: sideDifference(a) }));
  const last = [...points].reverse().find((p) => p.diff !== null);
  const you = audience === "patient";
  const { recoveringKnee: rk, otherKnee: ok } = data.patient;
  const threshold = data.plan.sideDifferenceReview.degrees;
  const physio = data.patient.physiotherapist.split(" ")[0];
  const firstDiff = points.find((p) => p.diff !== null);

  return (
    <ChartCard
      id={id}
      chartLabel="Grouped bar chart comparing the measured bend of each knee at each assessment"
      title={you ? "How does your recovering knee compare with the other knee?" : "Left vs right flexion"}
      subtitle={you ? "Recorded bend of each knee at the same assessments." : "Peak flexion per side at each assessment; difference = other knee − recovering knee."}
      latest={last ? { label: "Latest difference", value: `${last.diff}°`, comparison: <span>{rk} {last.recovering}° · {ok} {last.other}°</span> } : undefined}
      controls={<RangeControl />}
      legend={
        <>
          <LegendItem swatch={swatch.box(C.recovering)} label={`Recovering (${rk}) knee`} />
          <LegendItem swatch={swatch.box("#d8d1c7", C.other)} label={`Other (${ok}) knee`} />
        </>
      }
      explanation={
        last ? (
          <>
            The recorded bend angle differs by {last.diff}° between sides at the latest assessment
            {firstDiff && firstDiff !== last ? `, compared with ${firstDiff.diff}° on ${formatShort(firstDiff.date)}` : ""}. {you ? `${physio} can assess whether this difference matters for your recovery.` : `Review threshold set in plan: ${threshold}°.`}{" "}
            {last.diff! > threshold ? <StatusPill kind="discuss" className="mt-2 align-middle" /> : null}
          </>
        ) : (
          "No assessments with both knees recorded in this period."
        )
      }
      why={
        <>
          Comparing both sides gives a personal reference point. A difference on its own is not a sign of injury and doesn&apos;t call for any particular exercise; {you ? physio : "the clinician"} decides whether it is relevant. Measuring both knees assumes a second sensor or another reliable reference is worn during assessments.
        </>
      }
    >
      <div className="h-[260px] sm:h-[300px]">
        {!last ? (
          <EmptyChart message="No paired measurements in this period." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 10, right: 8, left: 8, bottom: 18 }} barGap={2} barCategoryGap="22%">
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatShort} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: C.grid }} minTickGap={14} label={axisLabel("Assessment date", "x")} height={44} />
              <YAxis domain={[0, 150]} ticks={[0, 30, 60, 90, 120, 150]} tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}°`} width={64} label={axisLabel("Knee bend (degrees)", "y")} />
              <Tooltip
                cursor={{ fill: "rgba(94,84,75,0.06)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const a = payload[0].payload as Assessment & { diff: number | null };
                  return (
                    <TooltipCard
                      title={`Assessment · ${formatLong(a.date)}`}
                      rows={[
                        { label: `Recovering (${rk})`, value: a.recovering === null ? "—" : `${a.recovering}°`, swatch: swatch.box(C.recovering) },
                        { label: `Other (${ok})`, value: a.other === null ? "—" : `${a.other}°`, swatch: swatch.box("#d8d1c7", C.other) },
                        { label: "Difference", value: a.diff === null ? "—" : `${a.diff}°` },
                      ]}
                      context={`Review threshold set by ${physio}: ${threshold}°.`}
                    />
                  );
                }}
              />
              <Bar dataKey="recovering" fill={C.recovering} radius={[4, 4, 0, 0]} animationDuration={500} />
              <Bar dataKey="other" fill="#d8d1c7" stroke={C.other} strokeWidth={1} radius={[4, 4, 0, 0]} animationDuration={500} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
