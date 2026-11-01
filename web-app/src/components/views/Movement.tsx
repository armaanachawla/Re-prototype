"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Cpu, Eye, HelpCircle, Stethoscope, Ban } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { bendStatus, consistencyTrend, latestBend, sideDifference } from "@/lib/recovery";
import { formatShort } from "@/lib/dates";
import { BendChart } from "../charts/BendChart";
import { BendVisual } from "../charts/BendVisual";
import { RepsChart } from "../charts/RepsChart";
import { SessionsChart } from "../charts/SessionsChart";
import { ConsistencyChart } from "../charts/ConsistencyChart";
import { SideChart } from "../charts/SideChart";
import { ActivityChart } from "../charts/ActivityChart";
import { Card, Callout, PageHeader, SimTag } from "../ui/Card";
import { StatusPill } from "../ui/StatusPill";
import { Term, GLOSSARY } from "../ui/Term";

const METRICS = [
  { id: "metric-bend", n: "01", name: "Knee bending angle" },
  { id: "metric-reps", n: "02", name: "Exercise repetitions" },
  { id: "metric-quality", n: "03", name: "Movement quality" },
  { id: "metric-sides", n: "04", name: "Left–right comparison" },
];

export function Movement() {
  const { data } = useApp();
  const { latest, previous, change } = latestBend(data);
  const diff = sideDifference(latest);
  const physio = data.patient.physiotherapist.split(" ")[0];
  const trends = data.plan.consistencyExercises.map((id) => ({ id, t: consistencyTrend(data, id) }));
  const { recoveringKnee: rk, otherKnee: ok } = data.patient;

  return (
    <div>
      <PageHeader
        eyebrow="What does the wearable measure?"
        title="Movement, made meaningful."
        intro="Four measurements the proposed RE sleeve is designed around. For each, see what it is, how it might be measured, what you'd see, why your physiotherapist may care, and what it can't tell you."
        aside={<SimTag />}
      />

      <nav aria-label="Metrics" className="no-print -mx-4 mb-10 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {METRICS.map((m) => (
            <li key={m.id}>
              <a href={`#${m.id}`} onClick={(e) => (e.preventDefault(), document.getElementById(m.id)?.scrollIntoView({ behavior: "smooth" }))} className="flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-card px-4 py-2 text-[14px] text-ink hover:border-line-strong">
                <span className="font-serif text-taupe">{m.n}</span>
                {m.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Callout tone="sand" icon={<HelpCircle className="h-4 w-4" />} className="mb-12">
        <strong className="font-medium">Measured, estimated, or unvalidated?</strong> None of these measurements come from real hardware. Each describes what a suitably positioned, validated sensor system <em>might</em> record. Sensor placement, accuracy and comfort would all need to be tested before any real-world use.
      </Callout>

      <div className="space-y-20">
        {/* 1. Bend angle */}
        <MetricSection
          id="metric-bend"
          n="01"
          name="Knee bending angle"
          question="How far can I bend my knee?"
          facets={{
            what: (
              <>
                <Term definition={GLOSSARY.flexion}>Knee flexion</Term>: the angle that describes how much the knee bends, in degrees. 0° is a straight leg.
              </>
            ),
            how: (
              <>
                Two slim motion sensors (<Term definition={GLOSSARY.imu}>IMUs</Term>), one above and one below the knee, could estimate the angle between thigh and shin during a short guided assessment. This would need validation against clinical measurement.
              </>
            ),
            sees: "Your latest measurement, the change since your previous assessment, a simple diagram of the bend, and a sentence explaining the trend.",
            physio: "To see how measured range of motion changes over time, compare it with your prescribed goals, and decide whether the trend merits further assessment alongside a physical examination.",
            cannot: "There's no universal 'right' number. Goals depend on your injury or surgery, recovery stage and your clinician's assessment. The angle alone doesn't show pain, swelling, strength or readiness to progress.",
          }}
        >
          <Card className="grid items-center gap-6 md:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="text-[14px] text-taupe">Latest illustrative measurement · {latest ? formatShort(latest.date) : "—"}</p>
              <p className="tabular font-serif text-6xl text-ink">{latest?.recovering ?? "—"}°</p>
              {change !== null && previous ? (
                <p className="mt-2 text-[15px] text-ink">
                  {change >= 0 ? "Up" : "Down"} {Math.abs(change)}° from {previous.recovering}° at your previous assessment ({formatShort(previous.date)}).
                </p>
              ) : null}
              <div className="mt-3">{bendStatus(change) ? <StatusPill kind={bendStatus(change)!} /> : null}</div>
              <p className="mt-4 text-[15px] leading-relaxed text-taupe">
                {change === null
                  ? "Only one assessment so far, so there's no trend yet."
                  : change >= 3
                    ? "Your recorded bend has increased in the sample data."
                    : change <= -3
                      ? "Your recorded bend is lower than at your previous assessment in the sample data."
                      : "Your recorded bend is about the same as at your previous assessment."}{" "}
                {physio} can interpret whether the change meets your recovery goals.
              </p>
            </div>
            {latest ? (
              <div>
                <BendVisual angle={latest.recovering!} previous={previous?.recovering} className="mx-auto w-full max-w-sm" />
                <p className="mt-1 text-center text-[13px] text-taupe">Dark line: latest ({latest.recovering}°). Light line: previous ({previous?.recovering}°).</p>
              </div>
            ) : null}
          </Card>
          <BendChart />
        </MetricSection>

        {/* 2. Reps */}
        <MetricSection
          id="metric-reps"
          n="02"
          name="Exercise repetitions"
          question="How many repetitions did I complete?"
          facets={{
            what: <>The number of <Term definition={GLOSSARY.repetition}>repetitions</Term> completed in each prescribed exercise, compared with your plan.</>,
            how: "During exercises with a clear bend-and-straighten movement, the sensors could recognise each repetition. Exercises with little knee movement, such as quad sets, can't be counted and would be logged by you.",
            sees: "Repetitions completed in a session, planned versus completed, and how many of your planned sessions you completed each week.",
            physio: "To review participation in prescribed exercises, spot sessions where adherence may have fallen, and talk through barriers or technique with you.",
            cannot: "A detected repetition doesn't mean the exercise was performed correctly. Counts can occasionally miss a repetition.",
          }}
        >
          <RepsChart />
          <SessionsChart />
        </MetricSection>

        {/* 3. Quality */}
        <MetricSection
          id="metric-quality"
          n="03"
          name="Movement quality"
          question="Am I performing the movement consistently?"
          facets={{
            what: "How similar each repetition is to the others, here limited to how deep each repetition went in selected exercises.",
            how: "Selected movement patterns could potentially be assessed using appropriate sensors and validated algorithms. This prototype shows one simple, explainable example: the spread of peak bend between repetitions.",
            sees: "A plain description, a small number of observations, and an explanation of how each was worked out.",
            physio: "To identify patterns worth a closer look and review consistency across sessions, as a supplement to, not a replacement for, clinical observation.",
            cannot: "Whether the movement was performed well or safely. This is an illustrative research concept, not a validated movement-quality score.",
          }}
        >
          <Card>
            <h4 className="font-medium text-ink">Observations from your sample data</h4>
            <ul className="mt-3 space-y-2.5">
              {trends.map(({ id, t }) => (
                <li key={id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[15px] text-ink">
                  <span>
                    {!t
                      ? `${data.exercises[id].name}: not enough sessions yet.`
                      : t.kind === "less"
                        ? `${data.exercises[id].name}: movement was less consistent in your last two sessions.`
                        : t.kind === "more"
                          ? `${data.exercises[id].name}: movement was more consistent in recent sessions.`
                          : `${data.exercises[id].name}: movement was similarly consistent across recent sessions.`}
                  </span>
                  {t ? <StatusPill kind={t.kind === "less" ? "discuss" : "consistent"} label={t.kind === "less" ? "Worth discussing" : "Staying consistent"} /> : null}
                </li>
              ))}
            </ul>
            <Derivation />
          </Card>
          <ConsistencyChart />
        </MetricSection>

        {/* 4. Sides */}
        <MetricSection
          id="metric-sides"
          n="04"
          name="Left–right movement comparison"
          question="Am I moving both sides similarly?"
          facets={{
            what: "The difference in recorded bend between your recovering knee and your other knee, measured at the same assessment.",
            how: "A validated setup could compare movements across both knees. That would probably mean a sensor on each leg during assessments, or another reliable reference.",
            sees: "Both knees side by side, the difference in degrees, and a neutral explanation.",
            physio: "To review differences in measured movement, decide whether a difference is relevant to your specific recovery plan, and judge whether further assessment is appropriate.",
            cannot: "A difference isn't automatically a sign of injury, and RE doesn't suggest corrective exercises. Some difference may be expected; only your clinician can judge.",
          }}
        >
          {latest && diff !== null ? (
            <Card className="grid gap-6 sm:grid-cols-2">
              {[
                { label: `Recovering (${rk}) knee`, v: latest.recovering! },
                { label: `Other (${ok}) knee`, v: latest.other! },
              ].map((k) => (
                <div key={k.label} className="text-center">
                  <p className="text-[14px] text-taupe">{k.label}</p>
                  <BendVisual angle={k.v} className="mx-auto w-full max-w-[260px]" />
                </div>
              ))}
              <p className="text-[15px] leading-relaxed text-ink sm:col-span-2">
                At your latest assessment on {formatShort(latest.date)}, the recorded bend differed by <strong className="font-semibold">{diff}°</strong> between your knees. {physio} asked to review differences larger than {data.plan.sideDifferenceReview.degrees}°, and can assess whether this one matters for your recovery.
              </p>
            </Card>
          ) : null}
          <SideChart />
        </MetricSection>

        <section aria-labelledby="context-title" className="space-y-4">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-taupe">Supporting context</p>
            <h2 id="context-title" className="mt-2 font-serif text-3xl text-ink">Daily activity</h2>
            <p className="mt-1.5 max-w-2xl text-[15px] text-taupe">General movement during the day. Shown for context only; it is not the main measure of your recovery.</p>
          </div>
          <ActivityChart />
        </section>
      </div>
    </div>
  );
}

function MetricSection({
  id,
  n,
  name,
  question,
  facets,
  children,
}: {
  id: string;
  n: string;
  name: string;
  question: string;
  facets: { what: ReactNode; how: ReactNode; sees: ReactNode; physio: ReactNode; cannot: ReactNode };
  children: ReactNode;
}) {
  const rows = [
    { icon: HelpCircle, label: "What is being measured", body: facets.what },
    { icon: Cpu, label: "How the proposed wearable might measure it", body: facets.how },
    { icon: Eye, label: "What you see", body: facets.sees },
    { icon: Stethoscope, label: "Why a physiotherapist may care", body: facets.physio },
    { icon: Ban, label: "What it cannot tell us by itself", body: facets.cannot },
  ];
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28 space-y-5">
      <div>
        <p className="font-serif text-lg text-taupe">
          {n} · {name}
        </p>
        <h2 id={`${id}-title`} className="mt-1 font-serif text-3xl leading-tight tracking-[-0.01em] text-ink sm:text-4xl">
          {question}
        </h2>
      </div>
      <dl className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 xl:grid-cols-5">
        {rows.map((r, i) => (
          <div key={r.label} className={`bg-card p-4 sm:p-5 ${i === 4 ? "bg-rose-soft/40" : ""} ${i === 4 ? "sm:col-span-2 xl:col-span-1" : ""}`}>
            <dt className={`flex items-center gap-2 text-[13px] font-medium ${i === 4 ? "text-rose-deep" : "text-sage-deep"}`}>
              <r.icon className="h-4 w-4 shrink-0" aria-hidden />
              {r.label}
            </dt>
            <dd className="mt-2 text-[15px] leading-relaxed text-ink">{r.body}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function Derivation() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 border-t border-line pt-3">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-1.5 text-[15px] font-medium text-sage-deep hover:underline">
        How was this observation worked out?
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open ? (
        <ol className="re-fade mt-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink">
          <li>For each repetition, the sensors would record the deepest bend reached.</li>
          <li>For each session, RE works out how much those deepest points differed, as an average spread in degrees (±°). Technically, this is a standard deviation.</li>
          <li>The average of your last two sessions is compared with the six sessions before. A difference of at least 1° is described as more or less consistent; anything smaller is described as staying consistent.</li>
          <li>This is an <strong className="font-medium">illustrative research concept</strong>. It has not been validated, it only looks at depth, and it can&apos;t judge technique or safety.</li>
        </ol>
      ) : null}
    </div>
  );
}
