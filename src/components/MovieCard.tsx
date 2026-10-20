import { useEffect, useRef } from "preact/hooks";
import { EVENTS } from "../shared/events";
import { timeToMinutes } from "../shared/lanes";
import type { Movie, Screening, TrackingStatus } from "../shared/types";
import { cardHeight, minuteToY } from "../lib/layout";

interface Props {
  screening: Screening;
  movie: Movie;
  status: TrackingStatus | undefined;
  selected: boolean;
  /** First visible minute-of-day on the timeline. */
  rangeStartMinutes: number;
  onSelect: () => void;
}

export function MovieCard({ screening, movie, status, selected, rangeStartMinutes, onSelect }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const dampened = status === "seen" || status === "skip";
  const classes = ["card", selected && "sel", dampened && "damp", status === "want" && "want"]
    .filter(Boolean)
    .join(" ");

  // Keep the selected card clear of the bottom sheet (see scroll-margin in CSS).
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <button
      ref={ref}
      class={classes}
      style={{
        top: `${minuteToY(timeToMinutes(screening.time), rangeStartMinutes)}px`,
        height: `${cardHeight(movie.runtime)}px`,
        background: movie.color,
        ...(selected ? { boxShadow: `0 4px 20px ${movie.color}88, 0 0 0 2px #fff` } : {}),
      }}
      aria-pressed={selected}
      aria-label={`${movie.title}, ${screening.time}, ${movie.runtime} minutes`}
      onClick={onSelect}
    >
      <img class="cp" src={movie.posterUrl} alt="" loading="lazy" />
      <span
        class="ci"
        style={{
          background: `linear-gradient(to bottom, ${movie.color}f2 0%, ${movie.color}66 45%, ${movie.color}66 60%, ${movie.color}f2 100%)`,
        }}
      >
        <span class="ct">{movie.title}</span>
        <span class="cm">
          <span>
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
      </span>
    </button>
  );
}
