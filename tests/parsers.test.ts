import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  eventsFromLabel,
  parseEventPages,
  parseHomepage,
  parseRuntime,
  parseTicketUrls,
} from "../scripts/parsers";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}.html`, import.meta.url), "utf8");
const home = fixture("home");

describe("parseHomepage", () => {
  const days = parseHomepage(home);

  it("returns the six dated days and skips the DAGSKRÁ tab", () => {
    expect(days.map((d) => d.date)).toEqual([
      "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25",
    ]);
  });

  it("finds every showtime in each day section", () => {
    expect(days.map((d) => d.screenings.length)).toEqual([8, 7, 7, 5, 7, 1]);
  });

  it("extracts movie, time, subtitle and ticket fields", () => {
    expect(days[0]?.screenings[0]).toMatchObject({
      movieId: "911",
      movieSlug: "um-t-mann-og-vatni-time-and-water-",
      movieTitle: "Um tímann og vatnið (Time and Water)",
      time: "16:40",
      subtitleType: "ENG SUB",
      ticketUrl: "https://tickets.bioparadis.is/#/book/19347",
    });
    expect(days[0]?.screenings[0]?.posterUrl).toContain("mycloudcinema.com/media/posters/911/");
  });

  it("reads poster overlay labels", () => {
    const labels = new Set(days.flatMap((d) => d.screenings.map((s) => s.eventLabel)));
    expect(labels).toContain("PARTÍSÝNING");
    expect(labels).toContain("SVARTIR SUNNUDAGAR");
  });

  it("keeps showtimes that have no ticket link (empty ticketUrl)", () => {
    const all = days.flatMap((d) => d.screenings);
    expect(all.filter((s) => s.ticketUrl === "").length).toBeGreaterThan(0);
  });

  it("throws when the page has no date tabs (e.g. a Cloudflare block page)", () => {
    expect(() => parseHomepage("<html><body>Sorry, you have been blocked</body></html>")).toThrow(/No date tabs/);
  });
});

describe("parseEventPages", () => {
  const pages = parseEventPages(home);

  it("de-duplicates by slug", () => {
    const slugs = pages.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("maps known series to event types", () => {
    const type = (slug: string) => pages.find((p) => p.slug === slug)?.eventType;
    expect(type("partisyningar")).toBe("party");
    expect(type("svartir-sunnudagar")).toBe("blackSunday");
    expect(type("midvikudagsbio")).toBe("wednesday");
    expect(type("biotekid")).toBe("biotekid");
  });

  it("leaves unknown festivals unmapped", () => {
    expect(pages.find((p) => p.slug === "japanskt-horror-fest")?.eventType).toBeNull();
  });
});

describe("other parsers", () => {
  it("parseTicketUrls returns unique ticket links", () => {
    const urls = parseTicketUrls(fixture("event"));
    expect(urls.length).toBeGreaterThan(0);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((u) => u.startsWith("https://tickets.bioparadis.is/#/book/"))).toBe(true);
  });

  it("parseRuntime reads the Lengd field", () => {
    expect(parseRuntime(fixture("movie"))).toBe(106);
    expect(parseRuntime("<body>no runtime here</body>")).toBeNull();
  });

  it("eventsFromLabel maps poster labels", () => {
    expect(eventsFromLabel("PARTÍSÝNING")).toEqual(["party"]);
    expect(eventsFromLabel("SVARTIR SUNNUDAGAR")).toEqual(["blackSunday"]);
    expect(eventsFromLabel("Miðvikudagsbíó")).toEqual(["wednesday"]);
    expect(eventsFromLabel("BÍÓTEKIÐ")).toEqual(["biotekid"]);
    expect(eventsFromLabel("Kvöldstund með...")).toEqual(["party"]);
    expect(eventsFromLabel("Síðustu sýningar!")).toEqual([]);
    expect(eventsFromLabel("")).toEqual([]);
  });
});
