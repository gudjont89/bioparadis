import type { Day } from "../shared/types";
import { dayLabel } from "../lib/time";

interface Props {
  days: Day[];
  selected: string;
  today: string;
  onSelect: (date: string) => void;
}

export function DateChips({ days, selected, today, onSelect }: Props) {
  return (
    <nav class="dates" aria-label="Choose a day">
      {days.map((day) => (
        <button
          key={day.date}
          class={`dc${day.date === selected ? " act" : ""}`}
          aria-pressed={day.date === selected}
          onClick={() => onSelect(day.date)}
        >
          <span class="lb">{dayLabel(day.date)}</span>
          {day.date === today ? (
            <span class="sl">Today</span>
          ) : day.screenings.length === 0 ? (
            <span class="ed" title="No screenings" />
          ) : null}
        </button>
      ))}
    </nav>
  );
}
