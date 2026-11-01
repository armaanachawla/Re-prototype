# RE:FORM Movement-Sensing Experiments

This folder contains an early-stage, educational prototype for estimating knee flexion from two inertial measurement units (IMUs), one mounted on the thigh and one on the shin.

## Scope

The current experiments use synthetic data. They demonstrate a simplified signal-processing pipeline: synthetic IMU data generation, segment pitch estimation, relative knee-flexion estimation, and basic smoothing and error summaries.

## Important limitations

This is not a validated medical device or a clinically validated measurement system. The current model assumes planar sagittal-plane motion and simplified sensor alignment. It does not yet address full 3D orientation, anatomical calibration, realistic translational acceleration, soft-tissue artefact, or robust drift correction. Do not use its outputs for diagnosis, treatment decisions, or return-to-sport decisions.

## Files

- `reform_sensing.py` — core signal-processing functions.
- `run_all.py` — runs the demonstration pipeline.
- `experiments.md` — experiment descriptions, inputs, outputs, and next steps.
- `requirements.txt` — Python dependencies.
- `data/` — synthetic input data.
- `outputs/` — generated estimates and example metrics.

## Run

Install dependencies with `pip install -r requirements.txt`, then run `python run_all.py`.
