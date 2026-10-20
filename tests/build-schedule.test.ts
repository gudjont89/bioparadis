import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSchedule, type FetchText } from "../scripts/build-schedule";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}.html`, import.meta.url), "utf8");

const fetchFromFixtures: FetchText = async (url) => {
  if (url === "https://bioparadis.is/") return fixture("home");
  if (url.includes("/vidburdir/")) return fixture("event");
  if (url.includes("/mynd/")) return fixture("movie");
  throw new Error(`unexpected url ${url}`);
};

describe("buildSchedule", () => {
  it("assembles days, movies, runtimes, events and lanes", async () => {
    const schedule = await buildSchedule(fetchFromFixtures, new Date("2026-10-20T12:00:00Z"));

    expect(schedule.generatedAt).toBe("2026-10-20T12:00:00.000Z");
    expect(schedule.days).toHaveLength(6);
    expect(schedule.days.reduce((n, d) => n + d.screenings.length, 0)).toBe(35);
    expect(Object.values(schedule.movies).every((m) => m.runtime === 106)).toBe(true);

    const screenings = schedule.days.flatMap((d) => d.screenings);
    expect(new Set(screenings.map((s) => s.id)).size).toBe(screenings.length);
    expect(screenings.every((s) => s.lane >= 0 && s.lane <= 2)).toBe(true);
    expect(screenings.some((s) => s.events.includes("party"))).toBe(true);
  });

  it("falls back to the default runtime when a detail page fails", async () => {
    const schedule = await buildSchedule(async (url) => {
      if (url.includes("/mynd/")) throw new Error("boom");
      return fetchFromFixtures(url);
    });
    expect(Object.values(schedule.movies).every((m) => m.runtime === 90)).toBe(true);
  });

  it("rejects a blocked homepage instead of producing an empty schedule", async () => {
    await expect(buildSchedule(async () => "<html>Sorry, you have been blocked</html>")).rejects.toThrow();
  });

  it("rejects when days exist but none has screenings", async () => {
    const html = `<a class="getFilms" data-div="shows_2026-10-20"></a><div class="shows" id="shows_2026-10-20"></div>`;
    await expect(buildSchedule(async () => html)).rejects.toThrow(/empty schedule/);
  });
});
