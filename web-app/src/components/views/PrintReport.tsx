"use client";

import { useApp } from "@/lib/app-state";
import { buildGoals, buildObservations, buildReviewItems, programmeWeek, sideDifference, weekSummaries } from "@/lib/recovery";
import { formatFull, formatShort, formatSpan } from "@/lib/dates";
import { CONCEPT_NOTICE } from "../layout/Notice";

/** Printable sample report. Hidden on screen; shown only when printing. */
export function PrintReport() {
  return (
    <div className="print-only text-[11pt] leading-snug text-black">
      <ReportBody />
    </div>
  );
}

/** The report content, shared by the print layout and the on-screen viewer. */
export function ReportBody() {
  const { data } = useApp();
  const { patient } = data;
  const weeks = weekSummaries(data);
  const goals = buildGoals(data);
  const review = buildReviewItems(data);
  const obs = buildObservations(data);
  const cell = "border border-[#ccc] px-2 py-1 text-left";

  return (
    <div>
      <div className="mb-4 border-2 border-black p-3 text-center font-bold uppercase tracking-wide">Simulated data: illustrative concept prototype. Not a real patient, device or clinical record.</div>
      <h1 className="font-serif text-[22pt]">RE: sample recovery report</h1>
      <p className="mb-4">
        Generated from sample data for {patient.displayName} (fictional) · Data to {formatFull(data.dataEnd)} · Week {programmeWeek(data, data.dataEnd)} of {patient.programmeWeeks}
      </p>
      <table className="mb-4 w-full border-collapse text-[10pt]">
        <tbody>
          <tr><th className={cell}>Context</th><td className={cell}>{patient.context}</td></tr>
          <tr><th className={cell}>Recovering knee</th><td className={cell}>{patient.recoveringKnee}</td></tr>
          <tr><th className={cell}>Physiotherapist (fictional)</th><td className={cell}>{patient.physiotherapist}</td></tr>
          <tr><th className={cell}>Next appointment</th><td className={cell}>{formatFull(patient.nextAppointment)}</td></tr>
        </tbody>
      </table>

      <h2 className="mt-4 text-[14pt] font-bold">Trends that may warrant review</h2>
      <ul className="ml-5 list-disc">
        {review.map((r) => (
          <li key={r.id}>
            <strong>{r.title}:</strong> {r.technical}
            <br />
            <em>Plain English:</em> {r.friendly}
          </li>
        ))}
      </ul>

      <h2 className="mt-4 text-[14pt] font-bold">Knee flexion assessments (degrees)</h2>
      <table className="w-full border-collapse text-[10pt]">
        <thead>
          <tr><th className={cell}>Date</th><th className={cell}>Recovering ({patient.recoveringKnee})</th><th className={cell}>Other ({patient.otherKnee})</th><th className={cell}>Difference</th></tr>
        </thead>
        <tbody>
          {data.assessments.map((a) => (
            <tr key={a.id}><td className={cell}>{formatShort(a.date)}</td><td className={cell}>{a.recovering ?? "—"}°</td><td className={cell}>{a.other ?? "—"}°</td><td className={cell}>{sideDifference(a) ?? "—"}°</td></tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-4 text-[14pt] font-bold">Exercise sessions by week</h2>
      <table className="w-full border-collapse text-[10pt]">
        <thead>
          <tr><th className={cell}>Week</th><th className={cell}>Dates</th><th className={cell}>Planned</th><th className={cell}>Completed</th><th className={cell}>Partly</th><th className={cell}>Not completed</th></tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.week}><td className={cell}>{w.week}</td><td className={cell}>{formatSpan(w.start, w.end)}</td><td className={cell}>{w.planned}</td><td className={cell}>{w.completed}</td><td className={cell}>{w.partial}</td><td className={cell}>{w.missed}</td></tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-4 text-[14pt] font-bold">Goals (set by the physiotherapist)</h2>
      <ul className="ml-5 list-disc">
        {goals.map((g) => (
          <li key={g.id}>
            <strong>{g.title}</strong>: {g.statusText}. {g.detail}
          </li>
        ))}
      </ul>

      <h2 className="mt-4 text-[14pt] font-bold">Patient discussion points</h2>
      <ul className="ml-5 list-disc">
        {obs.map((o) => (
          <li key={o.id}>
            {o.title}. <em>Cannot conclude:</em> {o.cannotConclude}
          </li>
        ))}
      </ul>

      <h2 className="mt-4 text-[14pt] font-bold">Limitations</h2>
      <p>{CONCEPT_NOTICE}</p>
      <p className="mt-1">
        Movement-consistency values are an illustrative research concept and are not validated. Detected repetition counts are approximate and do not confirm correct technique. Observations are prompts for clinical review, not diagnoses or recommendations.
      </p>
    </div>
  );
}
