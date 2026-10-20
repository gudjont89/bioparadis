# Bíó Paradís schedule

A Gantt-style timeline of the weekly screenings at [Bíó Paradís](https://bioparadis.is) (Reykjavík): three swimlanes, event badges, per-movie tracking (want / seen / skip), and add-to-calendar. A static site (Vite + Preact + TypeScript) that installs as a PWA.

## How it works

bioparadis.is sends no CORS headers, so a browser can't fetch it directly. Instead:

1. A scheduled GitHub Action runs `scripts/scrape.ts` (cheerio) and writes `public/schedule.json`.
2. The site is built with that file and deployed to GitHub Pages.
3. The browser only ever loads `schedule.json` from the same origin.

If the scrape fails (site blocks the runner, layout changed, empty schedule) the job exits non-zero **before deploy**, so the previously published schedule stays live.

```
scripts/        scraper: parsers.ts (HTML → raw data), build-schedule.ts (pipeline), scrape.ts (CLI)
src/shared/     types and logic shared by scraper and site (lane assignment, colors, events)
src/            the Preact app (components/, lib/)
tests/          vitest; parsers run against real HTML in tests/fixtures/
docs/           reference-ui.html (original prototype)
```

## Development

```sh
npm install
npm run scrape     # fetch live data into public/schedule.json (gitignored)
npm run dev        # http://localhost:5173
npm test
npm run build      # typecheck + production build into dist/
```

Tracking is stored in `localStorage` (`bp_tr`), all behind `useTracking()` in `src/lib/tracking.ts`, which is where Firebase sync would plug in.

## Deploying

Repo settings → Pages → Source: **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` runs on push to `master`, every 3 hours, and manually. GitHub pauses scheduled workflows after 60 days without repo activity.

## Scraping notes

- The scraper identifies itself with an honest `User-Agent`. Cloudflare in front of the site returns 403 to browser-spoofed agents but serves honest ones.
- Event badges come from two sources, merged: the poster overlay label on the homepage, and ticket-URL cross-referencing against each event subpage linked in the nav.
- Refresh test fixtures with curl (use the same User-Agent as `scripts/scrape.ts`) when the site's markup changes.
