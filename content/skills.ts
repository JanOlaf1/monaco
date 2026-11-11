import { l } from "@/lib/content/factories";
import type { SkillDefinition } from "@/lib/content/types";

/**
 * Skill registry. Ids are stable storage keys (placement evidence is saved per
 * skill id), so never rename one; add a new id instead. Chapters, placement
 * items and the coverage matrix refer to these ids, and tests/content.test.ts
 * checks that every reference exists.
 */
export const skills: SkillDefinition[] = [
  // JavaScript
  { id: "js.output", track: "javascript", title: l("Console output", "Konsolitulostus") },
  { id: "js.variables", track: "javascript", title: l("Variables and data types", "Muuttujat ja tietotyypit") },
  { id: "js.operators", track: "javascript", title: l("Operators and comparisons", "Operaattorit ja vertailut") },
  { id: "js.conditions", track: "javascript", title: l("Conditions", "Ehtolauseet") },
  { id: "js.functions", track: "javascript", title: l("Functions", "Funktiot") },
  { id: "js.loops", track: "javascript", title: l("Loops", "Silmukat") },
  { id: "js.arrays", track: "javascript", title: l("Arrays", "Taulukot") },
  { id: "js.objects", track: "javascript", title: l("Objects", "Oliot") },
  { id: "js.strings", track: "javascript", title: l("String methods", "Merkkijonometodit") },
  { id: "js.problem-solving", track: "javascript", title: l("Combining concepts", "Käsitteiden yhdistäminen") },
  { id: "js.array-methods", track: "javascript", title: l("map, reduce and sort", "map, reduce ja sort") },
  { id: "js.errors", track: "javascript", title: l("Errors and validation", "Virheet ja validointi") },
  { id: "js.async", track: "javascript", title: l("Async and promises", "Asynkronisuus ja lupaukset") },

  // Python
  { id: "py.output", track: "python", title: l("Printing output", "Tulostaminen") },
  { id: "py.variables", track: "python", title: l("Variables and strings", "Muuttujat ja merkkijonot") },
  { id: "py.numbers", track: "python", title: l("Numbers and arithmetic", "Luvut ja laskutoimitukset") },
  { id: "py.booleans", track: "python", title: l("Booleans and comparisons", "Totuusarvot ja vertailut") },
  { id: "py.conditions", track: "python", title: l("Conditions", "Ehtolauseet") },
  { id: "py.functions", track: "python", title: l("Functions", "Funktiot") },
  { id: "py.loops", track: "python", title: l("Loops", "Silmukat") },
  { id: "py.collections", track: "python", title: l("Lists and dictionaries", "Listat ja sanakirjat") },
  { id: "py.text", track: "python", title: l("Text processing", "Tekstinkäsittely") },
  { id: "py.problem-solving", track: "python", title: l("Combining concepts", "Käsitteiden yhdistäminen") },
  { id: "py.comprehensions", track: "python", title: l("Comprehensions and sorting", "Koosteet ja lajittelu") },
  { id: "py.errors", track: "python", title: l("Exceptions and validation", "Poikkeukset ja validointi") },
  { id: "py.classes", track: "python", title: l("Classes and objects", "Luokat ja oliot") },

  // TypeScript (course planned)
  { id: "ts.annotations", track: "typescript", title: l("Type annotations", "Tyyppimerkinnät") },
  { id: "ts.objects", track: "typescript", title: l("Objects and interfaces", "Oliot ja rajapinnat") },
  { id: "ts.unions", track: "typescript", title: l("Union types and narrowing", "Yhdistetyypit ja tyypin rajaus") },

  // React (course planned)
  { id: "react.components", track: "react", title: l("Components and JSX", "Komponentit ja JSX") },
  { id: "react.props", track: "react", title: l("Props", "Propsit") },
  { id: "react.state", track: "react", title: l("State and events", "Tila ja tapahtumat") },
];
