# RE web app

[← Back to the project overview](../README.md)

The interactive prototype of the RE companion platform: a patient experience (**My Recovery**) and a **Physiotherapist View**, built over one simulated dataset.

> **Concept prototype.** The RE wearable and its sensors do not exist yet. Every value in this app is simulated, illustrative sample data. RE is not an existing, clinically validated or approved medical device and is not intended for diagnosis or treatment. The sample exercises are illustrative and are not an exercise prescription.

---

## Install and run

Requirements: **Node.js 20.9 or newer** (tested on Node 22) and npm. Run every command below from this `web-app` folder.

```bash
cd web-app
```

```bash
npm install
```

```bash
npm run dev
```

Then open **http://localhost:3000**. `npm run dev` keeps running until you press Ctrl+C. The first page load compiles the app and can take a few seconds.

Production build:

```bash
npm run build
```

```bash
npm start
```

All quality checks (lint, type-check, build):

```bash
npm run check
```

The site prerenders to static pages and needs no environment variables, backend or database. To deploy it on Vercel or Netlify, set the project's **root directory** to `web-app`.

Single shareable HTML file (used for the claude.ai Artifact link):

```bash
npm run build:artifact
```

This writes `web-app/artifact-dist/re-recovery.html` (not committed), with the app and its styles inlined. In that build, "Print sample report" becomes "View sample report" (on screen) and the CSV download becomes a copy-to-clipboard, because the hosting page blocks printing and downloads.

## What's in the app

Navigation: **Overview · Movement · My Recovery Goals · Activity Log · My Wearable · Physiotherapist View**, plus a **My Recovery / Physiotherapist View** switch in the header. The current view is kept in the URL hash, so links and the browser back button work.

| View | Purpose |
|---|---|
| **Overview** (patient home) | Answers three questions immediately: *How am I progressing? Am I following my plan? What should I discuss with my physiotherapist?* Also shows a weekly summary in plain English, the knee-bend trend and sessions charts, **Things to discuss with your physiotherapist** (each with what changed, the supporting measurements, why it's worth discussing and what RE can't conclude), goals still in progress, metric explanations, and a reminder that the physiotherapist's plan comes first. |
| **Movement**: "Movement, made meaningful." | The four metrics (knee bending angle, exercise repetitions, movement quality, left–right comparison). Each one covers what is measured, how the proposed wearable might measure it, what you see, why a physiotherapist may care, and what it can't tell us. Each has its own patient display and interactive chart. Daily activity is shown separately as supporting context only. |
| **My Recovery Goals** | Patient-specific goals set by the (fictional) physiotherapist, with status (completed / in progress / needs discussion), progress bars, history charts and a filter. Shows the required note: "Your physiotherapist sets your goals. RE helps you track them; it does not determine whether you are medically ready to progress." |
| **Activity Log** | Every planned exercise, with date, exercise, repetitions, session status and recorded observations. Filter by date range, exercise type and completion status. Selecting an entry opens a detail panel (a bottom sheet on smaller screens) with its measurements and a plain-English explanation. Includes empty and invalid-range states. |
| **My Wearable** | Illustration of the proposed sleeve with interactive annotations (movement sensors, fit and support zones, connected platform), validation caveats, and a customiser with 6 colours × 3 styles (Everyday, Active, Comfort) that updates the illustration, selected state and description. |
| **Physiotherapist View** | The same data in more detail: patient overview, flexion over time (both knees), left-vs-right comparison, adherence, rep-to-rep variation, per-exercise completion, goals (achieved / in progress / not yet achieved), a session-by-session timeline and **trends that may warrant clinical review**, with a **Patient-friendly ↔ Technical** toggle. Includes **Print sample report** (print-optimised, labelled SIMULATED) and **Download sample data (CSV)**. |

### Chart readability rules

Every chart uses the shared `ChartCard` frame, which enforces:

- a question-based title and plain-English subheading
- labelled axes with units
- the latest value shown prominently, with a previous-period comparison
- a one-sentence explanation computed from the data
- a "Why this matters" note
- glossary tooltips for technical terms (flexion, ROM, SD, IMU…)
- hover/tap tooltips with date, value, unit and context
- a shared time-period control (This week / Last 4 weeks / All 8 weeks)

Statuses always pair colour with an icon and words; completion uses fill vs hatch vs dashed outline, so nothing relies on red/green alone.

## Architecture

```
web-app/
├── scripts/
│   ├── build-artifact.mjs      Builds the single shareable HTML file
│   └── artifact-entry.tsx      Entry point used by that build
└── src/
    ├── app/                    Layout (fonts), page (view switcher), globals.css (design tokens, print rules)
    ├── data/
    │   └── sample-patient.ts   Deterministic simulated dataset (the only data source)
    ├── lib/
    │   ├── types.ts            Shared data model (RecoveryDataset, Assessment, Session, ExerciseEntry…)
    │   ├── recovery.ts         Pure functions: time windows, statuses, goals, observations, review items
    │   ├── app-state.tsx       React context: view, time range, wearable choice, log filters, URL hash
    │   ├── target.ts           Detects the single-file build (swaps print/download for on-screen options)
    │   ├── export.ts           CSV export
    │   └── dates.ts            UTC-safe date helpers
    └── components/
        ├── layout/             Header (navigation + audience switch), concept banner, footer
        ├── views/              Overview, Movement, Goals, ActivityLog, Wearable, Physio, Discussion, PrintReport
        ├── charts/             ChartCard frame, BendChart, SessionsChart, SideChart, ConsistencyChart,
        │                       RepsChart, ActivityChart, BendVisual (angle diagram)
        ├── product/            Parametric KneeSleeve illustration + colour/style options
        └── ui/                 Segmented control, StatusPill, Card/Callout/ProgressBar, Term (glossary)
```

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Recharts 3 · Lucide icons. No backend, authentication, external API, analytics or browser storage.

## How the sample data works

`src/data/sample-patient.ts` builds one `RecoveryDataset` for a fictional patient, "Alex Morgan" (right knee, week 8 of a 12-week plan, 31 Aug – 25 Oct 2026, physiotherapist "Sam Rivera"):

- **Assessments:** 16 twice-weekly guided bend assessments for both knees, written by hand so the story is clear (recovering knee 92° → 120°, other knee ≈135°).
- **Sessions:** 5 planned sessions a week. Missed and partial sessions are fixed by hand; repetition counts, peak bend and rep-to-rep variation come from a **fixed-seed PRNG**, so values are identical on every load, render and browser.
- **Plan:** targets and thresholds set by the physiotherapist (e.g. bend goal 125° by week 12, review side differences over 10°). Goals are patient-specific; there are no universal clinical thresholds.
- **Activity:** estimated daily steps as context, with one missing day to show gap handling.

Both the patient and physiotherapist views read the same dataset through `lib/recovery.ts`, so summary cards, chart explanations, goals, observations, the report and the CSV always agree. A status is produced only when the data supports it (for example, "Improving compared with last assessment" requires a change of at least 3°). Nothing is labelled healed, safe to exercise or ready to return to sport.

## What is simulated

Everything that would come from hardware or a clinic: bend angles, both-knee comparison, repetition counts, movement-consistency values, step estimates, session completion, the patient, the physiotherapist, goals and appointments. The "movement consistency" measure (the standard deviation of peak bend between repetitions) is an **illustrative research concept**, not a validated movement-quality score. Pattern detection is shown only as a **proposed feature requiring validation**.

What genuinely works: the full interface, navigation, view switching, filters, chart interactions, the customiser, the print report and the CSV export.

## Connecting real sensors (what would be required)

1. **Hardware:** a sleeve with at least two inertial measurement units (thigh and shin), plus a reference on the other leg for side-to-side comparison. Firmware for sampling, on-device processing and Bluetooth Low Energy sync.
2. **Algorithms:** knee-angle estimation from sensor orientation, repetition detection per exercise, and handling of drift, placement variation and calibration. An early, synthetic-data experiment with this step is in [`research/movement-sensing`](../research/movement-sensing/).
3. **Data pipeline:** a mobile app or gateway that turns raw signals into the `Assessment`, `Session` and `ExerciseEntry` shapes in `lib/types.ts`. The UI would need no change; you would replace `SAMPLE_DATASET` in `lib/app-state.tsx` with a loader (async fetching would move into `AppProvider`).
4. **Platform:** authentication, patient–clinician linking, consent, secure storage, audit logs, and compliance with applicable healthcare privacy and data-protection law. None of this exists in the prototype.

## Validation needed before real-world use

- **Measurement validity and reliability:** compare sensor-derived knee angle against goniometry or motion capture, across sensor placements, body types, skin tones, clothing and recovery stages.
- **Repetition detection accuracy:** per exercise, including false positives and misses.
- **Movement-consistency measures:** whether any metric relates meaningfully to clinically observed movement quality. Until then it should not be shown as a score.
- **Usability and comprehension:** testing with patients (including low health literacy and accessibility needs) and physiotherapists, to check the wording is understood and not over-interpreted.
- **Comfort, fit and safety:** skin contact, pressure, extended wear (especially the Comfort style) and washability.
- **Clinical workflow and evidence:** whether the information helps clinical decisions without adding burden.
- **Regulatory:** assessment of whether the product would be a medical device in target markets, and the appropriate approvals.

## Limitations of this prototype

- Single fictional patient and fixed date window (data ends 25 Oct 2026).
- State lives in memory and resets on reload (except the current view, which is kept in the URL).
- Printing uses the browser's print dialog. Choose "Save as PDF" for a file.
- The product is concept art, not an engineering drawing.
