import { useEffect } from "preact/hooks";
import { EVENTS } from "../shared/events";
import type { Cinema, Movie, Screening, TrackingStatus } from "../shared/types";
import { downloadIcs, googleCalendarUrl } from "../lib/calendar";
import { dayLabel, endTime, hasStarted, type ReykjavikNow } from "../lib/time";

interface Props {
  screening: Screening;
  movie: Movie;
  cinema: Cinema;
  /** Every loaded screening of this movie, across days. */
  allShowings: Screening[];
  status: TrackingStatus | undefined;
  now: ReykjavikNow;
  onTrack: (status: TrackingStatus) => void;
  onClose: () => void;
}

const TRACKING: { status: TrackingStatus; icon: string; title: string; cls: string }[] = [
  { status: "want", icon: "★", title: "Want to see", cls: "aw" },
  { status: "seen", icon: "✓", title: "Already seen", cls: "as" },
  { status: "skip", icon: "✕", title: "Not interested", cls: "ak" },
];

export function DetailSheet({ screening, movie, cinema, allShowings, status, now, onTrack, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
    <div class="backdrop" onClick={onClose} aria-hidden="true" />
    <section
      class="det"
      role="dialog"
      aria-label={`${movie.title} details`}
      style={{ borderTopColor: movie.color }}
    >
      <button class="det-x" onClick={onClose} aria-label="Close">
        ✕
      </button>
      <div class="det-top">
        <img class="det-poster" src={movie.posterUrl} alt="" />
        <div class="det-body">
          <a class="det-title" href={movie.detailUrl} target="_blank" rel="noopener">
            {movie.title}
          </a>
          <div class="det-meta">
            {screening.time} – {endTime(screening.time, movie.runtime)} · {movie.runtime} min
            {screening.hall && ` · ${screening.hall}`}
            {screening.subtitleType && ` · ${screening.subtitleType}`}
            {screening.audio && ` · ${screening.audio}`}
          </div>
          {screening.events.length > 0 && (
            <div class="det-evts">
              {screening.events.map((e) => (
                <div class="det-ev" key={e}>
                  <span class="be">{EVENTS[e].emoji}</span>
                  {EVENTS[e].label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div class="det-actions">
        {screening.ticketUrl && (
          <a class="btn" href={screening.ticketUrl} target="_blank" rel="noopener" style={{ background: movie.color }}>
            Tickets
          </a>
        )}
        <a class="btn btn-cal" href={googleCalendarUrl(screening, movie, cinema)} target="_blank" rel="noopener">
          + Google Cal
        </a>
        <button class="btn btn-cal" onClick={() => downloadIcs(screening, movie, cinema)} title="Download .ics file">
          .ics
        </button>
        <div class="sep" />
        {TRACKING.map((t) => (
          <button
            key={t.status}
            class={`bt${status === t.status ? ` ${t.cls}` : ""}`}
            title={t.title}
            aria-label={t.title}
            aria-pressed={status === t.status}
            onClick={() => onTrack(t.status)}
          >
            {t.icon}
          </button>
        ))}
      </div>

      {allShowings.length > 1 && (
        <div class="det-upcoming">
          <div class="det-up-label">All showtimes</div>
          <div class="det-up-list">
            {allShowings.map((s) => {
              const cls = [
                "det-up-chip",
                s.id === screening.id && "cur",
                hasStarted(s.date, s.time, now) && "past",
              ]
                .filter(Boolean)
                .join(" ");
              const content = (
                <>
                  <span class="ud">{dayLabel(s.date)}</span>
                  <span class="ut">{s.time}</span>
                  {s.events.map((e) => (
                    <span class="ub" key={e}>
                      {EVENTS[e].emoji}
                    </span>
                  ))}
                </>
              );
              return s.ticketUrl ? (
                <a class={cls} key={s.id} href={s.ticketUrl} target="_blank" rel="noopener">
                  {content}
                </a>
              ) : (
                <span class={cls} key={s.id}>
                  {content}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </section>
    </>
  );
}
