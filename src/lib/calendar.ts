import type { Movie, Screening } from "../shared/types";

const LOCATION = "Hverfisgata 54, 101 Reykjavík";

/**
 * Iceland is UTC+0 all year (no DST), so Reykjavík wall-clock time equals UTC
 * and screenings can be emitted as UTC timestamps without a VTIMEZONE block.
 */
export function screeningWindow(s: Screening, runtime: number): { start: Date; end: Date } {
  const [y = 0, mo = 1, d = 1] = s.date.split("-").map(Number);
  const [h = 0, mi = 0] = s.time.split(":").map(Number);
  const start = new Date(Date.UTC(y, mo - 1, d, h, mi));
  return { start, end: new Date(start.getTime() + runtime * 60_000) };
}

/** `20261020T164000Z` */
function stamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function details(s: Screening): string {
  return s.ticketUrl ? `Buy tickets: ${s.ticketUrl}` : "";
}

export function googleCalendarUrl(s: Screening, movie: Movie): string {
  const { start, end } = screeningWindow(s, movie.runtime);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Bíó Paradís: ${movie.title}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    location: LOCATION,
    details: details(s),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function icsFile(s: Screening, movie: Movie, now = new Date()): string {
  const { start, end } = screeningWindow(s, movie.runtime);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//bioparadis//schedule//EN",
    "BEGIN:VEVENT",
    `UID:${s.id.replace(/\W+/g, "-")}@bioparadis`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeIcs(`Bíó Paradís: ${movie.title}`)}`,
    `LOCATION:${escapeIcs(LOCATION)}`,
    ...(s.ticketUrl ? [`DESCRIPTION:${escapeIcs(details(s))}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadIcs(s: Screening, movie: Movie): void {
  const blob = new Blob([icsFile(s, movie)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${movie.slug}-${s.date}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
