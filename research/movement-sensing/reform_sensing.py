"""Simplified educational two-IMU knee-angle demonstration.

Uses synthetic or user-supplied CSV signals. Not a clinical measurement system.
"""
from __future__ import annotations

import numpy as np
import pandas as pd


def make_synthetic_data(duration_s: float = 8.0, sample_rate_hz: float = 100.0,
                        amplitude_deg: float = 60.0) -> pd.DataFrame:
    """Create idealised planar thigh/shin IMU signals and a reference knee angle."""
    if duration_s <= 0 or sample_rate_hz <= 0:
        raise ValueError("duration_s and sample_rate_hz must be positive")
    dt = 1.0 / sample_rate_hz
    t = np.arange(0.0, duration_s, dt)
    phase = 2.0 * np.pi * t / duration_s
    knee = amplitude_deg * (0.5 - 0.5 * np.cos(phase))
    thigh = 8.0 * np.sin(phase)
    shin = thigh + knee

    def segment_channels(angle_deg: np.ndarray) -> dict[str, np.ndarray]:
        angle = np.deg2rad(angle_deg)
        # Idealised gravity-only accelerometer in the assumed X/Z plane.
        ax = np.sin(angle)
        ay = np.zeros_like(angle)
        az = np.cos(angle)
        # Angular rate about assumed Y axis, in degrees per second.
        gy = np.gradient(angle_deg, dt)
        zeros = np.zeros_like(angle)
        return {"ax": ax, "ay": ay, "az": az,
                "gx": zeros, "gy": gy, "gz": zeros}

    th = segment_channels(thigh)
    sh = segment_channels(shin)
    data = {"time_s": t, "reference_knee_deg": knee}
    for prefix, channels in (("thigh", th), ("shin", sh)):
        for name, values in channels.items():
            data[f"{prefix}_{name}"] = values
    return pd.DataFrame(data)


def accel_pitch_deg(ax: np.ndarray, az: np.ndarray) -> np.ndarray:
    """Estimate pitch from assumed accelerometer X/Z axes."""
    return np.rad2deg(np.arctan2(ax, az))


def complementary_pitch(gyro_y_dps: np.ndarray, accel_pitch: np.ndarray,
                        sample_rate_hz: float, alpha: float = 0.98) -> np.ndarray:
    """Fuse gyro rate and accelerometer pitch with a basic complementary filter."""
    if not 0.0 <= alpha <= 1.0:
        raise ValueError("alpha must be between 0 and 1")
    if sample_rate_hz <= 0:
        raise ValueError("sample_rate_hz must be positive")
    gyro_y_dps = np.asarray(gyro_y_dps, dtype=float)
    accel_pitch = np.asarray(accel_pitch, dtype=float)
    if gyro_y_dps.shape != accel_pitch.shape:
        raise ValueError("gyro and accelerometer arrays must have matching shapes")
    if len(gyro_y_dps) == 0:
        return np.array([])
    dt = 1.0 / sample_rate_hz
    estimate = np.empty_like(accel_pitch)
    estimate[0] = accel_pitch[0]
    for i in range(1, len(estimate)):
        gyro_estimate = estimate[i - 1] + gyro_y_dps[i] * dt
        estimate[i] = alpha * gyro_estimate + (1.0 - alpha) * accel_pitch[i]
    return estimate


def moving_average(values: np.ndarray, window: int = 5) -> np.ndarray:
    """Smooth a one-dimensional signal using a centred moving average."""
    values = np.asarray(values, dtype=float)
    if window < 1:
        raise ValueError("window must be at least 1")
    if len(values) == 0:
        return values.copy()
    return pd.Series(values).rolling(window=window, center=True, min_periods=1).mean().to_numpy()


def add_estimates(data: pd.DataFrame, sample_rate_hz: float = 100.0,
                  alpha: float = 0.98) -> pd.DataFrame:
    """Return a copy with segment pitch and relative knee-angle estimates."""
    result = data.copy()
    for segment in ("thigh", "shin"):
        accel = accel_pitch_deg(result[f"{segment}_ax"].to_numpy(),
                                result[f"{segment}_az"].to_numpy())
        result[f"{segment}_pitch_accel_deg"] = accel
        result[f"{segment}_pitch_est_deg"] = complementary_pitch(
            result[f"{segment}_gy"].to_numpy(), accel, sample_rate_hz, alpha
        )
    result["knee_flexion_est_deg"] = (
        result["shin_pitch_est_deg"] - result["thigh_pitch_est_deg"]
    )
    result["knee_flexion_smoothed_deg"] = moving_average(
        result["knee_flexion_est_deg"].to_numpy()
    )
    return result


def summarize_estimate(data: pd.DataFrame) -> dict[str, float]:
    """Calculate errors against the synthetic/reference angle column."""
    error = (data["knee_flexion_est_deg"] -
             data["reference_knee_deg"]).to_numpy(dtype=float)
    return {
        "mae_deg": float(np.mean(np.abs(error))),
        "rmse_deg": float(np.sqrt(np.mean(error ** 2))),
        "bias_deg": float(np.mean(error)),
    }


def load_imu_csv(path: str) -> pd.DataFrame:
    """Load a CSV with the expected two-IMU column names."""
    data = pd.read_csv(path)
    required = {
        "time_s", "thigh_ax", "thigh_ay", "thigh_az",
        "thigh_gx", "thigh_gy", "thigh_gz",
        "shin_ax", "shin_ay", "shin_az",
        "shin_gx", "shin_gy", "shin_gz",
    }
    missing = sorted(required - set(data.columns))
    if missing:
        raise ValueError("CSV is missing required columns: " + ", ".join(missing))
    return data
