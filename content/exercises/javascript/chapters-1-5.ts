import { check, jsChallenge, l } from "@/lib/content/factories";
import { code, md } from "@/lib/content/md";

/* ------------------------------------------------------------------ */
/* Chapter 1 — Hello, JavaScript                                      */
/* ------------------------------------------------------------------ */

export const jsHelloConsole = jsChallenge({
  id: "js-hello-console",
  chapterId: "js-intro",
  minutes: 2,
  title: l("Your first program", "Ensimmäinen ohjelmasi"),
  summary: l("Say hello with console.log().", "Tervehdi console.log()-funktiolla."),
  concept: l(
    md`
      A program is a list of instructions that runs from top to bottom. \`console.log()\` shows a value in the console:

      ~~~js
      console.log("Good morning!");
      ~~~

      Text in quotes is a **string**. JavaScript prints it exactly as written. The semicolon ends the statement.
    `,
    md`
      Ohjelma on luettelo ohjeita, jotka suoritetaan ylhäältä alaspäin. \`console.log()\` näyttää arvon konsolissa:

      ~~~js
      console.log("Good morning!");
      ~~~

      Lainausmerkeissä oleva teksti on **merkkijono**. JavaScript tulostaa sen täsmälleen sellaisenaan. Puolipiste päättää lauseen.
    `,
  ),
  objectives: [
    l("Run a JavaScript program", "Suorittaa JavaScript-ohjelman"),
    l("Log text with console.log()", "Tulostaa tekstiä console.log()-funktiolla"),
  ],
  instructions: l(
    "Log exactly `Hello, world!` to the console. Press **Run** to try it, then **Check answer**.",
    "Tulosta konsoliin täsmälleen `Hello, world!`. Kokeile painamalla **Suorita** ja sitten **Tarkista vastaus**.",
  ),
  hints: [
    l('Put the text in quotes inside the parentheses: `console.log("...")`.', 'Kirjoita teksti lainausmerkkeihin sulkeiden sisään: `console.log("...")`.'),
    l("Check the comma and the exclamation mark.", "Tarkista pilkku ja huutomerkki."),
  ],
  tests: [
    check(
      "logs-hello",
      l("The console shows `Hello, world!`", "Konsolissa näkyy `Hello, world!`"),
      l(
        "The console should show exactly `Hello, world!` — same capital letter, comma and exclamation mark.",
        "Konsolissa pitää näkyä täsmälleen `Hello, world!` – sama iso kirjain, pilkku ja huutomerkki.",
      ),
      `t.logged("Hello, world!");`,
    ),
    check(
      "only-greeting",
      l("Nothing else is logged.", "Muuta ei tulosteta."),
      l("Log only the greeting — remove extra `console.log()` calls.", "Tulosta vain tervehdys – poista ylimääräiset `console.log()`-kutsut."),
      `t.deepEqual(t.logs, ["Hello, world!"]);`,
    ),
  ],
  starter: "// Your first JavaScript program\n// Write your code below this line.\n",
  expectedOutput: { text: "Hello, world!" },
});

export const jsMultipleLogs = jsChallenge({
  id: "js-multiple-logs",
  chapterId: "js-intro",
  minutes: 3,
  title: l("Line by line", "Rivi kerrallaan"),
  summary: l("Log several lines in the right order.", "Tulosta useita rivejä oikeassa järjestyksessä."),
  concept: l(
    md`
      Statements run in order, one after another, so the order of your \`console.log()\` calls is the order of the lines in the console:

      ~~~js
      console.log("First");
      console.log("Second");
      ~~~
    `,
    md`
      Lauseet suoritetaan järjestyksessä yksi kerrallaan, joten \`console.log()\`-kutsujen järjestys on myös konsolin rivien järjestys:

      ~~~js
      console.log("First");
      console.log("Second");
      ~~~
    `,
  ),
  objectives: [
    l("Understand that statements run in order", "Ymmärtää, että lauseet suoritetaan järjestyksessä"),
    l("Log several lines", "Tulostaa useita rivejä"),
  ],
  instructions: l(
    md`
      Log these three lines, in this order:

      ~~~
      Ready
      Set
      Code!
      ~~~
    `,
    md`
      Tulosta nämä kolme riviä tässä järjestyksessä:

      ~~~
      Ready
      Set
      Code!
      ~~~
    `,
  ),
  hints: [
    l("Use one `console.log()` call per line.", "Käytä yhtä `console.log()`-kutsua riviä kohden."),
    l("`Ready` must be logged first.", "`Ready` tulostetaan ensin."),
  ],
  tests: [
    check(
      "all-lines",
      l("All three lines are logged.", "Kaikki kolme riviä tulostetaan."),
      l("At least one of `Ready`, `Set` and `Code!` is missing.", "Ainakin yksi riveistä `Ready`, `Set` ja `Code!` puuttuu."),
      `t.ok(["Ready", "Set", "Code!"].every((word) => t.logs.includes(word)));`,
    ),
    check(
      "order",
      l("The lines are in the right order.", "Rivit ovat oikeassa järjestyksessä."),
      l("The lines are in a different order. Reorder your `console.log()` calls.", "Rivit ovat eri järjestyksessä. Järjestä `console.log()`-kutsut uudelleen."),
      `t.deepEqual(t.logs, ["Ready", "Set", "Code!"]);`,
    ),
  ],
  starter: "// Write your code below this line.\n",
  expectedOutput: { text: "Ready\nSet\nCode!" },
});

/* ------------------------------------------------------------------ */
/* Chapter 2 — Variables and data types                               */
/* ------------------------------------------------------------------ */

export const jsLetUpdate = jsChallenge({
  id: "js-let-update",
  chapterId: "js-variables",
  minutes: 4,
  title: l("Changing a value", "Arvon muuttaminen"),
  summary: l("Update a variable declared with let.", "Päivitä let-avainsanalla esitelty muuttuja."),
  concept: l(
    md`
      Variables store values under a name. Declare a value that will change with \`let\`, and one that stays the same with \`const\`:

      ~~~js
      let lives = 3;
      lives = lives - 1;   // now 2
      const name = "Saku";
      ~~~

      \`lives -= 1\` and \`score += 5\` are shorter ways to update a variable. Assigning a new value to a \`const\` is an error.
    `,
    md`
      Muuttujat tallentavat arvoja nimen alle. Muuttuva arvo esitellään avainsanalla \`let\` ja pysyvä avainsanalla \`const\`:

      ~~~js
      let lives = 3;
      lives = lives - 1;   // nyt 2
      const name = "Saku";
      ~~~

      \`lives -= 1\` ja \`score += 5\` ovat lyhyempiä tapoja päivittää muuttujaa. Uuden arvon sijoittaminen \`const\`-muuttujaan on virhe.
    `,
  ),
  objectives: [
    l("Update a let variable", "Päivittää let-muuttujaa"),
    l("Know when to use let or const", "Tietää, milloin käyttää let- tai const-avainsanaa"),
  ],
  instructions: l(
    "A game starts with `score` at 0. Add `bonus` to `score` by updating the existing variable (don't declare a new one), then log `score`.",
    "Peli alkaa, kun `score` on 0. Lisää `bonus` muuttujaan `score` päivittämällä olemassa olevaa muuttujaa (älä esittele uutta) ja tulosta sitten `score`.",
  ),
  hints: [
    l("`score = score + bonus;` updates the variable.", "`score = score + bonus;` päivittää muuttujaa."),
    l("Then `console.log(score);`. You can also write `score += bonus;`.", "Sitten `console.log(score);`. Voit myös kirjoittaa `score += bonus;`."),
  ],
  tests: [
    check(
      "updated",
      l("`score` ends up as `score + bonus`.", "`score` on lopuksi `score + bonus`."),
      l("`score` wasn't increased by `bonus`. Update it with `score = score + bonus`.", "Muuttujaa `score` ei kasvatettu arvolla `bonus`. Päivitä se lausekkeella `score = score + bonus`."),
      `t.equal(score, 10);`,
    ),
    check(
      "other-values",
      l("It works for other starting scores and bonuses.", "Se toimii muillakin aloituspisteillä ja bonuksilla."),
      l("With other values, `score` was wrong. Calculate it from the variables instead of typing the result.", "Muilla arvoilla `score` oli väärin. Laske se muuttujista sen sijaan, että kirjoittaisit tuloksen."),
      code`
        const run = await t.runWith({ score: 5, bonus: 7 });
        t.equal(run.value("score"), 12);
      `,
    ),
    check(
      "logged",
      l("The console shows the new score.", "Konsolissa näkyy uusi pistemäärä."),
      l("Log `score` after updating it.", "Tulosta `score` päivityksen jälkeen."),
      `t.logged(String(score));`,
    ),
    check(
      "still-let",
      l("`score` is still declared with `let`.", "`score` on yhä esitelty avainsanalla `let`."),
      l("Keep `let score = 0;` — a `const` can't be changed.", "Säilytä `let score = 0;` – `const`-arvoa ei voi muuttaa."),
      `t.equal(t.ast.declarationKind("score"), "let");`,
    ),
  ],
  starter: "let score = 0;\nconst bonus = 10;\n\n// Write your code below this line.\n",
});

export const jsDataTypes = jsChallenge({
  id: "js-data-types",
  chapterId: "js-variables",
  minutes: 4,
  title: l("Data types", "Tietotyypit"),
  summary: l("Store strings, numbers and booleans.", "Tallenna merkkijonoja, lukuja ja totuusarvoja."),
  concept: l(
    md`
      Every value has a **type**. The basic ones are:

      - **string**: text in quotes, \`"Saku"\`
      - **number**: \`42\` or \`3.5\` — no quotes
      - **boolean**: \`true\` or \`false\`

      \`typeof\` tells you the type: \`typeof 42\` is \`"number"\`. Note that \`"42"\` in quotes is a string, not a number.
    `,
    md`
      Jokaisella arvolla on **tyyppi**. Perustyypit ovat:

      - **string** (merkkijono): tekstiä lainausmerkeissä, \`"Saku"\`
      - **number** (luku): \`42\` tai \`3.5\` – ilman lainausmerkkejä
      - **boolean** (totuusarvo): \`true\` tai \`false\`

      \`typeof\` kertoo tyypin: \`typeof 42\` on \`"number"\`. Huomaa, että lainausmerkeissä oleva \`"42"\` on merkkijono, ei luku.
    `,
  ),
  objectives: [
    l("Recognise strings, numbers and booleans", "Tunnistaa merkkijonot, luvut ja totuusarvot"),
    l("Check a type with typeof", "Tarkistaa tyypin typeof-operaattorilla"),
  ],
  instructions: l(
    "Describe a library book with three constants: `title` (a string), `pages` (a number) and `isAvailable` (a boolean). Then log `typeof pages`.",
    "Kuvaile kirjaston kirjaa kolmella vakiolla: `title` (merkkijono), `pages` (luku) ja `isAvailable` (totuusarvo). Tulosta sitten `typeof pages`.",
  ),
  hints: [
    l('Strings need quotes, numbers and booleans don\'t: `const pages = 300;`', 'Merkkijonot tarvitsevat lainausmerkit, luvut ja totuusarvot eivät: `const pages = 300;`'),
    l("`console.log(typeof pages);` should show `number`.", "`console.log(typeof pages);` näyttää tekstin `number`."),
  ],
  tests: [
    check(
      "title-string",
      l("`title` is a non-empty string.", "`title` on merkkijono, joka ei ole tyhjä."),
      l("`title` should be text in quotes.", "Muuttujan `title` pitää olla lainausmerkeissä olevaa tekstiä."),
      code`
        t.isType(title, "string");
        t.ok(title.trim().length > 0);
      `,
    ),
    check(
      "pages-number",
      l("`pages` is a positive number.", "`pages` on positiivinen luku."),
      l("`pages` should be a number without quotes, such as `300`.", "Muuttujan `pages` pitää olla luku ilman lainausmerkkejä, esimerkiksi `300`."),
      code`
        t.isType(pages, "number");
        t.ok(pages > 0);
      `,
    ),
    check(
      "available-boolean",
      l("`isAvailable` is a boolean.", "`isAvailable` on totuusarvo."),
      l("`isAvailable` should be `true` or `false`, without quotes.", "Muuttujan `isAvailable` pitää olla `true` tai `false` ilman lainausmerkkejä."),
      `t.isType(isAvailable, "boolean");`,
    ),
    check(
      "logs-type",
      l("The console shows `number`.", "Konsolissa näkyy `number`."),
      l("Log `typeof pages`.", "Tulosta `typeof pages`."),
      `t.logged("number");`,
    ),
  ],
  starter: "// Write your code below this line.\n",
});

/* ------------------------------------------------------------------ */
/* Chapter 3 — Operators and comparisons                              */
/* ------------------------------------------------------------------ */

export const jsArithmetic = jsChallenge({
  id: "js-arithmetic",
  chapterId: "js-operators",
  minutes: 4,
  title: l("Café receipt", "Kahvilan kuitti"),
  summary: l("Calculate with arithmetic operators.", "Laske aritmeettisilla operaattoreilla."),
  concept: l(
    md`
      JavaScript has the usual arithmetic operators: \`+\`, \`-\`, \`*\` and \`/\`. Multiplication and division happen first; parentheses change the order:

      ~~~js
      console.log(2 + 3 * 4);     // 14
      console.log((2 + 3) * 4);   // 20
      ~~~

      Careful: \`+\` also joins strings, so \`"2" + 3\` is \`"23"\`.
    `,
    md`
      JavaScriptissä on tavalliset laskuoperaattorit: \`+\`, \`-\`, \`*\` ja \`/\`. Kerto- ja jakolasku lasketaan ensin; sulkeilla järjestystä voi muuttaa:

      ~~~js
      console.log(2 + 3 * 4);     // 14
      console.log((2 + 3) * 4);   // 20
      ~~~

      Varo: \`+\` yhdistää myös merkkijonoja, joten \`"2" + 3\` on \`"23"\`.
    `,
  ),
  objectives: [
    l("Calculate with + - * /", "Laskea operaattoreilla + - * /"),
    l("Use variables in expressions", "Käyttää muuttujia lausekkeissa"),
  ],
  instructions: l(
    "`price` is the price of one bun and `quantity` how many you buy. Create a constant `total` with the total cost and log it.",
    "`price` on yhden pullan hinta ja `quantity` ostettavien pullien määrä. Luo vakio `total`, jossa on kokonaishinta, ja tulosta se.",
  ),
  hints: [
    l("Multiply the price by the quantity.", "Kerro hinta määrällä."),
    l("`const total = price * quantity;` and `console.log(total);`", "`const total = price * quantity;` ja `console.log(total);`"),
  ],
  tests: [
    check(
      "total-value",
      l("`total` is `price` × `quantity`.", "`total` on `price` × `quantity`."),
      l("`total` doesn't equal the price times the quantity.", "`total` ei ole hinta kertaa määrä."),
      `t.closeTo(total, price * quantity);`,
    ),
    check(
      "other-values",
      l("`total` is correct for other prices and quantities.", "`total` on oikein myös muilla hinnoilla ja määrillä."),
      l("With other values, `total` was wrong. Calculate it from the variables.", "Muilla arvoilla `total` oli väärin. Laske se muuttujista."),
      code`
        t.closeTo((await t.runWith({ price: 3, quantity: 7 })).value("total"), 21);
        t.closeTo((await t.runWith({ price: 1.2, quantity: 10 })).value("total"), 12);
      `,
    ),
    check(
      "logged",
      l("The console shows the total.", "Konsolissa näkyy kokonaishinta."),
      l("Log `total` at the end.", "Tulosta `total` lopuksi."),
      `t.ok(t.logs.some((line) => line.includes(String(total))));`,
    ),
  ],
  starter: "const price = 2.5;\nconst quantity = 4;\n\n// Write your code below this line.\n",
});

export const jsComparisons = jsChallenge({
  id: "js-comparisons",
  chapterId: "js-operators",
  minutes: 3,
  title: l("Comparing values", "Arvojen vertailu"),
  summary: l("Turn a comparison into a boolean.", "Muuta vertailu totuusarvoksi."),
  concept: l(
    md`
      Comparisons produce a boolean, \`true\` or \`false\`:

      ~~~js
      console.log(5 > 3);     // true
      console.log(5 === 3);   // false
      ~~~

      The operators are \`<\`, \`<=\`, \`>\`, \`>=\`, \`===\` (strictly equal) and \`!==\` (not equal). Prefer \`===\` over \`==\`: it doesn't convert types behind your back.
    `,
    md`
      Vertailut tuottavat totuusarvon, \`true\` tai \`false\`:

      ~~~js
      console.log(5 > 3);     // true
      console.log(5 === 3);   // false
      ~~~

      Operaattorit ovat \`<\`, \`<=\`, \`>\`, \`>=\`, \`===\` (täsmälleen yhtä suuri) ja \`!==\` (eri suuri). Käytä mieluummin \`===\` kuin \`==\`: se ei muunna tyyppejä huomaamatta.
    `,
  ),
  objectives: [
    l("Use comparison operators", "Käyttää vertailuoperaattoreita"),
    l("Store a boolean result", "Tallentaa totuusarvoisen tuloksen"),
  ],
  instructions: l(
    "Create `isAdult`, which is `true` when `age` is 18 or more and `false` otherwise. Use a comparison — don't write `true` or `false` yourself.",
    "Luo `isAdult`, joka on `true`, kun `age` on 18 tai enemmän, ja muuten `false`. Käytä vertailua – älä kirjoita arvoja `true` tai `false` itse.",
  ),
  hints: [
    l("“18 or more” is `>= 18`.", "”18 tai enemmän” on `>= 18`."),
    l("`const isAdult = age >= 18;`", "`const isAdult = age >= 18;`"),
  ],
  tests: [
    check(
      "is-boolean",
      l("`isAdult` is a boolean.", "`isAdult` on totuusarvo."),
      l("`isAdult` should be the result of a comparison: `true` or `false`.", "Muuttujan `isAdult` pitää olla vertailun tulos: `true` tai `false`."),
      `t.isType(isAdult, "boolean");`,
    ),
    check(
      "under",
      l("`isAdult` is `false` for age 17.", "`isAdult` on `false`, kun ikä on 17."),
      l("For age 17, `isAdult` should be `false`.", "Kun ikä on 17, muuttujan `isAdult` pitää olla `false`."),
      `t.equal((await t.runWith({ age: 17 })).value("isAdult"), false);`,
    ),
    check(
      "boundary",
      l("`isAdult` is `true` for exactly 18.", "`isAdult` on `true`, kun ikä on tasan 18."),
      l("For exactly 18, `isAdult` should be `true`. Check `>` versus `>=`.", "Kun ikä on tasan 18, muuttujan `isAdult` pitää olla `true`. Tarkista `>` vai `>=`."),
      `t.equal((await t.runWith({ age: 18 })).value("isAdult"), true);`,
    ),
    check(
      "over",
      l("`isAdult` is `true` for age 40.", "`isAdult` on `true`, kun ikä on 40."),
      l("For age 40, `isAdult` should be `true`.", "Kun ikä on 40, muuttujan `isAdult` pitää olla `true`."),
      `t.equal((await t.runWith({ age: 40 })).value("isAdult"), true);`,
    ),
  ],
  starter: "const age = 17;\n\n// Write your code below this line.\n",
});

/* ------------------------------------------------------------------ */
/* Chapter 4 — Conditional statements                                 */
/* ------------------------------------------------------------------ */

export const jsIfElse = jsChallenge({
  id: "js-if-else",
  chapterId: "js-conditions",
  minutes: 4,
  title: l("If this, then that", "Jos näin, niin noin"),
  summary: l("Choose between two actions with if and else.", "Valitse kahden toiminnon välillä if- ja else-rakenteella."),
  concept: l(
    md`
      An \`if\` statement runs its block only when the condition is \`true\`; \`else\` runs otherwise:

      ~~~js
      if (points >= 10) {
        console.log("You win!");
      } else {
        console.log("Try again");
      }
      ~~~

      The condition goes in parentheses and each block in curly braces.
    `,
    md`
      \`if\`-lause suorittaa lohkonsa vain, kun ehto on \`true\`; muuten suoritetaan \`else\`:

      ~~~js
      if (points >= 10) {
        console.log("You win!");
      } else {
        console.log("Try again");
      }
      ~~~

      Ehto kirjoitetaan sulkeisiin ja jokainen lohko aaltosulkeisiin.
    `,
  ),
  objectives: [
    l("Write an if / else statement", "Kirjoittaa if/else-rakenteen"),
    l("Pick the right boundary operator", "Valita oikea rajaoperaattori"),
  ],
  instructions: l(
    "Log `Warm` when `temperature` is 20 or more, and `Cool` otherwise. Log only one of the two words.",
    "Tulosta `Warm`, kun `temperature` on 20 tai enemmän, ja muuten `Cool`. Tulosta vain toinen sanoista.",
  ),
  hints: [
    l("`if (temperature >= 20) { ... } else { ... }`", "`if (temperature >= 20) { ... } else { ... }`"),
    l("Put one `console.log()` in each block.", "Kirjoita kumpaankin lohkoon yksi `console.log()`."),
  ],
  tests: [
    check(
      "uses-conditional",
      l("The program makes a decision with a conditional.", "Ohjelma tekee päätöksen ehtorakenteella."),
      l("Use `if` / `else` (or the `? :` operator) to choose what to log.", "Valitse tulostettava teksti rakenteella `if` / `else` (tai `? :`-operaattorilla)."),
      `t.ok(t.ast.has("IfStatement") || t.ast.has("ConditionalExpression") || t.ast.has("SwitchStatement"));`,
    ),
    check(
      "warm",
      l("25 degrees logs only `Warm`.", "25 astetta tulostaa vain `Warm`."),
      l("For 25 degrees the console should show just `Warm`.", "25 asteessa konsolissa pitää näkyä pelkkä `Warm`."),
      `t.deepEqual((await t.runWith({ temperature: 25 })).logs, ["Warm"]);`,
    ),
    check(
      "boundary",
      l("Exactly 20 degrees logs `Warm`.", "Tasan 20 astetta tulostaa `Warm`."),
      l("At exactly 20 degrees the console should show `Warm`. Check `>` versus `>=`.", "Tasan 20 asteessa konsolissa pitää näkyä `Warm`. Tarkista `>` vai `>=`."),
      `t.deepEqual((await t.runWith({ temperature: 20 })).logs, ["Warm"]);`,
    ),
    check(
      "cool",
      l("5 degrees logs only `Cool`.", "5 astetta tulostaa vain `Cool`."),
      l("For 5 degrees the console should show just `Cool`.", "5 asteessa konsolissa pitää näkyä pelkkä `Cool`."),
      `t.deepEqual((await t.runWith({ temperature: 5 })).logs, ["Cool"]);`,
    ),
  ],
  starter: "const temperature = 22;\n\n// Write your code below this line.\n",
});

export const jsLogicalOperators = jsChallenge({
  id: "js-logical-operators",
  chapterId: "js-conditions",
  minutes: 4,
  title: l("Combining conditions", "Ehtojen yhdistäminen"),
  summary: l("Combine booleans with &&, || and !.", "Yhdistä totuusarvoja operaattoreilla &&, || ja !."),
  concept: l(
    md`
      Logical operators combine booleans:

      - \`a && b\` is \`true\` only when **both** are true
      - \`a || b\` is \`true\` when **at least one** is true
      - \`!a\` flips the value

      ~~~js
      const canSwim = isSummer && !isStormy;
      ~~~
    `,
    md`
      Loogiset operaattorit yhdistävät totuusarvoja:

      - \`a && b\` on \`true\` vain, kun **molemmat** ovat tosia
      - \`a || b\` on \`true\`, kun **ainakin toinen** on tosi
      - \`!a\` kääntää arvon

      ~~~js
      const canSwim = isSummer && !isStormy;
      ~~~
    `,
  ),
  objectives: [
    l("Use &&, || and !", "Käyttää operaattoreita &&, || ja !"),
    l("Translate a rule into an expression", "Muuttaa säännön lausekkeeksi"),
  ],
  instructions: l(
    "A concert lets you in if you **have a ticket** and you are **not banned**. Create `canEnter` from `hasTicket` and `isBanned`.",
    "Konserttiin pääsee, jos sinulla **on lippu** etkä ole **porttikiellossa**. Luo `canEnter` muuttujista `hasTicket` ja `isBanned`.",
  ),
  hints: [
    l("“Not banned” is `!isBanned`.", "”Ei porttikiellossa” on `!isBanned`."),
    l("Both must hold: `hasTicket && !isBanned`.", "Molempien pitää täyttyä: `hasTicket && !isBanned`."),
  ],
  tests: [
    check(
      "is-boolean",
      l("`canEnter` is a boolean.", "`canEnter` on totuusarvo."),
      l("`canEnter` should be `true` or `false`.", "Muuttujan `canEnter` pitää olla `true` tai `false`."),
      `t.isType(canEnter, "boolean");`,
    ),
    check(
      "allowed",
      l("With a ticket and no ban, `canEnter` is `true`.", "Kun lippu on eikä porttikieltoa ole, `canEnter` on `true`."),
      l("A ticket holder who isn't banned should get in.", "Lipun haltijan, joka ei ole porttikiellossa, pitää päästä sisään."),
      `t.equal((await t.runWith({ hasTicket: true, isBanned: false })).value("canEnter"), true);`,
    ),
    check(
      "no-ticket",
      l("Without a ticket, `canEnter` is `false`.", "Ilman lippua `canEnter` on `false`."),
      l("Someone without a ticket got in. Use `&&`, not `||`.", "Joku pääsi sisään ilman lippua. Käytä operaattoria `&&`, ei `||`."),
      `t.equal((await t.runWith({ hasTicket: false, isBanned: false })).value("canEnter"), false);`,
    ),
    check(
      "banned",
      l("A banned person with a ticket can't enter.", "Porttikiellossa oleva ei pääse sisään lipullakaan."),
      l("A banned person got in. Include `!isBanned`.", "Porttikiellossa oleva pääsi sisään. Lisää ehtoon `!isBanned`."),
      `t.equal((await t.runWith({ hasTicket: true, isBanned: true })).value("canEnter"), false);`,
    ),
  ],
  starter: "const hasTicket = true;\nconst isBanned = false;\n\n// Write your code below this line.\n",
});

/* ------------------------------------------------------------------ */
/* Chapter 5 — Functions                                              */
/* ------------------------------------------------------------------ */

export const jsRectangleArea = jsChallenge({
  id: "js-rectangle-area",
  chapterId: "js-functions",
  minutes: 4,
  title: l("Several parameters", "Useita parametreja"),
  summary: l("Write a function with two inputs.", "Kirjoita funktio, jolla on kaksi syötettä."),
  concept: l(
    md`
      Functions can take several parameters, separated by commas. Arguments are matched to parameters in order:

      ~~~js
      function totalPrice(price, quantity) {
        return price * quantity;
      }

      console.log(totalPrice(2.5, 4));   // 10
      ~~~
    `,
    md`
      Funktiolla voi olla useita parametreja pilkuilla erotettuina. Argumentit sijoitetaan parametreihin järjestyksessä:

      ~~~js
      function totalPrice(price, quantity) {
        return price * quantity;
      }

      console.log(totalPrice(2.5, 4));   // 10
      ~~~
    `,
  ),
  objectives: [
    l("Define a function with several parameters", "Määritellä funktion, jolla on useita parametreja"),
    l("Return a computed value", "Palauttaa lasketun arvon"),
  ],
  instructions: l(
    "Write `rectangleArea(width, height)` that returns the area of a rectangle. Then log the area of a 3 × 4 rectangle.",
    "Kirjoita funktio `rectangleArea(width, height)`, joka palauttaa suorakulmion pinta-alan. Tulosta sitten 3 × 4 -suorakulmion pinta-ala.",
  ),
  hints: [
    l("`return width * height;`", "`return width * height;`"),
    l("`console.log(rectangleArea(3, 4));`", "`console.log(rectangleArea(3, 4));`"),
  ],
  tests: [
    check(
      "is-function",
      l("`rectangleArea` is a function.", "`rectangleArea` on funktio."),
      l("Define a function named `rectangleArea`.", "Määrittele funktio nimeltä `rectangleArea`."),
      `t.isType(rectangleArea, "function");`,
    ),
    check(
      "small",
      l("`rectangleArea(3, 4)` returns `12`.", "`rectangleArea(3, 4)` palauttaa `12`."),
      l("Return the width multiplied by the height.", "Palauta leveys kerrottuna korkeudella."),
      `t.closeTo(rectangleArea(3, 4), 12);`,
    ),
    check(
      "decimals",
      l("`rectangleArea(2.5, 2)` returns `5`.", "`rectangleArea(2.5, 2)` palauttaa `5`."),
      l("Decimal sizes give the wrong area.", "Desimaalimitat antavat väärän pinta-alan."),
      `t.closeTo(rectangleArea(2.5, 2), 5);`,
    ),
    check(
      "zero",
      l("A width of 0 gives `0`.", "Leveys 0 antaa tuloksen `0`."),
      l("`rectangleArea(0, 7)` should return `0`.", "`rectangleArea(0, 7)` pitää palauttaa `0`."),
      `t.closeTo(rectangleArea(0, 7), 0);`,
    ),
    check(
      "logged",
      l("The console shows the area of a 3 × 4 rectangle.", "Konsolissa näkyy 3 × 4 -suorakulmion pinta-ala."),
      l("Log `rectangleArea(3, 4)`.", "Tulosta `rectangleArea(3, 4)`."),
      `t.logged("12");`,
    ),
  ],
  starter: "// Write your function below this line.\n",
});
