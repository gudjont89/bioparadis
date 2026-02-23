# Bíó Paradís — Android App Implementation Spec

## 1. Product Overview

A lightweight Android app for browsing the weekly screening schedule at Bíó Paradís (Hverfisgata 54, 101 Reykjavík), featuring a horizontal Gantt-style timeline, Google Calendar integration, and personal movie tracking.

See `reference-ui.html` for the interactive HTML prototype of the target UI.

---

## 2. Core Features

### 2.1 Timeline View (Home Screen)

- **Horizontal date selector** at the top — scrollable chips showing upcoming days (typically 6–7 days). The current day is highlighted with a "Today" sublabel. Days with no screenings show a small dot indicator.
- **Gantt-chart timeline** — the main view area, horizontally scrollable, showing screenings positioned by start time.
  - **3 unnamed swimlanes** (one per screen). Bíó Paradís has 3 screens; hall assignment is not published, so lanes are assigned heuristically by non-overlapping time slots.
  - **Card width** is proportional to runtime (`runtime × pixelsPerMinute`), with a minimum width so short films remain tappable.
  - **Card height is constant** (60dp).
  - Each card shows: **poster thumbnail** (left edge) + **movie title** + **time · runtime**.
  - **Event badges** (emoji) appear in the top-right corner of the card. A card can have **multiple badges** stacked side by side (e.g., 🇩🇪🎉 for a German Film Days + Party screening).
  - A **red "now" indicator line** with a pulsing dot shows the current time on today's view.
- **Auto-scroll**: on today, scroll to the current time minus a small offset. On other days, scroll to the first screening.
- **Empty state**: days with no screenings show a centered "No screenings scheduled" message.

### 2.2 Screening Detail (Bottom Sheet)

Tapping a card opens a bottom sheet / panel containing:

- **Close button** — top-right corner of the panel.
- **Poster** (small), **movie title**, **time range** (start–end), **runtime**.
- **Event pills** — labeled badges for each associated event (e.g., "🇩🇪 German Film Days", "🎉 Partísýning"). Multiple pills if applicable.
- **Action buttons**:
  - **Tickets** — opens the bioparadis.is ticket URL (deep link to the specific screening).
  - **+ Calendar** — fires a Google Calendar intent (see §2.3).
- **Tracking buttons** (see §2.4).
- **"All showtimes"** — a row of tappable chips showing every screening of this movie across all loaded days, each with its day label, time, and any event badges. The currently viewed screening is highlighted. Past screenings appear faded. Each chip links to its ticket URL.

### 2.3 Google Calendar Integration

Use Android's built-in calendar intent — no OAuth required, works with any calendar app:

```kotlin
val intent = Intent(Intent.ACTION_INSERT).apply {
    data = CalendarContract.Events.CONTENT_URI
    putExtra(CalendarContract.Events.TITLE, "Bíó Paradís: $movieTitle")
    putExtra(CalendarContract.Events.EVENT_LOCATION, "Hverfisgata 54, 101 Reykjavík")
    putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, startTimeMillis)
    putExtra(CalendarContract.EXTRA_EVENT_END_TIME, endTimeMillis)
    putExtra(CalendarContract.Events.DESCRIPTION, "Buy tickets: $ticketUrl")
}
startActivity(intent)
```

End time = start time + runtime in minutes.

### 2.4 Movie Tracking

Each movie (not screening) can be assigned one of three statuses, toggled on/off:

| Status | Icon | Effect on card |
|--------|------|----------------|
| **Want to see** | ★ | Subtle gold border glow |
| **Already seen** | ✓ | Dampened: low opacity (~25%), desaturated, dimmed |
| **Not interested** | ✕ | Dampened: same as "seen" |

- Tracking is per-movie, not per-screening — if you mark "Pillion" as seen, all Pillion cards across all days are dampened.
- Dampened cards remain visible and tappable (never hidden).
- Persisted to local storage (SharedPreferences or Room).

---

## 3. Data Architecture

### 3.1 Data Sources

All data is scraped from `bioparadis.is`. No API has been identified (but the ticketing system uses MyCloudCinema — `web.iceland.mycloudcinema.com` — which may expose JSON endpoints; worth investigating via browser devtools).

#### Main schedule: `https://bioparadis.is/`

The homepage has date tabs and a flat list of screenings per day.

**HTML structure per screening:**
```html
<li>
  <a href="/mynd/{id}_{slug}/">
    <img src="https://web.iceland.mycloudcinema.com/media/posters/{id}/1080/{uuid}.jpeg">
    <!-- Optional overlay text for events, e.g.: "SVARTIR SUNNUDAGAR", "Miðvikudagsbíó" -->
  </a>
  <h4><a href="/mynd/{id}_{slug}/">{Movie Title}</a></h4>
  <ul>
    <li>
      {HH:MM} {SUB_TYPE}
      <a href="https://tickets.bioparadis.is/#/book/{ticket_id}">KAUPA</a>
    </li>
    <!-- More showtimes... -->
  </ul>
</li>
```

**Key fields extractable:**
- Movie title
- Poster URL (1080px, hosted on MyCloudCinema CDN)
- Showtime(s) per day
- Subtitle type (ENG SUB, ICE SUB, NO SUB)
- Ticket URL (unique per screening: `tickets.bioparadis.is/#/book/{id}`)
- Movie detail page URL

**The date tabs** are `<li>` elements inside a `<ul>`. The screenings for each date are in separate `<ul>` blocks rendered in order. Note: the site uses JavaScript to show/hide date sections, but the HTML contains all days' data in a single page load.

#### Movie detail page: `https://bioparadis.is/mynd/{id}_{slug}/`

Contains runtime and other metadata:

```
Lengd: 106 mín          → runtime in minutes
Leikstjórn: ...         → director
Aðalhlutverk: ...       → cast
Tegund: Romance, Drama  → genre(s)
Tungumál: english       → language
Framleiðsluár: 2025     → production year
```

Parse runtime from the `Lengd:` field.

#### Event subpages (for badge assignment)

Each recurring event series and festival has its own page listing associated screenings:

| Event | URL | Badge |
|-------|-----|-------|
| Party screenings | `/vidburdir/partisyningar/` | 🎉 |
| Black Sundays | `/vidburdir/svartir-sunnudagar/` | 🖤 |
| Wednesday screenings | `/vidburdir/midvikudagsbio/` | 📅 |
| Bíótekið (Film Museum) | `/vidburdir/biotekid/` | 🎞️ |
| German Film Days 2026 | `/vidburdir/thyskir-kvikmyndadagar-2026/` | 🇩🇪 |
| French Film Days (Jan) | (URL varies by year) | 🇫🇷 |

**Scraping strategy for events:**

1. Scrape each event subpage.
2. Extract all ticket URLs from the page.
3. Build a lookup map: `Map<ticketUrl, List<EventType>>`.
4. When building the main schedule, cross-reference each screening's ticket URL against this lookup to assign event tags.

**This correctly handles multi-event screenings.** Example: Good Bye, Lenin! (ticket `#/book/12761`) appears on both `/vidburdir/partisyningar/` and `/vidburdir/thyskir-kvikmyndadagar-2026/`, so it gets both `party` and `german` tags.

**Discovering festival pages:** The navigation menu lists active festivals under "Viðburðir". Parse the menu to detect new festival URLs dynamically rather than hardcoding them.

### 3.2 Swimlane Assignment

Since screen/hall info isn't published, assign screenings to 3 lanes using a greedy algorithm:

```
for each screening sorted by start time:
  for each lane 0..2:
    if lane is free (last screening's end time ≤ this start time):
      assign to this lane
      break
```

End time = start time + runtime. Add a small buffer (e.g., 15 min) for changeover.

### 3.3 Data Model

```kotlin
data class Movie(
    val id: String,              // e.g., "635"
    val slug: String,            // e.g., "pillion"
    val title: String,
    val runtime: Int,            // minutes
    val posterUrl: String,
    val detailUrl: String,
    val color: Int,              // assigned color for card background
)

data class Screening(
    val movie: Movie,
    val date: LocalDate,
    val time: LocalTime,
    val subtitleType: String,    // "ENG SUB", "ICE SUB", "NO SUB"
    val ticketUrl: String,
    val events: List<EventType>, // can be multiple
    val lane: Int,               // 0, 1, or 2 — assigned after scraping
)

enum class EventType(val emoji: String, val label: String) {
    PARTY("🎉", "Partísýning"),
    BLACK_SUNDAY("🖤", "Svartir Sunnudagar"),
    MIDVIKU("📅", "Miðvikudagsbíó"),
    BIOTEKID("🎞️", "Bíótekið"),
    GERMAN_DAYS("🇩🇪", "German Film Days"),
    FRENCH_DAYS("🇫🇷", "French Film Days"),
}

enum class TrackingStatus { WANT, SEEN, SKIP }
```

### 3.4 Movie Colors

Assign a consistent color to each movie based on its ID (hash to a palette index). Use rich, saturated tones that work as card backgrounds with white text. The prototype uses hand-picked colors; for production, a palette of ~12–16 predefined colors works well.

---

## 4. Technical Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | Kotlin | |
| UI | Jetpack Compose | |
| Architecture | MVVM, single module | |
| Networking | Retrofit + OkHttp | |
| HTML parsing | Jsoup | For scraping bioparadis.is |
| Image loading | Coil | Compose-native |
| Local storage | Room (screenings cache) + DataStore (tracking prefs) | |
| Calendar | `Intent(ACTION_INSERT)` | No auth needed |
| Min SDK | 26 (Android 8.0) | |

### 4.1 Scraping Pipeline

```
1. Fetch homepage HTML               → parse date tabs + all screenings
2. Fetch each event subpage           → build ticketUrl → EventType[] map
3. Fetch each unique movie detail page → extract runtime
4. Cross-reference ticket URLs        → assign event tags
5. Run lane assignment algorithm      → assign lane 0/1/2
6. Cache everything in Room           → show cached data instantly, refresh in background
```

**Refresh strategy:** On app launch, show cached data immediately. Fetch fresh data in background. The bioparadis.is schedule typically changes on Thursday/Friday for the following week. A 1-hour cache TTL is reasonable.

**Error handling:** If scraping fails, show cached data with a "Last updated X ago" indicator. If no cache exists, show an error state with retry.

---

## 5. UI Layout Details

### 5.1 Timeline Dimensions

```
pixelsPerMinute = 2.8dp     (tuned for readability on phone screens)
hourStart = 13              (1 PM — earliest screenings are ~14:00)
hourEnd = 24                (midnight)
totalScrollWidth = (24 - 13) × 60 × 2.8 = 1,848dp
cardHeight = 60dp
laneHeight = 76dp
laneGap = 4dp
minCardWidth = 100dp        (so short films stay tappable)
posterWidth = 42dp          (on the card)
```

### 5.2 Compose Layout Sketch

```
Column {
  // Header: logo + title
  Row { Icon, Column(title, subtitle) }

  // Date chips
  LazyRow { dates.forEach { DateChip(it) } }

  // Timeline
  HorizontalScrollable {
    Box(width = totalScrollWidth) {
      // Grid lines (one per hour)
      // 3 Lane rows
      repeat(3) { laneIndex ->
        Box(height = laneHeight, offset y = ...) {
          screeningsInLane.forEach { screening ->
            MovieCard(
              offset x = (startMinutes - hourStart*60) * pxPerMin,
              width = runtime * pxPerMin,
            )
          }
        }
      }
      // Now indicator
      NowLine(offset x = nowMinutes * pxPerMin)
    }
  }

  // Bottom sheet (detail panel)
  if (selectedScreening != null) {
    ScreeningDetail(screening, onClose, onTrack)
  }
}
```

---

## 6. Edge Cases & Observations

Based on scraping bioparadis.is over multiple days:

### 6.1 Schedule Availability
- Some days show "Dagskráin birtist hér innan skamms / Schedule will be available soon" — the app should treat this as an empty day.
- The schedule window is typically 6–7 days out. Occasionally only 5 days are available.

### 6.2 Same Movie, Multiple Showtimes
- A movie can screen multiple times on the same day (e.g., Pillion at 18:50 AND 21:15 on Sun 22). These are separate screenings with different ticket URLs and potentially different lanes.

### 6.3 Same Movie, Different Events
- The same movie+showtime can belong to multiple event series (e.g., Good Bye, Lenin! at Fri 21:00 is both a Party Screening and a German Film Days screening). The scraping strategy of cross-referencing ticket URLs handles this naturally.

### 6.4 Event Overlay Text (Not Used)
- The homepage sometimes shows overlay text on poster images (e.g., "SVARTIR SUNNUDAGAR", "Miðvikudagsbíó"). **We do NOT use this for event detection** — it's inconsistent and hard to parse from `<img>` overlays. Instead, we scrape the dedicated event subpages which are authoritative.

### 6.5 Dynamic Festival Pages
- Festivals like German Film Days have year-specific URLs (`/vidburdir/thyskir-kvikmyndadagar-2026/`). The app should discover these from the navigation menu rather than hardcoding. The nav menu `<ul>` under "Viðburðir" lists all active event pages.

### 6.6 Wednesday Screenings (Miðvikudagsbíó)
- These are the 14:00 screenings on Wednesdays, aimed at daytime audiences (elderly, shift workers). They are part of a named series but there is no special discount — just the regular matinee time slot with a branded name. Badge: 📅

### 6.7 Poster Image URLs
- Posters come from `https://web.iceland.mycloudcinema.com/media/posters/{movieId}/1080/{uuid}.{ext}`
- Resolution is 1080px tall. For thumbnails, consider requesting a smaller size if the CDN supports it, or just let Coil handle downsampling.

---

## 7. Future Enhancements (Post-MVP)

- **Push notifications** for new films or tracked "want to see" movies
- **Genre/language filters** on the timeline
- **Widget** showing today's screenings on the home screen
- **MyCloudCinema API investigation** — the ticketing system at `tickets.bioparadis.is` and poster CDN at `web.iceland.mycloudcinema.com` suggest a CMS that likely has JSON API endpoints. Check browser devtools Network tab for XHR requests.
- **iCal/RSS feed** — worth checking if bioparadis.is offers one
- **Landscape mode** — the Gantt timeline would benefit from a wider viewport on tablets
