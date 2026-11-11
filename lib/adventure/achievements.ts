import type { LocalizedText } from "@/lib/i18n/config";
import type { AdventureState } from "./state";

export interface AdventureAchievement {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  earned: boolean;
  at?: string;
  value: number;
  target: number;
}

/** Derived from the ledger, so reloads cannot forget or double-award a badge. */
export function adventureAchievements(state: AdventureState): AdventureAchievement[] {
  const events = Object.values(state.events).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  const dates = (kind: string) => events.filter((event) => event.kind === kind).map((event) => event.at);
  const badge = (id: string, title: LocalizedText, description: LocalizedText, earnedAt: string[], target: number): AdventureAchievement => ({
    id, title, description, earned: earnedAt.length >= target, at: earnedAt[target - 1], value: Math.min(earnedAt.length, target), target,
  });
  return [
    badge("first-review", { en: "Fresh Perspective", fi: "Uusi näkökulma" },
      { en: "Verify every step of an exercise completed on an earlier UTC day.", fi: "Tarkista jokainen vaihe aiempana UTC-päivänä suoritetusta harjoituksesta." }, dates("review"), 1),
    badge("review-ranger", { en: "Review Ranger", fi: "Kertausretkeilijä" },
      { en: "Complete a verified review on three different UTC days.", fi: "Tee tarkistettu kertaus kolmena eri UTC-päivänä." }, dates("review"), 3),
    badge("daily-explorer", { en: "A Small Expedition", fi: "Pieni tutkimusretki" },
      { en: "Finish an optional daily quest.", fi: "Suorita vapaaehtoinen päiväretki." }, dates("daily"), 1),
    badge("weekly-navigator", { en: "Weekly Navigator", fi: "Viikon suunnistaja" },
      { en: "Finish an optional weekly quest with three different exercises.", fi: "Suorita vapaaehtoinen viikkoretki kolmella eri harjoituksella." }, dates("weekly"), 1),
    badge("thoughtful-collector", { en: "Explorer's Wardrobe", fi: "Tutkijan varusteet" },
      { en: "Unlock two cosmetic items with earned crystals.", fi: "Avaa kaksi ulkoasuvarustetta ansaituilla kiteillä." },
      dates("purchase"), 2),
    badge("chapter-cartographer", { en: "Chapter Cartographer", fi: "Lukujen kartoittaja" },
      { en: "Complete three regular chapters.", fi: "Suorita kolme tavallista lukua." }, dates("chapter"), 3),
  ];
}
