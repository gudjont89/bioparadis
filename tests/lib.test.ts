import { describe, expect, it } from "vitest";
import { googleCalendarUrl, icsFile, screeningWindow } from "../src/lib/calendar";
import { cinemaById } from "../src/shared/cinemas";
import { cardHeight, hourRange, MIN_CARD_HEIGHT, minuteToY, PX_PER_MIN, TIMELINE_PAD_Y } from "../src/lib/layout";
import { dayLabel, endTime, formatMinutes, hasStarted, reykjavikNow } from "../src/lib/time";
import { readTracking, toggled } from "../src/lib/tracking";
import type { Movie, Screening } from "../src/shared/types";

const bioParadis = cinemaById("bioparadis");
const laugarasbio = cinemaById("laugarasbio");
const movie: Movie = {
  id: "1", slug: "pillion", title: "Pillion, The Film", runtime: 121,
  posterUrl: "", detailUrl: "", color: "#000000",
};
const screening: Screening = {
  id: "https://tickets.bioparadis.is/#/book/1", cinemaId: "bioparadis", movieId: "1", date: "2026-10-23", time: "23:00",
  hall: "Salur 1", subtitleType: "", ticketUrl: "https://tickets.bioparadis.is/#/book/1", events: [], lane: 0,
};

describe("time", () => {
  it("formats minutes with midnight wrap-around", () => {
    expect(formatMinutes(23 * 60 + 30 + 121)).toBe("01:31");
    expect(endTime("23:00", 121)).toBe("01:01");
  });

  it("labels days", () => {
    expect(dayLabel("2026-10-20")).toBe("Tue 20");
    expect(dayLabel("2026-10-25")).toBe("Sun 25");
  });

  it("reads Reykjavík time regardless of the viewer's zone", () => {
    // Iceland is UTC+0 year-round
    expect(reykjavikNow(new Date("2026-07-01T23:59:00Z"))).toEqual({ date: "2026-07-01", minutes: 23 * 60 + 59 });
    expect(reykjavikNow(new Date("2026-01-01T00:00:00Z"))).toEqual({ date: "2026-01-01", minutes: 0 });
  });

  it("knows whether a screening has started", () => {
    const now = { date: "2026-10-20", minutes: 18 * 60 };
    expect(hasStarted("2026-10-19", "23:00", now)).toBe(true);
    expect(hasStarted("2026-10-20", "17:59", now)).toBe(true);
    expect(hasStarted("2026-10-20", "18:01", now)).toBe(false);
    expect(hasStarted("2026-10-21", "14:00", now)).toBe(false);
  });
});

describe("calendar", () => {
  it("computes an end time that crosses midnight", () => {
    const { start, end } = screeningWindow(screening, movie.runtime);
    expect(start.toISOString()).toBe("2026-10-23T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-24T01:01:00.000Z");
  });

  it("builds a Google Calendar template URL", () => {
    const url = new URL(googleCalendarUrl(screening, movie, bioParadis));
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe("Bíó Paradís: Pillion, The Film");
    expect(url.searchParams.get("dates")).toBe("20261023T230000Z/20261024T010100Z");
    expect(url.searchParams.get("location")).toBe("Hverfisgata 54, 101 Reykjavík");
    expect(url.searchParams.get("details")).toContain("book/1");
  });

  it("builds a valid, escaped .ics file", () => {
    const ics = icsFile(screening, movie, bioParadis, new Date("2026-10-20T12:00:00Z"));
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261023T230000Z");
    expect(ics).toContain("DTEND:20261024T010100Z");
    expect(ics).toContain("SUMMARY:Bíó Paradís: Pillion\\, The Film");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });

  it("uses the screening's cinema for the title and location", () => {
    const url = new URL(googleCalendarUrl(screening, movie, laugarasbio));
    expect(url.searchParams.get("text")).toBe("Laugarásbíó: Pillion, The Film");
    expect(url.searchParams.get("location")).toBe("Laugarási, 104 Reykjavík");
  });
});

describe("vertical layout", () => {
  it("scales card height with runtime but never below the minimum", () => {
    expect(cardHeight(100)).toBeCloseTo(100 * PX_PER_MIN);
    expect(cardHeight(10)).toBe(MIN_CARD_HEIGHT);
  });

  it("maps minutes to a y offset from the first visible hour", () => {
    expect(minuteToY(13 * 60, 13 * 60)).toBe(TIMELINE_PAD_Y);
    expect(minuteToY(14 * 60, 13 * 60)).toBeCloseTo(TIMELINE_PAD_Y + 60 * PX_PER_MIN);
  });
});

describe("hourRange", () => {
  it("defaults to 13-24 and widens for late screenings", () => {
    expect(hourRange([], {})).toEqual({ start: 13, end: 24 });
    // 23:00 + 121 min ends 01:01 -> 25:01 -> ceil 26
    expect(hourRange([screening], { 1: movie })).toEqual({ start: 13, end: 26 });
    expect(hourRange([{ ...screening, time: "11:30" }], { 1: movie })).toEqual({ start: 11, end: 24 });
  });
});

describe("tracking", () => {
  it("toggles a status on and off, and switches between statuses", () => {
    const want = toggled({}, "1", "want");
    expect(want).toEqual({ "1": "want" });
    expect(toggled(want, "1", "want")).toEqual({});
    expect(toggled(want, "1", "seen")).toEqual({ "1": "seen" });
  });

  it("reads stored tracking defensively", () => {
    const store = (raw: string | null) => ({ getItem: () => raw });
    expect(readTracking(store('{"1":"want","2":"bogus"}'))).toEqual({ "1": "want" });
    expect(readTracking(store("not json"))).toEqual({});
    expect(readTracking(store("null"))).toEqual({});
    expect(readTracking(store(null))).toEqual({});
  });
});
