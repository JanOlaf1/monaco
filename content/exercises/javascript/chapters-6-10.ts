import { check, jsChallenge, jsLab, l } from "@/lib/content/factories";
import { code, md } from "@/lib/content/md";

/* ------------------------------------------------------------------ */
/* Chapter 6 — Loops                                                  */
/* ------------------------------------------------------------------ */

export const jsForLoop = jsChallenge({
  id: "js-for-loop",
  chapterId: "js-loops",
  minutes: 4,
  title: l("Counting with for", "Laskeminen for-silmukalla"),
  summary: l("Repeat code with a for loop.", "Toista koodia for-silmukalla."),
  concept: l(
    md`
      A \`for\` loop has three parts: a start, a condition and a step. The block repeats while the condition is true:

      ~~~js
      for (let i = 1; i <= 3; i++) {
        console.log(i);   // 1, 2, 3
      }
      ~~~

      \`i++\` adds 1 to \`i\` after each round.
    `,
    md`
      \`for\`-silmukassa on kolme osaa: alku, ehto ja askel. Lohko toistuu niin kauan kuin ehto on tosi:

      ~~~js
      for (let i = 1; i <= 3; i++) {
        console.log(i);   // 1, 2, 3
      }
      ~~~

      \`i++\` lisää muuttujaan \`i\` ykkösen jokaisen kierroksen jälkeen.
    `,
  ),
  objectives: [
    l("Write a for loop", "Kirjoittaa for-silmukan"),
    l("Choose the right loop condition", "Valita oikea silmukkaehto"),
  ],
  instructions: l(
    "Use a loop to log the numbers 1 to 5, one per line.",
    "Tulosta silmukan avulla luvut 1–5, yksi kullekin riville.",
  ),
  hints: [
    l("Start at 1 and continue while `i <= 5`.", "Aloita ykkösestä ja jatka, kun `i <= 5`."),
    l("`for (let i = 1; i <= 5; i++) { console.log(i); }`", "`for (let i = 1; i <= 5; i++) { console.log(i); }`"),
  ],
  tests: [
    check(
      "uses-loop",
      l("The program uses a loop.", "Ohjelma käyttää silmukkaa."),
      l("Use a loop instead of five separate `console.log()` calls.", "Käytä silmukkaa viiden erillisen `console.log()`-kutsun sijaan."),
      code`
        const loops = ["ForStatement", "WhileStatement", "DoWhileStatement", "ForOfStatement"];
        t.ok(loops.some((type) => t.ast.has(type)));
      `,
    ),
    check(
      "output",
      l("The console shows 1 to 5, one per line.", "Konsolissa näkyvät luvut 1–5 omilla riveillään."),
      l("The output should be 1, 2, 3, 4 and 5. Check where the loop starts and stops.", "Tulosteen pitää olla 1, 2, 3, 4 ja 5. Tarkista, mistä silmukka alkaa ja mihin se päättyy."),
      `t.deepEqual(t.logs, ["1", "2", "3", "4", "5"]);`,
    ),
  ],
  starter: "// Write your code below this line.\n",
  expectedOutput: { text: "1\n2\n3\n4\n5" },
});

export const jsSumTo = jsChallenge({
  id: "js-sum-to",
  chapterId: "js-loops",
  minutes: 5,
  title: l("Adding up numbers", "Lukujen summa"),
  summary: l("Build a total inside a loop.", "Kerrytä summa silmukan sisällä."),
  concept: l(
    md`
      To add up many values, start from 0 and add each value inside a loop — the **accumulator** pattern:

      ~~~js
      let total = 0;
      for (let i = 1; i <= 3; i++) {
        total += i;
      }
      // total is 6
      ~~~
    `,
    md`
      Kun lasket monta arvoa yhteen, aloita nollasta ja lisää jokainen arvo silmukassa – tätä kutsutaan **kerääjäksi**:

      ~~~js
      let total = 0;
      for (let i = 1; i <= 3; i++) {
        total += i;
      }
      // total on 6
      ~~~
    `,
  ),
  objectives: [
    l("Use the accumulator pattern", "Käyttää kerääjärakennetta"),
    l("Return a result from a loop", "Palauttaa silmukassa lasketun tuloksen"),
  ],
  instructions: l(
    "Write `sumTo(n)` that returns 1 + 2 + … + n. For example `sumTo(4)` is `10`, and `sumTo(0)` is `0`.",
    "Kirjoita funktio `sumTo(n)`, joka palauttaa summan 1 + 2 + … + n. Esimerkiksi `sumTo(4)` on `10` ja `sumTo(0)` on `0`.",
  ),
  hints: [
    l("Create `let total = 0;` before the loop and `return total;` after it.", "Luo `let total = 0;` ennen silmukkaa ja `return total;` sen jälkeen."),
    l("Loop with `for (let i = 1; i <= n; i++)` and add `i` each time.", "Silmukoi `for (let i = 1; i <= n; i++)` ja lisää `i` joka kerta."),
  ],
  tests: [
    check(
      "is-function",
      l("`sumTo` is a function.", "`sumTo` on funktio."),
      l("Define a function named `sumTo`.", "Määrittele funktio nimeltä `sumTo`."),
      `t.isType(sumTo, "function");`,
    ),
    check(
      "small",
      l("`sumTo(4)` returns `10`.", "`sumTo(4)` palauttaa `10`."),
      l("`sumTo(4)` should be 1 + 2 + 3 + 4 = 10. Check where your loop starts and stops.", "`sumTo(4)` pitää olla 1 + 2 + 3 + 4 = 10. Tarkista, mistä silmukka alkaa ja mihin se päättyy."),
      `t.equal(sumTo(4), 10);`,
    ),
    check(
      "one-and-zero",
      l("`sumTo(1)` is `1` and `sumTo(0)` is `0`.", "`sumTo(1)` on `1` ja `sumTo(0)` on `0`."),
      l("Small inputs give the wrong result.", "Pienet syötteet antavat väärän tuloksen."),
      code`
        t.equal(sumTo(1), 1);
        t.equal(sumTo(0), 0);
      `,
    ),
    check(
      "large",
      l("`sumTo(100)` returns `5050`.", "`sumTo(100)` palauttaa `5050`."),
      l("Larger inputs give the wrong result.", "Suuremmat syötteet antavat väärän tuloksen."),
      `t.equal(sumTo(100), 5050);`,
    ),
  ],
  starter: "// Write your function below this line.\n",
});

/* ------------------------------------------------------------------ */
/* Chapter 7 — Arrays                                                 */
/* ------------------------------------------------------------------ */

export const jsArrayPush = jsChallenge({
  id: "js-array-push",
  chapterId: "js-arrays",
  minutes: 4,
  title: l("Growing an array", "Taulukko kasvaa"),
  summary: l("Add items to an array and count them.", "Lisää taulukkoon alkioita ja laske ne."),
  concept: l(
    md`
      An **array** holds values in order: \`const tools = ["map", "paddle"];\`. Positions start at 0, so \`tools[0]\` is \`"map"\`.

      \`push()\` adds an item to the end and \`length\` tells how many items there are:

      ~~~js
      tools.push("rope");
      console.log(tools.length);   // 3
      ~~~

      A \`const\` array can still change its contents — \`const\` only stops you from assigning a whole new array.
    `,
    md`
      **Taulukko** (array) säilyttää arvoja järjestyksessä: \`const tools = ["map", "paddle"];\`. Kohdat alkavat nollasta, joten \`tools[0]\` on \`"map"\`.

      \`push()\` lisää alkion loppuun, ja \`length\` kertoo alkioiden määrän:

      ~~~js
      tools.push("rope");
      console.log(tools.length);   // 3
      ~~~

      \`const\`-taulukon sisältöä voi silti muuttaa – \`const\` estää vain kokonaan uuden taulukon sijoittamisen.
    `,
  ),
  objectives: [
    l("Add items with push()", "Lisätä alkioita push()-metodilla"),
    l("Read the length of an array", "Lukea taulukon pituuden"),
  ],
  instructions: l(
    'Add `"blue"` to the end of `colors`, then log how many colors the array has.',
    'Lisää `"blue"` taulukon `colors` loppuun ja tulosta sitten taulukon värien määrä.',
  ),
  hints: [
    l('`colors.push("blue");`', '`colors.push("blue");`'),
    l("`console.log(colors.length);`", "`console.log(colors.length);`"),
  ],
  tests: [
    check(
      "appended",
      l('`"blue"` is added to the end of `colors`.', '`"blue"` on lisätty taulukon `colors` loppuun.'),
      l('`colors` should end with `"blue"`. Use `push()`.', 'Taulukon `colors` pitää päättyä alkioon `"blue"`. Käytä `push()`-metodia.'),
      `t.deepEqual(colors, ["red", "green", "blue"]);`,
    ),
    check(
      "other-array",
      l("It works when `colors` starts with other items.", "Se toimii, vaikka `colors` sisältäisi alussa muita alkioita."),
      l("With a different starting array, the result was wrong. Add to the existing array.", "Toisella alkutaulukolla tulos oli väärin. Lisää olemassa olevaan taulukkoon."),
      `t.deepEqual((await t.runWith({ colors: ["black"] })).value("colors"), ["black", "blue"]);`,
    ),
    check(
      "logged",
      l("The console shows the number of colors.", "Konsolissa näkyy värien määrä."),
      l("Log `colors.length` after adding the color.", "Tulosta `colors.length`, kun olet lisännyt värin."),
      `t.ok(t.logs.some((line) => line.includes(String(colors.length))));`,
    ),
  ],
  starter: 'const colors = ["red", "green"];\n\n// Write your code below this line.\n',
});

export const jsFilterEven = jsChallenge({
  id: "js-filter-even",
  chapterId: "js-arrays",
  minutes: 6,
  title: l("Filtering arrays", "Taulukon suodattaminen"),
  summary: l("Return a new array with only some items.", "Palauta uusi taulukko, jossa on vain osa alkioista."),
  concept: l(
    md`
      \`filter()\` creates a **new** array with the items for which a function returns \`true\`. The original array is not changed:

      ~~~js
      const scores = [40, 75, 90];
      const passed = scores.filter((score) => score >= 50);
      // passed is [75, 90], scores is unchanged
      ~~~

      A number is even when \`number % 2 === 0\`.
    `,
    md`
      \`filter()\` luo **uuden** taulukon niistä alkioista, joille annettu funktio palauttaa \`true\`. Alkuperäinen taulukko ei muutu:

      ~~~js
      const scores = [40, 75, 90];
      const passed = scores.filter((score) => score >= 50);
      // passed on [75, 90], scores on ennallaan
      ~~~

      Luku on parillinen, kun \`number % 2 === 0\`.
    `,
  ),
  objectives: [
    l("Filter an array", "Suodattaa taulukon"),
    l("Avoid changing the input", "Välttää syötteen muuttamista"),
  ],
  instructions: l(
    "Write `onlyEven(numbers)` that returns a new array containing only the even numbers. Don't change the original array.",
    "Kirjoita funktio `onlyEven(numbers)`, joka palauttaa uuden taulukon, jossa on vain parilliset luvut. Älä muuta alkuperäistä taulukkoa.",
  ),
  hints: [
    l("`numbers.filter(...)` returns a new array.", "`numbers.filter(...)` palauttaa uuden taulukon."),
    l("`return numbers.filter((n) => n % 2 === 0);`", "`return numbers.filter((n) => n % 2 === 0);`"),
  ],
  tests: [
    check(
      "is-function",
      l("`onlyEven` is a function.", "`onlyEven` on funktio."),
      l("Define a function named `onlyEven`.", "Määrittele funktio nimeltä `onlyEven`."),
      `t.isType(onlyEven, "function");`,
    ),
    check(
      "basic",
      l("`onlyEven([1, 2, 3, 4])` returns `[2, 4]`.", "`onlyEven([1, 2, 3, 4])` palauttaa `[2, 4]`."),
      l("Keep the numbers where `n % 2 === 0`.", "Säilytä luvut, joille `n % 2 === 0`."),
      `t.deepEqual(onlyEven([1, 2, 3, 4]), [2, 4]);`,
    ),
    check(
      "none",
      l("An array without even numbers gives `[]`.", "Taulukko ilman parillisia lukuja antaa `[]`."),
      l("`onlyEven([1, 3])` should return an empty array.", "`onlyEven([1, 3])` pitää palauttaa tyhjä taulukko."),
      `t.deepEqual(onlyEven([1, 3]), []);`,
    ),
    check(
      "negatives",
      l("Zero and negative even numbers are kept.", "Nolla ja negatiiviset parilliset luvut säilytetään."),
      l(
        "Zero and negative numbers are handled wrongly. Note that `-3 % 2` is `-1`, so test for `=== 0`.",
        "Nolla ja negatiiviset luvut käsitellään väärin. Huomaa, että `-3 % 2` on `-1`, joten vertaa lausekkeella `=== 0`.",
      ),
      `t.deepEqual(onlyEven([0, -2, -3]), [0, -2]);`,
    ),
    check(
      "no-mutation",
      l("The original array is not changed.", "Alkuperäinen taulukko ei muutu."),
      l("`onlyEven` changed the array it was given. Return a new array instead.", "`onlyEven` muutti sille annettua taulukkoa. Palauta sen sijaan uusi taulukko."),
      code`
        const input = [1, 2, 3, 4];
        onlyEven(input);
        t.deepEqual(input, [1, 2, 3, 4]);
      `,
    ),
  ],
  starter: "// Write your function below this line.\n",
});

/* ------------------------------------------------------------------ */
/* Chapter 8 — Objects                                                */
/* ------------------------------------------------------------------ */

export const jsObjectBasics = jsChallenge({
  id: "js-object-basics",
  chapterId: "js-objects",
  minutes: 4,
  title: l("Your first object", "Ensimmäinen oliosi"),
  summary: l("Group related values into an object.", "Ryhmittele toisiinsa liittyvät arvot olioksi."),
  concept: l(
    md`
      An **object** groups related values under named **properties**:

      ~~~js
      const pet = { name: "Saku", age: 4 };
      console.log(pet.name);   // "Saku"
      ~~~

      Read a property with a dot: \`pet.age\`. Properties can hold any type of value.
    `,
    md`
      **Olio** (object) ryhmittelee toisiinsa liittyvät arvot nimettyihin **ominaisuuksiin**:

      ~~~js
      const pet = { name: "Saku", age: 4 };
      console.log(pet.name);   // "Saku"
      ~~~

      Ominaisuuden arvo luetaan pisteellä: \`pet.age\`. Ominaisuuksissa voi olla minkä tahansa tyyppisiä arvoja.
    `,
  ),
  objectives: [
    l("Create an object literal", "Luoda olioliteraalin"),
    l("Read a property with dot notation", "Lukea ominaisuuden pistemerkinnällä"),
  ],
  instructions: l(
    "Create a constant `book` with two properties: `title` (a string) and `pages` (a number). Then log the book's title.",
    "Luo vakio `book`, jolla on kaksi ominaisuutta: `title` (merkkijono) ja `pages` (luku). Tulosta sitten kirjan nimi.",
  ),
  hints: [
    l('`const book = { title: "Moomins", pages: 160 };`', '`const book = { title: "Muumit", pages: 160 };`'),
    l("Log the property, not the whole object: `console.log(book.title);`", "Tulosta ominaisuus, ei koko oliota: `console.log(book.title);`"),
  ],
  tests: [
    check(
      "is-object",
      l("`book` is an object.", "`book` on olio."),
      l("Create `book` with curly braces: `{ ... }`.", "Luo `book` aaltosulkeilla: `{ ... }`."),
      `t.isType(book, "object");`,
    ),
    check(
      "title",
      l("`book.title` is a non-empty string.", "`book.title` on merkkijono, joka ei ole tyhjä."),
      l("Give `book` a `title` property with text in quotes.", "Anna oliolle `book` ominaisuus `title`, jonka arvo on lainausmerkeissä oleva teksti."),
      code`
        t.isType(book.title, "string");
        t.ok(book.title.trim().length > 0);
      `,
    ),
    check(
      "pages",
      l("`book.pages` is a number.", "`book.pages` on luku."),
      l("Give `book` a `pages` property with a number (no quotes).", "Anna oliolle `book` ominaisuus `pages`, jonka arvo on luku (ilman lainausmerkkejä)."),
      `t.isType(book.pages, "number");`,
    ),
    check(
      "logs-title",
      l("The console shows the title.", "Konsolissa näkyy kirjan nimi."),
      l("Log `book.title` — just the title, not the whole object.", "Tulosta `book.title` – pelkkä nimi, ei koko oliota."),
      `t.logged(book.title);`,
    ),
  ],
  starter: "// Write your code below this line.\n",
});

export const jsDescribePet = jsChallenge({
  id: "js-describe-pet",
  chapterId: "js-objects",
  minutes: 5,
  title: l("Objects as parameters", "Olio parametrina"),
  summary: l("Read properties of an object passed to a function.", "Lue funktiolle annetun olion ominaisuuksia."),
  concept: l(
    md`
      Functions often receive objects. Inside the function, read the properties you need:

      ~~~js
      function label(product) {
        return product.name + ": " + product.price + " €";
      }

      label({ name: "Tea", price: 2.8 });   // "Tea: 2.8 €"
      ~~~

      You can also **destructure** the parameter: \`function label({ name, price }) { ... }\`.
    `,
    md`
      Funktiot saavat usein parametrinaan olioita. Lue funktion sisällä tarvitsemasi ominaisuudet:

      ~~~js
      function label(product) {
        return product.name + ": " + product.price + " €";
      }

      label({ name: "Tea", price: 2.8 });   // "Tea: 2.8 €"
      ~~~

      Parametrin voi myös **purkaa**: \`function label({ name, price }) { ... }\`.
    `,
  ),
  objectives: [
    l("Pass objects to functions", "Välittää olioita funktioille"),
    l("Build text from object properties", "Muodostaa tekstiä olion ominaisuuksista"),
  ],
  instructions: l(
    'Write `describePet(pet)` that returns `"<name> the <species>"`. For example `describePet({ name: "Saku", species: "otter" })` returns `"Saku the otter"`.',
    'Kirjoita funktio `describePet(pet)`, joka palauttaa tekstin `"<name> the <species>"`. Esimerkiksi `describePet({ name: "Saku", species: "otter" })` palauttaa `"Saku the otter"`.',
  ),
  hints: [
    l("Use `pet.name` and `pet.species`.", "Käytä ominaisuuksia `pet.name` ja `pet.species`."),
    l('`return pet.name + " the " + pet.species;`', '`return pet.name + " the " + pet.species;`'),
  ],
  tests: [
    check(
      "is-function",
      l("`describePet` is a function.", "`describePet` on funktio."),
      l("Define a function named `describePet`.", "Määrittele funktio nimeltä `describePet`."),
      `t.isType(describePet, "function");`,
    ),
    check(
      "saku",
      l('Saku the otter is described correctly.', 'Saku the otter kuvataan oikein.'),
      l('`describePet({ name: "Saku", species: "otter" })` should return `"Saku the otter"`.', '`describePet({ name: "Saku", species: "otter" })` pitää palauttaa `"Saku the otter"`.'),
      `t.equal(describePet({ name: "Saku", species: "otter" }), "Saku the otter");`,
    ),
    check(
      "other-pets",
      l("It works for any pet.", "Se toimii millä tahansa lemmikillä."),
      l("Other pets get the wrong description. Read the properties of `pet`.", "Muut lemmikit saavat väärän kuvauksen. Lue olion `pet` ominaisuudet."),
      code`
        t.equal(describePet({ name: "Miri", species: "cat" }), "Miri the cat");
        t.equal(describePet({ name: "Rex", species: "dog", age: 3 }), "Rex the dog");
      `,
    ),
  ],
  starter: "// Write your function below this line.\n",
});

/* ------------------------------------------------------------------ */
/* Chapter 9 — String manipulation                                    */
/* ------------------------------------------------------------------ */

export const jsShout = jsChallenge({
  id: "js-shout",
  chapterId: "js-strings",
  minutes: 4,
  title: l("String methods", "Merkkijonometodit"),
  summary: l("Clean up and transform text with methods.", "Siisti ja muunna tekstiä metodeilla."),
  concept: l(
    md`
      Strings have built-in methods. They return a **new** string:

      - \`trim()\` removes spaces from both ends
      - \`toUpperCase()\` / \`toLowerCase()\` change the case

      Methods can be chained: \`"  hi ".trim().toUpperCase()\` is \`"HI"\`.
    `,
    md`
      Merkkijonoilla on sisäänrakennettuja metodeja. Ne palauttavat **uuden** merkkijonon:

      - \`trim()\` poistaa välilyönnit molemmista päistä
      - \`toUpperCase()\` / \`toLowerCase()\` muuttavat kirjainkokoa

      Metodeja voi ketjuttaa: \`"  hi ".trim().toUpperCase()\` on \`"HI"\`.
    `,
  ),
  objectives: [
    l("Use trim() and toUpperCase()", "Käyttää metodeja trim() ja toUpperCase()"),
    l("Chain string methods", "Ketjuttaa merkkijonometodeja"),
  ],
  instructions: l(
    'Write `shout(text)` that returns the text with spaces trimmed, in capital letters, and with `!` added: `shout("  hello ")` returns `"HELLO!"`.',
    'Kirjoita funktio `shout(text)`, joka palauttaa tekstin ilman reunojen välilyöntejä, isoilla kirjaimilla ja huutomerkillä täydennettynä: `shout("  hello ")` palauttaa `"HELLO!"`.',
  ),
  hints: [
    l("`text.trim().toUpperCase()` does most of the work.", "`text.trim().toUpperCase()` tekee suurimman osan työstä."),
    l('Add the `!` with `+ "!"`.', 'Lisää `!` lausekkeella `+ "!"`.'),
  ],
  tests: [
    check(
      "is-function",
      l("`shout` is a function.", "`shout` on funktio."),
      l("Define a function named `shout`.", "Määrittele funktio nimeltä `shout`."),
      `t.isType(shout, "function");`,
    ),
    check(
      "basic",
      l('`shout("  hello ")` returns `"HELLO!"`.', '`shout("  hello ")` palauttaa `"HELLO!"`.'),
      l("Trim the spaces, convert to upper case and add `!`.", "Poista välilyönnit, muunna isoiksi kirjaimiksi ja lisää `!`."),
      `t.equal(shout("  hello "), "HELLO!");`,
    ),
    check(
      "other-text",
      l("It works for other text.", "Se toimii muullakin tekstillä."),
      l("Other inputs give the wrong result.", "Muut syötteet antavat väärän tuloksen."),
      code`
        t.equal(shout("go team"), "GO TEAM!");
        t.equal(shout("WOW"), "WOW!");
      `,
    ),
  ],
  starter: "// Write your function below this line.\n",
});

export const jsInitials = jsChallenge({
  id: "js-initials",
  chapterId: "js-strings",
  minutes: 6,
  title: l("Initials", "Nimikirjaimet"),
  summary: l("Split text into words and combine their first letters.", "Jaa teksti sanoiksi ja yhdistä niiden alkukirjaimet."),
  concept: l(
    md`
      \`split(" ")\` turns a string into an array of words, \`text[0]\` gives the first character, and \`join("")\` glues an array back into a string:

      ~~~js
      const words = "red green".split(" ");   // ["red", "green"]
      words.map((word) => word[0]).join("");  // "rg"
      ~~~

      \`split(/\\s+/)\` splits on any amount of whitespace.
    `,
    md`
      \`split(" ")\` muuttaa merkkijonon sanataulukoksi, \`text[0]\` antaa ensimmäisen merkin ja \`join("")\` liittää taulukon takaisin merkkijonoksi:

      ~~~js
      const words = "red green".split(" ");   // ["red", "green"]
      words.map((word) => word[0]).join("");  // "rg"
      ~~~

      \`split(/\\s+/)\` jakaa minkä tahansa määrän välilyöntejä kohdalta.
    `,
  ),
  objectives: [
    l("Split a string into words", "Jakaa merkkijonon sanoiksi"),
    l("Transform and join array items", "Muuntaa ja yhdistää taulukon alkioita"),
  ],
  instructions: l(
    'Write `initials(fullName)` that returns the capital initials followed by dots: `initials("Ada Lovelace")` returns `"A.L."` and `initials("grace brewster hopper")` returns `"G.B.H."`.',
    'Kirjoita funktio `initials(fullName)`, joka palauttaa isot nimikirjaimet pisteineen: `initials("Ada Lovelace")` palauttaa `"A.L."` ja `initials("grace brewster hopper")` palauttaa `"G.B.H."`.',
  ),
  hints: [
    l("Split the name into words and take `word[0]` of each.", "Jaa nimi sanoiksi ja ota jokaisesta `word[0]`."),
    l(
      '`fullName.trim().split(/\\s+/).map((w) => w[0].toUpperCase() + ".").join("")`',
      '`fullName.trim().split(/\\s+/).map((w) => w[0].toUpperCase() + ".").join("")`',
    ),
  ],
  tests: [
    check(
      "is-function",
      l("`initials` is a function.", "`initials` on funktio."),
      l("Define a function named `initials`.", "Määrittele funktio nimeltä `initials`."),
      `t.isType(initials, "function");`,
    ),
    check(
      "two-names",
      l('`initials("Ada Lovelace")` returns `"A.L."`.', '`initials("Ada Lovelace")` palauttaa `"A.L."`.'),
      l("Take the first letter of each word and add a dot after it.", "Ota jokaisen sanan ensimmäinen kirjain ja lisää sen perään piste."),
      `t.equal(initials("Ada Lovelace"), "A.L.");`,
    ),
    check(
      "lowercase",
      l("Lower-case names give capital initials.", "Pienillä kirjaimilla kirjoitetut nimet antavat isot nimikirjaimet."),
      l("Convert each initial to upper case.", "Muunna jokainen nimikirjain isoksi."),
      `t.equal(initials("alan turing"), "A.T.");`,
    ),
    check(
      "three-names",
      l("Works for three names.", "Toimii kolmella nimellä."),
      l("Every word in the name needs an initial.", "Jokainen nimen sana tarvitsee nimikirjaimen."),
      `t.equal(initials("grace brewster hopper"), "G.B.H.");`,
    ),
    check(
      "hidden-spaces",
      l("Ignores extra spaces.", "Ohittaa ylimääräiset välilyönnit."),
      l("Names with extra spaces break your function.", "Ylimääräiset välilyönnit rikkovat funktiosi."),
      `t.equal(initials("  linus   torvalds "), "L.T.");`,
      { hidden: true },
    ),
  ],
  starter: "// Write your function below this line.\n",
});

/* ------------------------------------------------------------------ */
/* Chapter 10 — Mini-projects                                         */
/* ------------------------------------------------------------------ */

export const jsShoppingCartLab = jsLab({
  id: "js-shopping-cart-lab",
  chapterId: "js-projects",
  difficulty: "intermediate",
  minutes: 25,
  title: l("Lab: Shopping cart", "Harjoitustyö: Ostoskori"),
  summary: l("Combine arrays, objects and functions in a checkout.", "Yhdistä taulukot, oliot ja funktiot kassatoiminnoksi."),
  concept: l(
    md`
      Real programs combine everything: an **array of objects** holds the data, and small **functions** each do one job.

      ~~~js
      const items = [{ price: 2, quantity: 3 }];
      let total = 0;
      for (const item of items) {
        total += item.price * item.quantity;
      }
      ~~~

      \`number.toFixed(2)\` formats a number with exactly two decimals: \`(12.6).toFixed(2)\` is \`"12.60"\`.
    `,
    md`
      Oikeat ohjelmat yhdistävät kaiken opitun: **olioiden taulukko** säilyttää tiedot, ja pienet **funktiot** tekevät kukin yhden tehtävän.

      ~~~js
      const items = [{ price: 2, quantity: 3 }];
      let total = 0;
      for (const item of items) {
        total += item.price * item.quantity;
      }
      ~~~

      \`number.toFixed(2)\` muotoilee luvun täsmälleen kahdella desimaalilla: \`(12.6).toFixed(2)\` on \`"12.60"\`.
    `,
  ),
  objectives: [
    l("Loop over an array of objects", "Käydä läpi olioista koostuvan taulukon"),
    l("Write small functions that work together", "Kirjoittaa pieniä yhteistyössä toimivia funktioita"),
    l("Format numbers as text", "Muotoilla lukuja tekstiksi"),
  ],
  requirements: [
    l(
      "`cartTotal(items)` returns the sum of `price * quantity` for every item. An empty cart totals `0`.",
      "`cartTotal(items)` palauttaa summan `price * quantity` kaikille tuotteille. Tyhjän korin summa on `0`.",
    ),
    l(
      '`applyDiscount(total, code)` returns the new total: `"SAVE10"` takes 10% off, `"HALF"` takes 50% off and any other code changes nothing.',
      '`applyDiscount(total, code)` palauttaa uuden summan: `"SAVE10"` vähentää 10 %, `"HALF"` vähentää 50 % ja muut koodit eivät muuta mitään.',
    ),
    l(
      '`formatPrice(amount)` returns the amount with two decimals and ` €`, e.g. `"12.60 €"`.',
      '`formatPrice(amount)` palauttaa summan kahdella desimaalilla ja merkinnällä ` €`, esim. `"12.60 €"`.',
    ),
    l(
      'Log the formatted total of `cart` after applying the code `"SAVE10"`.',
      'Tulosta korin `cart` muotoiltu summa koodin `"SAVE10"` alennuksen jälkeen.',
    ),
  ],
  instructions: l(
    "An online shop needs the logic for its checkout. Write the three functions from the requirements, then use them together to log the final price of `cart`.",
    "Verkkokauppa tarvitsee kassansa logiikan. Kirjoita vaatimusten kolme funktiota ja käytä niitä yhdessä tulostaaksesi korin `cart` loppuhinnan.",
  ),
  hints: [
    l("Loop with `for (const item of items)` and add `item.price * item.quantity`.", "Silmukoi `for (const item of items)` ja lisää `item.price * item.quantity`."),
    l('In `applyDiscount`: `if (code === "SAVE10") return total * 0.9;`', 'Funktiossa `applyDiscount`: `if (code === "SAVE10") return total * 0.9;`'),
    l(
      'Combine them: `console.log(formatPrice(applyDiscount(cartTotal(cart), "SAVE10")));`',
      'Yhdistä ne: `console.log(formatPrice(applyDiscount(cartTotal(cart), "SAVE10")));`',
    ),
  ],
  tests: [
    check(
      "functions",
      l("`cartTotal`, `applyDiscount` and `formatPrice` are functions.", "`cartTotal`, `applyDiscount` ja `formatPrice` ovat funktioita."),
      l("Define all three functions with the exact names from the requirements.", "Määrittele kaikki kolme funktiota täsmälleen vaatimusten nimillä."),
      code`
        t.isType(cartTotal, "function");
        t.isType(applyDiscount, "function");
        t.isType(formatPrice, "function");
      `,
    ),
    check(
      "total",
      l("`cartTotal(cart)` is `14`.", "`cartTotal(cart)` on `14`."),
      l("Add up `price * quantity` for every item.", "Laske yhteen `price * quantity` jokaiselle tuotteelle."),
      `t.closeTo(cartTotal(cart), 14);`,
    ),
    check(
      "total-empty",
      l("An empty cart totals `0`.", "Tyhjän korin summa on `0`."),
      l("`cartTotal([])` should return `0`.", "`cartTotal([])` pitää palauttaa `0`."),
      `t.equal(cartTotal([]), 0);`,
    ),
    check(
      "discount-save10",
      l('`"SAVE10"` takes 10% off.', '`"SAVE10"` vähentää 10 %.'),
      l('`applyDiscount(14, "SAVE10")` should be `12.6` — return the new total, not the discount.', '`applyDiscount(14, "SAVE10")` pitää olla `12.6` – palauta uusi summa, ei alennusta.'),
      `t.closeTo(applyDiscount(14, "SAVE10"), 12.6);`,
    ),
    check(
      "discount-half",
      l('`"HALF"` takes 50% off.', '`"HALF"` vähentää 50 %.'),
      l('`applyDiscount(14, "HALF")` should be `7`.', '`applyDiscount(14, "HALF")` pitää olla `7`.'),
      `t.closeTo(applyDiscount(14, "HALF"), 7);`,
    ),
    check(
      "discount-unknown",
      l("Unknown codes change nothing.", "Tuntemattomat koodit eivät muuta mitään."),
      l('`applyDiscount(14, "FREE")` should return `14` unchanged.', '`applyDiscount(14, "FREE")` pitää palauttaa `14` muuttumattomana.'),
      `t.closeTo(applyDiscount(14, "FREE"), 14);`,
    ),
    check(
      "format",
      l('`formatPrice(12.6)` is `"12.60 €"`.', '`formatPrice(12.6)` on `"12.60 €"`.'),
      l("Use `toFixed(2)` and add a space and `€`.", "Käytä metodia `toFixed(2)` ja lisää välilyönti ja `€`."),
      code`
        t.equal(formatPrice(12.6), "12.60 €");
        t.equal(formatPrice(7), "7.00 €");
      `,
    ),
    check(
      "logged",
      l("The console shows `12.60 €`.", "Konsolissa näkyy `12.60 €`."),
      l('Log `formatPrice(applyDiscount(cartTotal(cart), "SAVE10"))`.', 'Tulosta `formatPrice(applyDiscount(cartTotal(cart), "SAVE10"))`.'),
      `t.logged("12.60 €");`,
    ),
    check(
      "hidden-small-amounts",
      l("Handles small amounts precisely.", "Käsittelee pienet summat tarkasti."),
      l("Small prices give an imprecise total or format.", "Pienet hinnat antavat epätarkan summan tai muotoilun."),
      code`
        const total = cartTotal([{ name: "Sticker", price: 0.1, quantity: 3 }]);
        t.closeTo(total, 0.3);
        t.equal(formatPrice(total), "0.30 €");
      `,
      { hidden: true },
    ),
  ],
  starter: md`
    const cart = [
      { name: "Notebook", price: 4.5, quantity: 2 },
      { name: "Pen", price: 1.25, quantity: 4 },
    ];

    // Write your functions below this line.
  `,
  expectedOutput: { text: "12.60 €" },
});

export const jsTaskListLab = jsLab({
  id: "js-task-list-lab",
  chapterId: "js-projects",
  difficulty: "intermediate",
  minutes: 25,
  title: l("Lab: Task list", "Harjoitustyö: Tehtävälista"),
  summary: l("Manage a list of tasks without changing the original data.", "Hallitse tehtävälistaa muuttamatta alkuperäisiä tietoja."),
  concept: l(
    md`
      Many apps avoid changing data in place. Instead, functions return **new** arrays and objects. The spread syntax \`...\` copies them:

      ~~~js
      const next = [...tasks, { title: "Swim", done: false }];   // new array
      const updated = { ...task, done: true };                     // new object
      ~~~

      \`map()\` creates a new array by transforming every item, and \`filter()\` keeps only some items.
    `,
    md`
      Monet sovellukset välttävät tietojen muuttamista paikallaan. Funktiot palauttavat sen sijaan **uusia** taulukoita ja olioita. Levityssyntaksi \`...\` kopioi ne:

      ~~~js
      const next = [...tasks, { title: "Swim", done: false }];   // uusi taulukko
      const updated = { ...task, done: true };                     // uusi olio
      ~~~

      \`map()\` luo uuden taulukon muuntamalla jokaisen alkion, ja \`filter()\` säilyttää vain osan alkioista.
    `,
  ),
  objectives: [
    l("Create new arrays and objects with spread", "Luoda uusia taulukoita ja olioita levityssyntaksilla"),
    l("Transform arrays with map() and filter()", "Muuntaa taulukoita metodeilla map() ja filter()"),
    l("Keep the original data unchanged", "Pitää alkuperäiset tiedot muuttumattomina"),
  ],
  requirements: [
    l(
      "`addTask(tasks, title)` returns a **new** array with `{ title, done: false }` added to the end. The original array is not changed.",
      "`addTask(tasks, title)` palauttaa **uuden** taulukon, jonka loppuun on lisätty `{ title, done: false }`. Alkuperäinen taulukko ei muutu.",
    ),
    l(
      "`completeTask(tasks, title)` returns a new array where the task with that title has `done: true`. The original tasks are not changed.",
      "`completeTask(tasks, title)` palauttaa uuden taulukon, jossa kyseisen nimisellä tehtävällä on `done: true`. Alkuperäiset tehtävät eivät muutu.",
    ),
    l("`remainingCount(tasks)` returns how many tasks are not done.", "`remainingCount(tasks)` palauttaa keskeneräisten tehtävien määrän."),
    l(
      'Start from an empty list, add `"Write code"` and `"Test code"`, complete `"Write code"` and log the remaining count.',
      'Aloita tyhjästä listasta, lisää `"Write code"` ja `"Test code"`, merkitse `"Write code"` valmiiksi ja tulosta keskeneräisten määrä.',
    ),
  ],
  instructions: l(
    "Build the core of a to-do app. Write the three functions from the requirements so that they never modify the data they receive, then use them to log how many tasks remain.",
    "Rakenna tehtävälistasovelluksen ydin. Kirjoita vaatimusten kolme funktiota niin, etteivät ne koskaan muuta saamiaan tietoja, ja tulosta niiden avulla jäljellä olevien tehtävien määrä.",
  ),
  hints: [
    l("`return [...tasks, { title, done: false }];`", "`return [...tasks, { title, done: false }];`"),
    l(
      "`return tasks.map((task) => (task.title === title ? { ...task, done: true } : task));`",
      "`return tasks.map((task) => (task.title === title ? { ...task, done: true } : task));`",
    ),
    l("`return tasks.filter((task) => !task.done).length;`", "`return tasks.filter((task) => !task.done).length;`"),
  ],
  tests: [
    check(
      "functions",
      l("`addTask`, `completeTask` and `remainingCount` are functions.", "`addTask`, `completeTask` ja `remainingCount` ovat funktioita."),
      l("Define all three functions with the exact names from the requirements.", "Määrittele kaikki kolme funktiota täsmälleen vaatimusten nimillä."),
      code`
        t.isType(addTask, "function");
        t.isType(completeTask, "function");
        t.isType(remainingCount, "function");
      `,
    ),
    check(
      "add",
      l("`addTask` adds a new, unfinished task.", "`addTask` lisää uuden, keskeneräisen tehtävän."),
      l('`addTask([], "Swim")` should return `[{ title: "Swim", done: false }]`.', '`addTask([], "Swim")` pitää palauttaa `[{ title: "Swim", done: false }]`.'),
      `t.deepEqual(addTask([], "Swim"), [{ title: "Swim", done: false }]);`,
    ),
    check(
      "add-immutable",
      l("`addTask` doesn't change the original array.", "`addTask` ei muuta alkuperäistä taulukkoa."),
      l("`addTask` changed the array it received. Return a new array, e.g. with `[...tasks, newTask]`.", "`addTask` muutti saamaansa taulukkoa. Palauta uusi taulukko, esim. lausekkeella `[...tasks, newTask]`."),
      code`
        const original = [];
        const result = addTask(original, "Swim");
        t.deepEqual(original, []);
        t.ok(result !== original);
      `,
    ),
    check(
      "complete",
      l("`completeTask` marks the matching task as done.", "`completeTask` merkitsee oikean tehtävän valmiiksi."),
      l("Only the task with the given title should get `done: true`.", "Vain annetun nimisen tehtävän pitää saada arvo `done: true`."),
      code`
        const tasks = [{ title: "A", done: false }, { title: "B", done: false }];
        t.deepEqual(completeTask(tasks, "B"), [{ title: "A", done: false }, { title: "B", done: true }]);
      `,
    ),
    check(
      "complete-immutable",
      l("`completeTask` doesn't change the original tasks.", "`completeTask` ei muuta alkuperäisiä tehtäviä."),
      l(
        "`completeTask` changed an original task object. Create a new object with `{ ...task, done: true }`.",
        "`completeTask` muutti alkuperäistä tehtäväoliota. Luo uusi olio lausekkeella `{ ...task, done: true }`.",
      ),
      code`
        const tasks = [{ title: "A", done: false }];
        completeTask(tasks, "A");
        t.deepEqual(tasks, [{ title: "A", done: false }]);
      `,
    ),
    check(
      "remaining",
      l("`remainingCount` counts unfinished tasks.", "`remainingCount` laskee keskeneräiset tehtävät."),
      l("Count the tasks where `done` is `false`.", "Laske tehtävät, joilla `done` on `false`."),
      code`
        t.equal(remainingCount([{ title: "A", done: true }, { title: "B", done: false }, { title: "C", done: false }]), 2);
        t.equal(remainingCount([]), 0);
      `,
    ),
    check(
      "logged",
      l("The console shows `1` remaining task.", "Konsolissa näkyy `1` jäljellä oleva tehtävä."),
      l("Add both tasks, complete one, and log `remainingCount(...)`.", "Lisää molemmat tehtävät, merkitse yksi valmiiksi ja tulosta `remainingCount(...)`."),
      `t.logged("1");`,
    ),
    check(
      "hidden-unknown-title",
      l("Completing an unknown title changes nothing.", "Tuntemattoman tehtävän merkitseminen ei muuta mitään."),
      l("Completing a title that isn't in the list should leave every task as it was.", "Listassa olemattoman tehtävän merkitsemisen pitää jättää kaikki tehtävät ennalleen."),
      code`
        const tasks = [{ title: "A", done: false }];
        t.deepEqual(completeTask(tasks, "Z"), [{ title: "A", done: false }]);
      `,
      { hidden: true },
    ),
  ],
  starter: "// Write your functions below this line.\n",
  expectedOutput: { text: "1" },
});
