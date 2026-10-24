import type { Screening } from "./types";

const CHANGEOVER_MINUTES = 15;

export function timeToMinutes(time: string): number {
  const [h = "0", m = "0"] = time.split(":");
  return Number(h) * 60 + Number(m);
}

/**
 * Puts each screening in its hall's lane (the hall's index in `halls`).
 * Screenings without a known hall get a greedy swimlane: a lane is free when
 * its previous screening (runtime + changeover) has ended, and if every lane
 * is busy, the one that frees up first is reused so cards overlap as little
 * as possible.
 */
export function assignLanes<T extends { time: string; hall?: string }>(
  screenings: T[],
  runtimeOf: (s: T) => number,
  halls: string[],
): (T & { lane: number })[] {
  const laneEnds = Array<number>(halls.length).fill(0);
  return [...screenings]
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
    .map((s) => {
      const start = timeToMinutes(s.time);
      let lane = halls.indexOf(s.hall ?? "");
      if (lane === -1) lane = laneEnds.findIndex((end) => end <= start);
      if (lane === -1) lane = laneEnds.indexOf(Math.min(...laneEnds));
      laneEnds[lane] = start + runtimeOf(s) + CHANGEOVER_MINUTES;
      return { ...s, lane };
    });
}

export function groupByLane(screenings: Screening[], laneCount: number): Screening[][] {
  const lanes: Screening[][] = Array.from({ length: laneCount }, () => []);
  for (const s of screenings) lanes[s.lane]?.push(s);
  return lanes;
}
