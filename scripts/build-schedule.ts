import { colorForMovie } from "../src/shared/colors";
import { assignLanes } from "../src/shared/lanes";
import type { EventType, Movie, Schedule, Screening } from "../src/shared/types";
import {
  eventsFromLabel,
  parseEventPages,
  parseHomepage,
  parseRuntime,
  parseTicketUrls,
  type RawScreening,
} from "./parsers";

const DEFAULT_RUNTIME = 90;
const BASE_URL = "https://bioparadis.is";

export type FetchText = (url: string) => Promise<string>;

/** Runs `fn` over `items`, logging and substituting `fallback` when one fails. */
async function settle<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  fallback: (item: T) => R,
  describe: (item: T) => string,
): Promise<R[]> {
  return Promise.all(
    items.map(async (item) => {
      try {
        return await fn(item);
      } catch (err) {
        console.warn(`warn: ${describe(item)} failed: ${(err as Error).message}`);
        return fallback(item);
      }
    }),
  );
}

export async function buildSchedule(fetchText: FetchText, now = new Date()): Promise<Schedule> {
  const homepage = await fetchText(`${BASE_URL}/`);
  const rawDays = parseHomepage(homepage);
  const eventPages = parseEventPages(homepage).filter((p) => p.eventType !== null);

  // ticket URL -> events, from the authoritative event subpages
  const eventPairs = await settle(
    eventPages,
    async (page) => {
      const urls = parseTicketUrls(await fetchText(new URL(page.url, BASE_URL).href));
      return urls.map((u) => [u, page.eventType as EventType] as const);
    },
    () => [] as (readonly [string, EventType])[],
    (page) => `event page ${page.slug}`,
  );
  const eventsByTicket = new Map<string, EventType[]>();
  for (const [url, event] of eventPairs.flat()) {
    eventsByTicket.set(url, [...(eventsByTicket.get(url) ?? []), event]);
  }

  // one detail page per movie -> runtime
  const uniqueMovies = new Map<string, RawScreening>();
  for (const s of rawDays.flatMap((d) => d.screenings)) {
    if (!uniqueMovies.has(s.movieId)) uniqueMovies.set(s.movieId, s);
  }
  const runtimes = new Map(
    await settle(
      [...uniqueMovies.values()],
      async (s) => {
        const runtime = parseRuntime(await fetchText(new URL(s.detailUrl, BASE_URL).href));
        return [s.movieId, runtime ?? DEFAULT_RUNTIME] as const;
      },
      (s) => [s.movieId, DEFAULT_RUNTIME] as const,
      (s) => `movie ${s.movieId}`,
    ),
  );

  const movies: Record<string, Movie> = {};
  for (const s of uniqueMovies.values()) {
    movies[s.movieId] = {
      id: s.movieId,
      slug: s.movieSlug,
      title: s.movieTitle,
      runtime: runtimes.get(s.movieId) ?? DEFAULT_RUNTIME,
      posterUrl: s.posterUrl,
      detailUrl: new URL(s.detailUrl, BASE_URL).href,
      color: colorForMovie(s.movieId),
    };
  }

  const days = rawDays.map((day) => {
    const withEvents = day.screenings.map((raw) => {
      const events = [
        ...new Set([...eventsFromLabel(raw.eventLabel), ...(eventsByTicket.get(raw.ticketUrl) ?? [])]),
      ];
      return { raw, time: raw.time, events };
    });
    const laned = assignLanes(withEvents, (s) => movies[s.raw.movieId]?.runtime ?? DEFAULT_RUNTIME);
    const screenings: Screening[] = laned.map(({ raw, time, events, lane }) => ({
      id: raw.ticketUrl || `${raw.movieId}_${day.date}_${time}`,
      movieId: raw.movieId,
      date: day.date,
      time,
      subtitleType: raw.subtitleType,
      ticketUrl: raw.ticketUrl,
      events,
      lane,
    }));
    return { date: day.date, screenings };
  });

  if (days.every((d) => d.screenings.length === 0)) {
    throw new Error("Parsed days but found no screenings; refusing to publish an empty schedule");
  }

  return { generatedAt: now.toISOString(), days, movies };
}
