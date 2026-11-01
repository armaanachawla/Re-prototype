"use client";

import { ArrowRight, ClipboardList, HeartHandshake, Info, MessageCircle, Ruler, TrendingUp } from "lucide-react";
import { useApp } from "@/lib/app-state";
import { bendStatus, buildGoals, buildObservations, latestBend, mean, activityBetween, programmeWeek, sideDifference, weekSummaries } from "@/lib/recovery";
import { formatLong, formatShort, formatSpan } from "@/lib/dates";
import { BendChart } from "../charts/BendChart";
import { SessionsChart } from "../charts/SessionsChart";
import { Card, Callout, ProgressBar, SimTag } from "../ui/Card";
import { StatusPill } from "../ui/StatusPill";
import { Term, GLOSSARY } from "../ui/Term";
import { Discussion } from "./Discussion";

export function Overview() {
  const { data, go, dispatch } = useApp();
  const { latest, previous, change } = latestBend(data);
  const weeks = weekSummaries(data);
  const thisWeek = weeks[weeks.length - 1];
  const lastWeek = weeks[weeks.length - 2];
  const observations = buildObservations(data);
  const goals = buildGoals(data).filter((g) => g.status !== "completed");
  const status = bendStatus(change);
  const week = programmeWeek(data, data.dataEnd);
  const diff = sideDifference(latest);
  const steps = mean(activityBetween(data, thisWeek.start, thisWeek.end).map((d) => d.steps));
  const physio = data.patient.physiotherapist.split(" ")[0];

  const showWeek = (view: "movement" | "goals", anchor?: string) => {
    dispatch({ type: "range", range: "week" });
    go(view, anchor);
  };

  return (
    <div className="space-y-12">
      {/* Greeting */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[15px] text-taupe">
            Week {week} of your {data.patient.programmeWeeks}-week plan · {formatLong(data.dataEnd)}
          </p>
          <h1 className="mt-2 font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-ink sm:text-6xl">Hello, {data.patient.firstName}.</h1>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-taupe">Here&apos;s how your recovery looks this week, in plain words.</p>
        </div>
        <SimTag label="Sample patient · illustrative data" />
      </section>

      {/* Three questions */}
      <section aria-label="Your recovery at a glance" className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col">
          <p className="flex items-center gap-2 text-[15px] font-medium text-sage-deep">
            <TrendingUp className="h-4 w-4" aria-hidden /> How am I progressing?
          </p>
          <p className="mt-4 tabular font-serif text-5xl text-ink">{latest ? `${latest.recovering}°` : "—"}</p>
          <p className="mt-1 text-[15px] text-taupe">
            Knee bend at your latest assessment ({latest ? formatShort(latest.date) : "—"}){previous && change !== null ? `, ${change >= 0 ? "up" : "down"} ${Math.abs(change)}° from ${previous.recovering}°` : ""}.
          </p>
          <div className="mt-4">{status ? <StatusPill kind={status} /> : null}</div>
          <button type="button" onClick={() => go("movement", "metric-bend")} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] font-medium text-sage-deep hover:underline">
            See your knee bend <ArrowRight className="h-4 w-4" />
          </button>
        </Card>

        <Card className="flex flex-col">
          <p className="flex items-center gap-2 text-[15px] font-medium text-sage-deep">
            <ClipboardList className="h-4 w-4" aria-hidden /> Am I following my plan?
          </p>
          <p className="mt-4 tabular font-serif text-5xl text-ink">
            {thisWeek.done}
            <span className="text-2xl text-taupe"> of {thisWeek.planned}</span>
          </p>
          <p className="mt-1 text-[15px] text-taupe">
            Exercise sessions completed this week{lastWeek ? `; last week you completed ${lastWeek.done} of ${lastWeek.planned}` : ""}.
          </p>
          <div className="mt-4">
            <ProgressBar pct={(thisWeek.done / thisWeek.planned) * 100} label="Sessions completed this week" />
          </div>
          <div className="mt-3">
            <StatusPill kind={thisWeek.done >= thisWeek.planned ? "reached" : "not-reached"} label={thisWeek.done >= thisWeek.planned ? "All planned sessions done" : "Goal not yet reached"} />
          </div>
          <button type="button" onClick={() => go("log")} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] font-medium text-sage-deep hover:underline">
            Open your activity log <ArrowRight className="h-4 w-4" />
          </button>
        </Card>

        <Card className="flex flex-col bg-rose-soft/40">
          <p className="flex items-center gap-2 text-[15px] font-medium text-rose-deep">
            <MessageCircle className="h-4 w-4" aria-hidden /> What should I discuss with {physio}?
          </p>
          <p className="mt-4 tabular font-serif text-5xl text-ink">{observations.length}</p>
          <p className="mt-1 text-[15px] text-taupe">things worth raising at your appointment on {formatShort(data.patient.nextAppointment)}.</p>
          <ul className="mt-4 space-y-2 text-[15px] text-ink">
            {observations.slice(0, 3).map((o) => (
              <li key={o.id} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-deep" aria-hidden />
                {o.title}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => document.getElementById("discuss")?.scrollIntoView({ behavior: "smooth" })} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] font-medium text-rose-deep hover:underline">
            See the details <ArrowRight className="h-4 w-4" />
          </button>
        </Card>
      </section>

      {/* Weekly summary */}
      <Card as="section">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl text-ink">Your week in summary</h2>
          <p className="text-[14px] text-taupe">{formatSpan(thisWeek.start, thisWeek.end)}</p>
        </div>
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          <SummaryItem icon={<Ruler className="h-4 w-4" />}>
            You had {data.assessments.filter((a) => a.date >= thisWeek.start).length} bend assessments this week. Your recovering knee reached {latest?.recovering}°{change !== null ? `, ${Math.abs(change)}° ${change >= 0 ? "more" : "less"} than the assessment before` : ""}.
          </SummaryItem>
          <SummaryItem icon={<ClipboardList className="h-4 w-4" />}>
            You completed {thisWeek.done} of {thisWeek.planned} planned exercise sessions{thisWeek.partial ? `, ${thisWeek.partial} of them partly` : ""}.
          </SummaryItem>
          {diff !== null ? (
            <SummaryItem icon={<HeartHandshake className="h-4 w-4" />}>
              Your two knees differed by {diff}° in recorded bend, more than the {data.plan.sideDifferenceReview.degrees}° {physio} asked to review.
            </SummaryItem>
          ) : null}
          {steps !== null ? (
            <SummaryItem icon={<TrendingUp className="h-4 w-4" />}>
              You averaged about {Math.round(steps).toLocaleString("en-GB")} estimated steps a day. This is context only; your exercise plan comes first.
            </SummaryItem>
          ) : null}
        </ul>
      </Card>

      {/* Trends */}
      <section aria-label="Your trends" className="grid gap-6 xl:grid-cols-2">
        <BendChart />
        <SessionsChart />
      </section>

      <Discussion />

      {/* Goals */}
      <section aria-labelledby="ov-goals">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="ov-goals" className="font-serif text-3xl text-ink">Goals still in progress</h2>
          <button type="button" onClick={() => showWeek("goals")} className="inline-flex items-center gap-1.5 text-[15px] font-medium text-sage-deep hover:underline">
            All your goals <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {goals.map((g) => (
            <li key={g.id} className="rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-soft)]">
              <p className="font-medium text-ink">{g.title}</p>
              {g.progress ? (
                <div className="mt-3">
                  <ProgressBar pct={g.progress.pct} label={`${g.title} progress`} tone={g.status === "discuss" ? "terracotta" : "sage"} />
                  <p className="mt-1.5 text-[13px] text-taupe">
                    {g.progress.current}
                    {g.progress.unit} of {g.progress.target}
                    {g.progress.unit}
                  </p>
                </div>
              ) : null}
              <div className="mt-3">
                <StatusPill kind={g.statusKind} label={g.statusText} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* What these numbers mean */}
      <Card as="section">
        <h2 className="font-serif text-2xl text-ink">What these numbers mean</h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Knee bend", d: <>How far your knee bends, in degrees (°). 0° is straight. Also called <Term definition={GLOSSARY.flexion}>flexion</Term>.</> },
            { t: "Sessions completed", d: "Exercise sessions with recorded activity, compared with the number in your plan." },
            { t: "Movement consistency", d: "How similar the depth of each repetition was. An illustrative research concept, not a score of technique." },
            { t: "Knee comparison", d: "The difference in recorded bend between your recovering knee and your other knee." },
          ].map((m) => (
            <div key={m.t}>
              <dt className="font-medium text-ink">{m.t}</dt>
              <dd className="mt-1 text-[15px] leading-relaxed text-taupe">{m.d}</dd>
            </div>
          ))}
        </dl>
        <button type="button" onClick={() => go("movement")} className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-medium text-sage-deep hover:underline">
          Learn how each one is measured <ArrowRight className="h-4 w-4" />
        </button>
      </Card>

      <Callout tone="sage" icon={<Info className="h-4 w-4" />}>
        <strong className="font-medium">Your physiotherapist&apos;s plan comes first.</strong> Follow the exercises and activity levels {data.patient.physiotherapist} has given you, even when they differ from general activity targets. RE helps you keep track; it doesn&apos;t replace their advice.
      </Callout>
    </div>
  );
}

function SummaryItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl bg-ivory p-4 text-[15px] leading-relaxed text-ink">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sage-deep" aria-hidden>
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}
