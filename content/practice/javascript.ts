import { l } from "@/lib/content/factories";
import { code } from "@/lib/content/md";
import type { PracticeActivity } from "@/lib/practice/types";

/**
 * JavaScript practice activities. Original content; every answer key is
 * verified by running the code in tests/practice.test.ts.
 */
export const javascriptPractice: PracticeActivity[] = [
  {
    id: "pr-js-let-update",
    kind: "predict",
    language: "javascript",
    exerciseId: "js-let-update",
    prompt: l("What does this program print?", "Mitä tämä ohjelma tulostaa?"),
    code: code`
      let score = 10;
      score = score - 3;
      score = score * 2;
      console.log(score);
    `,
    options: [
      { id: "a", output: "17" },
      { id: "b", output: "14" },
      { id: "c", output: "10" },
      { id: "d", output: "7" },
    ],
    answer: "b",
    explanation: l(
      "Each line uses the current value: 10 − 3 = 7, then 7 × 2 = 14.",
      "Jokainen rivi käyttää muuttujan senhetkistä arvoa: 10 − 3 = 7 ja sitten 7 × 2 = 14.",
    ),
  },
  {
    id: "pr-js-object-update",
    kind: "predict",
    language: "javascript",
    exerciseId: "js-object-basics",
    prompt: l("What does this program print?", "Mitä tämä ohjelma tulostaa?"),
    code: code`
      const pet = { name: "Miso", age: 3 };
      pet.age = pet.age + 1;
      console.log(\`\${pet.name} is \${pet.age}\`);
    `,
    options: [
      { id: "a", output: "Miso is 3" },
      { id: "b", output: "pet.name is pet.age" },
      { id: "c", output: "Miso is 4" },
      { id: "d", output: "Miso is 31" },
    ],
    answer: "c",
    explanation: l(
      "`const` stops `pet` from pointing to another object, but the object's properties can still change. `${...}` inserts the values into the template string.",
      "`const` estää muuttujaa `pet` viittaamasta toiseen olioon, mutta olion ominaisuuksia voi silti muuttaa. `${...}` lisää arvot mallimerkkijonoon.",
    ),
  },
  {
    id: "pr-js-loop-bound",
    kind: "bug",
    language: "javascript",
    exerciseId: "js-for-loop",
    prompt: l(
      "This should print the three items, but it also prints `undefined`. Which line has the bug?",
      "Tämän pitäisi tulostaa kolme asiaa, mutta se tulostaa myös `undefined`. Millä rivillä virhe on?",
    ),
    code: code`
      const items = ["pen", "cup", "map"];
      for (let i = 0; i <= items.length; i++) {
        console.log(items[i]);
      }
    `,
    expectedOutput: "pen\ncup\nmap",
    bugLine: 1,
    fix: "for (let i = 0; i < items.length; i++) {",
    explanation: l(
      "Indexes run from 0 to `items.length - 1`. With `<=` the loop also reads `items[3]`, which doesn't exist. Use `i < items.length`.",
      "Indeksit ovat 0:sta arvoon `items.length - 1`. Vertailulla `<=` silmukka lukee myös kohdan `items[3]`, jota ei ole. Käytä ehtoa `i < items.length`.",
    ),
  },
  {
    id: "pr-js-missing-return",
    kind: "bug",
    language: "javascript",
    exerciseId: "greeting-functions",
    prompt: l(
      "`double(4)` should print `8`, but this prints `undefined`. Which line needs to change?",
      "Kutsun `double(4)` pitäisi tulostaa `8`, mutta tämä tulostaa `undefined`. Mitä riviä pitää muuttaa?",
    ),
    code: code`
      function double(n) {
        const result = n * 2;
      }
      console.log(double(4));
    `,
    expectedOutput: "8",
    bugLine: 1,
    fix: "  return n * 2;",
    explanation: l(
      "The function calculates the value but never returns it, so the call gives `undefined`. `return n * 2;` sends the result back to the caller.",
      "Funktio laskee arvon mutta ei palauta sitä, joten kutsu antaa `undefined`. `return n * 2;` palauttaa tuloksen kutsujalle.",
    ),
  },
  {
    id: "pr-js-filter-even",
    kind: "complete",
    language: "javascript",
    exerciseId: "js-filter-even",
    prompt: l(
      "Complete the code so that it prints only the even numbers: `8,12`.",
      "Täydennä koodi niin, että se tulostaa vain parilliset luvut: `8,12`.",
    ),
    code: code`
      const numbers = [3, 8, 5, 12, 7];
      const even = numbers.filter((n) => n % 2 ___ 0);
      console.log(even.join(","));
    `,
    expectedOutput: "8,12",
    options: [
      { id: "a", text: "===" },
      { id: "b", text: "!==" },
      { id: "c", text: "==" },
      { id: "d", text: "=" },
    ],
    answers: ["a", "c"],
    explanation: l(
      "A number is even when the remainder `n % 2` equals 0. Both `===` and `==` work here; `===` is the usual choice because it never converts types. `=` assigns instead of comparing.",
      "Luku on parillinen, kun jakojäännös `n % 2` on 0. Tässä toimivat sekä `===` että `==`; yleensä käytetään `===`, koska se ei muunna tyyppejä. `=` sijoittaa eikä vertaa.",
    ),
  },
  {
    id: "pr-js-running-total",
    kind: "reorder",
    language: "javascript",
    exerciseId: "js-sum-to",
    prompt: l(
      "Put the lines in order so that the program prints `Total: 10`.",
      "Järjestä rivit niin, että ohjelma tulostaa `Total: 10`.",
    ),
    lines: [
      "let total = 0;",
      "for (const price of [4, 6]) {",
      "  total += price;",
      "}",
      "console.log(`Total: ${total}`);",
    ],
    expectedOutput: "Total: 10",
    alsoCorrect: [],
    start: [2, 4, 0, 3, 1],
    explanation: l(
      "Create the variable first, add each price inside the loop, and print only after the loop has finished.",
      "Luo muuttuja ensin, lisää jokainen hinta silmukan sisällä ja tulosta vasta, kun silmukka on päättynyt.",
    ),
  },
  {
    id: "pr-js-hoisted-greet",
    kind: "reorder",
    language: "javascript",
    exerciseId: "greeting-functions",
    prompt: l(
      "Put the lines in order so that the program prints `Hi, Ada!`.",
      "Järjestä rivit niin, että ohjelma tulostaa `Hi, Ada!`.",
    ),
    lines: ["function greet(name) {", "  return `Hi, ${name}!`;", "}", 'console.log(greet("Ada"));'],
    expectedOutput: "Hi, Ada!",
    alsoCorrect: [[3, 0, 1, 2]],
    start: [1, 3, 2, 0],
    explanation: l(
      "The function body goes between its braces. The call can come after the function, or even before it: function declarations are hoisted, so both orders work.",
      "Funktion runko tulee aaltosulkeiden väliin. Kutsu voi olla funktion jälkeen tai jopa ennen sitä: funktioesittelyt nostetaan (hoisting), joten molemmat järjestykset toimivat.",
    ),
  },
  {
    id: "pr-js-initials",
    kind: "select",
    language: "javascript",
    exerciseId: "js-initials",
    prompt: l(
      'Choose an implementation of `initials(name)` that returns the first letter of every word in upper case, for example `initials("ada lovelace")` → `"AL"`.',
      'Valitse toteutus funktiolle `initials(name)`, joka palauttaa jokaisen sanan ensimmäisen kirjaimen isona, esimerkiksi `initials("ada lovelace")` → `"AL"`.',
    ),
    options: [
      {
        id: "a",
        code: code`
          function initials(name) {
            return name[0].toUpperCase() + name.split(" ")[1][0];
          }
        `,
      },
      {
        id: "b",
        code: code`
          function initials(name) {
            return name.split(" ").map((word) => word[0].toUpperCase()).join("");
          }
        `,
      },
      {
        id: "c",
        code: code`
          function initials(name) {
            return name.split(" ").map((word) => word[0]).join("").toUpperCase;
          }
        `,
      },
      {
        id: "d",
        code: code`
          function initials(name) {
            let result = "";
            for (const word of name.split(" ")) {
              result += word.charAt(0).toUpperCase();
            }
            return result;
          }
        `,
      },
    ],
    harness: code`
      console.log(initials("ada lovelace"));
      console.log(initials("grace brewster hopper"));
    `,
    expectedOutput: "AL\nGBH",
    answers: ["b", "d"],
    explanation: l(
      "B and D both work: they visit every word and upper-case its first letter. A only handles two words and forgets to upper-case the second initial; C returns the `toUpperCase` method itself because the call parentheses `()` are missing.",
      "B ja D toimivat: ne käyvät läpi jokaisen sanan ja muuttavat sen ensimmäisen kirjaimen isoksi. A käsittelee vain kaksi sanaa eikä muuta toista alkukirjainta isoksi. C palauttaa itse `toUpperCase`-metodin, koska kutsun sulkeet `()` puuttuvat.",
    ),
  },
  {
    id: "pr-js-const-reassign",
    kind: "quiz",
    language: "javascript",
    exerciseId: "js-let-update",
    prompt: l("What happens when this program runs?", "Mitä tapahtuu, kun tämä ohjelma ajetaan?"),
    code: code`
      const limit = 5;
      limit = 6;
      console.log(limit);
    `,
    check: { error: "TypeError" },
    options: [
      { id: "a", label: l("It prints `6`.", "Se tulostaa `6`.") },
      {
        id: "b",
        label: l(
          "It stops with a `TypeError`, because a `const` variable can't be given a new value.",
          "Se pysähtyy virheeseen `TypeError`, koska `const`-muuttujalle ei voi antaa uutta arvoa.",
        ),
      },
      { id: "c", label: l("It prints `5` and ignores the second line.", "Se tulostaa `5` ja ohittaa toisen rivin.") },
    ],
    answer: "b",
    explanation: l(
      "Use `let` for values that change. `const` makes the variable binding permanent, so assigning to it throws `TypeError: Assignment to constant variable`.",
      "Käytä muuttuville arvoille `let`-määrittelyä. `const` tekee sidonnasta pysyvän, joten uusi sijoitus aiheuttaa virheen `TypeError: Assignment to constant variable`.",
    ),
  },
  {
    id: "pr-js-loose-strict",
    kind: "quiz",
    language: "javascript",
    exerciseId: "js-comparisons",
    prompt: l("Why do these two lines print different values?", "Miksi nämä kaksi riviä tulostavat eri arvot?"),
    code: code`
      console.log(5 == "5");
      console.log(5 === "5");
    `,
    check: { output: "true\nfalse" },
    options: [
      {
        id: "a",
        label: l(
          "`===` is just a typo for `==`, so the second line is an error.",
          "`===` on vain kirjoitusvirhe operaattorista `==`, joten toinen rivi on virhe.",
        ),
      },
      {
        id: "b",
        label: l(
          "A number and a string can never be compared.",
          "Lukua ja merkkijonoa ei voi koskaan verrata.",
        ),
      },
      {
        id: "c",
        label: l(
          "`==` converts the string to a number before comparing; `===` also requires the same type.",
          "`==` muuntaa merkkijonon luvuksi ennen vertailua; `===` vaatii lisäksi saman tyypin.",
        ),
      },
    ],
    answer: "c",
    explanation: l(
      'The first line prints `true` because `"5"` is converted to `5`. The second prints `false` because a number and a string are different types.',
      'Ensimmäinen rivi tulostaa `true`, koska `"5"` muunnetaan luvuksi `5`. Toinen tulostaa `false`, koska luku ja merkkijono ovat eri tyyppejä.',
    ),
  },
];
