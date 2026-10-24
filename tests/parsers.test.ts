import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { eventsFromTag, parseDayPage, parseShowtimes } from "../scripts/parsers";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

describe("parseShowtimes", () => {
  const day = parseShowtimes(fixture("showtimes.json"), [5]);

  it("reads the date and keeps only the requested cinema", () => {
    expect(day.date).toBe("2026-10-24");
    expect(day.screenings.every((s) => s.ticketUrl.startsWith("https://tickets.bioparadis.is/"))).toBe(true);
  });

  it("drops sessions the API repeats verbatim", () => {
    // The Invite 21:30 appears twice in the response.
    expect(day.screenings).toHaveLength(12);
    expect(new Set(day.screenings.map((s) => s.ticketUrl)).size).toBe(12);
  });

  it("extracts movie and session fields", () => {
    expect(day.movies.find((m) => m.id === "18655")).toEqual({
      id: "18655",
      title: "Fjord",
      runtime: 146,
      posterUrl: "https://kvikmyndir.is/images/poster/18655_500.jpg",
    });
    expect(day.screenings.find((s) => s.ticketUrl.endsWith("/19373"))).toEqual({
      cinema: 5,
      movieId: "18655",
      time: "16:30",
      hall: "Salur 1",
      ticketUrl: "https://tickets.bioparadis.is/#/book/19373",
    });
  });

  it("keeps several cinemas, tagged with their ids", () => {
    const both = parseShowtimes(fixture("showtimes.json"), [5, 4]);
    expect(both.screenings.filter((s) => s.cinema === 5)).toHaveLength(12);
    expect(both.screenings.filter((s) => s.cinema === 4)).toHaveLength(15);
    expect(both.screenings.find((s) => s.ticketUrl.endsWith("/19210"))).toMatchObject({
      cinema: 4,
      movieId: "18315", // Clayface
      time: "20:00",
      hall: "AXL",
    });
  });

  it("trims titles", () => {
    expect(day.movies.find((m) => m.id === "18486")?.title).toBe("Fuglar (og menn)");
  });

  it("normalises dotted times, missing runtimes and empty posters", () => {
    const json = JSON.stringify({
      date: "2026-10-30",
      data: [
        {
          id: 18883,
          title: "Ic\u00adeg\u00adu\u00adys",
          durationMinutes: null,
          poster: null, // as the API sends it for IceGuys
          showtimes: [{ cinema: 5, schedule: [{ time: "9.50", hall: "Salur 1", purchase_url: "u" }] }],
        },
      ],
    });
    const { movies, screenings } = parseShowtimes(json, [5]);
    expect(movies[0]).toMatchObject({ title: "Iceguys", runtime: null, posterUrl: "" });
    expect(screenings[0]?.time).toBe("09:50");
  });

  it("throws on an error body", () => {
    expect(() => parseShowtimes('{"error":{"status":401,"code":"missing_key"}}', [5])).toThrow(/Unexpected/);
  });
});

describe("parseDayPage", () => {
  const extras = parseDayPage(fixture("syningatimar.html"));
  const get = (id: number) => extras.get(`https://tickets.bioparadis.is/#/book/${id}`);

  it("reads subtitles from the session tooltip", () => {
    expect(get(19373)?.subtitleType).toBe("ICE SUB"); // Fjord 16:30
    expect(get(19374)?.subtitleType).toBe("ENG SUB"); // Fjord 18:45
    expect(get(19551)?.subtitleType).toBe(""); // Tony: no subtitle line
  });

  it("maps event tags", () => {
    expect(get(18865)?.events).toEqual(["party"]); // Rocky Horror, Partísýning
    expect(get(19405)?.events).toEqual(["party"]); // Camp Miasma, midnaetursyningar
    expect(get(19373)?.events).toEqual([]);
  });

  it("covers every Bíó Paradís session the API returns for the same day", () => {
    const api = parseShowtimes(fixture("showtimes.json"), [5]);
    expect(api.screenings.every((s) => extras.has(s.ticketUrl))).toBe(true);
  });
});

describe("eventsFromTag", () => {
  it.each([
    ["Partísýning", ["party"]],
    ["midnaetursyningar", ["party"]],
    ["Svartir sunnudagar", ["blackSunday"]],
    ["Midvikudagsbio", ["wednesday"]],
    ["Bíótekið", ["biotekid"]],
    ["Þýskir kvikmyndadagar", ["german"]],
    ["Franskir kvikmyndadagar", ["french"]],
    ["Tonlist", []],
    ["italskir kvikmyndadagar", []],
  ])("%s", (tag, events) => {
    expect(eventsFromTag(tag)).toEqual(events);
  });
});
