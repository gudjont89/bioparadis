import { colorForMovie } from "../src/shared/colors";
import { assignLanes } from "../src/shared/lanes";
import type { Day, Movie, Schedule, Screening } from "../src/shared/types";
import { parseDayPage, parseShowtimes, type SessionExtras } from "./parsers";

const DEFAULT_RUNTIME = 90;
const SITE_URL = "https://kvikmyndir.is";
const API_URL = `${SITE_URL}/api/v2`;
/** kvikmyndir.is cinema id for Bíó Paradís. */
const BIO_PARADIS = 5;
/** The site and API publish today plus 21 days. */
const DAYS_AHEAD = 22;

export type FetchText = (url: string, headers?: Record<string, string>) => Promise<string>;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/þ/g, "th")
    .replace(/ð/g, "d")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Sessions, halls and runtimes come from the API. The API has no subtitles or
 * event tags, so those come from the matching day page; if a page fails, that
 * day's sessions just go without them.
 */
export async function buildSchedule(fetchText: FetchText, apiKey: string, now = new Date()): Promise<Schedule> {
  const movies: Record<string, Movie> = {};
  const days: Day[] = [];

  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const fetched = await Promise.all([
      fetchText(`${API_URL}/showtimes?offset=${offset}`, { Authorization: `Bearer ${apiKey}` }),
      fetchText(`${SITE_URL}/bio/syningatimar/?dagur=${offset}`, { Cookie: "kvik_lang=is" }).then(
        parseDayPage,
        (err: Error) => {
          console.warn(`warn: day page ${offset} failed: ${err.message}`);
          return new Map<string, SessionExtras>();
        },
      ),
    ]).catch((err: Error) => {
      // Today is required; a later failure just shortens the horizon rather than
      // showing a gap that looks like "no screenings".
      if (offset === 0) throw err;
      console.warn(`warn: showtimes offset ${offset} failed, stopping: ${err.message}`);
      return null;
    });
    if (!fetched) break;
    const [json, extras] = fetched;

    const raw = parseShowtimes(json, BIO_PARADIS);
    for (const m of raw.movies) {
      movies[m.id] ??= {
        id: m.id,
        slug: slugify(m.title),
        title: m.title,
        runtime: m.runtime ?? DEFAULT_RUNTIME,
        posterUrl: m.posterUrl,
        detailUrl: `${SITE_URL}/mynd/?id=${m.id}`,
        color: colorForMovie(m.id),
      };
    }

    const laned = assignLanes(raw.screenings, (s) => movies[s.movieId]?.runtime ?? DEFAULT_RUNTIME);
    const screenings: Screening[] = laned.map((s) => ({
      id: s.ticketUrl || `${s.movieId}_${raw.date}_${s.time}`,
      movieId: s.movieId,
      date: raw.date,
      time: s.time,
      hall: s.hall,
      subtitleType: extras.get(s.ticketUrl)?.subtitleType ?? "",
      ticketUrl: s.ticketUrl,
      events: extras.get(s.ticketUrl)?.events ?? [],
      lane: s.lane,
    }));
    days.push({ date: raw.date, screenings });
  }

  // Far-off days are often empty only because times aren't published yet.
  while (days.length > 0 && days.at(-1)?.screenings.length === 0) days.pop();
  if (days.length === 0) {
    throw new Error("Found no screenings; refusing to publish an empty schedule");
  }

  return { generatedAt: now.toISOString(), days, movies };
}
