import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSchedule, type FetchText } from "./build-schedule";

const USER_AGENT = "bioparadis-schedule-viewer/0.2 (personal project; schedule scraper)";

// Locally the key lives in .env; in CI it comes from the KVIKMYNDIR_API_KEY secret.
try {
  process.loadEnvFile(resolve(dirname(fileURLToPath(import.meta.url)), "../.env"));
} catch {
  // no .env file
}
const apiKey = process.env.KVIKMYNDIR_API_KEY;
if (!apiKey) throw new Error("KVIKMYNDIR_API_KEY is not set (see .env.example)");

const fetchText: FetchText = async (url, headers) => {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
};

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../public/schedule.json");

// Any thrown error exits non-zero without touching the output, so CI fails
// and the previously deployed schedule stays live.
const schedule = await buildSchedule(fetchText, apiKey);
await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(schedule, null, 2) + "\n");

const count = schedule.days.reduce((n, d) => n + d.screenings.length, 0);
console.log(`Wrote ${out}: ${schedule.days.length} days, ${count} screenings, ${Object.keys(schedule.movies).length} movies`);
