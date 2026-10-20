import { EVENTS } from "../shared/events";
import type { Movie, Screening, TrackingStatus } from "../shared/types";
import { cardWidth, PX_PER_MIN } from "../lib/layout";
import { timeToMinutes } from "../shared/lanes";

interface Props {
  screening: Screening;
  movie: Movie;
  status: TrackingStatus | undefined;
  selected: boolean;
  /** Minutes from the left edge of the visible range. */
  rangeStartMinutes: number;
  onSelect: () => void;
}

export function MovieCard({ screening, movie, status, selected, rangeStartMinutes, onSelect }: Props) {
  const dampened = status === "seen" || status === "skip";
  const classes = ["card", selected && "sel", dampened && "damp", status === "want" && "want"]
    .filter(Boolean)
    .join(" ");
  const left = (timeToMinutes(screening.time) - rangeStartMinutes) * PX_PER_MIN;

  return (
    <button
      class={classes}
      style={{
        left: `${left}px`,
        width: `${cardWidth(movie.runtime)}px`,
        background: movie.color,
        ...(selected ? { boxShadow: `0 4px 20px ${movie.color}88, 0 0 0 2px #fff` } : {}),
      }}
      aria-pressed={selected}
      aria-label={`${movie.title}, ${screening.time}, ${movie.runtime} minutes`}
      onClick={onSelect}
    >
      <img class="cp" src={movie.posterUrl} alt="" loading="lazy" />
      <span class="ci" style={{ background: `linear-gradient(135deg,${movie.color}ee,${movie.color}cc)` }}>
        <span class="ct">{movie.title}</span>
        <span class="cm">
          {screening.time} · {movie.runtime}m
        </span>
        {screening.events.length > 0 && (
          <span class="badges">
            {screening.events.map((e) => (
              <span key={e} title={EVENTS[e].label}>
                {EVENTS[e].emoji}
              </span>
            ))}
          </span>
        )}
      </span>
    </button>
  );
}
