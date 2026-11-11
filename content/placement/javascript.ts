import { check, l } from "@/lib/content/factories";
import { code } from "@/lib/content/md";
import type { PlacementDefinition } from "@/lib/learning/placement";

/**
 * JavaScript placement check. Predict and debug items are verified by running
 * every snippet in tests/placement.test.ts; coding items have reference
 * solutions there too.
 */
export const javascriptPlacement: PlacementDefinition = {
  id: "placement-javascript",
  version: 1,
  courseId: "javascript",
  language: "javascript",
  minutes: 6,
  items: [
    /* --------------------------- Beginner --------------------------- */
    {
      id: "js-b-predict",
      kind: "predict",
      level: "beginner",
      skills: ["js.variables", "js.operators"],
      prompt: l("What does this program print?", "Mitä tämä ohjelma tulostaa?"),
      code: code`
        let count = 3;
        count = count + 2;
        console.log(count * 2);
      `,
      options: [
        { id: "a", output: "5" },
        { id: "b", output: "8" },
        { id: "c", output: "10" },
        { id: "d", output: "32" },
      ],
      answer: "c",
      explanation: l(
        "`count` becomes 3 + 2 = 5, and the program prints 5 * 2 = 10.",
        "`count` muuttuu arvoon 3 + 2 = 5, ja ohjelma tulostaa 5 * 2 = 10.",
      ),
    },
    {
      id: "js-b-debug",
      kind: "debug",
      level: "beginner",
      skills: ["js.conditions", "js.operators"],
      prompt: l(
        "This program should print `Adult` for an 18-year-old, but it prints `Minor`. Which change fixes it?",
        "Tämän ohjelman pitäisi tulostaa 18-vuotiaalle `Adult`, mutta se tulostaa `Minor`. Mikä muutos korjaa sen?",
      ),
      code: code`
        const age = 18;
        if (age > 18) {
          console.log("Adult");
        } else {
          console.log("Minor");
        }
      `,
      expectedOutput: "Adult",
      options: [
        {
          id: "a",
          label: l("Change `age > 18` to `age >= 18`.", "Muuta `age > 18` muotoon `age >= 18`."),
          fixed: 'const age = 18;\nif (age >= 18) {\n  console.log("Adult");\n} else {\n  console.log("Minor");\n}\n',
        },
        {
          id: "b",
          label: l("Change `const age` to `let age`.", "Muuta `const age` muotoon `let age`."),
          fixed: 'let age = 18;\nif (age > 18) {\n  console.log("Adult");\n} else {\n  console.log("Minor");\n}\n',
        },
        {
          id: "c",
          label: l("Change `else` to `else if (age < 18)`.", "Muuta `else` muotoon `else if (age < 18)`."),
          fixed: 'const age = 18;\nif (age > 18) {\n  console.log("Adult");\n} else if (age < 18) {\n  console.log("Minor");\n}\n',
        },
      ],
      answer: "a",
      explanation: l(
        "`>` is false when both sides are equal. `>=` also accepts 18 itself.",
        "`>` on epätosi, kun molemmat puolet ovat yhtä suuret. `>=` hyväksyy myös luvun 18.",
      ),
    },
    {
      id: "js-b-code",
      kind: "code",
      level: "beginner",
      skills: ["js.functions", "js.conditions"],
      prompt: l(
        "Write `isWeekend(day)` that returns `true` for `\"Saturday\"` and `\"Sunday\"`, and `false` for any other day.",
        "Kirjoita funktio `isWeekend(day)`, joka palauttaa `true` päiville `\"Saturday\"` ja `\"Sunday\"` ja `false` kaikille muille päiville.",
      ),
      starter: "function isWeekend(day) {\n  // Return true or false.\n}\n",
      tests: [
        check(
          "weekend",
          l("Saturday and Sunday return `true`.", "Lauantai ja sunnuntai palauttavat `true`."),
          l("Return `true` for both weekend days.", "Palauta `true` molemmille viikonlopun päiville."),
          code`
            t.equal(isWeekend("Saturday"), true);
            t.equal(isWeekend("Sunday"), true);
          `,
        ),
        check(
          "weekday",
          l("Other days return `false`.", "Muut päivät palauttavat `false`."),
          l("Return `false` for days such as Monday and Friday.", "Palauta `false` esimerkiksi maanantaille ja perjantaille."),
          code`
            t.equal(isWeekend("Monday"), false);
            t.equal(isWeekend("Friday"), false);
          `,
        ),
      ],
      explanation: l(
        "One way: `return day === \"Saturday\" || day === \"Sunday\";`",
        "Yksi tapa: `return day === \"Saturday\" || day === \"Sunday\";`",
      ),
    },

    /* ------------------------- Intermediate ------------------------- */
    {
      id: "js-i-predict",
      kind: "predict",
      level: "intermediate",
      skills: ["js.loops", "js.arrays"],
      prompt: l("What does this program print?", "Mitä tämä ohjelma tulostaa?"),
      code: code`
        const nums = [4, 7, 2, 9];
        let total = 0;
        for (const n of nums) {
          if (n > 3) total += n;
        }
        console.log(total);
      `,
      options: [
        { id: "a", output: "22" },
        { id: "b", output: "20" },
        { id: "c", output: "13" },
        { id: "d", output: "9" },
      ],
      answer: "b",
      explanation: l(
        "Only 4, 7 and 9 are greater than 3, so the total is 4 + 7 + 9 = 20.",
        "Vain 4, 7 ja 9 ovat suurempia kuin 3, joten summa on 4 + 7 + 9 = 20.",
      ),
    },
    {
      id: "js-i-debug",
      kind: "debug",
      level: "intermediate",
      skills: ["js.loops", "js.arrays"],
      prompt: l(
        "This loop should print all three names, but it skips `Ada` and prints `undefined`. Which change fixes it?",
        "Tämän silmukan pitäisi tulostaa kaikki kolme nimeä, mutta se ohittaa nimen `Ada` ja tulostaa `undefined`. Mikä muutos korjaa sen?",
      ),
      code: code`
        const names = ["Ada", "Linus", "Grace"];
        for (let i = 1; i <= names.length; i++) {
          console.log(names[i]);
        }
      `,
      expectedOutput: "Ada\nLinus\nGrace",
      options: [
        {
          id: "a",
          label: l("Start at `0` but keep `i <= names.length`.", "Aloita nollasta mutta säilytä `i <= names.length`."),
          fixed: 'const names = ["Ada", "Linus", "Grace"];\nfor (let i = 0; i <= names.length; i++) {\n  console.log(names[i]);\n}\n',
        },
        {
          id: "b",
          label: l("Keep `i = 1` and use `i < names.length`.", "Säilytä `i = 1` ja käytä ehtoa `i < names.length`."),
          fixed: 'const names = ["Ada", "Linus", "Grace"];\nfor (let i = 1; i < names.length; i++) {\n  console.log(names[i]);\n}\n',
        },
        {
          id: "c",
          label: l("Use `let i = 0` and `i < names.length`.", "Käytä ehtoja `let i = 0` ja `i < names.length`."),
          fixed: 'const names = ["Ada", "Linus", "Grace"];\nfor (let i = 0; i < names.length; i++) {\n  console.log(names[i]);\n}\n',
        },
      ],
      answer: "c",
      explanation: l(
        "Indexes start at 0 and the last index is `names.length - 1`, so the loop needs both changes.",
        "Indeksit alkavat nollasta ja viimeinen indeksi on `names.length - 1`, joten silmukka tarvitsee molemmat muutokset.",
      ),
    },
    {
      id: "js-i-code",
      kind: "code",
      level: "intermediate",
      skills: ["js.arrays", "js.objects", "js.loops"],
      prompt: l(
        "Write `averageScore(students)`. `students` is an array such as `[{ name: \"Ada\", score: 8 }]`. Return the average `score` rounded to one decimal, or `0` for an empty array.",
        "Kirjoita funktio `averageScore(students)`. `students` on taulukko, kuten `[{ name: \"Ada\", score: 8 }]`. Palauta `score`-arvojen keskiarvo yhden desimaalin tarkkuudella tai `0`, jos taulukko on tyhjä.",
      ),
      starter: "function averageScore(students) {\n  // Return the average score.\n}\n",
      tests: [
        check(
          "average",
          l("The average of 8 and 6 is `7`.", "Lukujen 8 ja 6 keskiarvo on `7`."),
          l("Add up every `score` and divide by the number of students.", "Laske kaikki `score`-arvot yhteen ja jaa oppilaiden määrällä."),
          `t.closeTo(averageScore([{ name: "A", score: 8 }, { name: "B", score: 6 }]), 7);`,
        ),
        check(
          "rounding",
          l("The result is rounded to one decimal.", "Tulos pyöristetään yhteen desimaaliin."),
          l("Round with `Math.round(value * 10) / 10`.", "Pyöristä lausekkeella `Math.round(value * 10) / 10`."),
          `t.closeTo(averageScore([{ name: "A", score: 7 }, { name: "B", score: 8 }, { name: "C", score: 8 }]), 7.7);`,
        ),
        check(
          "empty",
          l("An empty array gives `0`.", "Tyhjä taulukko antaa `0`."),
          l("Dividing by zero gives `NaN`. Return `0` when there are no students.", "Nollalla jakaminen antaa `NaN`. Palauta `0`, kun oppilaita ei ole."),
          `t.equal(averageScore([]), 0);`,
        ),
      ],
      explanation: l(
        "Sum the scores in a loop (or with `reduce`), divide by `students.length` and round. Guard the empty array first.",
        "Laske pisteet yhteen silmukalla (tai metodilla `reduce`), jaa luvulla `students.length` ja pyöristä. Käsittele tyhjä taulukko ensin.",
      ),
    },

    /* --------------------------- Advanced --------------------------- */
    {
      id: "js-a-predict",
      kind: "predict",
      level: "advanced",
      skills: ["js.array-methods"],
      prompt: l("What does this program print?", "Mitä tämä ohjelma tulostaa?"),
      code: code`
        const items = [3, 1, 2];
        const result = items.map((n) => n * 2).filter((n) => n > 2);
        console.log(result.length, items[0]);
      `,
      options: [
        { id: "a", output: "2 6" },
        { id: "b", output: "2 3" },
        { id: "c", output: "3 3" },
        { id: "d", output: "1 6" },
      ],
      answer: "b",
      explanation: l(
        "`map` creates `[6, 2, 4]` and `filter` keeps `[6, 4]`. Neither changes `items`, so `items[0]` is still 3.",
        "`map` luo taulukon `[6, 2, 4]` ja `filter` säilyttää `[6, 4]`. Kumpikaan ei muuta taulukkoa `items`, joten `items[0]` on yhä 3.",
      ),
    },
    {
      id: "js-a-debug",
      kind: "debug",
      level: "advanced",
      skills: ["js.async"],
      prompt: l(
        "This program should print `Total: 5`, but it prints `Total: [object Promise]`. Which change fixes it?",
        "Tämän ohjelman pitäisi tulostaa `Total: 5`, mutta se tulostaa `Total: [object Promise]`. Mikä muutos korjaa sen?",
      ),
      code: code`
        async function getCount() {
          return 5;
        }

        async function main() {
          const count = getCount();
          console.log("Total: " + count);
        }

        main();
      `,
      expectedOutput: "Total: 5",
      options: [
        {
          id: "a",
          label: l("Remove `async` from `main`.", "Poista `async` funktiosta `main`."),
          fixed:
            'async function getCount() {\n  return 5;\n}\n\nfunction main() {\n  const count = getCount();\n  console.log("Total: " + count);\n}\n\nmain();\n',
        },
        {
          id: "b",
          label: l("Change `return 5;` to `return await 5;`.", "Muuta `return 5;` muotoon `return await 5;`."),
          fixed:
            'async function getCount() {\n  return await 5;\n}\n\nasync function main() {\n  const count = getCount();\n  console.log("Total: " + count);\n}\n\nmain();\n',
        },
        {
          id: "c",
          label: l("Write `const count = await getCount();`.", "Kirjoita `const count = await getCount();`."),
          fixed:
            'async function getCount() {\n  return 5;\n}\n\nasync function main() {\n  const count = await getCount();\n  console.log("Total: " + count);\n}\n\nmain();\n',
        },
      ],
      answer: "c",
      explanation: l(
        "An `async` function always returns a promise. `await` waits for it and gives the value 5.",
        "`async`-funktio palauttaa aina lupauksen. `await` odottaa sitä ja antaa arvon 5.",
      ),
    },
    {
      id: "js-a-code",
      kind: "code",
      level: "advanced",
      skills: ["js.array-methods", "js.objects"],
      prompt: l(
        "Write `topTags(posts, n)`. Each post looks like `{ title: \"Hi\", tags: [\"js\", \"css\"] }`. Return the `n` most used tags, most used first; tags used equally often are sorted alphabetically.",
        "Kirjoita funktio `topTags(posts, n)`. Jokainen julkaisu on muotoa `{ title: \"Hi\", tags: [\"js\", \"css\"] }`. Palauta `n` eniten käytettyä tunnistetta yleisimmästä alkaen; yhtä usein käytetyt järjestetään aakkosjärjestykseen.",
      ),
      starter: "function topTags(posts, n) {\n  // Return the n most used tags.\n}\n",
      tests: [
        check(
          "counts",
          l("Tags are ordered by how often they are used.", "Tunnisteet järjestetään käyttökertojen mukaan."),
          l("Count every tag across all posts and sort by the count, highest first.", "Laske jokainen tunniste kaikista julkaisuista ja lajittele määrän mukaan suurimmasta alkaen."),
          code`
            const posts = [
              { title: "A", tags: ["js", "css"] },
              { title: "B", tags: ["js"] },
              { title: "C", tags: ["js", "html", "css"] },
            ];
            t.deepEqual(topTags(posts, 2), ["js", "css"]);
          `,
        ),
        check(
          "ties",
          l("Equally common tags are alphabetical.", "Yhtä yleiset tunnisteet ovat aakkosjärjestyksessä."),
          l("When counts are equal, compare the tag names.", "Kun määrät ovat samat, vertaa tunnisteiden nimiä."),
          code`
            const posts = [{ title: "A", tags: ["web", "api"] }, { title: "B", tags: ["db"] }];
            t.deepEqual(topTags(posts, 3), ["api", "db", "web"]);
          `,
        ),
        check(
          "few-tags",
          l("Asking for more tags than exist returns them all.", "Jos pyydetään enemmän tunnisteita kuin on, palautetaan kaikki."),
          l("Use `slice(0, n)` so a large `n` is fine; no posts gives `[]`.", "Käytä `slice(0, n)`, jolloin suuri `n` toimii; ilman julkaisuja tulos on `[]`."),
          code`
            t.deepEqual(topTags([{ title: "A", tags: ["x"] }], 5), ["x"]);
            t.deepEqual(topTags([], 3), []);
          `,
        ),
      ],
      explanation: l(
        "Count tags into an object (for example with `reduce`), then `Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b)).slice(0, n)`.",
        "Laske tunnisteet olioon (esimerkiksi metodilla `reduce`) ja käytä sitten `Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b)).slice(0, n)`.",
      ),
    },
  ],
};
