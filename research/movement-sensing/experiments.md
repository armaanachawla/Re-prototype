# Experiment plan

## Experiment 1 — Synthetic IMU data generation
**Input:** Configured movement duration, sampling rate, and synthetic reference knee motion.

**Process:** Generate idealised thigh and shin accelerometer and gyroscope signals for a simple planar movement.

**Output:** A CSV containing synthetic sensor channels and reference angles.

**Why it matters:** It provides a repeatable test input before physical sensors are available. Synthetic data is useful for checking code flow, but it does not represent real-world sensor performance.

## Experiment 2 — Segment pitch estimation
**Input:** Accelerometer and gyroscope channels for the thigh and shin.

**Process:** Estimate pitch from accelerometer X/Z axes and combine it with integrated gyroscope Y using a complementary filter.

**Output:** Estimated thigh and shin pitch angles.

**Why it matters:** Each IMU estimates the orientation of one body segment. Sensor-axis alignment and calibration will be needed for physical testing.

## Experiment 3 — Relative knee-flexion estimate
**Input:** Estimated thigh and shin pitch angles.

**Process:** Calculate relative angle as shin pitch minus thigh pitch.

**Output:** An approximate knee-flexion time series.

**Why it matters:** The relative orientation of the two segments is the basic signal of interest for tracking knee movement. Sign convention and anatomical calibration must be verified.

## Experiment 4 — Smoothing and synthetic error summary
**Input:** Estimated knee-flexion signal and synthetic reference angle.

**Process:** Apply a moving average and calculate mean absolute error (MAE), root mean square error (RMSE), and bias against the synthetic reference.

**Output:** Smoothed estimates and summary metrics.

**Why it matters:** This checks whether the processing pipeline behaves as expected under the simplified synthetic assumptions. These metrics are not evidence of accuracy on people or physical hardware.

## Experiment 5 — Future real-sensor validation
**Input:** Time-synchronised thigh and shin IMU recordings collected during controlled movements, plus an appropriate reference measurement.

**Process:** Establish sensor placement and axis alignment, calibrate, synchronise streams, assess drift and repeatability, and compare estimates with the reference.

**Output:** A documented real-data validation report.

**Why it matters:** This is required before making claims about measurement performance. It has not been completed by the current synthetic prototype.

## Known limitations and next steps
- Planar sagittal-plane model only.
- Assumed sensor axes; no anatomical sensor-to-segment calibration.
- Simplified gravity-based accelerometer model; real movement acceleration can corrupt tilt estimates.
- No full 3D orientation fusion or magnetometer.
- No realistic soft-tissue artefact or comprehensive gyro-drift model.
- Validate sensor placement, synchronisation, calibration, repeatability, and reference agreement with real hardware before interpreting results.
