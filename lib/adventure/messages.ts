import type { LocalizedText } from "@/lib/i18n/config";

/** Reviewed, original authored messages; no invented quotations or attribution. */
export interface ChapterMessage {
  id: string;
  version: 1;
  authorship: "Koodaamo original";
  text: LocalizedText;
}

export const CHAPTER_MESSAGES: readonly ChapterMessage[] = [
  { id: "small-steps", version: 1, authorship: "Koodaamo original", text: {
    en: "A chapter is a set of small decisions you can now explain. Take that understanding to your next island.",
    fi: "Luku on joukko pieniä päätöksiä, jotka osaat nyt selittää. Vie ymmärrys seuraavalle saarelle.",
  } },
  { id: "questions", version: 1, authorship: "Koodaamo original", text: {
    en: "Good questions belong in an explorer's backpack. Keep one from this chapter for your next experiment.",
    fi: "Hyvät kysymykset kuuluvat tutkijan reppuun. Ota tästä luvusta yksi mukaan seuraavaan kokeiluun.",
  } },
  { id: "test-a-map", version: 1, authorship: "Koodaamo original", text: {
    en: "A useful test is a small map: it shows where your idea works and where to explore next.",
    fi: "Hyvä testi on pieni kartta: se näyttää, missä ideasi toimii ja mitä kannattaa tutkia seuraavaksi.",
  } },
  { id: "rest-at-harbor", version: 1, authorship: "Koodaamo original", text: {
    en: "The harbor is here whenever you need a pause. Your progress will still be yours when you return.",
    fi: "Satama on täällä, kun tarvitset tauon. Edistyminen on yhä sinun, kun palaat.",
  } },
];

/** Stable choice: a chapter never changes its card merely because it is opened. */
export function chapterMessage(courseId: string, chapterId: string): ChapterMessage {
  let hash = 0;
  for (const char of `${courseId}:${chapterId}`) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return CHAPTER_MESSAGES[hash % CHAPTER_MESSAGES.length];
}
