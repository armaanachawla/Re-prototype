/**
 * Shared data model for RE.
 *
 * Patient and physiotherapist views both read from the same `RecoveryDataset`,
 * so their numbers always agree. In this prototype the dataset is simulated
 * (see `src/data/sample-patient.ts`). A future version could fill the same
 * shape from validated sensor hardware (see README).
 */

export type Side = "left" | "right";

export interface Patient {
  firstName: string;
  displayName: string;
  recoveringKnee: Side;
  otherKnee: Side;
  context: string;
  programmeStart: string;
  programmeWeeks: number;
  physiotherapist: string;
  nextAppointment: string;
}

/**
 * A guided bend assessment. The patient follows an in-app prompt to bend each
 * knee as far as is comfortable. `null` means the value was not captured.
 * Measuring the other knee assumes a second sensor (or another reliable
 * reference) is worn during assessments.
 */
export interface Assessment {
  id: string;
  date: string;
  /** Peak knee bend (flexion) of the recovering knee, in degrees. */
  recovering: number | null;
  /** Peak knee bend of the other knee, in degrees. */
  other: number | null;
}

export type ExerciseId = "heel-slides" | "quad-sets" | "straight-leg-raises" | "mini-squats" | "step-ups" | "stationary-bike";

/** How the proposed wearable might record an exercise. */
export type Detection = "reps" | "self-reported" | "duration";

export interface Exercise {
  id: ExerciseId;
  name: string;
  description: string;
  detection: Detection;
  /** Whether the illustrative movement-consistency concept is shown for this exercise. */
  consistency: boolean;
}

export type EntryStatus = "done" | "partial" | "not-done";
export type SessionStatus = "completed" | "partial" | "missed";

export interface ExerciseEntry {
  exerciseId: ExerciseId;
  status: EntryStatus;
  /** Planned repetitions (sets × reps). `null` for duration-based exercises. */
  plannedReps: number | null;
  /** Repetitions the sensor detected. `null` when not detected or not applicable. */
  detectedReps: number | null;
  /** Self-reported completion for exercises the sensor cannot recognise. */
  selfReported?: boolean;
  plannedMinutes: number | null;
  minutes: number | null;
  /** Average peak knee bend reached across repetitions, in degrees. */
  peakBend: number | null;
  /** Illustrative: average rep-to-rep spread of peak bend, in ± degrees. */
  variation: number | null;
}

export interface Session {
  id: string;
  date: string;
  week: number;
  status: SessionStatus;
  entries: ExerciseEntry[];
}

export interface DailyActivity {
  date: string;
  /** Estimated steps. Supporting context only. */
  steps: number | null;
}

export interface GoalDefinition {
  id: string;
  title: string;
  detail: string;
  setOn: string;
}

export interface RecoveryDataset {
  patient: Patient;
  dataEnd: string;
  assessments: Assessment[];
  exercises: Record<ExerciseId, Exercise>;
  sessions: Session[];
  activity: DailyActivity[];
  /** Thresholds and targets set by the physiotherapist for this patient. */
  plan: {
    sessionsPerWeek: number;
    bendGoalEarly: { target: number; setOn: string };
    bendGoal: { target: number; byWeek: number; setOn: string };
    sideDifferenceReview: { degrees: number; setOn: string };
    consistencyExercises: ExerciseId[];
  };
}

/** Time windows offered across the app. */
export type RangeKey = "week" | "month" | "all";
