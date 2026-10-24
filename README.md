# Bíó Paradís schedule

A Gantt-style timeline of the weekly screenings at [Bíó Paradís](https://bioparadis.is) (Reykjavík): three swimlanes, event badges, per-movie tracking (want / seen / skip), and add-to-calendar. A static site (Vite + Preact + TypeScript) that installs as a PWA.

## How it works

Showtimes come from the [Kvikmyndir.is API](https://kvikmyndir.is/forritaskil/). Its key must stay secret, so the browser never calls it. Instead:

1. A scheduled GitHub Action runs `scripts/scrape.ts` and writes `public/schedule.json`.
2. The site is built with that file and deployed to GitHub Pages.
3. The browser only ever loads `schedule.json` from the same origin.

If the scrape fails (bad key, API down, empty schedule) the job exits non-zero **before deploy**, so the previously published schedule stays live.

```
scripts/        scraper: parsers.ts (API JSON + HTML → raw data), build-schedule.ts (pipeline), scrape.ts (CLI)
src/shared/     types and logic shared by scraper and site (lane assignment, colors, events)
src/            the Preact app (components/, lib/)
tests/          vitest; parsers run against a real API response and day page in tests/fixtures/
docs/           reference-ui.html (original prototype)
```

## Development

```sh
npm install
cp .env.example .env   # then paste your API key into .env
npm run scrape     # fetch live data into public/schedule.json (gitignored)
npm run dev        # http://localhost:5173
npm test
npm run build      # typecheck + production build into dist/
```

Tracking is stored in `localStorage` (`bp_tr`), all behind `useTracking()` in `src/lib/tracking.ts`, which is where Firebase sync would plug in.

## Deploying

Repo settings → Pages → Source: **GitHub Actions**. Add the API key as a repository secret named `KVIKMYNDIR_API_KEY` (Settings → Secrets and variables → Actions). The workflow in `.github/workflows/deploy.yml` runs on push to `master`, every few hours, and manually. GitHub pauses scheduled workflows after 60 days without repo activity.

## Scraping notes

- Get a personal API key by signing in at kvikmyndir.is and creating one under Stillingar (60 requests/min, 10,000/day). The terms ask for attribution and a link back to the film page, which the footer and the detail sheet's title provide.
- Each scrape makes 22 API calls (`/showtimes?offset=0..21`, filtered to Bíó Paradís, cinema id 5) and fetches 22 `/bio/syningatimar/?dagur=N` pages. The API has halls, runtimes and ticket URLs but no subtitles or event tags; those are read from the day pages and matched by ticket URL. If a day page fails, that day's sessions just lack subtitles and badges.
- Each hall (Salur 1–3) is a lane on the timeline. Sessions with an unknown hall fall back to the greedy lane assignment.
- The API's `language` field is the spoken language (e.g. `NO`, `KR`), not subtitles, so it isn't used.
- Event tags are free text with inconsistent accents (`midnaetursyningar`, `Partísýning`); `eventsFromTag` in `scripts/parsers.ts` maps them. Unmapped tags (e.g. `Tonlist`, `italskir kvikmyndadagar`) are ignored.
- `public/logos/` holds the cinemas' logos, downloaded from kvikmyndir.is (`/wp-content/themes/kvikmyndir/images/logo_<name>.png`). They are the cinemas' trademarks, used only to identify them.
- Refresh `tests/fixtures/` by saving one day's API response and the matching day page at the same time, so their sessions agree.
