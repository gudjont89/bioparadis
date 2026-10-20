import { Fragment } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { groupByLane, timeToMinutes } from "../shared/lanes";
import type { Day, Movie } from "../shared/types";
import { hourRange, PX_PER_MIN, TIMELINE_PAD } from "../lib/layout";
import type { ReykjavikNow } from "../lib/time";
import type { TrackingMap } from "../lib/tracking";
import { MovieCard } from "./MovieCard";

interface Props {
  day: Day;
  movies: Record<string, Movie>;
  tracking: TrackingMap;
  selectedId: string | null;
  now: ReykjavikNow;
  onSelect: (screeningId: string) => void;
}

const pad = (n: number) => String(n % 24).padStart(2, "0");

export function Timeline({ day, movies, tracking, selectedId, now, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const isToday = day.date === now.date;
  const { start, end } = hourRange(day.screenings, movies);
  const rangeStart = start * 60;

  // Auto-scroll when the day changes.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const first = Math.min(...day.screenings.map((s) => timeToMinutes(s.time)));
    // Today: start an hour before "now", but never before the first screening.
    const target = isToday ? Math.max(now.minutes - 60, first - 20) : first - 20;
    wrap.scrollLeft = Number.isFinite(target) ? Math.max(0, (target - rangeStart) * PX_PER_MIN) : 0;
    // `now` is intentionally omitted: don't yank the scroll position every tick.
  }, [day.date]);

  if (day.screenings.length === 0) {
    return (
      <div class="tw">
        <div class="empty">
          <div class="ei">📋</div>
          <div>No screenings scheduled</div>
          <div class="em">schedule will appear when available</div>
        </div>
      </div>
    );
  }

  const nowOffset = (now.minutes - rangeStart) * PX_PER_MIN;
  const showNow = isToday && now.minutes >= rangeStart && now.minutes <= end * 60;
  const hours = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div class="tw" ref={wrapRef}>
      <div class="tl" style={{ width: `${(end - start) * 60 * PX_PER_MIN + TIMELINE_PAD * 2}px` }}>
        {hours.map((h) => {
          const x = (h - start) * 60 * PX_PER_MIN + TIMELINE_PAD;
          return (
            <Fragment key={h}>
              <div class="gl" style={{ left: `${x}px` }} />
              <div class="gla" style={{ left: `${x}px` }}>
                {pad(h)}:00
              </div>
            </Fragment>
          );
        })}
        <div class="lanes">
          {groupByLane(day.screenings).map((lane, i) => (
            <div class="lane" key={i}>
              {lane.map((s) => {
                const movie = movies[s.movieId];
                if (!movie) return null;
                return (
                  <MovieCard
                    key={s.id}
                    screening={s}
                    movie={movie}
                    status={tracking[s.movieId]}
                    selected={s.id === selectedId}
                    rangeStartMinutes={rangeStart}
                    onSelect={() => onSelect(s.id)}
                  />
                );
              })}
            </div>
          ))}
          {showNow && (
            <div class="nl" style={{ left: `${nowOffset}px` }} aria-hidden="true">
              <div class="nd" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
