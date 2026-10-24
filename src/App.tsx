import { useEffect, useMemo, useState } from "preact/hooks";
import { DateChips } from "./components/DateChips";
import { DetailSheet } from "./components/DetailSheet";
import { Timeline } from "./components/Timeline";
import { loadSchedule } from "./lib/schedule";
import { reykjavikNow } from "./lib/time";
import { useTracking } from "./lib/tracking";
import type { Schedule } from "./shared/types";

type Load = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; schedule: Schedule };

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => reykjavikNow());
  useEffect(() => {
    const id = setInterval(() => setNow(reykjavikNow()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function updatedLabel(generatedAt: string): string {
  const mins = Math.round((Date.now() - new Date(generatedAt).getTime()) / 60_000);
  if (mins < 2) return "just now";
  if (mins < 120) return `${mins} min ago`;
  if (mins < 60 * 48) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / 1440)} days ago`;
}

export function App() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { tracking, toggle } = useTracking();
  const now = useNow();

  const fetchSchedule = () => {
    setLoad({ state: "loading" });
    loadSchedule().then(
      (schedule) => setLoad({ state: "ready", schedule }),
      (err: Error) => setLoad({ state: "error", message: err.message }),
    );
  };
  useEffect(fetchSchedule, []);

  // Past days are not useful; drop them.
  const days = useMemo(
    () => (load.state === "ready" ? load.schedule.days.filter((d) => d.date >= now.date) : []),
    [load, now.date],
  );
  const activeDate = days.find((d) => d.date === selectedDate)?.date ?? days.find((d) => d.date === now.date)?.date ?? days[0]?.date;
  const day = days.find((d) => d.date === activeDate);

  const movies = load.state === "ready" ? load.schedule.movies : {};
  const allScreenings = useMemo(() => days.flatMap((d) => d.screenings), [days]);
  const selected = allScreenings.find((s) => s.id === selectedId) ?? null;
  const selectedMovie = selected ? movies[selected.movieId] : undefined;

  return (
    <div class={`app${selected && selectedMovie ? " has-sheet" : ""}`}>
      <header class="hdr">
        <div class="hdr-ico" aria-hidden="true">🎬</div>
        <div>
          <h1 class="hdr-t">Bíó Paradís</h1>
          <div class="hdr-s">Hverfisgata 54</div>
        </div>
      </header>

      {load.state === "loading" && <div class="empty">Loading schedule…</div>}
      {load.state === "error" && (
        <div class="empty">
          <div>Couldn't load the schedule</div>
          <div class="em">{load.message}</div>
          <button class="btn btn-cal retry" onClick={fetchSchedule}>
            Retry
          </button>
        </div>
      )}
      {load.state === "ready" && days.length === 0 && (
        <div class="empty">
          <div>No upcoming screenings</div>
          <div class="em">last updated {updatedLabel(load.schedule.generatedAt)}</div>
        </div>
      )}

      {load.state === "ready" && day && (
        <>
          <DateChips
            days={days}
            selected={day.date}
            today={now.date}
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedId(null);
            }}
          />
          <Timeline
            day={day}
            movies={movies}
            tracking={tracking}
            selectedId={selectedId}
            now={now}
            onSelect={setSelectedId}
          />
          {selected && selectedMovie && (
            <DetailSheet
              screening={selected}
              movie={selectedMovie}
              allShowings={allScreenings.filter((s) => s.movieId === selected.movieId)}
              status={tracking[selected.movieId]}
              now={now}
              onTrack={(status) => toggle(selected.movieId, status)}
              onClose={() => setSelectedId(null)}
            />
          )}
          <footer class="foot">
            tap a screening · track what you've seen and what to skip
            <div class="lg">
              <span>★ want</span>
              <span>✓ seen</span>
              <span>✕ skip</span>
            </div>
            <div>
              schedule updated {updatedLabel(load.schedule.generatedAt)} · data from{" "}
              <a href="https://kvikmyndir.is" target="_blank" rel="noopener">
                Kvikmyndir.is
              </a>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
