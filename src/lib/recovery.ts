/**
 * Pure functions that derive every status, summary, goal and observation in
 * the interface from one `RecoveryDataset`. A status is only produced when
 * the data supports it; nothing here diagnoses, predicts or prescribes.
 */
import type { Assessment, ExerciseEntry, ExerciseId, RangeKey, RecoveryDataset, Session, SessionStatus } from "./types";
import { addDays, dateRange, formatShort, formatWeekday, parseISO } from "./dates";

/* ------------------------------------------------------------------ ranges */

export interface Window {
  key: RangeKey;
  label: string;
  short: string;
  start: string;
  end: string;
  /** Equal-length window immediately before, for comparisons. Null when there is no earlier data. */
  previous: { start: string; end: string } | null;
}

export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "Last 4 weeks" },
  { value: "all", label: "All 8 weeks" },
];

export function rangeWindow(data: RecoveryDataset, key: RangeKey): Window {
  const end = data.dataEnd;
  const days = key === "week" ? 7 : key === "month" ? 28 : null;
  const start = days ? addDays(end, -(days - 1)) : data.patient.programmeStart;
  const prevStart = days ? addDays(start, -days) : null;
  const previous = days && prevStart && prevStart >= data.patient.programmeStart ? { start: prevStart, end: addDays(start, -1) } : null;
  const label = RANGE_OPTIONS.find((r) => r.value === key)!.label;
  const short = key === "week" ? "this week" : key === "month" ? "over the last 4 weeks" : "over the full 8 weeks";
  return { key, label, short, start, end, previous };
}

export const programmeWeek = (data: RecoveryDataset, date: string) =>
  Math.floor((parseISO(date).getTime() - parseISO(data.patient.programmeStart).getTime()) / (7 * 86_400_000)) + 1;

/* ------------------------------------------------------------- assessments */

export const assessmentsBetween = (data: RecoveryDataset, start: string, end: string) =>
  data.assessments.filter((a) => a.date >= start && a.date <= end);

const withRecovering = (list: Assessment[]) => list.filter((a): a is Assessment & { recovering: number } => a.recovering !== null);

export function latestBend(data: RecoveryDataset) {
  const list = withRecovering(data.assessments);
  const latest = list[list.length - 1] ?? null;
  const previous = list[list.length - 2] ?? null;
  return { latest, previous, change: latest && previous ? latest.recovering - previous.recovering : null };
}

export type StatusKind = "improving" | "consistent" | "lower" | "not-reached" | "reached" | "discuss" | "completed" | "in-progress" | "tracking";

/** Neutral description of the change between two assessments. ±2° is treated as unchanged. */
export function bendStatus(change: number | null): StatusKind | null {
  if (change === null) return null;
  if (change >= 3) return "improving";
  if (change <= -3) return "lower";
  return "consistent";
}

export function sideDifference(a: Assessment | null) {
  if (!a || a.recovering === null || a.other === null) return null;
  return a.other - a.recovering;
}

/* ---------------------------------------------------------------- sessions */

export interface WeekSummary {
  week: number;
  start: string;
  end: string;
  planned: number;
  completed: number;
  partial: number;
  missed: number;
  /** Sessions where at least some exercise was done. */
  done: number;
}

export function weekSummaries(data: RecoveryDataset): WeekSummary[] {
  const weeks = new Map<number, Session[]>();
  data.sessions.forEach((s) => weeks.set(s.week, [...(weeks.get(s.week) ?? []), s]));
  return [...weeks.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week, list]) => {
      const start = addDays(data.patient.programmeStart, (week - 1) * 7);
      const count = (st: SessionStatus) => list.filter((s) => s.status === st).length;
      return {
        week,
        start,
        end: addDays(start, 6),
        planned: list.length,
        completed: count("completed"),
        partial: count("partial"),
        missed: count("missed"),
        done: count("completed") + count("partial"),
      };
    });
}

export const sessionsBetween = (data: RecoveryDataset, start: string, end: string) =>
  data.sessions.filter((s) => s.date >= start && s.date <= end);

export function sessionTotals(sessions: Session[]) {
  const planned = sessions.length;
  const completed = sessions.filter((s) => s.status === "completed").length;
  const partial = sessions.filter((s) => s.status === "partial").length;
  return { planned, completed, partial, missed: planned - completed - partial, done: completed + partial };
}

/** Per-day rows for a single week (planned days only). */
export function dailySessionRows(data: RecoveryDataset, start: string, end: string) {
  return sessionsBetween(data, start, end).map((s) => ({
    key: s.date,
    label: `${formatWeekday(s.date)} ${formatShort(s.date).split(" ")[0]}`,
    completed: s.status === "completed" ? 1 : 0,
    partial: s.status === "partial" ? 1 : 0,
    missed: s.status === "missed" ? 1 : 0,
    planned: 1,
    date: s.date,
  }));
}

/* ------------------------------------------------------------- consistency */

export interface ConsistencyPoint {
  date: string;
  variation: number;
  peakBend: number | null;
}

export function consistencyPoints(data: RecoveryDataset, id: ExerciseId, start?: string, end?: string): ConsistencyPoint[] {
  return data.sessions
    .filter((s) => (!start || s.date >= start) && (!end || s.date <= end))
    .flatMap((s) => s.entries.filter((e) => e.exerciseId === id && e.variation !== null).map((e) => ({ date: s.date, variation: e.variation!, peakBend: e.peakBend })));
}

/** Compares the two most recent sessions with the six before them. A difference under 1° is treated as consistent. */
export function consistencyTrend(data: RecoveryDataset, id: ExerciseId) {
  const pts = consistencyPoints(data, id);
  if (pts.length < 4) return null;
  const recent = pts.slice(-2);
  const before = pts.slice(-8, -2);
  const avg = (l: ConsistencyPoint[]) => l.reduce((a, p) => a + p.variation, 0) / l.length;
  const recentAvg = avg(recent);
  const beforeAvg = avg(before);
  const diff = recentAvg - beforeAvg;
  const kind: "more" | "less" | "same" = diff >= 1 ? "less" : diff <= -1 ? "more" : "same";
  return { recent, before, recentAvg, beforeAvg, diff, kind };
}

/* ---------------------------------------------------------------- activity */

export const activityBetween = (data: RecoveryDataset, start: string, end: string) =>
  data.activity.filter((d) => d.date >= start && d.date <= end);

export function mean(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v !== null);
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

/* ------------------------------------------------------------------- goals */

export interface GoalView {
  id: string;
  title: string;
  description: string;
  setOn: string;
  status: "completed" | "in-progress" | "discuss";
  statusKind: StatusKind;
  statusText: string;
  progress?: { baseline: number; current: number; target: number; unit: string; pct: number };
  history?: { label: string; value: number | null; target?: number }[];
  achievedOn?: string;
  detail: string;
}

export function buildGoals(data: RecoveryDataset): GoalView[] {
  const { plan, patient } = data;
  const physio = patient.physiotherapist.split(" ")[0];
  const goals: GoalView[] = [];
  const valid = withRecovering(data.assessments);
  const { latest, change } = latestBend(data);
  const weeks = weekSummaries(data);
  const thisWeek = weeks[weeks.length - 1];

  // 1. Early bend goal (completed when an assessment first reaches the target)
  const reached = valid.find((a) => a.date >= plan.bendGoalEarly.setOn && a.recovering >= plan.bendGoalEarly.target);
  const earlyBaseline = valid.find((a) => a.date >= plan.bendGoalEarly.setOn)?.recovering ?? 0;
  goals.push({
    id: "bend-early",
    title: `Reach a knee bend of ${plan.bendGoalEarly.target}°`,
    description: `An earlier goal ${patient.physiotherapist} set at the start of your plan.`,
    setOn: plan.bendGoalEarly.setOn,
    status: reached ? "completed" : "in-progress",
    statusKind: reached ? "completed" : "not-reached",
    statusText: reached ? `Reached on ${formatShort(reached.date)}` : "Goal not yet reached",
    achievedOn: reached?.date,
    progress: latest
      ? {
          baseline: earlyBaseline,
          current: Math.min(latest.recovering, plan.bendGoalEarly.target),
          target: plan.bendGoalEarly.target,
          unit: "°",
          pct: reached ? 100 : pct(latest.recovering, earlyBaseline, plan.bendGoalEarly.target),
        }
      : undefined,
    detail: reached
      ? `Your recorded bend first reached ${reached.recovering}° at the assessment on ${formatShort(reached.date)}.`
      : `Your latest recorded bend is ${latest?.recovering ?? "—"}°.`,
  });

  // 2. Current bend goal
  const baseline = [...valid].reverse().find((a) => a.date <= plan.bendGoal.setOn)?.recovering ?? valid[0]?.recovering ?? 0;
  const current = latest?.recovering ?? null;
  const metGoal = current !== null && current >= plan.bendGoal.target;
  const kind = metGoal ? "reached" : bendStatus(change) ?? "in-progress";
  goals.push({
    id: "bend",
    title: `Work towards a knee bend of ${plan.bendGoal.target}° by week ${plan.bendGoal.byWeek}`,
    description: `Set by ${patient.physiotherapist} for your recovering (${patient.recoveringKnee}) knee.`,
    setOn: plan.bendGoal.setOn,
    status: metGoal ? "completed" : "in-progress",
    statusKind: kind,
    statusText: metGoal
      ? `Target reached in the sample data. ${patient.physiotherapist.split(" ")[0]} will review this with you`
      : kind === "improving"
        ? "Improving compared with last assessment"
        : kind === "consistent"
          ? "Staying consistent"
          : kind === "lower"
            ? "Lower than last assessment"
            : "In progress",
    progress: current !== null ? { baseline, current, target: plan.bendGoal.target, unit: "°", pct: pct(current, baseline, plan.bendGoal.target) } : undefined,
    history: valid.filter((a) => a.date >= plan.bendGoal.setOn).map((a) => ({ label: formatShort(a.date), value: a.recovering, target: plan.bendGoal.target })),
    detail:
      current !== null
        ? `You've moved from ${baseline}° when this goal was set to ${current}° at your latest assessment, ${plan.bendGoal.target - current}° short of the goal ${physio} set.`
        : "No assessment recorded yet.",
  });

  // 3. Weekly sessions
  if (thisWeek) {
    const met = thisWeek.done >= plan.sessionsPerWeek;
    const missedDates = sessionsBetween(data, thisWeek.start, thisWeek.end).filter((s) => s.status === "missed");
    goals.push({
      id: "sessions",
      title: `Complete ${plan.sessionsPerWeek} exercise sessions each week`,
      description: "The number of sessions in your current exercise plan.",
      setOn: patient.programmeStart,
      status: "in-progress",
      statusKind: met ? "reached" : "not-reached",
      statusText: met ? "Reached this week" : "Goal not yet reached this week",
      progress: { baseline: 0, current: thisWeek.done, target: plan.sessionsPerWeek, unit: " sessions", pct: Math.round((thisWeek.done / plan.sessionsPerWeek) * 100) },
      history: weeks.map((w) => ({ label: `Wk ${w.week}`, value: w.done, target: plan.sessionsPerWeek })),
      detail: met
        ? `You completed all ${plan.sessionsPerWeek} planned sessions this week.`
        : `You completed ${thisWeek.done} of ${plan.sessionsPerWeek} planned sessions this week. ${missedDates.length ? `The session on ${missedDates.map((s) => `${formatWeekday(s.date)} ${formatShort(s.date)}`).join(" and ")} was not completed.` : ""}`,
    });
  }

  // 4. Consistency tracking
  const trends = plan.consistencyExercises.map((id) => ({ id, trend: consistencyTrend(data, id) }));
  const less = trends.filter((t) => t.trend?.kind === "less");
  goals.push({
    id: "consistency",
    title: "Track movement consistency in selected exercises",
    description: `${plan.consistencyExercises.map((id) => data.exercises[id].name).join(" and ")}. An illustrative research concept, not a measure of technique.`,
    setOn: plan.bendGoal.setOn,
    status: less.length ? "discuss" : "in-progress",
    statusKind: less.length ? "discuss" : "tracking",
    statusText: less.length ? "Worth discussing at your next appointment" : "Tracking, staying consistent",
    detail: trends
      .map(({ id, trend }) =>
        !trend
          ? `${data.exercises[id].name}: not enough sessions yet.`
          : `${data.exercises[id].name}: ${trend.kind === "same" ? "staying consistent" : trend.kind === "more" ? "more consistent in recent sessions" : "less consistent in the last two sessions"} (±${trend.recentAvg.toFixed(1)}° recently vs ±${trend.beforeAvg.toFixed(1)}° before).`,
      )
      .join(" "),
  });

  // 5. Side difference review
  const diff = sideDifference(latest);
  if (diff !== null) {
    const over = diff > plan.sideDifferenceReview.degrees;
    goals.push({
      id: "difference",
      title: `Review the difference between your knees with ${physio}`,
      description: `${physio} asked to review this if the recorded difference is more than ${plan.sideDifferenceReview.degrees}°.`,
      setOn: plan.sideDifferenceReview.setOn,
      status: over ? "discuss" : "in-progress",
      statusKind: over ? "discuss" : "tracking",
      statusText: over ? `Worth discussing at your appointment on ${formatShort(patient.nextAppointment)}` : `Within the ${plan.sideDifferenceReview.degrees}° review threshold`,
      history: data.assessments.map((a) => ({ label: formatShort(a.date), value: sideDifference(a), target: plan.sideDifferenceReview.degrees })),
      detail: `At your latest assessment your ${patient.recoveringKnee} knee bent to ${latest?.recovering}° and your ${patient.otherKnee} knee to ${latest?.other}°, a difference of ${diff}°.`,
    });
  }

  return goals;
}

const pct = (current: number, baseline: number, target: number) =>
  target === baseline ? 100 : Math.max(0, Math.min(100, Math.round(((current - baseline) / (target - baseline)) * 100)));

/* ------------------------------------------------------------ observations */

export interface Observation {
  id: string;
  title: string;
  kind: StatusKind;
  whatChanged: string;
  evidence: { label: string; value: string }[];
  whyDiscuss: string;
  cannotConclude: string;
}

/** Things to discuss with the physiotherapist. Each is generated only when its condition holds. */
export function buildObservations(data: RecoveryDataset): Observation[] {
  const out: Observation[] = [];
  const valid = withRecovering(data.assessments);
  const last3 = valid.slice(-3);
  const { patient, plan } = data;
  const physio = patient.physiotherapist.split(" ")[0];

  if (last3.length === 3 && last3[0].recovering < last3[1].recovering && last3[1].recovering < last3[2].recovering) {
    out.push({
      id: "bend-up",
      title: "Your recorded knee bend has increased over the last three assessments",
      kind: "improving",
      whatChanged: `Your recorded bend went from ${last3[0].recovering}° to ${last3[2].recovering}° across your last three assessments.`,
      evidence: last3.map((a) => ({ label: `Assessment, ${formatWeekday(a.date)} ${formatShort(a.date)}`, value: `${a.recovering}°` })),
      whyDiscuss: `${physio} can compare this with your goal of ${plan.bendGoal.target}° and with what they see when they examine your knee.`,
      cannotConclude: `Whether your knee is ready for new exercises or activities. That's a decision for ${physio}.`,
    });
  }
  if (last3.length === 3 && last3.every((a) => Math.abs(a.recovering - last3[0].recovering) <= 2)) {
    out.push({
      id: "bend-flat",
      title: "Your recorded knee bend has stayed about the same recently",
      kind: "consistent",
      whatChanged: `Your last three assessments were within 2° of each other.`,
      evidence: last3.map((a) => ({ label: formatShort(a.date), value: `${a.recovering}°` })),
      whyDiscuss: `${physio} can help you understand what this means at your stage of recovery.`,
      cannotConclude: "Why your bend has stayed the same, or whether it matters.",
    });
  }

  const weeks = weekSummaries(data);
  const thisWeek = weeks[weeks.length - 1];
  if (thisWeek && thisWeek.done < thisWeek.planned) {
    const missed = sessionsBetween(data, thisWeek.start, thisWeek.end).filter((s) => s.status === "missed");
    out.push({
      id: "sessions-low",
      title: "You completed fewer exercise sessions than planned this week",
      kind: "not-reached",
      whatChanged: `You completed ${thisWeek.done} of ${thisWeek.planned} planned sessions this week.`,
      evidence: [
        { label: "Sessions planned", value: String(thisWeek.planned) },
        { label: "Sessions completed (fully or partly)", value: String(thisWeek.done) },
        ...missed.map((s) => ({ label: "Not completed", value: `${formatWeekday(s.date)} ${formatShort(s.date)}` })),
      ],
      whyDiscuss: `Talking about what got in the way, such as time, pain or motivation, can help ${physio} adjust your plan if needed.`,
      cannotConclude: "Why the session was missed, or whether it has affected your recovery.",
    });
  }

  const latest = valid[valid.length - 1];
  const diff = sideDifference(latest ?? null);
  if (diff !== null && diff > plan.sideDifferenceReview.degrees) {
    out.push({
      id: "difference",
      title: "There is a difference between the recorded bend of your two knees",
      kind: "discuss",
      whatChanged: `At your latest assessment, your ${patient.recoveringKnee} knee bent to ${latest.recovering}° and your ${patient.otherKnee} knee to ${latest.other}°, a ${diff}° difference.`,
      evidence: [
        { label: `Recovering (${patient.recoveringKnee}) knee`, value: `${latest.recovering}°` },
        { label: `Other (${patient.otherKnee}) knee`, value: `${latest.other}°` },
        { label: `Review threshold set by ${physio}`, value: `${plan.sideDifferenceReview.degrees}°` },
      ],
      whyDiscuss: `${physio} asked to review differences larger than ${plan.sideDifferenceReview.degrees}°, and can judge whether this one matters for your recovery.`,
      cannotConclude: "What is causing the difference, or whether it is a problem. A difference on its own is not a sign of injury.",
    });
  }

  for (const id of plan.consistencyExercises) {
    const t = consistencyTrend(data, id);
    if (t?.kind === "less") {
      const name = data.exercises[id].name;
      out.push({
        id: `consistency-${id}`,
        title: `Your ${name.toLowerCase()} were less consistent in the last two sessions`,
        kind: "discuss",
        whatChanged: `How deep each repetition went varied more than before: about ±${t.recentAvg.toFixed(1)}° recently, compared with ±${t.beforeAvg.toFixed(1)}° in the sessions before.`,
        evidence: [
          ...t.recent.map((p) => ({ label: `${name}, ${formatShort(p.date)}`, value: `±${p.variation.toFixed(1)}°` })),
          { label: "Average of the 6 sessions before", value: `±${t.beforeAvg.toFixed(1)}°` },
        ],
        whyDiscuss: `${physio} can watch you do the exercise and check whether anything about it has changed.`,
        cannotConclude: "Whether your technique has changed. The sensor records depth, not how you performed the movement.",
      });
    }
  }
  return out;
}

/* ----------------------------------------------- physiotherapist review list */

export interface ReviewItem {
  id: string;
  title: string;
  technical: string;
  friendly: string;
}

export function buildReviewItems(data: RecoveryDataset): ReviewItem[] {
  const items: ReviewItem[] = [];
  const valid = withRecovering(data.assessments);
  const { plan, patient } = data;
  const physio = patient.physiotherapist.split(" ")[0];

  // Plateaus: consecutive assessments within ±1°
  const plateaus: { from: string; text: string }[] = [];
  for (let i = 1; i < valid.length; i++) {
    if (Math.abs(valid[i].recovering - valid[i - 1].recovering) <= 1)
      plateaus.push({ from: valid[i - 1].date, text: `${formatShort(valid[i - 1].date)}–${formatShort(valid[i].date)} (${valid[i - 1].recovering}°→${valid[i].recovering}°)` });
  }
  const first = valid[0];
  const last = valid[valid.length - 1];
  if (first && last) {
    items.push({
      id: "rom",
      title: "Flexion trend",
      technical: `Recovering-knee flexion (degrees of bend) ${first.recovering}°→${last.recovering}° over ${valid.length} assessments (+${last.recovering - first.recovering}°). ${plateaus.length ? `Change ≤1° between consecutive assessments: ${plateaus.map((p) => p.text).join("; ")}.` : "No flat periods between consecutive assessments."} Current goal ${plan.bendGoal.target}° by wk ${plan.bendGoal.byWeek}.`,
      friendly: `${patient.firstName}'s recorded knee bend has gone from ${first.recovering}° to ${last.recovering}° since the start of the plan${plateaus.length ? `, with a period of little change from ${formatShort(plateaus[0].from)}` : ""}.`,
    });
  }

  const weeks = weekSummaries(data);
  const under = weeks.filter((w) => w.done < w.planned);
  const totals = sessionTotals(data.sessions);
  items.push({
    id: "adherence",
    title: "Exercise adherence",
    technical: `${totals.done}/${totals.planned} planned sessions with recorded activity (${Math.round((totals.done / totals.planned) * 100)}%), of which ${totals.partial} were partial. Below prescription in wks ${under.map((w) => w.week).join(", ") || "none"}. Current wk: ${weeks[weeks.length - 1].done}/${weeks[weeks.length - 1].planned}.`,
    friendly: `${patient.firstName} completed ${totals.done} of ${totals.planned} planned sessions. ${under.length} of ${weeks.length} weeks had fewer sessions than planned, including this week.`,
  });

  const diff = sideDifference(last ?? null);
  if (diff !== null) {
    items.push({
      id: "asymmetry",
      title: "Side-to-side difference",
      technical: `Latest flexion ${patient.recoveringKnee === "right" ? "R" : "L"} ${last.recovering}° / ${patient.otherKnee === "right" ? "R" : "L"} ${last.other}°: Δ ${diff}° (recovering knee at ${Math.round((last.recovering / (last.other ?? 1)) * 100)}% of the other side). ${diff > plan.sideDifferenceReview.degrees ? `Above the ${plan.sideDifferenceReview.degrees}° review threshold set in the plan.` : "Within the review threshold."}`,
      friendly: `The recorded bend differs by ${diff}° between ${patient.firstName}'s knees, more than the ${plan.sideDifferenceReview.degrees}° ${physio} asked to review.`,
    });
  }

  for (const id of plan.consistencyExercises) {
    const t = consistencyTrend(data, id);
    if (!t) continue;
    items.push({
      id: `cons-${id}`,
      title: `Rep-to-rep variation: ${data.exercises[id].name.toLowerCase()}`,
      technical: `Mean SD (standard deviation) of peak flexion per rep: last 2 sessions ±${t.recentAvg.toFixed(1)}° vs preceding 6 ±${t.beforeAvg.toFixed(1)}° (Δ ${t.diff >= 0 ? "+" : ""}${t.diff.toFixed(1)}°). Illustrative research measure; not validated against observed technique.`,
      friendly:
        t.kind === "less"
          ? `${data.exercises[id].name} reached a less even depth in the last two sessions. Worth watching in clinic.`
          : `${data.exercises[id].name} depth has been ${t.kind === "more" ? "more even recently" : "similar from session to session"}.`,
    });
  }

  const undetected = data.sessions.flatMap((s) => s.entries).filter((e) => e.selfReported).length;
  if (undetected) {
    items.push({
      id: "detection",
      title: "Data completeness",
      technical: `${undetected} quad-set entries were self-reported because the sensor cannot recognise isometric exercises. Detected rep counts are sometimes lower than performed reps, so treat them as approximate.`,
      friendly: `Some exercises were logged by ${patient.firstName} rather than detected by the sensor, and rep counts are approximate.`,
    });
  }
  return items;
}

/* --------------------------------------------------------------- log rows */

export interface LogRow {
  key: string;
  session: Session;
  entry: ExerciseEntry;
}

export function logRows(data: RecoveryDataset): LogRow[] {
  return data.sessions.flatMap((s) => s.entries.map((entry) => ({ key: `${s.id}-${entry.exerciseId}`, session: s, entry })));
}

export function describeEntry(data: RecoveryDataset, e: ExerciseEntry): string {
  const ex = data.exercises[e.exerciseId];
  if (e.status === "not-done") return `${ex.name} was planned but not recorded for this session.`;
  if (ex.detection === "duration") return `${e.minutes} of ${e.plannedMinutes} planned minutes recorded.`;
  if (ex.detection === "self-reported") return "Logged as done by you. This exercise involves very little knee bending, so the sensor can't count repetitions.";
  const parts: string[] = [];
  if (e.detectedReps !== null && e.plannedReps !== null) {
    parts.push(
      e.status === "partial"
        ? `Part of the exercise was done: ${e.detectedReps} of ${e.plannedReps} planned repetitions detected.`
        : e.detectedReps < e.plannedReps
          ? `${e.detectedReps} of ${e.plannedReps} planned repetitions detected. The sensor can occasionally miss a repetition.`
          : `All ${e.plannedReps} planned repetitions detected.`,
    );
  }
  if (e.peakBend !== null) parts.push(`Your knee bent to about ${e.peakBend}° on average at the deepest point of each repetition.`);
  if (e.variation !== null) parts.push(`Depth varied by about ±${e.variation.toFixed(1)}° from one repetition to the next.`);
  return parts.join(" ");
}

export function allDates(data: RecoveryDataset) {
  return dateRange(data.patient.programmeStart, data.dataEnd);
}
