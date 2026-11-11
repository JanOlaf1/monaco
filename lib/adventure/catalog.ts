import type { LocalizedText } from "@/lib/i18n/config";

/** Rename the currency here; it is never purchased with money. */
export const CRYSTAL_NAME: LocalizedText = { en: "Code Crystals", fi: "Koodikiteet" };
export const CRYSTAL_REWARDS = { exercise: 5, chapter: 20, daily: 3, weekly: 10, review: 2 } as const;
export type CosmeticSlot = "eyes" | "neck" | "back" | "head";
export type CosmeticId = "goggles" | "scarf" | "backpack" | "hat";

export interface Cosmetic {
  id: CosmeticId;
  slot: CosmeticSlot;
  cost: number;
  title: LocalizedText;
  description: LocalizedText;
}

/** Original, fixed-price cosmetics. They never affect lessons, XP or grading. */
export const COSMETICS: readonly Cosmetic[] = [
  {
    id: "goggles", slot: "eyes", cost: 15,
    title: { en: "Tideglass goggles", fi: "Vuorovesilasit" },
    description: { en: "Sea-blue lenses for spotting a fresh approach.", fi: "Merensiniset linssit uuden näkökulman löytämiseen." },
  },
  {
    id: "scarf", slot: "neck", cost: 10,
    title: { en: "Aurora scarf", fi: "Revontulihuivi" },
    description: { en: "A teal scarf for a comfortable coding voyage.", fi: "Turkoosi huivi mukavalle koodausmatkalle." },
  },
  {
    id: "backpack", slot: "back", cost: 25,
    title: { en: "Mapmaker's backpack", fi: "Kartanpiirtäjän reppu" },
    description: { en: "Room for notes, questions and your next idea.", fi: "Tilaa muistiinpanoille, kysymyksille ja seuraavalle idealle." },
  },
  {
    id: "hat", slot: "head", cost: 30,
    title: { en: "Harbor captain's hat", fi: "Satamakapteenin hattu" },
    description: { en: "A little flag for the course you choose yourself.", fi: "Pieni lippu itse valitsemallesi suunnalle." },
  },
];

export const cosmeticById = (id: string): Cosmetic | undefined => COSMETICS.find((item) => item.id === id);
