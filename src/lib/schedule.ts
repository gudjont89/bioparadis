import type { Schedule } from "../shared/types";

export async function loadSchedule(): Promise<Schedule> {
  const res = await fetch(`${import.meta.env.BASE_URL}schedule.json`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load schedule (${res.status})`);
  return (await res.json()) as Schedule;
}
