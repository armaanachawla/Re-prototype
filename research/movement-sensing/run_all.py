"""Run the synthetic RE:FORM two-IMU demonstration."""
from pathlib import Path
import json

import matplotlib.pyplot as plt

from reform_sensing import make_synthetic_data, add_estimates, summarize_estimate


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
OUTPUT_DIR = ROOT / "outputs"


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    raw = make_synthetic_data()
    estimated = add_estimates(raw)
    raw.to_csv(DATA_DIR / "synthetic_two_imu_data.csv", index=False)
    estimated.to_csv(OUTPUT_DIR / "estimated_signals.csv", index=False)

    metrics = summarize_estimate(estimated)
    (OUTPUT_DIR / "synthetic_metrics.json").write_text(
        json.dumps(metrics, indent=2) + "\n", encoding="utf-8"
    )

    plt.figure(figsize=(10, 5))
    plt.plot(estimated["time_s"], estimated["reference_knee_deg"],
             label="Synthetic reference")
    plt.plot(estimated["time_s"], estimated["knee_flexion_est_deg"],
             label="Estimated knee flexion", alpha=0.8)
    plt.plot(estimated["time_s"], estimated["knee_flexion_smoothed_deg"],
             label="Smoothed estimate", linewidth=2)
    plt.xlabel("Time (s)")
    plt.ylabel("Angle (degrees)")
    plt.title("RE:FORM — synthetic two-IMU knee-flexion demonstration")
    plt.legend()
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "knee_angle_estimate.png", dpi=160)
    plt.close()

    print("Synthetic demonstration complete.")
    print(json.dumps(metrics, indent=2))
    print(f"Outputs saved in: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
