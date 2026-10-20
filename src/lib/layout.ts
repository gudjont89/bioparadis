import { timeToMinutes } from "../shared/lanes";
import type { Movie, Screening } from "../shared/types";

/** Pixels per minute on the timeline. */
export const PX_PER_MIN = 2.8;
export const MIN_CARD_WIDTH = 100;
/** Left padding of the timeline; grid lines are offset by this. */
export const TIMELINE_PAD = 20;

export function cardWidth(runtime: number): number {
  return Math.max(runtime * PX_PER_MIN, MIN_CARD_WIDTH);
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
