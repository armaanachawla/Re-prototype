/**
 * Deterministic sample dataset for the RE concept prototype.
 *
 * EVERYTHING HERE IS SIMULATED AND ILLUSTRATIVE. No value comes from a real
 * person or a physical device. Assessment values are written by hand so the
 * narrative is easy to follow; session details use a fixed-seed generator so
 * they are identical on every load, render and browser.
 */
import type { Assessment, DailyActivity, Exercise, ExerciseEntry, ExerciseId, RecoveryDataset, Session, SessionStatus } from "@/lib/types";
import { addDays, dateRange } from "@/lib/dates";

const PROGRAMME_START = "2026-08-31"; // Monday of week 1
const WEEKS = 8;
const DATA_END = addDays(PROGRAMME_START, WEEKS * 7 - 1); // Sunday 25 Oct 2026

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const EXERCISES: Record<ExerciseId, Exercise> = {
  "heel-slides": {
    id: "heel-slides",
    name: "Heel slides",
    description: "Lying down, slide the heel towards you to bend the knee, then straighten.",
    detection: "reps",
    consistency: true,
  },
  "quad-sets": {
    id: "quad-sets",
    name: "Quad sets",
    description: "Tighten the thigh muscle with the leg straight and hold.",
    detection: "self-reported",
    consistency: false,
  },
  "straight-leg-raises": {
    id: "straight-leg-raises",
    name: "Straight-leg raises",
    description: "Lying down, lift the straight leg a short distance and lower it.",
    detection: "reps",
    consistency: false,
  },
  "mini-squats": {
    id: "mini-squats",
    name: "Mini squats",
    description: "Holding a support, bend both knees a small amount and stand back up.",
    detection: "reps",
    consistency: true,
  },
  "step-ups": {
    id: "step-ups",
    name: "Step-ups",
    description: "Step up onto a low step with the recovering leg, then step down.",
    detection: "reps",
    consistency: false,
  },
  "stationary-bike": {
    id: "stationary-bike",
    name: "Stationary bike",
    description: "Gentle cycling at low resistance.",
    detection: "duration",
    consistency: false,
  },
};

/** Twice-weekly guided assessments (Monday and Thursday). Hand-written for a clear narrative. */
const RECOVERING = [92, 95, 97, 99, 101, 104, 105, 107, 108, 108, 109, 110, 112, 114, 117, 120];
const OTHER = [134, 135, 135, 134, 135, 136, 135, 135, 134, 135, 136, 135, 135, 136, 135, 135];

const assessments: Assessment[] = RECOVERING.map((rec, i) => {
  const week = Math.floor(i / 2);
  const date = addDays(PROGRAMME_START, week * 7 + (i % 2 === 0 ? 0 : 3));
  return { id: `A-${String(i + 1).padStart(2, "0")}`, date, recovering: rec, other: OTHER[i] };
});

function planForWeek(week: number): { id: ExerciseId; reps?: number; minutes?: number }[] {
  return week <= 3
    ? [
        { id: "heel-slides", reps: 30 },
        { id: "quad-sets", reps: 30 },
        { id: "straight-leg-raises", reps: 30 },
        { id: "stationary-bike", minutes: 10 },
      ]
    : [
        { id: "heel-slides", reps: 36 },
        { id: "straight-leg-raises", reps: 36 },
        { id: "mini-squats", reps: 30 },
        { id: "step-ups", reps: 24 },
        { id: "stationary-bike", minutes: 15 },
      ];
}

/** Planned weekdays that were missed, by week (0 = Monday). */
const MISSED: Record<number, number[]> = { 2: [3], 4: [1, 4], 5: [2], 8: [4] };
/** Sessions where one exercise was only partly completed: week → [weekday, exercise, fraction]. */
const PARTIAL: Record<number, [number, ExerciseId, number][]> = {
  3: [[4, "straight-leg-raises", 0.67]],
  6: [[2, "step-ups", 0]],
  8: [[1, "mini-squats", 0.6]],
};
/** Rep-to-rep variation for the last two mini-squat sessions (illustrative observation for review). */
const LATE_SQUAT_VARIATION = [5.6, 5.9];

function latestAssessmentBefore(date: string) {
  return [...assessments].reverse().find((a) => a.date <= date) ?? assessments[0];
}

function generateSessions(): Session[] {
  const rand = mulberry32(31082026);
  const sessions: Session[] = [];
  const squatSessions: ExerciseEntry[] = [];

  for (let week = 1; week <= WEEKS; week++) {
    for (let day = 0; day < 5; day++) {
      const date = addDays(PROGRAMME_START, (week - 1) * 7 + day);
      const id = `S-${date}`;
      if (MISSED[week]?.includes(day)) {
        sessions.push({
          id,
          date,
          week,
          status: "missed",
          entries: planForWeek(week).map((p) => ({
            exerciseId: p.id,
            status: "not-done",
            plannedReps: p.reps ?? null,
            detectedReps: null,
            plannedMinutes: p.minutes ?? null,
            minutes: null,
            peakBend: null,
            variation: null,
          })),
        });
        continue;
      }

      const partial = PARTIAL[week]?.find(([d]) => d === day);
      const bendBase = latestAssessmentBefore(date).recovering ?? 100;
      const progress = (week - 1) / (WEEKS - 1);

      const entries: ExerciseEntry[] = planForWeek(week).map((p) => {
        const ex = EXERCISES[p.id];
        const fraction = partial && partial[1] === p.id ? partial[2] : 1;
        const status = fraction === 1 ? "done" : fraction === 0 ? "not-done" : "partial";
        const entry: ExerciseEntry = {
          exerciseId: p.id,
          status,
          plannedReps: p.reps ?? null,
          detectedReps: null,
          plannedMinutes: p.minutes ?? null,
          minutes: null,
          peakBend: null,
          variation: null,
        };
        if (ex.detection === "duration") {
          entry.minutes = status === "not-done" ? null : Math.round((p.minutes ?? 0) * fraction);
          return entry;
        }
        if (ex.detection === "self-reported") {
          entry.selfReported = status !== "not-done";
          return entry;
        }
        if (status === "not-done") return entry;
        const done = Math.round((p.reps ?? 0) * fraction);
        // The sensor occasionally misses a repetition, which the UI explains.
        const missedByDetection = rand() < 0.3 ? 1 + Math.floor(rand() * 2) : 0;
        entry.detectedReps = Math.max(0, done - missedByDetection);
        if (p.id === "heel-slides") {
          entry.peakBend = Math.round(bendBase - 3 + (rand() - 0.5) * 2);
          entry.variation = round1(6.4 - 2.6 * progress + (rand() - 0.5) * 1.0);
        } else if (p.id === "mini-squats") {
          entry.peakBend = Math.round(58 + 12 * progress + (rand() - 0.5) * 3);
          entry.variation = round1(5.4 - 1.2 * progress + (rand() - 0.5) * 0.8);
          squatSessions.push(entry);
        } else if (p.id === "step-ups") {
          entry.peakBend = Math.round(70 + 10 * progress + (rand() - 0.5) * 3);
        }
        return entry;
      });

      const status: SessionStatus = entries.some((e) => e.status !== "done") ? "partial" : "completed";
      sessions.push({ id, date, week, status, entries });
    }
  }

  // Make the final two mini-squat sessions noticeably less consistent so the review list has an example.
  const done = squatSessions.filter((e) => e.variation !== null);
  done.slice(-2).forEach((e, i) => (e.variation = LATE_SQUAT_VARIATION[i]));

  return sessions;
}

function generateActivity(): DailyActivity[] {
  const rand = mulberry32(25102026);
  return dateRange(PROGRAMME_START, DATA_END).map((date, i) => {
    const weekday = i % 7;
    const trend = 2600 + (i / (WEEKS * 7 - 1)) * 3200;
    const weekend = weekday >= 5 ? -500 : 0;
    // One day of missing data to demonstrate gaps.
    if (date === "2026-09-27") return { date, steps: null };
    return { date, steps: Math.round((trend + weekend + (rand() - 0.5) * 1400) / 10) * 10 };
  });
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export const SAMPLE_DATASET: RecoveryDataset = {
  patient: {
    firstName: "Alex",
    displayName: "Alex Morgan",
    recoveringKnee: "right",
    otherKnee: "left",
    context: "Rehabilitation after knee surgery (illustrative scenario)",
    programmeStart: PROGRAMME_START,
    programmeWeeks: 12,
    physiotherapist: "Sam Rivera",
    nextAppointment: "2026-10-28",
  },
  dataEnd: DATA_END,
  assessments,
  exercises: EXERCISES,
  sessions: generateSessions(),
  activity: generateActivity(),
  plan: {
    sessionsPerWeek: 5,
    bendGoalEarly: { target: 110, setOn: PROGRAMME_START },
    bendGoal: { target: 125, byWeek: 12, setOn: "2026-10-05" },
    sideDifferenceReview: { degrees: 10, setOn: "2026-10-05" },
    consistencyExercises: ["heel-slides", "mini-squats"],
  },
};
