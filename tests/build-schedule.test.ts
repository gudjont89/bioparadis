import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSchedule, type FetchText } from "../scripts/build-schedule";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const emptyDay = (offset: number) => JSON.stringify({ date: `2026-11-${String(offset).padStart(2, "0")}`, data: [] });

/** Serves the fixtures for today and empty responses for every later day. */
const fetchFromFixtures: FetchText = async (url, headers) => {
  if (url.includes("/api/v2/showtimes")) {
    if (headers?.Authorization !== "Bearer test-key") throw new Error("401 Unauthorized");
    const offset = Number(new URL(url).searchParams.get("offset"));
    return offset === 0 ? fixture("showtimes.json") : emptyDay(offset);
  }
  if (url.includes("/bio/syningatimar/")) return fixture("syningatimar.html");
  throw new Error(`unexpected url ${url}`);
};

describe("buildSchedule", () => {
  it("assembles days, movies, halls, subtitles, events and lanes", async () => {
    const schedule = await buildSchedule(fetchFromFixtures, "test-key", new Date("2026-10-24T12:00:00Z"));

    expect(schedule.generatedAt).toBe("2026-10-24T12:00:00.000Z");
    expect(schedule.days.map((d) => d.date)).toEqual(["2026-10-24"]); // trailing empty days dropped
    const screenings = schedule.days[0]?.screenings ?? [];
    expect(screenings).toHaveLength(12);

    expect(screenings.find((s) => s.ticketUrl.endsWith("/19374"))).toMatchObject({
      id: "https://tickets.bioparadis.is/#/book/19374",
      movieId: "18655",
      date: "2026-10-24",
      time: "18:45",
      hall: "Salur 2",
      subtitleType: "ENG SUB",
      events: [],
      lane: 1,
    });
    expect(screenings.find((s) => s.ticketUrl.endsWith("/18865"))?.events).toEqual(["party"]);
    expect(screenings.every((s) => s.lane === Number(s.hall.slice(-1)) - 1)).toBe(true);

    expect(schedule.movies["18655"]).toMatchObject({
      title: "Fjord",
      slug: "fjord",
      runtime: 146,
      detailUrl: "https://kvikmyndir.is/mynd/?id=18655",
    });
    expect(schedule.movies["18693"]?.slug).toBe("um-timann-og-vatnid");
  });

  it("keeps sessions without subtitles or events when a day page fails", async () => {
    const schedule = await buildSchedule(async (url, headers) => {
      if (url.includes("/bio/syningatimar/")) throw new Error("boom");
      return fetchFromFixtures(url, headers);
    }, "test-key");
    const screenings = schedule.days[0]?.screenings ?? [];
    expect(screenings).toHaveLength(12);
    expect(screenings.every((s) => s.subtitleType === "" && s.events.length === 0)).toBe(true);
  });

  it("stops at the first failing later day instead of leaving a gap", async () => {
    const urls: string[] = [];
    const schedule = await buildSchedule(async (url, headers) => {
      urls.push(url);
      if (url.endsWith("showtimes?offset=1")) throw new Error("503");
      if (url.endsWith("showtimes?offset=2")) return fixture("showtimes.json");
      return fetchFromFixtures(url, headers);
    }, "test-key");
    expect(schedule.days).toHaveLength(1);
    expect(urls.some((u) => u.endsWith("offset=2"))).toBe(false);
  });

  it("rejects when today's showtimes fail (e.g. a bad key)", async () => {
    await expect(buildSchedule(fetchFromFixtures, "wrong-key")).rejects.toThrow(/401/);
  });

  it("rejects an empty schedule", async () => {
    await expect(
      buildSchedule(async (url) => (url.includes("/api/") ? emptyDay(1) : ""), "test-key"),
    ).rejects.toThrow(/empty schedule/);
  });
});
