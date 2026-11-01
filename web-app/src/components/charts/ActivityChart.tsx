"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/lib/app-state";
import { activityBetween, mean, rangeWindow } from "@/lib/recovery";
import { formatLong, formatShort, formatWeekday } from "@/lib/dates";
import { ChartCard, LegendItem, swatch } from "./ChartCard";
import { TooltipCard } from "./ChartTooltip";
import { AXIS_TICK, C, RangeControl, axisLabel } from "./common";

/** Daily activity: supporting context only, never the main recovery measure. */
export function ActivityChart({ audience = "patient", id }: { audience?: "patient" | "physio"; id?: string }) {
  const { data, state } = useApp();
  const w = rangeWindow(data, state.range);
  const days = activityBetween(data, w.start, w.end);
  const avg = mean(days.map((d) => d.steps));
  const prevAvg = w.previous ? mean(activityBetween(data, w.previous.start, w.previous.end).map((d) => d.steps)) : null;
  const missing = days.filter((d) => d.steps === null).length;
  const last = days[days.length - 1];
  const you = audience === "patient";
  const fmt = (n: number | null) => (n === null ? "—" : Math.round(n).toLocaleString("en-GB"));

  return (
    <ChartCard
      id={id}
      chartLabel="Bar chart of estimated daily steps"
      title={you ? "How much did you move each day?" : "Daily activity (context)"}
      subtitle="Estimated steps per day. Supporting context only; your exercise plan comes first."
      latest={{
        label: "Daily average",
        value: fmt(avg),
        comparison: prevAvg !== null ? <span>Previous period: {fmt(prevAvg)} a day</span> : <span>No earlier period to compare</span>,
      }}
      controls={<RangeControl />}
      legend={
        <>
          <LegendItem swatch={swatch.box(C.sage)} label="Estimated steps" />
          <LegendItem swatch={swatch.line(C.axis, true)} label="Average for the period" />
        </>
      }
      explanation={`${you ? "You" : data.patient.firstName} averaged about ${fmt(avg)} estimated steps a day ${w.short}${
        prevAvg !== null ? `, compared with ${fmt(prevAvg)} in the period before` : ""
      }. The most recent day (${formatShort(last.date)}) recorded ${fmt(last.steps)}.${missing ? ` ${missing} day${missing > 1 ? "s have" : " has"} no data.` : ""}`}
      why={`General activity gives context, such as a busy or quiet week, but more steps is not automatically better during recovery. ${you ? "Follow the activity levels your physiotherapist has agreed with you." : "Interpret alongside the prescribed activity plan."}`}
    >
      <div className="h-[220px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={days} margin={{ top: 10, right: 8, left: 8, bottom: 18 }} barCategoryGap={state.range === "week" ? "35%" : "18%"}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="date" tickFormatter={(d: string) => (state.range === "week" ? formatWeekday(d) : formatShort(d))} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: C.grid }} minTickGap={16} label={axisLabel("Date", "x")} height={44} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={68} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))} label={axisLabel("Estimated steps", "y")} />
            <Tooltip
              cursor={{ fill: "rgba(94,84,75,0.06)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof days)[number];
                return (
                  <TooltipCard
                    title={formatLong(d.date)}
                    rows={[{ label: "Estimated steps", value: d.steps === null ? "No data" : fmt(d.steps) }]}
                    context={avg !== null ? `Period average: ${fmt(avg)} a day. Estimated from movement, not a validated step count.` : undefined}
                  />
                );
              }}
            />
            {avg !== null ? <ReferenceLine y={avg} stroke={C.axis} strokeDasharray="4 4" /> : null}
            <Bar dataKey="steps" fill={C.sage} radius={[4, 4, 0, 0]} animationDuration={500} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
