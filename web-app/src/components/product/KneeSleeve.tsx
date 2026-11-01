"use client";

import { useId } from "react";
import type { StyleKey } from "@/lib/app-state";
import type { ColourOption } from "./options";

/**
 * Parametric illustration of the proposed RE sleeve.
 * The sleeve is modelled as a tapered, anatomically curved tube: every
 * horizontal contour is the front half of an ellipse whose width follows
 * the thigh → knee → calf profile below.
 */

export const VIEW_W = 400;
export const VIEW_H = 600;
const CX = 200;
const TOP = 70;
const BOTTOM = 530;
const KNEE = 292;
const ELLIPSE = 0.18;

const PROFILE: [number, number][] = [
  [TOP, 104],
  [150, 98],
  [235, 86],
  [KNEE, 78],
  [360, 82],
  [440, 74],
  [BOTTOM, 64],
];

export type Hotspot = "sensors" | "fit" | "platform";

function makeProfile(scale: number) {
  return (y: number): number => {
    for (let i = 0; i < PROFILE.length - 1; i++) {
      const [y0, w0] = PROFILE[i];
      const [y1, w1] = PROFILE[i + 1];
      if (y >= y0 && y <= y1) {
        const t = (y - y0) / (y1 - y0);
        const s = t * t * (3 - 2 * t);
        return (w0 + (w1 - w0) * s) * scale;
      }
    }
    return (y < TOP ? PROFILE[0][1] : PROFILE[PROFILE.length - 1][1]) * scale;
  };
}

const f = (n: number) => n.toFixed(1);
const SCALE: Record<StyleKey, number> = { everyday: 0.95, active: 1, comfort: 1.04 };

export function geometry(style: StyleKey) {
  const hw = makeProfile(SCALE[style]);
  const edge = (y0: number, y1: number, side: -1 | 1) => {
    const pts: string[] = [];
    const dir = y1 >= y0 ? 1 : -1;
    for (let y = y0; dir > 0 ? y <= y1 : y >= y1; y += 4 * dir) pts.push(`L${f(CX + side * hw(y))},${f(y)}`);
    pts.push(`L${f(CX + side * hw(y1))},${f(y1)}`);
    return pts.join(" ");
  };
  const arc = (y: number, ltr: boolean) => {
    const w = hw(y);
    return `A${f(w)},${f(w * ELLIPSE)} 0 0 ${ltr ? 0 : 1} ${f(ltr ? CX + w : CX - w)},${f(y)}`;
  };
  const band = (y0: number, y1: number) => `M${f(CX - hw(y0))},${f(y0)} ${arc(y0, true)} ${edge(y0, y1, 1)} ${arc(y1, false)} ${edge(y1, y0, -1)} Z`;
  const contour = (y: number) => `M${f(CX - hw(y))},${f(y)} ${arc(y, true)}`;
  const surface = (u: number, y: number): [number, number] => {
    const w = hw(y);
    return [CX + u * w, y + Math.sqrt(Math.max(0, 1 - u * u)) * w * ELLIPSE];
  };
  return { hw, band, contour, surface, body: band(TOP, BOTTOM) };
}

/** Anchor points (viewBox units) for the interactive annotations. */
export function anchors(style: StyleKey) {
  const g = geometry(style);
  const [sx, sy] = g.surface(0.78, 205);
  const [fx, fy] = g.surface(-0.5, KNEE + 6);
  return {
    sensors: { x: sx + 34, y: sy + 26 },
    fit: { x: fx, y: fy },
    platform: { x: sx + 58, y: sy - 52 },
  } satisfies Record<Hotspot, { x: number; y: number }>;
}

interface Props {
  colour: ColourOption;
  style: StyleKey;
  highlight?: Hotspot | null;
  className?: string;
  title?: string;
}

export function KneeSleeve({ colour, style, highlight = null, className, title }: Props) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${n}-${uid}`;
  const g = geometry(style);
  const t = "transition-[fill,stroke,opacity] duration-700 ease-out";
  const cuffTop = style === "comfort" ? 44 : style === "active" ? 34 : 22;
  const cuffBottom = style === "comfort" ? 36 : style === "active" ? 28 : 18;
  const knit = style === "comfort" ? 9 : style === "active" ? 5 : 4;
  const knitOpacity = style === "comfort" ? 0.1 : style === "active" ? 0.06 : 0.04;
  const courses = Array.from({ length: Math.floor((BOTTOM - TOP - 8) / knit) }, (_, i) => TOP + 6 + i * knit);
  const hi = (k: Hotspot) => highlight === k;
  const ACCENT = "#9a4e31";
  const FIT = "#4f6b53";
  const shadeOpacity = colour.light ? 0.75 : 1;

  // Proposed sensor pods on the outer side, above and below the joint line.
  const pods = [205, 385].map((y) => {
    const [x, yy] = g.surface(0.78, y);
    return { x, y: yy };
  });

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={className} role="img" aria-label={title ?? `Illustration of the proposed RE knee sleeve, ${style} style, in ${colour.name.toLowerCase()}`}>
      <defs>
        <linearGradient id={id("shade")} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.42 * shadeOpacity} />
          <stop offset="0.16" stopColor="#000" stopOpacity={0.12 * shadeOpacity} />
          <stop offset="0.36" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.52" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.8" stopColor="#000" stopOpacity={0.16 * shadeOpacity} />
          <stop offset="1" stopColor="#000" stopOpacity={0.48 * shadeOpacity} />
        </linearGradient>
        <linearGradient id={id("v")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>
        <radialGradient id={id("inner")} cx="0.5" cy="0.25" r="0.8">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </radialGradient>
        <radialGradient id={id("knee")} cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <pattern id={id("vent")} width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="1.4" fill="#000" fillOpacity="0.28" />
        </pattern>
        <clipPath id={id("body")}>
          <path d={g.body} />
        </clipPath>
        <filter id={id("blur")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      {title ? <title>{title}</title> : null}

      <ellipse cx={CX} cy={562} rx={86} ry={10} fill="#2b2724" opacity="0.16" filter={`url(#${id("blur")})`} />

      {/* Interior of the top opening */}
      <ellipse cx={CX} cy={TOP} rx={g.hw(TOP)} ry={g.hw(TOP) * ELLIPSE} fill={colour.detail} className={t} />
      <ellipse cx={CX} cy={TOP + 1.5} rx={g.hw(TOP) - 5} ry={g.hw(TOP) * ELLIPSE - 2.5} fill={`url(#${id("inner")})`} />

      <path d={g.body} fill={colour.base} className={t} />

      <g clipPath={`url(#${id("body")})`}>
        {courses.map((y) => (
          <path key={y} d={g.contour(y)} fill="none" stroke={colour.light ? "#000" : "#fff"} strokeOpacity={knitOpacity} strokeWidth={style === "comfort" ? 2.2 : 1} />
        ))}

        {/* Ventilation zones (Active) */}
        {style === "active"
          ? [-1, 1].map((s) => {
              const pts: string[] = [];
              for (let y = 150; y <= 440; y += 6) {
                const [x, yy] = g.surface(s * 0.72, y);
                pts.push(`${pts.length ? "L" : "M"}${f(x)},${f(yy)}`);
              }
              for (let y = 440; y >= 150; y -= 6) {
                const [x, yy] = g.surface(s * 0.97, y);
                pts.push(`L${f(x)},${f(yy)}`);
              }
              return <path key={s} d={`${pts.join(" ")} Z`} fill={`url(#${id("vent")})`} />;
            })
          : null}

        {/* Cuffs */}
        <path d={g.band(TOP, TOP + cuffTop)} fill={colour.detail} className={t} />
        <path d={g.band(BOTTOM - cuffBottom, BOTTOM)} fill={colour.detail} className={t} />

        {/* Knee support zone */}
        <ellipse cx={CX} cy={KNEE + 12} rx={56} ry={68} fill="none" stroke="#000" strokeOpacity="0.14" strokeWidth="7" />
        <ellipse cx={CX} cy={KNEE + 12} rx={52} ry={64} fill={`url(#${id("knee")})`} />
        <ellipse cx={CX} cy={KNEE + 12} rx={47} ry={59} fill="none" stroke={colour.light ? "#000" : "#fff"} strokeOpacity="0.18" strokeWidth="1" strokeDasharray="3 3" />

        {/* Flexible connector between the two pods */}
        <path
          d={(() => {
            const pts: string[] = [];
            for (let y = 205; y <= 385; y += 5) {
              const [x, yy] = g.surface(0.78, y);
              pts.push(`${pts.length ? "L" : "M"}${f(x)},${f(yy)}`);
            }
            return pts.join(" ");
          })()}
          fill="none"
          stroke={hi("sensors") ? ACCENT : colour.light ? "#000" : "#fff"}
          strokeOpacity={hi("sensors") ? 0.9 : 0.2}
          strokeWidth={hi("sensors") ? 2 : 1.2}
          strokeDasharray="2 3"
          className={t}
        />

        <rect x={CX - 130} y={TOP - 30} width={260} height={BOTTOM - TOP + 60} fill={`url(#${id("shade")})`} />
        <rect x={CX - 130} y={TOP - 30} width={260} height={BOTTOM - TOP + 60} fill={`url(#${id("v")})`} />
      </g>

      <path d={g.contour(TOP)} fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.2" />

      {/* Fit and support zone highlight */}
      <g opacity={hi("fit") ? 1 : 0} className="transition-opacity duration-500">
        <ellipse cx={CX} cy={KNEE + 12} rx={58} ry={70} fill="none" stroke={FIT} strokeWidth="2.5" strokeDasharray="6 5" />
        <path d={g.band(TOP, TOP + cuffTop)} fill="none" stroke={FIT} strokeWidth="2.5" strokeDasharray="6 5" />
        <path d={g.band(BOTTOM - cuffBottom, BOTTOM)} fill="none" stroke={FIT} strokeWidth="2.5" strokeDasharray="6 5" />
      </g>

      {/* Wordmark */}
      <text x={CX - 4} y={TOP + Math.min(cuffTop, 30) - 4} textAnchor="middle" fill={colour.light ? "#3d342c" : "#efe6da"} fillOpacity="0.7" style={{ font: "500 10px var(--font-serif), serif", letterSpacing: "0.32em" }}>
        RE
      </text>

      {/* Sensor pods */}
      {pods.map((p, i) => (
        <g key={i} transform={`translate(${f(p.x)} ${f(p.y)}) rotate(-3)`}>
          <rect x={-14} y={-24} width={28} height={48} rx={14} fill="none" stroke={ACCENT} strokeWidth="2.5" opacity={hi("sensors") ? 1 : 0} className="transition-opacity duration-500" />
          <rect x={-8} y={-17} width={16} height={34} rx={8} fill={colour.pod} className={t} />
          <rect x={-8} y={-17} width={16} height={34} rx={8} fill="none" stroke="#fff" strokeOpacity="0.22" />
          <circle cx={0} cy={-9} r={1.8} fill="#cfe0c8" />
        </g>
      ))}

      {/* Link to the companion platform */}
      <g transform={`translate(${f(pods[0].x + 12)} ${f(pods[0].y - 20)})`}>
        {[14, 24, 34].map((r, i) => {
          const a0 = (-80 * Math.PI) / 180;
          const a1 = (-12 * Math.PI) / 180;
          return (
            <path
              key={r}
              d={`M${f(r * Math.cos(a0))},${f(r * Math.sin(a0))} A${r},${r} 0 0 1 ${f(r * Math.cos(a1))},${f(r * Math.sin(a1))}`}
              fill="none"
              stroke={hi("platform") ? ACCENT : "#5e544b"}
              strokeWidth={hi("platform") ? 2.4 : 1.6}
              strokeLinecap="round"
              className="re-pulse"
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          );
        })}
      </g>
    </svg>
  );
}
