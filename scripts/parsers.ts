import * as cheerio from "cheerio";
import type { EventType } from "../src/shared/types";

export interface RawScreening {
  movieId: string;
  movieSlug: string;
  movieTitle: string;
  posterUrl: string;
  detailUrl: string;
  time: string;
  subtitleType: string;
  ticketUrl: string;
  /** Overlay label on the poster, e.g. "PARTÍSÝNING". */
  eventLabel: string;
}

export interface RawDay {
  date: string;
  screenings: RawScreening[];
}

export interface EventPageInfo {
  slug: string;
  url: string;
  eventType: EventType | null;
}

/**
 * Parses every dated day section on the homepage. The "DAGSKRÁ" tab
 * (`shows_ALLT`) is not a date and is skipped. Throws if no day sections are
 * found, so a changed layout fails loudly instead of publishing an empty
 * schedule.
 */
export function parseHomepage(html: string): RawDay[] {
  const $ = cheerio.load(html);
  const days: RawDay[] = [];
  const seen = new Set<string>();

  $("a.getFilms[data-div]").each((_, tab) => {
    const divId = $(tab).attr("data-div") ?? "";
    const date = /^shows_(\d{4}-\d{2}-\d{2})$/.exec(divId)?.[1];
    if (!date || seen.has(date)) return;
    seen.add(date);

    const section = $(`[id="${divId}"]`).first();
    const screenings = section
      .find('li:has(a[href*="/mynd/"])')
      .toArray()
      .flatMap((li) => parseMovieBlock($, li));
    days.push({ date, screenings });
  });

  if (days.length === 0) throw new Error("No date tabs found on homepage");
  return days;
}

function parseMovieBlock($: cheerio.CheerioAPI, el: Parameters<typeof $>[0]): RawScreening[] {
  const block = $(el);
  const detailUrl = block.find('a[href*="/mynd/"]').first().attr("href");
  const idSlug = detailUrl && /\/mynd\/(\d+)_([^/]+)\/?/.exec(detailUrl);
  if (!detailUrl || !idSlug) return [];
  const [, movieId = "", movieSlug = ""] = idSlug;

  const movieTitle = block.find("h4").first().text().trim();
  if (!movieTitle) return [];

  const posterUrl =
    block.find('img[src*="mycloudcinema"]').first().attr("src") ??
    block.find("img").first().attr("src") ??
    "";
  const eventLabel = block.find("span.event").first().text().trim();

  return block
    .find("ul.timar > li")
    .toArray()
    .flatMap((item) => {
      const li = $(item);
      const time = /(\d{1,2}:\d{2})/.exec(li.find("div.top-showtime").first().contents().first().text())?.[1];
      if (!time) return [];
      const href = li.find("div.bottom-buy-ticket a").first().attr("href") ?? "";
      return [
        {
          movieId,
          movieSlug,
          movieTitle,
          posterUrl,
          detailUrl,
          time: time.padStart(5, "0"),
          subtitleType: li.find("span.sub").first().text().trim(),
          ticketUrl: href.startsWith("javascript:") ? "" : href,
          eventLabel,
        },
      ];
    });
}

const SLUG_TO_EVENT: Record<string, EventType> = {
  partisyningar: "party",
  "svartir-sunnudagar": "blackSunday",
  midvikudagsbio: "wednesday",
  biotekid: "biotekid",
};

const KEYWORD_TO_EVENT: [string, EventType][] = [
  ["thyskir", "german"],
  ["german", "german"],
  ["fronsk", "french"],
  ["french", "french"],
];

function eventTypeForSlug(slug: string): EventType | null {
  const known = SLUG_TO_EVENT[slug];
  if (known) return known;
  const lower = slug.toLowerCase();
  return KEYWORD_TO_EVENT.find(([keyword]) => lower.includes(keyword))?.[1] ?? null;
}

/** Event/festival pages linked from the nav ("Viðburðir"), de-duplicated by slug. */
export function parseEventPages(html: string): EventPageInfo[] {
  const $ = cheerio.load(html);
  const bySlug = new Map<string, EventPageInfo>();
  $('a[href*="/vidburdir/"]').each((_, a) => {
    const url = $(a).attr("href") ?? "";
    const slug = /\/vidburdir\/([^/]+)\/?/.exec(url)?.[1];
    if (slug && !bySlug.has(slug)) {
      bySlug.set(slug, { slug, url, eventType: eventTypeForSlug(slug) });
    }
  });
  return [...bySlug.values()];
}

export function parseTicketUrls(html: string): string[] {
  const $ = cheerio.load(html);
  const urls = $('a[href*="tickets.bioparadis.is/#/book/"]')
    .toArray()
    .map((a) => $(a).attr("href") ?? "");
  return [...new Set(urls)];
}

export function parseRuntime(html: string): number | null {
  const $ = cheerio.load(html);
  const match = /Lengd:\s*(\d+)\s*mín/.exec($("body").text());
  return match?.[1] ? Number(match[1]) : null;
}

/** Maps the poster overlay label to events. Kept loose: labels are free text. */
export function eventsFromLabel(label: string): EventType[] {
  const lower = label.toLowerCase();
  if (!lower) return [];
  if (lower.includes("partí") || lower.includes("party")) return ["party"];
  if (lower.includes("svartir") || lower.includes("sunnudag")) return ["blackSunday"];
  if (lower.includes("miðvikudag")) return ["wednesday"];
  if (lower.includes("bíótekið") || lower.includes("biotekid")) return ["biotekid"];
  if (lower.includes("þýskir") || lower.includes("german")) return ["german"];
  if (/fronskir|french|frönsk|franska/.test(lower)) return ["french"];
  if (lower.includes("kvöldstund")) return ["party"]; // "Kvöldstund með..." events
  return [];
}
