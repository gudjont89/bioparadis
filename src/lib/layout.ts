import { timeToMinutes } from "../shared/lanes";
import type { Movie, Screening } from "../shared/types";

/** Pixels per minute along the (vertical) time axis. */
export const PX_PER_MIN = 1.8;
/** Short films stay tappable and fit a two-line title plus the meta row. */
export const MIN_CARD_HEIGHT = 56;
/** Space above the first and below the last hour line. */
export const TIMELINE_PAD_Y = 16;

export function cardHeight(runtime: number): number {
  return Math.max(runtime * PX_PER_MIN, MIN_CARD_HEIGHT);
}

/** Y offset of a minute-of-day within the timeline, given the first visible minute. */
export function minuteToY(minutes: number, rangeStartMinutes: number): number {
  return (minutes - rangeStartMinutes) * PX_PER_MIN + TIMELINE_PAD_Y;
}

/**
 * Visible hour range: 13:00-24:00 by default, widened when a day has earlier
 * or later (e.g. midnight) screenings.
 */
export function hourRange(
  screenings: Screening[],
  movies: Record<string, Movie>,
): { start: number; end: number } {
  let start = 13;
  let end = 24;
  for (const s of screenings) {
    const from = timeToMinutes(s.time);
    const to = from + (movies[s.movieId]?.runtime ?? 90);
    start = Math.min(start, Math.floor(from / 60));
    end = Math.max(end, Math.ceil(to / 60));
  }
  return { start, end };
}
