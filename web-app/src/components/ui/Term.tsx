"use client";

import { useId, useState, type ReactNode } from "react";

/** Inline glossary term: dotted underline, definition on hover, focus or tap. */
export function Term({ children, definition }: { children: ReactNode; definition: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline">
      <button
        type="button"
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
        className="cursor-help border-b border-dotted border-taupe text-inherit"
      >
        {children}
      </button>
      {open ? (
        <span
          role="tooltip"
          className="re-fade absolute bottom-full left-1/2 z-30 mb-2 w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-line bg-card px-3.5 py-2.5 text-left text-[13px] font-normal leading-snug text-ink shadow-[var(--shadow-soft)]"
        >
          {definition}
        </span>
      ) : null}
      <span id={id} className="sr-only">
        {definition}
      </span>
    </span>
  );
}

export const GLOSSARY = {
  flexion: "Knee flexion means bending the knee. It is measured in degrees (°): 0° is a straight leg, and the number grows as the knee bends further.",
  rom: "Range of motion (ROM): how far a joint can move. For the knee, this usually means how far it bends and straightens.",
  repetition: "One complete movement of an exercise, for example bending and straightening the knee once.",
  adherence: "How closely the exercise plan was followed: sessions completed compared with sessions planned.",
  variation: "How much the deepest point of each repetition differed from the others, shown as an average spread in degrees (±°). It is an illustrative research concept.",
  sd: "Standard deviation (SD): a statistical measure of how spread out a set of values is.",
  imu: "Inertial measurement unit (IMU): a small motion sensor that measures movement and orientation.",
} as const;
