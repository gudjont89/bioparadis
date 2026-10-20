import { describe, expect, it } from "vitest";
import { colorForMovie } from "../src/shared/colors";
import { assignLanes } from "../src/shared/lanes";

describe("assignLanes", () => {
  const runtimeOf = (s: { runtime: number }) => s.runtime;

  it("puts overlapping screenings in different lanes", () => {
    const out = assignLanes(
      [
        { time: "18:00", runtime: 100 },
        { time: "18:30", runtime: 100 },
        { time: "19:00", runtime: 100 },
      ],
      runtimeOf,
    );
    expect(out.map((s) => s.lane)).toEqual([0, 1, 2]);
  });

  it("reuses a lane once runtime plus 15 min changeover has passed", () => {
    const out = assignLanes(
      [
        { time: "14:00", runtime: 100 }, // busy until 15:55
        { time: "15:55", runtime: 90 },
        { time: "15:54", runtime: 90 },
      ],
      runtimeOf,
    );
    expect(out.map((s) => [s.time, s.lane])).toEqual([
      ["14:00", 0],
      ["15:54", 1],
      ["15:55", 0],
    ]);
  });

  it("falls back to the lane that frees up first when all are busy", () => {
    const out = assignLanes(
      [
        { time: "18:00", runtime: 200 },
        { time: "18:00", runtime: 100 },
        { time: "18:00", runtime: 150 },
        { time: "18:10", runtime: 90 },
      ],
      runtimeOf,
    );
    expect(out[3]?.lane).toBe(1); // lane 1 ends first (18:00 + 115)
  });

  it("does not mutate its input", () => {
    const input = [{ time: "20:00", runtime: 90 }, { time: "14:00", runtime: 90 }];
    assignLanes(input, runtimeOf);
    expect(input[0]?.time).toBe("20:00");
  });
});

describe("colorForMovie", () => {
  it("matches the Java String.hashCode-based palette index of the Android app", () => {
    // "635".hashCode() === 53528; 53528 % 16 === 8
    expect(colorForMovie("635")).toBe("#8A2C6E");
  });

  it("is deterministic and always yields a hex color", () => {
    expect(colorForMovie("911")).toBe(colorForMovie("911"));
    expect(colorForMovie("some-very-long-id-to-overflow-int32-hash")).toMatch(/^#[0-9A-F]{6}$/);
  });
});
