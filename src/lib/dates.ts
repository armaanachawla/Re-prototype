/** Date helpers that operate on ISO `YYYY-MM-DD` strings in UTC, so results never depend on the viewer's time zone. */

const DAY_MS = 86_400_000;

export function parseISO(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return toISO(new Date(parseISO(date).getTime() + days * DAY_MS));
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / DAY_MS);
}

/** Inclusive list of dates from `start` to `end`. */
export function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts });
const fmtShort = fmt({ day: "numeric", month: "short" });
const fmtWeekday = fmt({ weekday: "short" });
const fmtLongWeekday = fmt({ weekday: "long" });
const fmtLong = fmt({ weekday: "long", day: "numeric", month: "long" });
const fmtFull = fmt({ day: "numeric", month: "short", year: "numeric" });

export const formatShort = (d: string) => fmtShort.format(parseISO(d));
export const formatWeekday = (d: string) => fmtWeekday.format(parseISO(d));
export const formatLongWeekday = (d: string) => fmtLongWeekday.format(parseISO(d));
export const formatLong = (d: string) => fmtLong.format(parseISO(d));
export const formatFull = (d: string) => fmtFull.format(parseISO(d));

export function formatSpan(start: string, end: string): string {
  return `${formatShort(start)} – ${formatShort(end)}`;
}

export function minutesOfDay(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function formatDuration(min: number | null): string {
  if (min === null || !Number.isFinite(min)) return "—";
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}
