import { useCallback, useEffect, useState } from "preact/hooks";
import type { TrackingStatus } from "../shared/types";

export type TrackingMap = Record<string, TrackingStatus>;

const KEY = "bp_tr";
const VALID: TrackingStatus[] = ["want", "seen", "skip"];

export function readTracking(storage: Pick<Storage, "getItem"> = localStorage): TrackingMap {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(KEY) ?? "{}");
    if (typeof parsed !== "object" || parsed === null) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => VALID.includes(v as TrackingStatus)),
    ) as TrackingMap;
  } catch {
    return {};
  }
}

/** Setting the status a movie already has clears it (toggle). */
export function toggled(map: TrackingMap, movieId: string, status: TrackingStatus): TrackingMap {
  const next = { ...map };
  if (next[movieId] === status) delete next[movieId];
  else next[movieId] = status;
  return next;
}

/**
 * Per-movie tracking, persisted to localStorage. This hook is the only place
 * that touches storage, so a Firebase-backed store can replace it later.
 */
export function useTracking() {
  const [tracking, setTracking] = useState<TrackingMap>(() => readTracking());

  // Stay in sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setTracking(readTracking());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((movieId: string, status: TrackingStatus) => {
    setTracking((prev) => {
      const next = toggled(prev, movieId, status);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // storage unavailable (private mode); keep in-memory state only
      }
      return next;
    });
  }, []);

  return { tracking, toggle };
}
