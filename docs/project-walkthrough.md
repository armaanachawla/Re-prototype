# RE:FORM — Coding Agent Project Walkthrough

[← Back to the project overview](../README.md)

> **Document type:** Reconstructed project walkthrough based on the current contents of this repository. This is not an exported or verbatim transcript of an original AI coding-agent session.

## Project

RE:FORM is an early-stage concept for a smart knee support and digital rehabilitation platform. The repository contains two connected workstreams:

1. A web application prototype demonstrating the patient and physiotherapist experience.
2. A Python research prototype exploring a simplified two-IMU knee-flexion estimation pipeline.

Repository: https://github.com/armaanachawla/Re-prototype

## 1. Web application prototype

### Goal

Turn the product concept into an interactive application that demonstrates how patients and physiotherapists could review rehabilitation progress. The wearable and all patient measurements are conceptual or simulated; no physical sensor is connected.

### Stack

- Next.js and React
- TypeScript
- Tailwind CSS
- Recharts for data visualisation
- Lucide icons

### Main user experiences

- **Overview:** recovery summary, weekly progress, bend trends, session adherence and discussion points.
- **Movement:** knee-bend angle, repetitions, movement-consistency concept and side-to-side comparison.
- **Recovery Goals:** goals, progress and status.
- **Activity Log:** exercise sessions, repetitions, completion status, filters and entry details.
- **My Wearable:** conceptual knee-sleeve illustration, sensor annotations and style/colour customisation.
- **Physiotherapist View:** patient trends, adherence, session history, goals and review observations.
- **Sample report and export:** print-oriented report and CSV export.

### Architecture

- `web-app/src/app/` — Next.js app layout, page entry point, global styles and error states.
- `web-app/src/components/views/` — patient and physiotherapist screens.
- `web-app/src/components/charts/` — reusable chart frame, tooltips and movement/activity charts.
- `web-app/src/components/product/` — knee-sleeve visualisation and customisation options.
- `web-app/src/components/layout/` and `web-app/src/components/ui/` — navigation, notices and reusable interface components.
- `web-app/src/data/sample-patient.ts` — deterministic fictional sample dataset.
- `web-app/src/lib/types.ts` — shared data types.
- `web-app/src/lib/recovery.ts` — calculations for summaries, goals, statuses and observations.
- `web-app/src/lib/app-state.tsx` — shared application state and view/time/filter controls.
- `web-app/src/lib/export.ts` and `web-app/src/lib/dates.ts` — CSV export and date utilities.
- `web-app/scripts/build-artifact.mjs` and `web-app/scripts/artifact-entry.tsx` — standalone artifact build support.

### Important implementation boundary

The interface, navigation, filters, charts, sleeve customiser, sample report and CSV export are implemented. Patient identity, sensor readings, knee angles, repetitions, activity, goals and clinical observations are sample data. The prototype has no backend, authentication, database, Bluetooth connection or live wearable integration.

## 2. Python movement-sensing prototype

### Goal

Explore whether two inertial measurement units (IMUs), one placed on the thigh and one on the shin, could be used to estimate relative knee movement.

### Experiments implemented

1. **Synthetic data generation:** create idealised accelerometer and gyroscope signals for thigh and shin, alongside a known synthetic knee-angle reference.
2. **Segment pitch estimation:** estimate pitch from assumed accelerometer axes and combine it with gyroscope rate using a basic complementary filter.
3. **Relative knee-flexion estimate:** subtract estimated thigh pitch from estimated shin pitch.
4. **Smoothing and error summary:** apply a moving average and calculate MAE, RMSE and bias against the synthetic reference.

A fifth experiment—testing with real IMU recordings and an appropriate reference measurement—is documented as future work, not completed.

### Files

- `research/movement-sensing/reform_sensing.py` — synthetic data generation, pitch estimation, complementary filter, smoothing, relative-angle calculation, metrics and CSV validation.
- `research/movement-sensing/run_all.py` — runs the pipeline and writes output CSV, JSON metrics and a plot.
- `research/movement-sensing/experiments.md` — experiment rationale, inputs, outputs, limitations and future validation.
- `research/movement-sensing/requirements.txt` — Python dependencies.
- `research/movement-sensing/data/synthetic_two_imu_data.csv` — synthetic two-IMU dataset.
- `research/movement-sensing/outputs/` — example plot and metrics; the runner writes its outputs here.

### Run the Python experiment

From the `research/movement-sensing` folder:

```bash
python -m pip install -r requirements.txt
python run_all.py
```

The runner generates estimated signals, synthetic metrics and a knee-angle plot in the `outputs/` folder.

### Important implementation boundary

This is a simplified educational model, not a validated measurement system. It assumes planar movement and specific sensor axes, and does not yet implement full 3D orientation fusion, anatomical calibration, realistic translational acceleration, soft-tissue artefact or robust real-world drift handling. Synthetic error metrics do not establish real-world sensor accuracy.

## 3. How the two workstreams connect

The web application demonstrates how movement and recovery information could be presented. The Python prototype explores one possible way to derive knee-flexion estimates from two sensors. The intended future data flow is:

1. Thigh and shin IMUs collect movement signals.
2. A calibrated signal-processing pipeline estimates segment orientation and relative knee movement.
3. Validated measurements are transferred to the application.
4. Patient and physiotherapist screens display the resulting trends.

This end-to-end integration has not been built yet.

## 4. Next engineering milestones

- Test with physical IMUs and document sensor placement.
- Implement and evaluate anatomical calibration and synchronisation.
- Assess drift, repeatability and agreement with a suitable reference method.
- Validate repetition detection and any proposed movement-quality metrics.
- Design a secure data pipeline and Bluetooth integration.
- Replace simulated app data with real measurements only after appropriate testing and validation.

## Repository links

- Main application: https://github.com/armaanachawla/Re-prototype/tree/main/web-app
- Movement-sensing research: https://github.com/armaanachawla/Re-prototype/tree/main/research/movement-sensing
- Project README: https://github.com/armaanachawla/Re-prototype/blob/main/README.md
