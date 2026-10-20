import type { EventType } from "./types";

export const EVENTS: Record<EventType, { emoji: string; label: string }> = {
  party: { emoji: "🎉", label: "Partísýning" },
  blackSunday: { emoji: "🖤", label: "Svartir Sunnudagar" },
  wednesday: { emoji: "📅", label: "Miðvikudagsbíó" },
  biotekid: { emoji: "🎞️", label: "Bíótekið" },
  german: { emoji: "🇩🇪", label: "German Film Days" },
  french: { emoji: "🇫🇷", label: "French Film Days" },
};
