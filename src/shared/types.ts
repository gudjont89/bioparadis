export type EventType =
  | "party"
  | "blackSunday"
  | "wednesday"
  | "biotekid"
  | "german"
  | "french";

export type TrackingStatus = "want" | "seen" | "skip";

export interface Movie {
  id: string;
  slug: string;
  title: string;
  /** Minutes. */
  runtime: number;
  posterUrl: string;
  detailUrl: string;
  /** Card background, `#RRGGBB`. */
  color: string;
}

export interface Cinema {
  /** Key used in schedule.json and localStorage. */
  id: string;
  /** kvikmyndir.is cinema id. */
  kvikId: number;
  name: string;
  /** Calendar event location. */
  location: string;
  /** Hall names as the API writes them, one lane each, in display order. */
  halls: string[];
  /** Path under `public/`. */
  logo: string;
  /**
   * Whether a session with no subtitle line on kvikmyndir.is really has no
   * subtitles. Verified against the cinema's own site for Bíó Paradís only.
   */
  unmarkedMeansNoSubs: boolean;
}

export interface Screening {
  /** Ticket URL when present, otherwise `movieId_date_time`. */
  id: string;
  /** `Cinema.id`. */
  cinemaId: string;
  movieId: string;
  /** `YYYY-MM-DD`, Atlantic/Reykjavik. */
  date: string;
  /** `HH:MM`, Atlantic/Reykjavik. */
  time: string;
  /** e.g. "Salur 1"; empty if unknown. */
  hall: string;
  /** "ICE SUB" | "ENG SUB" | "NO SUB", or empty if unknown. */
  subtitleType: string;
  /** "ICE DUB" (Icelandic-dubbed) | "ENG AUDIO" (English version of a usually dubbed film), or empty. */
  audio: string;
  ticketUrl: string;
  events: EventType[];
  /** The hall's index in `Cinema.halls`, or a heuristic slot when the hall is unknown. */
  lane: number;
}

export interface Day {
  date: string;
  screenings: Screening[];
}

export interface Schedule {
  /** ISO timestamp of the scrape. */
  generatedAt: string;
  days: Day[];
  movies: Record<string, Movie>;
}
