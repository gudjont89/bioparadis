import { useCallback, useState } from "preact/hooks";
import { cinemaById } from "../shared/cinemas";
import type { Cinema } from "../shared/types";

const KEY = "bp_cinema";

function readCinemaId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** The cinema shown in the app, remembered per browser. Unknown or missing ids fall back to the first cinema. */
export function useSelectedCinema(): [Cinema, (id: string) => void] {
  const [cinema, setCinema] = useState(() => cinemaById(readCinemaId()));
  const select = useCallback((id: string) => {
    setCinema(cinemaById(id));
    try {
      localStorage.setItem(KEY, id);
    } catch {
      // storage unavailable (private mode, blocked): the choice just isn't remembered
    }
  }, []);
  return [cinema, select];
}
