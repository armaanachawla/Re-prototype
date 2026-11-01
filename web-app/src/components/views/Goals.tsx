"use client";

import { useState } from "react";
import { Bar, BarChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Info } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { buildGoals, type GoalView } from "@/lib/recovery";
import { formatFull } from "@/lib/dates";
import { Card, Callout, PageHeader, ProgressBar, SimTag } from "../ui/Card";
import { Segmented } from "../ui/Segmented";
import { StatusPill } from "../ui/StatusPill";
import { TooltipCard } from "../charts/ChartTooltip";
import { AXIS_TICK, C } from "../charts/common";

type Filter = "all" | GoalView["status"];

export function Goals() {
  const { data } = useApp();
  const goals = buildGoals(data);
  const [filter, setFilter] = useState<Filter>("all");
  const shown = goals.filter((g) => filter === "all" || g.status === filter);
  const count = (s: GoalView["status"]) => goals.filter((g) => g.status === s).length;

  return (
    <div>
      <PageHeader
        eyebrow="Personal tracking"
        title="My recovery goals"
        intro={`Goals ${data.patient.physiotherapist} has set for your recovery, tracked against your sample data.`}
        aside={<SimTag />}
      />

      <Callout tone="sage" icon={<Info className="h-4 w-4" />} className="mb-8 text-base">
        <strong className="font-medium">Your physiotherapist sets your goals. RE helps you track them; it does not determine whether you are medically ready to progress.</strong>
      </Callout>

      <div className="mb-6">
        <Segmented<Filter>
          label="Filter goals"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `All (${goals.length})` },
            { value: "in-progress", label: `In progress (${count("in-progress")})` },
            { value: "discuss", label: `Needs discussion (${count("discuss")})` },
            { value: "completed", label: `Completed (${count("completed")})` },
          ]}
        />
      </div>

      {shown.length === 0 ? (
        <Card className="text-center text-taupe">No goals in this group right now.</Card>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {shown.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </ul>
      )}
    </div>
  );
}

const GROUP: Record<GoalView["status"], string> = { completed: "Completed", "in-progress": "In progress", discuss: "Needs discussion" };

function GoalCard({ goal: g }: { goal: GoalView }) {
  const { data } = useApp();
  const tone = g.status === "completed" ? "sage" : g.status === "discuss" ? "terracotta" : "sand";
  return (
    <li className="re-fade flex flex-col rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-[13px] font-medium uppercase tracking-[0.1em] text-taupe">{GROUP[g.status]}</p>
        <p className="text-[13px] text-muted">
          Set by {data.patient.physiotherapist.split(" ")[0]} · {formatFull(g.setOn)}
        </p>
      </div>
      <h2 className="mt-2 font-serif text-2xl leading-snug text-ink">{g.title}</h2>
      <p className="mt-1 text-[15px] text-taupe">{g.description}</p>

      <div className="mt-4">
        <StatusPill kind={g.statusKind} label={g.statusText} />
      </div>

      {g.progress ? (
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-[14px]">
            <span className="text-taupe">Progress</span>
            <span className="tabular font-medium text-ink">
              {g.progress.current}
              {g.progress.unit} of {g.progress.target}
              {g.progress.unit}
            </span>
          </div>
          <ProgressBar pct={g.progress.pct} label={`${g.title}: ${g.progress.pct}% of the way`} tone={tone === "sand" ? "sage" : tone} />
          {g.progress.baseline > 0 && g.progress.unit === "°" ? (
            <p className="mt-1.5 text-[13px] text-taupe">
              Started at {g.progress.baseline}° when the goal was set · {g.progress.pct}% of the way
            </p>
          ) : null}
        </div>
      ) : null}

      {g.history && g.history.length > 1 ? <GoalHistory goal={g} /> : null}

      <p className="mt-4 text-[15px] leading-relaxed text-ink">{g.detail}</p>
    </li>
  );
}

function GoalHistory({ goal: g }: { goal: GoalView }) {
  const isSessions = g.id === "sessions";
  const unit = isSessions ? " sessions" : "°";
  const title = isSessions ? "Sessions completed each week" : g.id === "difference" ? "Difference between knees at each assessment" : "Knee bend at each assessment since this goal was set";
  return (
    <div className="mt-5 rounded-2xl bg-ivory p-3">
      <p className="mb-1 px-1 text-[13px] text-taupe">{title}</p>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          {isSessions ? (
            <BarChart data={g.history} margin={{ top: 6, right: 4, left: -12, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 11 }} tickLine={false} axisLine={false} interval={0} />
              <YAxis domain={[0, 5]} allowDecimals={false} tick={{ ...AXIS_TICK, fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip cursor={{ fill: "rgba(94,84,75,0.06)" }} content={({ active, payload }) => (active && payload?.length ? <TooltipCard title={String(payload[0].payload.label)} rows={[{ label: "Completed", value: `${payload[0].payload.value} of ${payload[0].payload.target}` }]} /> : null)} />
              <ReferenceLine y={g.history![0].target} stroke={C.goal} strokeDasharray="4 3" />
              <Bar dataKey="value" fill={C.recovering} radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={g.history} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis domain={g.id === "difference" ? [0, "dataMax + 5"] : ["dataMin - 5", "dataMax + 5"]} tick={{ ...AXIS_TICK, fontSize: 11 }} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => `${Math.round(v)}°`} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <TooltipCard title={String(payload[0].payload.label)} rows={[{ label: g.id === "difference" ? "Difference" : "Knee bend", value: `${payload[0].payload.value}${unit}` }]} context={payload[0].payload.target ? `${g.id === "difference" ? "Review threshold" : "Goal"}: ${payload[0].payload.target}°` : undefined} />
                  ) : null
                }
              />
              {g.history![0].target ? <ReferenceLine y={g.history![0].target} stroke={C.goal} strokeDasharray="4 3" /> : null}
              <Line dataKey="value" stroke={g.id === "difference" ? C.terracotta : C.recovering} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
