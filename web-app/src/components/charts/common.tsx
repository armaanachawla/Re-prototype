import type { RangeKey } from "@/lib/types";
import { RANGE_OPTIONS } from "@/lib/recovery";
import { useApp } from "@/lib/app-state";
import { Segmented } from "../ui/Segmented";

export const C = {
  recovering: "#4f6b53",
  other: "#8a7f74",
  goal: "#9a4e31",
  grid: "#ebe3d6",
  axis: "#5e544b",
  sage: "#9fb39f",
  sand: "#e6d3b3",
  sandDeep: "#8a6a3c",
  terracotta: "#c7764f",
  ivory: "#faf6ef",
  ink: "#2b2724",
};

export const AXIS_TICK = { fill: C.axis, fontSize: 12 };

export function axisLabel(value: string, axis: "x" | "y") {
  return axis === "y"
    ? { value, angle: -90, position: "insideLeft" as const, offset: 14, style: { textAnchor: "middle" as const, fill: C.axis, fontSize: 12 } }
    : { value, position: "insideBottom" as const, offset: -4, style: { fill: C.axis, fontSize: 12 } };
}

/** Range selector bound to the shared app range so every chart stays in sync. */
export function RangeControl({ options = RANGE_OPTIONS }: { options?: { value: RangeKey; label: string }[] }) {
  const { state, dispatch } = useApp();
  return <Segmented<RangeKey> size="sm" label="Time period" value={state.range} options={options} onChange={(range) => dispatch({ type: "range", range })} />;
}

export function EmptyChart({ message }: { message: string }) {
  return <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-line-strong bg-ivory px-6 text-center text-[15px] text-taupe">{message}</div>;
}

export const signed = (n: number, unit = "°") => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(n)}${unit}`;
