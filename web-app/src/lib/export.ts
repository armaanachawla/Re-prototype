import type { RecoveryDataset } from "./types";
import { logRows } from "./recovery";

/** Builds a CSV of the simulated session log. Every row is marked as simulated. */
export function sessionsCsv(data: RecoveryDataset): string {
  const header = ["data_type", "date", "week", "session_status", "exercise", "planned_reps", "detected_reps", "self_reported", "planned_minutes", "minutes", "avg_peak_bend_deg", "rep_variation_deg"];
  const rows = logRows(data).map(({ session, entry }) => [
    "SIMULATED",
    session.date,
    session.week,
    session.status,
    data.exercises[entry.exerciseId].name,
    entry.plannedReps ?? "",
    entry.detectedReps ?? "",
    entry.selfReported ? "yes" : "",
    entry.plannedMinutes ?? "",
    entry.minutes ?? "",
    entry.peakBend ?? "",
    entry.variation ?? "",
  ]);
  const lines = [
    "# RE concept prototype - SIMULATED, ILLUSTRATIVE SAMPLE DATA. Not from a real patient or device. Not for clinical use.",
    header.join(","),
    ...rows.map((r) => r.map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : String(v))).join(",")),
  ];
  return lines.join("\n");
}

export function downloadText(filename: string, text: string, type = "text/csv") {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
