import { check, jsChallenge, jsLab, l } from "@/lib/content/factories";
import { code, md } from "@/lib/content/md";

/* ------------------------------------------------------------------ */
/* map, reduce and sort                                                */
/* ------------------------------------------------------------------ */

export const jsFormatPrices = jsChallenge({
  id: "js-format-prices",
  chapterId: "js-array-methods",
  minutes: 6,
  title: l("Formatting prices", "Hintojen muotoilu"),
  summary: l("Turn every item of an array into something new with `map()`.", "Muunna taulukon jokainen alkio uudeksi metodilla `map()`."),
  concept: l(
    md`
      \`map()\` calls a function for every item and returns a **new** array of the results, in the same order. The original array is not changed:

      ~~~js
      const celsius = [0, 20, 37];
      const fahrenheit = celsius.map((c) => c * 1.8 + 32); // [32, 68, 98.6]
      ~~~

      \`number.toFixed(2)\` turns a number into a string with exactly two decimals: \`(4.5).toFixed(2)\` is \`"4.50"\`.
    `,
    md`
      \`map()\` kutsuu funktiota jokaiselle alkiolle ja palauttaa **uuden** taulukon tuloksista samassa järjestyksessä. Alkuperäinen taulukko ei muutu:

      ~~~js
      const celsius = [0, 20, 37];
      const fahrenheit = celsius.map((c) => c * 1.8 + 32); // [32, 68, 98.6]
      ~~~

      \`number.toFixed(2)\` muuttaa luvun merkkijonoksi, jossa on täsmälleen kaksi desimaalia: \`(4.5).toFixed(2)\` on \`"4.50"\`.
    `,
  ),
  objectives: [
    l("Transform an array with `map()`", "Muuntaa taulukon metodilla `map()`"),
    l("Format numbers with `toFixed()`", "Muotoilla lukuja metodilla `toFixed()`"),
  ],
  instructions: l(
    "Write `formatPrices(prices)` that returns a new array where every number is formatted with two decimals and a euro sign, for example `12.5` becomes `\"12.50 €\"`.",
    "Kirjoita funktio `formatPrices(prices)`, joka palauttaa uuden taulukon, jossa jokainen luku on muotoiltu kahdella desimaalilla ja euromerkillä, esimerkiksi `12.5` muuttuu muotoon `\"12.50 €\"`.",
  ),
  hints: [
    l("`prices.map((price) => ...)` returns the new array.", "`prices.map((price) => ...)` palauttaa uuden taulukon."),
    l("Each item can be `price.toFixed(2) + \" €\"`.", "Jokainen alkio voi olla `price.toFixed(2) + \" €\"`."),
  ],
  tests: [
    check(
      "is-function",
      l("`formatPrices` is a function.", "`formatPrices` on funktio."),
      l("Define a function named `formatPrices`.", "Määrittele funktio nimeltä `formatPrices`."),
      `t.isType(formatPrices, "function");`,
    ),
    check(
      "formats",
      l("`[12.5, 3]` becomes `[\"12.50 €\", \"3.00 €\"]`.", "`[12.5, 3]` muuttuu muotoon `[\"12.50 €\", \"3.00 €\"]`."),
      l(
        "Format each number with `toFixed(2)` and add a space and `€`.",
        "Muotoile jokainen luku metodilla `toFixed(2)` ja lisää välilyönti ja `€`.",
      ),
      `t.deepEqual(formatPrices([12.5, 3]), ["12.50 €", "3.00 €"]);`,
    ),
    check(
      "rounding",
      l("Prices are shown with exactly two decimals.", "Hinnat näytetään täsmälleen kahdella desimaalilla."),
      l(
        "Use `toFixed(2)`, which also rounds: `9.999` becomes `\"10.00\"` and `0` becomes `\"0.00\"`.",
        "Käytä metodia `toFixed(2)`, joka myös pyöristää: `9.999` muuttuu muotoon `\"10.00\"` ja `0` muotoon `\"0.00\"`.",
      ),
      `t.deepEqual(formatPrices([9.999, 0]), ["10.00 €", "0.00 €"]);`,
    ),
    check(
      "empty",
      l("An empty array gives an empty array.", "Tyhjä taulukko antaa tyhjän taulukon."),
      l("`formatPrices([])` should return `[]`.", "`formatPrices([])` pitää palauttaa `[]`."),
      `t.deepEqual(formatPrices([]), []);`,
    ),
    check(
      "no-mutation",
      l("The original array is not changed.", "Alkuperäinen taulukko ei muutu."),
      l("Return a new array instead of replacing items in `prices`.", "Palauta uusi taulukko sen sijaan, että korvaisit alkioita taulukossa `prices`."),
      code`
        const prices = [1, 2];
        formatPrices(prices);
        t.deepEqual(prices, [1, 2]);
      `,
    ),
  ],
  starter: "// Write formatPrices(prices) below this line.\n",
});

export const jsTotalsByCategory = jsChallenge({
  id: "js-totals-by-category",
  chapterId: "js-array-methods",
  minutes: 9,
  title: l("Spending by category", "Kulut luokittain"),
  summary: l("Summarise an array into one object with `reduce()`.", "Tiivistä taulukko yhdeksi olioksi metodilla `reduce()`."),
  concept: l(
    md`
      \`reduce()\` walks through an array and carries one **accumulator** value along. Whatever the callback returns becomes the accumulator for the next item:

      ~~~js
      const words = ["otter", "owl", "fox"];
      const byLetter = words.reduce((groups, word) => {
        const letter = word[0];
        groups[letter] = (groups[letter] ?? 0) + 1;
        return groups;
      }, {});
      // { o: 2, f: 1 }
      ~~~

      The second argument (\`{}\` here) is the starting value. \`??\` gives a fallback when the left side is \`undefined\`. A \`for...of\` loop that fills an object works too; \`reduce\` is simply a compact way to express it.
    `,
    md`
      \`reduce()\` käy taulukon läpi ja kuljettaa mukanaan yhtä **kerääjä**arvoa (accumulator). Se, mitä funktio palauttaa, on kerääjä seuraavalle alkiolle:

      ~~~js
      const words = ["otter", "owl", "fox"];
      const byLetter = words.reduce((groups, word) => {
        const letter = word[0];
        groups[letter] = (groups[letter] ?? 0) + 1;
        return groups;
      }, {});
      // { o: 2, f: 1 }
      ~~~

      Toinen argumentti (tässä \`{}\`) on alkuarvo. \`??\` antaa vara-arvon, kun vasen puoli on \`undefined\`. Myös \`for...of\`-silmukka, joka täyttää olion, toimii; \`reduce\` on vain tiivis tapa ilmaista sama.
    `,
  ),
  objectives: [
    l("Accumulate values with `reduce()`", "Kerätä arvoja metodilla `reduce()`"),
    l("Group numbers by key in an object", "Ryhmitellä lukuja avaimen mukaan oliossa"),
  ],
  instructions: l(
    "Write `totalsByCategory(expenses)`. Each expense looks like `{ category: \"food\", amount: 12.5 }`. Return an object that maps each category to the sum of its amounts, for example `{ food: 20, transport: 3.2 }`.",
    "Kirjoita funktio `totalsByCategory(expenses)`. Jokainen kulu on muotoa `{ category: \"food\", amount: 12.5 }`. Palauta olio, joka liittää jokaiseen luokkaan sen summien yhteismäärän, esimerkiksi `{ food: 20, transport: 3.2 }`.",
  ),
  hints: [
    l(
      "`return expenses.reduce((totals, expense) => { ...; return totals; }, {});`",
      "`return expenses.reduce((totals, expense) => { ...; return totals; }, {});`",
    ),
    l(
      "Inside: `totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;`",
      "Sisällä: `totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;`",
    ),
  ],
  tests: [
    check(
      "is-function",
      l("`totalsByCategory` is a function.", "`totalsByCategory` on funktio."),
      l("Define a function named `totalsByCategory`.", "Määrittele funktio nimeltä `totalsByCategory`."),
      `t.isType(totalsByCategory, "function");`,
    ),
    check(
      "groups",
      l("Amounts are added up per category.", "Summat lasketaan yhteen luokittain."),
      l(
        "Add each `amount` to the total of its `category`, starting from 0.",
        "Lisää jokainen `amount` oman `category`-luokkansa summaan nollasta alkaen.",
      ),
      code`
        const result = totalsByCategory([
          { category: "food", amount: 12.5 },
          { category: "transport", amount: 3.2 },
          { category: "food", amount: 7.5 },
        ]);
        t.deepEqual(Object.keys(result).sort(), ["food", "transport"]);
        t.closeTo(result.food, 20);
        t.closeTo(result.transport, 3.2);
      `,
    ),
    check(
      "single",
      l("A single expense gives one category.", "Yksi kulu antaa yhden luokan."),
      l("Start each new category at 0 before adding.", "Aloita jokainen uusi luokka nollasta ennen lisäämistä."),
      code`
        const result = totalsByCategory([{ category: "fun", amount: 9 }]);
        t.deepEqual(result, { fun: 9 });
      `,
    ),
    check(
      "empty",
      l("No expenses gives an empty object.", "Ilman kuluja tulos on tyhjä olio."),
      l("Start from an empty object `{}`.", "Aloita tyhjästä oliosta `{}`."),
      `t.deepEqual(totalsByCategory([]), {});`,
    ),
    check(
      "fresh-object",
      l("Each call returns a new object.", "Jokainen kutsu palauttaa uuden olion."),
      l(
        "Create the starting object inside the function, so totals from one call don't leak into the next.",
        "Luo aloitusolio funktion sisällä, jotta yhden kutsun summat eivät vuoda seuraavaan.",
      ),
      code`
        totalsByCategory([{ category: "food", amount: 5 }]);
        const second = totalsByCategory([{ category: "food", amount: 1 }]);
        t.deepEqual(second, { food: 1 });
      `,
    ),
  ],
  starter: "// Write totalsByCategory(expenses) below this line.\n",
});

export const jsSortTasks = jsChallenge({
  id: "js-sort-tasks",
  chapterId: "js-array-methods",
  minutes: 10,
  title: l("Sorting by deadline", "Lajittelu määräajan mukaan"),
  summary: l("Sort a copy of an array with a compare function.", "Lajittele taulukon kopio vertailufunktiolla."),
  concept: l(
    md`
      \`array.sort(compare)\` orders items using a **compare function** that returns a negative number (a first), a positive number (b first) or \`0\` (keep order):

      ~~~js
      const byAge = [...people].sort((a, b) => a.age - b.age);
      const byName = [...people].sort((a, b) => a.name.localeCompare(b.name));
      ~~~

      \`sort()\` **changes the array it is called on**. Copy it first with \`[...array]\` (or use \`toSorted()\` in modern runtimes) when the caller still needs the original.

      Dates written as \`YYYY-MM-DD\` sort correctly as strings, so \`localeCompare\` works for them too.
    `,
    md`
      \`array.sort(compare)\` järjestää alkiot **vertailufunktion** avulla. Se palauttaa negatiivisen luvun (a ensin), positiivisen luvun (b ensin) tai \`0\` (järjestys säilyy):

      ~~~js
      const byAge = [...people].sort((a, b) => a.age - b.age);
      const byName = [...people].sort((a, b) => a.name.localeCompare(b.name));
      ~~~

      \`sort()\` **muuttaa taulukkoa, jolle sitä kutsutaan**. Kopioi taulukko ensin (\`[...array]\`) tai käytä uusissa ympäristöissä metodia \`toSorted()\`, kun kutsuja tarvitsee vielä alkuperäistä.

      Muodossa \`YYYY-MM-DD\` kirjoitetut päivämäärät lajittuvat oikein merkkijonoina, joten \`localeCompare\` toimii niillekin.
    `,
  ),
  objectives: [
    l("Write a compare function", "Kirjoittaa vertailufunktion"),
    l("Sort by two keys", "Lajitella kahden avaimen mukaan"),
    l("Avoid mutating the input", "Välttää syötteen muuttamista"),
  ],
  instructions: l(
    md`
      Write \`sortByDeadline(tasks)\`. Each task looks like \`{ title: "Report", due: "2026-11-20" }\`. Return a **new** array sorted by \`due\`, earliest first. Tasks with the same date are sorted by \`title\`. Tasks whose \`due\` is \`null\` go last. Don't change \`tasks\`.
    `,
    md`
      Kirjoita funktio \`sortByDeadline(tasks)\`. Jokainen tehtävä on muotoa \`{ title: "Report", due: "2026-11-20" }\`. Palauta **uusi** taulukko, joka on lajiteltu kentän \`due\` mukaan aikaisin ensin. Saman päivän tehtävät lajitellaan kentän \`title\` mukaan. Tehtävät, joiden \`due\` on \`null\`, tulevat viimeisiksi. Älä muuta taulukkoa \`tasks\`.
    `,
  ),
  hints: [
    l("Start with `return [...tasks].sort((a, b) => { ... });`", "Aloita rivillä `return [...tasks].sort((a, b) => { ... });`"),
    l(
      "Handle `null` first: `if (a.due === null) return b.due === null ? a.title.localeCompare(b.title) : 1;` and the mirror case for `b`.",
      "Käsittele ensin `null`: `if (a.due === null) return b.due === null ? a.title.localeCompare(b.title) : 1;` ja peilikuvana sama `b`:lle.",
    ),
    l(
      "Then `return a.due.localeCompare(b.due) || a.title.localeCompare(b.title);` — `||` uses the title when the dates are equal (0).",
      "Sitten `return a.due.localeCompare(b.due) || a.title.localeCompare(b.title);` — `||` käyttää nimeä, kun päivät ovat samat (0).",
    ),
  ],
  tests: [
    check(
      "is-function",
      l("`sortByDeadline` is a function.", "`sortByDeadline` on funktio."),
      l("Define a function named `sortByDeadline`.", "Määrittele funktio nimeltä `sortByDeadline`."),
      `t.isType(sortByDeadline, "function");`,
    ),
    check(
      "by-date",
      l("Tasks are ordered by `due`, earliest first.", "Tehtävät järjestetään kentän `due` mukaan aikaisin ensin."),
      l("Compare the `due` strings of two tasks in your compare function.", "Vertaa kahden tehtävän `due`-merkkijonoja vertailufunktiossasi."),
      code`
        const sorted = sortByDeadline([
          { title: "B", due: "2026-12-01" },
          { title: "A", due: "2026-11-20" },
          { title: "C", due: "2027-01-05" },
        ]);
        t.deepEqual(sorted.map((task) => task.title), ["A", "B", "C"]);
      `,
    ),
    check(
      "ties",
      l("Same-day tasks are ordered by title.", "Saman päivän tehtävät järjestetään nimen mukaan."),
      l("When the dates are equal, compare `title` instead.", "Kun päivät ovat samat, vertaa sen sijaan kenttää `title`."),
      code`
        const sorted = sortByDeadline([
          { title: "Write tests", due: "2026-11-20" },
          { title: "Book room", due: "2026-11-20" },
        ]);
        t.deepEqual(sorted.map((task) => task.title), ["Book room", "Write tests"]);
      `,
    ),
    check(
      "no-date-last",
      l("Tasks without a date come last.", "Tehtävät ilman päivää tulevat viimeisiksi."),
      l("If `due` is `null`, put the task after every dated task.", "Jos `due` on `null`, laita tehtävä kaikkien päivättyjen tehtävien jälkeen."),
      code`
        const sorted = sortByDeadline([
          { title: "Someday", due: null },
          { title: "Soon", due: "2026-11-11" },
          { title: "Another day", due: null },
        ]);
        t.deepEqual(sorted.map((task) => task.title), ["Soon", "Another day", "Someday"]);
      `,
    ),
    check(
      "no-mutation",
      l("The original array keeps its order.", "Alkuperäinen taulukko säilyttää järjestyksensä."),
      l("`sort()` changes the array. Sort a copy: `[...tasks].sort(...)`.", "`sort()` muuttaa taulukkoa. Lajittele kopio: `[...tasks].sort(...)`."),
      code`
        const tasks = [
          { title: "Late", due: "2026-12-24" },
          { title: "Early", due: "2026-11-12" },
        ];
        sortByDeadline(tasks);
        t.deepEqual(tasks.map((task) => task.title), ["Late", "Early"]);
      `,
    ),
  ],
  starter: "// Write sortByDeadline(tasks) below this line.\n",
});

/* ------------------------------------------------------------------ */
/* Errors and validation                                               */
/* ------------------------------------------------------------------ */

export const jsValidateSignup = jsChallenge({
  id: "js-validate-signup",
  chapterId: "js-errors",
  minutes: 8,
  title: l("Validating a sign-up form", "Rekisteröitymislomakkeen tarkistus"),
  summary: l("Throw a clear `Error` when input is invalid.", "Heitä selkeä `Error`, kun syöte on virheellinen."),
  concept: l(
    md`
      \`throw new Error("message")\` stops the current function and hands an error to whoever called it. The caller can handle it with \`try\`/\`catch\`:

      ~~~js
      function setVolume(level) {
        if (level < 0 || level > 10) {
          throw new Error("Volume must be between 0 and 10");
        }
        return level;
      }

      try {
        setVolume(42);
      } catch (error) {
        console.log(error.message);
      }
      ~~~

      Validate input **before** using it, and write messages that tell the user how to fix the problem.
    `,
    md`
      \`throw new Error("message")\` pysäyttää funktion ja antaa virheen kutsujalle. Kutsuja voi käsitellä sen rakenteella \`try\`/\`catch\`:

      ~~~js
      function setVolume(level) {
        if (level < 0 || level > 10) {
          throw new Error("Volume must be between 0 and 10");
        }
        return level;
      }

      try {
        setVolume(42);
      } catch (error) {
        console.log(error.message);
      }
      ~~~

      Tarkista syöte **ennen** sen käyttämistä ja kirjoita viestit, jotka kertovat käyttäjälle, miten ongelman voi korjata.
    `,
  ),
  objectives: [
    l("Throw an `Error` with a message", "Heittää `Error`-virheen viestin kanssa"),
    l("Validate several fields in order", "Tarkistaa useita kenttiä järjestyksessä"),
    l("Normalise valid input", "Yhtenäistää kelvollisen syötteen"),
  ],
  instructions: l(
    md`
      Write \`validateSignup(form)\`. \`form\` looks like \`{ email: " Ada@Example.com ", password: "correct horse" }\`.

      - If \`email\` doesn't contain \`@\`, throw an \`Error\` whose message mentions \`@\`.
      - If \`password\` is shorter than 8 characters, throw an \`Error\` whose message mentions \`8\`.
      - Otherwise return \`{ email }\` with the email trimmed and in lowercase.
    `,
    md`
      Kirjoita funktio \`validateSignup(form)\`. \`form\` on muotoa \`{ email: " Ada@Example.com ", password: "correct horse" }\`.

      - Jos \`email\` ei sisällä merkkiä \`@\`, heitä \`Error\`, jonka viestissä mainitaan \`@\`.
      - Jos \`password\` on alle 8 merkkiä pitkä, heitä \`Error\`, jonka viestissä mainitaan \`8\`.
      - Muuten palauta \`{ email }\`, jossa sähköpostiosoite on siistitty ja pienillä kirjaimilla.
    `,
  ),
  hints: [
    l("`if (!form.email.includes(\"@\")) throw new Error(\"Email must contain @\");`", "`if (!form.email.includes(\"@\")) throw new Error(\"Email must contain @\");`"),
    l(
      "Finish with `return { email: form.email.trim().toLowerCase() };`",
      "Lopeta rivillä `return { email: form.email.trim().toLowerCase() };`",
    ),
  ],
  tests: [
    check(
      "is-function",
      l("`validateSignup` is a function.", "`validateSignup` on funktio."),
      l("Define a function named `validateSignup`.", "Määrittele funktio nimeltä `validateSignup`."),
      `t.isType(validateSignup, "function");`,
    ),
    check(
      "valid",
      l("A valid form returns the trimmed, lowercase email.", "Kelvollinen lomake palauttaa siistityn sähköpostiosoitteen pienillä kirjaimilla."),
      l("Return `{ email: form.email.trim().toLowerCase() }`.", "Palauta `{ email: form.email.trim().toLowerCase() }`."),
      `t.deepEqual(validateSignup({ email: " Ada@Example.com ", password: "correct horse" }), { email: "ada@example.com" });`,
    ),
    check(
      "bad-email",
      l("An email without `@` throws an error mentioning `@`.", "Sähköpostiosoite ilman merkkiä `@` heittää virheen, jossa mainitaan `@`."),
      l(
        "Throw `new Error(...)` with `@` in the message when the email has no `@`.",
        "Heitä `new Error(...)`, jonka viestissä on `@`, kun osoitteessa ei ole merkkiä `@`.",
      ),
      code`
        let caught = null;
        try {
          validateSignup({ email: "ada.example.com", password: "long enough" });
        } catch (error) {
          caught = error;
        }
        t.ok(caught instanceof Error, "validateSignup should throw an Error.");
        t.includes(caught.message, "@");
      `,
    ),
    check(
      "short-password",
      l("A password shorter than 8 characters throws an error mentioning `8`.", "Alle 8 merkin salasana heittää virheen, jossa mainitaan `8`."),
      l(
        "Check `form.password.length < 8` and throw an `Error` that mentions 8.",
        "Tarkista `form.password.length < 8` ja heitä `Error`, jossa mainitaan 8.",
      ),
      code`
        let caught = null;
        try {
          validateSignup({ email: "ada@example.com", password: "short" });
        } catch (error) {
          caught = error;
        }
        t.ok(caught instanceof Error, "validateSignup should throw an Error.");
        t.includes(caught.message, "8");
      `,
    ),
    check(
      "exactly-eight",
      l("A password of exactly 8 characters is accepted.", "Täsmälleen 8 merkin salasana hyväksytään."),
      l("8 characters is enough: use `< 8`, not `<= 8`.", "8 merkkiä riittää: käytä vertailua `< 8`, ei `<= 8`."),
      `t.deepEqual(validateSignup({ email: "a@b.fi", password: "12345678" }), { email: "a@b.fi" });`,
    ),
  ],
  starter: code`
    function validateSignup(form) {
      return { email: form.email };
    }
  `,
});

export const jsParseSettings = jsChallenge({
  id: "js-parse-settings",
  chapterId: "js-errors",
  minutes: 9,
  title: l("Loading saved settings", "Tallennettujen asetusten lataus"),
  summary: l("Recover from invalid JSON with `try`/`catch` and defaults.", "Toivu virheellisestä JSONista rakenteella `try`/`catch` ja oletusarvoilla."),
  concept: l(
    md`
      Data from storage or a network can be broken. \`JSON.parse\` throws a \`SyntaxError\` for invalid text, so wrap it in \`try\`/\`catch\` and fall back to safe defaults:

      ~~~js
      let saved;
      try {
        saved = JSON.parse(text);
      } catch {
        saved = {};
      }
      ~~~

      Even valid JSON may not be what you expect (\`"42"\` parses to a number). Check the type before using it. The spread syntax \`{ ...defaults, ...saved }\` creates a **new** object where saved values override defaults.
    `,
    md`
      Tallennuksesta tai verkosta tuleva data voi olla rikki. \`JSON.parse\` heittää \`SyntaxError\`-virheen virheellisestä tekstistä, joten kääri se rakenteeseen \`try\`/\`catch\` ja käytä turvallisia oletusarvoja:

      ~~~js
      let saved;
      try {
        saved = JSON.parse(text);
      } catch {
        saved = {};
      }
      ~~~

      Kelvollinenkaan JSON ei aina ole sitä, mitä odotat (\`"42"\` jäsentyy luvuksi). Tarkista tyyppi ennen käyttöä. Levityssyntaksi \`{ ...defaults, ...saved }\` luo **uuden** olion, jossa tallennetut arvot korvaavat oletukset.
    `,
  ),
  objectives: [
    l("Catch an error with `try`/`catch`", "Ottaa virheen kiinni rakenteella `try`/`catch`"),
    l("Check the type of parsed data", "Tarkistaa jäsennetyn datan tyypin"),
    l("Merge objects with spread syntax", "Yhdistää olioita levityssyntaksilla"),
  ],
  instructions: l(
    md`
      Write \`parseSettings(text)\`. The defaults are \`{ theme: "light", fontSize: 14 }\`.

      - If \`text\` is valid JSON for a plain object, return the defaults overridden by its values.
      - If it is invalid JSON, or valid JSON that isn't a plain object (a number, \`null\`, an array…), return the defaults.
      - Always return a new object.
    `,
    md`
      Kirjoita funktio \`parseSettings(text)\`. Oletusarvot ovat \`{ theme: "light", fontSize: 14 }\`.

      - Jos \`text\` on kelvollista JSONia, joka kuvaa tavallisen olion, palauta oletukset sen arvoilla korvattuina.
      - Jos JSON on virheellistä tai se ei kuvaa tavallista oliota (luku, \`null\`, taulukko…), palauta oletukset.
      - Palauta aina uusi olio.
    `,
  ),
  hints: [
    l("Parse inside `try { ... } catch { ... }` and use the defaults in `catch`.", "Jäsennä lohkossa `try { ... } catch { ... }` ja käytä oletuksia `catch`-lohkossa."),
    l(
      "A plain object passes `typeof value === \"object\" && value !== null && !Array.isArray(value)`.",
      "Tavallinen olio täyttää ehdon `typeof value === \"object\" && value !== null && !Array.isArray(value)`.",
    ),
    l("Return `{ ...defaults, ...parsed }` so a new object is created every time.", "Palauta `{ ...defaults, ...parsed }`, jolloin luodaan joka kerta uusi olio."),
  ],
  tests: [
    check(
      "is-function",
      l("`parseSettings` is a function.", "`parseSettings` on funktio."),
      l("Define a function named `parseSettings`.", "Määrittele funktio nimeltä `parseSettings`."),
      `t.isType(parseSettings, "function");`,
    ),
    check(
      "merges",
      l("Saved values override the defaults.", "Tallennetut arvot korvaavat oletukset."),
      l("Return `{ ...defaults, ...parsed }`.", "Palauta `{ ...defaults, ...parsed }`."),
      code`
        t.deepEqual(parseSettings('{"theme":"dark","fontSize":18}'), { theme: "dark", fontSize: 18 });
        t.deepEqual(parseSettings('{"fontSize":16}'), { theme: "light", fontSize: 16 });
      `,
    ),
    check(
      "invalid-json",
      l("Invalid JSON gives the defaults instead of crashing.", "Virheellinen JSON antaa oletukset kaatumisen sijaan."),
      l("Catch the error from `JSON.parse` and return the defaults.", "Ota `JSON.parse`-virhe kiinni ja palauta oletukset."),
      code`
        t.deepEqual(parseSettings("{theme: dark"), { theme: "light", fontSize: 14 });
        t.deepEqual(parseSettings(""), { theme: "light", fontSize: 14 });
      `,
    ),
    check(
      "not-object",
      l("JSON that isn't a plain object gives the defaults.", "JSON, joka ei ole tavallinen olio, antaa oletukset."),
      l(
        "Check the parsed value: numbers, `null` and arrays are not settings.",
        "Tarkista jäsennetty arvo: luvut, `null` ja taulukot eivät ole asetuksia.",
      ),
      code`
        t.deepEqual(parseSettings("42"), { theme: "light", fontSize: 14 });
        t.deepEqual(parseSettings("null"), { theme: "light", fontSize: 14 });
        t.deepEqual(parseSettings("[1, 2]"), { theme: "light", fontSize: 14 });
      `,
    ),
    check(
      "new-object",
      l("Changing one result doesn't affect later calls.", "Yhden tuloksen muuttaminen ei vaikuta myöhempiin kutsuihin."),
      l(
        "Don't return the shared defaults object itself; return a copy such as `{ ...defaults }`.",
        "Älä palauta jaettua oletusoliota sellaisenaan; palauta kopio, kuten `{ ...defaults }`.",
      ),
      code`
        const first = parseSettings("oops");
        first.theme = "neon";
        t.deepEqual(parseSettings("oops"), { theme: "light", fontSize: 14 });
      `,
    ),
  ],
  starter: code`
    const defaults = { theme: "light", fontSize: 14 };

    function parseSettings(text) {
      return JSON.parse(text);
    }
  `,
});

/* ------------------------------------------------------------------ */
/* Async and await                                                     */
/* ------------------------------------------------------------------ */

export const jsAwaitUser = jsChallenge({
  id: "js-await-user",
  chapterId: "js-async",
  minutes: 8,
  title: l("Waiting for data", "Datan odottaminen"),
  summary: l("Use `async` and `await` to work with a slow operation.", "Käytä sanoja `async` ja `await` hitaan operaation kanssa."),
  concept: l(
    md`
      Slow work such as a network request returns a **promise**: a value that arrives later. Inside an \`async\` function, \`await\` pauses until the promise is ready:

      ~~~js
      async function showWeather(fetchWeather) {
        const weather = await fetchWeather("Oulu");
        return \`\${weather.temperature} °C\`;
      }
      ~~~

      Without \`await\` you get the promise object itself, not the data. An \`async\` function always returns a promise, so callers \`await\` it too.

      Passing the slow function in as a parameter (\`fetchWeather\`) makes the code easy to test with a fake version.
    `,
    md`
      Hidas työ, kuten verkkopyyntö, palauttaa **lupauksen** (promise): arvon, joka saapuu myöhemmin. \`async\`-funktiossa \`await\` odottaa, kunnes lupaus on valmis:

      ~~~js
      async function showWeather(fetchWeather) {
        const weather = await fetchWeather("Oulu");
        return \`\${weather.temperature} °C\`;
      }
      ~~~

      Ilman sanaa \`await\` saat itse lupausolion etkä dataa. \`async\`-funktio palauttaa aina lupauksen, joten kutsujatkin odottavat sitä sanalla \`await\`.

      Kun hidas funktio annetaan parametrina (\`fetchWeather\`), koodia on helppo testata korvaavalla versiolla.
    `,
  ),
  objectives: [
    l("Write an `async` function", "Kirjoittaa `async`-funktion"),
    l("Wait for a promise with `await`", "Odottaa lupausta sanalla `await`"),
    l("Handle a missing result", "Käsitellä puuttuvan tuloksen"),
  ],
  instructions: l(
    md`
      Write \`async function greetUser(fetchUser, id)\`. \`fetchUser(id)\` returns a promise for a user such as \`{ name: "Ada" }\`, or for \`null\` when the user doesn't exist.

      Return \`"Hello, Ada!"\` for a user, and \`"Hello, guest!"\` when the result is \`null\`.
    `,
    md`
      Kirjoita \`async function greetUser(fetchUser, id)\`. \`fetchUser(id)\` palauttaa lupauksen käyttäjästä, kuten \`{ name: "Ada" }\`, tai arvosta \`null\`, kun käyttäjää ei ole.

      Palauta käyttäjälle \`"Hello, Ada!"\` ja \`"Hello, guest!"\`, kun tulos on \`null\`.
    `,
  ),
  hints: [
    l("`const user = await fetchUser(id);`", "`const user = await fetchUser(id);`"),
    l(
      "`if (!user) return \"Hello, guest!\";` and otherwise `return \"Hello, \" + user.name + \"!\";`",
      "`if (!user) return \"Hello, guest!\";` ja muuten `return \"Hello, \" + user.name + \"!\";`",
    ),
  ],
  tests: [
    check(
      "is-function",
      l("`greetUser` is a function.", "`greetUser` on funktio."),
      l("Define `async function greetUser(fetchUser, id)`.", "Määrittele `async function greetUser(fetchUser, id)`."),
      `t.isType(greetUser, "function");`,
    ),
    check(
      "greets",
      l("A found user is greeted by name.", "Löytynyt käyttäjä tervehditään nimeltä."),
      l(
        "`await` the result of `fetchUser(id)` before reading `name`.",
        "Odota `fetchUser(id)`:n tulosta sanalla `await` ennen kuin luet kentän `name`.",
      ),
      code`
        const slowFetch = (id) => new Promise((resolve) => setTimeout(() => resolve({ name: "Ada" }), 20));
        t.equal(await greetUser(slowFetch, 1), "Hello, Ada!");
      `,
    ),
    check(
      "passes-id",
      l("The `id` is passed on to `fetchUser`.", "`id` välitetään funktiolle `fetchUser`."),
      l("Call `fetchUser(id)` with the id you were given.", "Kutsu `fetchUser(id)` saamallasi tunnisteella."),
      code`
        const asked = [];
        const fetchUser = async (id) => {
          asked.push(id);
          return { name: "Grace" };
        };
        await greetUser(fetchUser, 7);
        t.deepEqual(asked, [7]);
      `,
    ),
    check(
      "guest",
      l("A missing user gets `\"Hello, guest!\"`.", "Puuttuva käyttäjä saa tervehdyksen `\"Hello, guest!\"`."),
      l("When the awaited user is `null`, return `\"Hello, guest!\"`.", "Kun odotettu käyttäjä on `null`, palauta `\"Hello, guest!\"`."),
      code`
        const fetchUser = async () => null;
        t.equal(await greetUser(fetchUser, 99), "Hello, guest!");
      `,
    ),
    check(
      "returns-promise",
      l("`greetUser` returns a promise.", "`greetUser` palauttaa lupauksen."),
      l("Mark the function `async` so callers can `await` it.", "Merkitse funktio sanalla `async`, jotta kutsujat voivat odottaa sitä."),
      code`
        const result = greetUser(async () => ({ name: "Ada" }), 1);
        t.ok(result instanceof Promise, "greetUser(...) should return a Promise.");
        await result;
      `,
    ),
  ],
  starter: code`
    function greetUser(fetchUser, id) {
      const user = fetchUser(id);
      return "Hello, " + user.name + "!";
    }
  `,
});

export const jsWeatherDashboardLab = jsLab({
  id: "js-weather-dashboard-lab",
  chapterId: "js-async",
  minutes: 20,
  title: l("Lab: Weather dashboard", "Harjoitustyö: Säänäkymä"),
  summary: l(
    "Load data for many cities in parallel and keep going when one request fails.",
    "Lataa usean kaupungin tiedot rinnakkain ja jatka, vaikka yksi pyyntö epäonnistuisi.",
  ),
  concept: l(
    md`
      Awaiting requests one by one is slow: five 1-second requests take 5 seconds. Start them all first and wait for them together with \`Promise.all\`:

      ~~~js
      const pages = await Promise.all(urls.map((url) => download(url)));
      ~~~

      \`Promise.all\` keeps the original order, but it **rejects as soon as one promise fails**. To let each request fail on its own, catch errors per item:

      ~~~js
      const results = await Promise.all(
        urls.map(async (url) => {
          try {
            return await download(url);
          } catch {
            return null;
          }
        }),
      );
      ~~~
    `,
    md`
      Pyyntöjen odottaminen yksi kerrallaan on hidasta: viisi sekunnin pyyntöä kestää 5 sekuntia. Käynnistä ne kaikki ensin ja odota niitä yhdessä funktiolla \`Promise.all\`:

      ~~~js
      const pages = await Promise.all(urls.map((url) => download(url)));
      ~~~

      \`Promise.all\` säilyttää alkuperäisen järjestyksen, mutta se **hylätään heti, kun yksi lupaus epäonnistuu**. Jotta jokainen pyyntö voi epäonnistua erikseen, ota virheet kiinni alkiokohtaisesti:

      ~~~js
      const results = await Promise.all(
        urls.map(async (url) => {
          try {
            return await download(url);
          } catch {
            return null;
          }
        }),
      );
      ~~~
    `,
  ),
  objectives: [
    l("Run promises in parallel with `Promise.all`", "Ajaa lupauksia rinnakkain funktiolla `Promise.all`"),
    l("Handle a failure without losing other results", "Käsitellä epäonnistumisen menettämättä muita tuloksia"),
    l("Keep results in a predictable order", "Pitää tulokset ennustettavassa järjestyksessä"),
  ],
  requirements: [
    l(
      "`loadDashboard(cities, fetchTemperature)` returns a promise for an array of `{ city, temperature }` objects in the same order as `cities`.",
      "`loadDashboard(cities, fetchTemperature)` palauttaa lupauksen taulukosta, jossa on `{ city, temperature }`-olioita samassa järjestyksessä kuin `cities`.",
    ),
    l("`fetchTemperature(city)` is called exactly once per city.", "`fetchTemperature(city)` kutsutaan täsmälleen kerran jokaiselle kaupungille."),
    l("All requests run at the same time, not one after another.", "Kaikki pyynnöt ajetaan yhtä aikaa, ei peräkkäin."),
    l(
      "If a request fails, that city gets `temperature: null` and the others still load.",
      "Jos pyyntö epäonnistuu, kaupunki saa arvon `temperature: null` ja muut latautuvat silti.",
    ),
    l("An empty list of cities gives `[]`.", "Tyhjä kaupunkilista antaa `[]`."),
  ],
  instructions: l(
    "Write `async function loadDashboard(cities, fetchTemperature)` that meets the requirements. `fetchTemperature(city)` returns a promise for a number and may reject.",
    "Kirjoita vaatimukset täyttävä `async function loadDashboard(cities, fetchTemperature)`. `fetchTemperature(city)` palauttaa lupauksen luvusta ja voi epäonnistua (reject).",
  ),
  hints: [
    l(
      "Create one promise per city with `cities.map(async (city) => { ... })` and `await Promise.all(...)` the array.",
      "Luo jokaiselle kaupungille lupaus: `cities.map(async (city) => { ... })`, ja odota taulukkoa: `await Promise.all(...)`.",
    ),
    l(
      "Inside the callback: `try { return { city, temperature: await fetchTemperature(city) }; } catch { return { city, temperature: null }; }`",
      "Funktion sisällä: `try { return { city, temperature: await fetchTemperature(city) }; } catch { return { city, temperature: null }; }`",
    ),
  ],
  tests: [
    check(
      "is-function",
      l("`loadDashboard` is a function.", "`loadDashboard` on funktio."),
      l("Define `async function loadDashboard(cities, fetchTemperature)`.", "Määrittele `async function loadDashboard(cities, fetchTemperature)`."),
      `t.isType(loadDashboard, "function");`,
    ),
    check(
      "results",
      l("Results come back as `{ city, temperature }` in city order.", "Tulokset palautetaan muodossa `{ city, temperature }` kaupunkien järjestyksessä."),
      l(
        "Return one object per city, in the same order as `cities`, even if some requests finish earlier.",
        "Palauta yksi olio kaupunkia kohden samassa järjestyksessä kuin `cities`, vaikka jotkin pyynnöt valmistuisivat aiemmin.",
      ),
      code`
        const delays = { Oulu: 40, Turku: 5, Inari: 20 };
        const temps = { Oulu: -3, Turku: 4, Inari: -12 };
        const fetchTemperature = (city) => new Promise((resolve) => setTimeout(() => resolve(temps[city]), delays[city]));
        const result = await loadDashboard(["Oulu", "Turku", "Inari"], fetchTemperature);
        t.deepEqual(result, [
          { city: "Oulu", temperature: -3 },
          { city: "Turku", temperature: 4 },
          { city: "Inari", temperature: -12 },
        ]);
      `,
    ),
    check(
      "once-each",
      l("Each city is requested exactly once.", "Jokaista kaupunkia pyydetään täsmälleen kerran."),
      l("Call `fetchTemperature(city)` once for every city — no retries, no skipped cities.", "Kutsu `fetchTemperature(city)` kerran jokaiselle kaupungille — ei uusintoja eikä ohitettuja kaupunkeja."),
      code`
        const asked = [];
        const fetchTemperature = async (city) => {
          asked.push(city);
          return 0;
        };
        await loadDashboard(["A", "B", "C"], fetchTemperature);
        t.deepEqual([...asked].sort(), ["A", "B", "C"]);
      `,
    ),
    check(
      "parallel",
      l("Requests run in parallel.", "Pyynnöt ajetaan rinnakkain."),
      l(
        "Start every request before awaiting any of them, for example with `Promise.all(cities.map(...))`.",
        "Käynnistä kaikki pyynnöt ennen kuin odotat yhtäkään, esimerkiksi rakenteella `Promise.all(cities.map(...))`.",
      ),
      code`
        let running = 0;
        let mostAtOnce = 0;
        const fetchTemperature = (city) =>
          new Promise((resolve) => {
            running += 1;
            mostAtOnce = Math.max(mostAtOnce, running);
            setTimeout(() => {
              running -= 1;
              resolve(1);
            }, 15);
          });
        await loadDashboard(["A", "B", "C", "D"], fetchTemperature);
        t.equal(mostAtOnce, 4, "All four requests should be running at the same time.");
      `,
    ),
    check(
      "failure",
      l("A failed request gives `temperature: null` for that city only.", "Epäonnistunut pyyntö antaa arvon `temperature: null` vain sille kaupungille."),
      l(
        "Catch errors per city (inside the `map` callback) so one failure doesn't reject everything.",
        "Ota virheet kiinni kaupunkikohtaisesti (`map`-funktion sisällä), jotta yksi epäonnistuminen ei hylkää kaikkea.",
      ),
      code`
        const fetchTemperature = async (city) => {
          if (city === "Atlantis") throw new Error("City not found");
          return 10;
        };
        const result = await loadDashboard(["Oulu", "Atlantis", "Turku"], fetchTemperature);
        t.deepEqual(result, [
          { city: "Oulu", temperature: 10 },
          { city: "Atlantis", temperature: null },
          { city: "Turku", temperature: 10 },
        ]);
      `,
    ),
    check(
      "empty",
      l("No cities gives `[]`.", "Ilman kaupunkeja tulos on `[]`."),
      l("`loadDashboard([], ...)` should resolve to an empty array.", "`loadDashboard([], ...)` pitää ratketa tyhjäksi taulukoksi."),
      `t.deepEqual(await loadDashboard([], async () => 0), []);`,
    ),
  ],
  starter: code`
    async function loadDashboard(cities, fetchTemperature) {
      const result = [];
      // Load every city's temperature.
      return result;
    }
  `,
});
