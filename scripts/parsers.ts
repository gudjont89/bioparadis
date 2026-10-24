import * as cheerio from "cheerio";
import type { EventType } from "../src/shared/types";

export interface RawMovie {
  id: string;
  title: string;
  /** Minutes; the API sends null for some films (e.g. new Icelandic releases). */
  runtime: number | null;
  posterUrl: string;
}

export interface RawScreening {
  /** kvikmyndir.is cinema id. */
  cinema: number;
  movieId: string;
  time: string;
  hall: string;
  ticketUrl: string;
}

export interface RawDay {
  date: string;
  movies: RawMovie[];
  screenings: RawScreening[];
}

/** Per-session details the API leaves out, read from the kvikmyndir.is day page. */
export interface SessionExtras {
  /** "ICE SUB" | "ENG SUB", or empty when the page doesn't say. */
  subtitleType: string;
  /** "ICE DUB" | "ENG AUDIO", or empty. */
  audio: string;
  events: EventType[];
}

interface ApiMovie {
  id: number;
  title: string;
  durationMinutes: number | null;
  poster: string | null;
  showtimes: {
    cinema: number;
    schedule: { time: string; hall: string; purchase_url: string }[];
  }[];
}

/**
 * Parses one `/api/v2/showtimes` response, keeping only the given cinemas' sessions.
 * The API repeats some sessions verbatim, so they are de-duplicated by ticket
 * URL. Throws on anything that isn't a showtimes response (e.g. an error body).
 */
export function parseShowtimes(json: string, cinemaIds: number[]): RawDay {
  const body = JSON.parse(json) as { date?: string; data?: ApiMovie[] };
  if (!body.date || !Array.isArray(body.data)) throw new Error(`Unexpected showtimes response: ${json.slice(0, 200)}`);

  const movies: RawMovie[] = [];
  const screenings: RawScreening[] = [];
  const seen = new Set<string>();
  for (const m of body.data) {
    const sessions = m.showtimes
      .filter((c) => cinemaIds.includes(c.cinema))
      .flatMap((c) => c.schedule.map((s) => ({ ...s, cinema: c.cinema })));
    if (sessions.length === 0) continue;
    const movieId = String(m.id);
    movies.push({
      id: movieId,
      title: m.title.replace(/\u00ad/g, "").trim(),
      runtime: m.durationMinutes || null,
      // Films without a poster come back as null or as the bare directory, ".../poster/".
      posterUrl: !m.poster || m.poster.endsWith("/") ? "" : m.poster,
    });
    for (const s of sessions) {
      const key = s.purchase_url || `${movieId}_${s.time}`;
      if (seen.has(key)) continue;
      seen.add(key);
      screenings.push({
        cinema: s.cinema,
        movieId,
        // Some cinemas write "17.50".
        time: s.time.trim().replace(".", ":").padStart(5, "0"),
        hall: s.hall.trim(),
        ticketUrl: s.purchase_url,
      });
    }
  }
  return { date: body.date, movies, screenings };
}

/**
 * Reads subtitles and event tags for every session on a `/bio/syningatimar/`
 * page, keyed by ticket URL (the same URLs the API returns).
 */
export function parseDayPage(html: string): Map<string, SessionExtras> {
  const $ = cheerio.load(html);
  const extras = new Map<string, SessionExtras>();
  $("a.st-showtime-link[href]").each((_, a) => {
    const link = $(a);
    // Tooltip lines: "Búin kl. ~19:18", "Salur: Salur 1", "Íslenskur texti", <tags>, "Smelltu til að kaupa miða"
    const tip = link.parent().attr("data-tip") ?? "";
    // The audio tag sits in the link itself: "ÍSL TAL" (Icelandic dub) or "EN TAL".
    const tegund = link.find(".tegund").text();
    const tags = link
      .find(".st-badge--tag")
      .toArray()
      .map((b) => $(b).text().trim());
    extras.set(link.attr("href") ?? "", {
      subtitleType: /Íslenskur texti/.test(tip) ? "ICE SUB" : /Enskur texti/.test(tip) ? "ENG SUB" : "",
      audio: /ÍSL TAL/.test(tegund) ? "ICE DUB" : /EN TAL/.test(tegund) ? "ENG AUDIO" : "",
      events: [...new Set(tags.flatMap(eventsFromTag))],
    });
  });
  return extras;
}

const TAG_TO_EVENT: [RegExp, EventType][] = [
  [/parti|party|midnaetur/, "party"],
  [/svartir sunnudagar/, "blackSunday"],
  [/midvikudags/, "wednesday"],
  [/biotek/, "biotekid"],
  [/thysk|german/, "german"],
  [/fransk|fronsk|french/, "french"],
];

/** Maps a free-text event tag to events. Tags are inconsistently accented ("Tonlist", "Partísýning"), so fold first. */
export function eventsFromTag(tag: string): EventType[] {
  const folded = tag
    .toLowerCase()
    .replace(/þ/g, "th")
    .replace(/ð/g, "d")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return TAG_TO_EVENT.filter(([re]) => re.test(folded)).map(([, event]) => event);
}
