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

export interface Screening {
  /** Ticket URL when present, otherwise `movieId_date_time`. */
  id: string;
  movieId: string;
  /** `YYYY-MM-DD`, Atlantic/Reykjavik. */
  date: string;
  /** `HH:MM`, Atlantic/Reykjavik. */
  time: string;
  subtitleType: string;
  ticketUrl: string;
  events: EventType[];
  /** 0..2, assigned heuristically; the cinema doesn't publish halls. */
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
