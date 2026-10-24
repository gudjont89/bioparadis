import { useEffect, useRef } from "preact/hooks";
import { groupByLane, timeToMinutes } from "../shared/lanes";
import type { Day, Movie } from "../shared/types";
import { hourRange, minuteToY, PX_PER_MIN, TIMELINE_PAD_Y } from "../lib/layout";
import type { ReykjavikNow } from "../lib/time";
import type { TrackingMap } from "../lib/tracking";
import { MovieCard } from "./MovieCard";

interface Props {
  day: Day;
  /** The cinema's halls, one lane each. */
  halls: string[];
  movies: Record<string, Movie>;
  tracking: TrackingMap;
  selectedId: string | null;
  now: ReykjavikNow;
  onSelect: (screeningId: string) => void;
}

const pad = (n: number) => String(n % 24).padStart(2, "0");
/** Narrowest a lane gets before the lanes scroll sideways (e.g. Smárabíó's seven halls on a phone). */
const MIN_LANE_PX = 70;

export function Timeline({ day, halls, movies, tracking, selectedId, now, onSelect }: Props) {
  const tlRef = useRef<HTMLDivElement>(null);
  const isToday = day.date === now.date;
  const { start, end } = hourRange(day.screenings, movies);
  const rangeStart = start * 60;

  // Scroll the page when the day changes: today starts an hour before "now"
  // (but not before the first screening), other days at the first screening.
  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    const first = Math.min(...day.screenings.map((s) => timeToMinutes(s.time)));
    const target = isToday ? Math.max(now.minutes - 60, first - 20) : first - 20;
    const stickyHeight = document.querySelector(".dates")?.getBoundingClientRect().height ?? 0;
    const y = tl.getBoundingClientRect().top + window.scrollY + minuteToY(target, rangeStart) - stickyHeight - 8;
    window.scrollTo({ top: Number.isFinite(y) ? Math.max(0, y) : 0 });
    // `now` is intentionally omitted: don't yank the scroll position every tick.
  }, [day.date]);

  if (day.screenings.length === 0) {
    return (
      <div class="empty">
        <div class="ei">📋</div>
        <div>No screenings scheduled</div>
        <div class="em">schedule will appear when available</div>
      </div>
    );
  }

  const columns = `repeat(${halls.length}, minmax(0, 1fr))`;
  // Past MIN_LANE_PX per lane the lanes scroll sideways; the hour column stays put.
  const minWidth = `calc(var(--gutter) + ${halls.length} * ${MIN_LANE_PX}px + ${halls.length - 1} * var(--lane-gap) + 12px)`;
  const height = `${(end - start) * 60 * PX_PER_MIN + TIMELINE_PAD_Y * 2}px`;
  const showNow = isToday && now.minutes >= rangeStart && now.minutes <= end * 60;
  const hours = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div class="tl-wrap">
      <div class="tl-scroll">
        <div style={{ minWidth }}>
          <div class="lane-hd" aria-hidden="true" style={{ gridTemplateColumns: columns }}>
            {halls.map((h) => (
              <div key={h}>{h}</div>
            ))}
          </div>
          <div class="tl" ref={tlRef} style={{ height }}>
            {hours.map((h) => (
              <div class="gl" key={h} style={{ top: `${minuteToY(h * 60, rangeStart)}px` }} />
            ))}
            <div class="lanes" style={{ gridTemplateColumns: columns }}>
              {groupByLane(day.screenings, halls.length).map((lane, i) => (
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
            </div>
            {showNow && (
              <div class="nl" style={{ top: `${minuteToY(now.minutes, rangeStart)}px` }} aria-hidden="true">
                <div class="nd" />
              </div>
            )}
          </div>
        </div>
      </div>
      <div class="tl-hours" style={{ height: `calc(${height} + var(--lane-hd-h))` }}>
        {hours.map((h) => (
          <div class="gla" key={h} style={{ top: `${minuteToY(h * 60, rangeStart)}px` }}>
            {pad(h)}:00
          </div>
        ))}
      </div>
    </div>
  );
}
