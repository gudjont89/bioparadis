import { timeToMinutes } from "../shared/lanes";

const TIME_ZONE = "Atlantic/Reykjavik";

const partsFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export interface ReykjavikNow {
  /** `YYYY-MM-DD` */
  date: string;
  minutes: number;
}

/** Current date and minutes-since-midnight in Reykjavík, regardless of the viewer's zone. */
export function reykjavikNow(now = new Date()): ReykjavikNow {
  const p = Object.fromEntries(partsFormat.formatToParts(now).map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: Number(p.hour) * 60 + Number(p.minute),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** `HH:MM`, wrapping past midnight. */
export function formatMinutes(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
}

export function endTime(time: string, runtime: number): string {
  return formatMinutes(timeToMinutes(time) + runtime);
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** `Tue 20` for `2026-10-20`. */
export function dayLabel(date: string): string {
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
  return `${DAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d}`;
}

/** True when a screening has already started. */
export function hasStarted(date: string, time: string, now: ReykjavikNow): boolean {
  if (date !== now.date) return date < now.date;
  return timeToMinutes(time) <= now.minutes;
}
