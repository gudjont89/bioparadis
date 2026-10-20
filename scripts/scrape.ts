import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSchedule, type FetchText } from "./build-schedule";

// Cloudflare blocks browser-spoofed User-Agents but serves honest ones.
const USER_AGENT = "bioparadis-schedule-viewer/0.1 (personal project; schedule scraper)";

const fetchText: FetchText = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
};

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../public/schedule.json");

// Any thrown error exits non-zero without touching the output, so CI fails
// and the previously deployed schedule stays live.
const schedule = await buildSchedule(fetchText);
await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(schedule, null, 2) + "\n");

const count = schedule.days.reduce((n, d) => n + d.screenings.length, 0);
console.log(`Wrote ${out}: ${schedule.days.length} days, ${count} screenings, ${Object.keys(schedule.movies).length} movies`);
