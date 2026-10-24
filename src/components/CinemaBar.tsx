import { useEffect, useRef } from "preact/hooks";
import { CINEMAS } from "../shared/cinemas";
import type { Cinema } from "../shared/types";

interface Props {
  selected: Cinema;
  onSelect: (id: string) => void;
}

export function CinemaBar({ selected, onSelect }: Props) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // The logos don't all fit on a phone; bring a remembered cinema into view on load.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, []);

  return (
    <nav class="cinemas" aria-label="Choose a cinema">
      {CINEMAS.map((c) => (
        <button
          key={c.id}
          ref={c.id === selected.id ? activeRef : undefined}
          class={`cin${c.id === selected.id ? " act" : ""}`}
          aria-pressed={c.id === selected.id}
          onClick={() => onSelect(c.id)}
        >
          <img src={`${import.meta.env.BASE_URL}${c.logo}`} alt={c.name} />
        </button>
      ))}
    </nav>
  );
}
