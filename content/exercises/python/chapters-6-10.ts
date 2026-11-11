import { check, l, pyChallenge, pyLab } from "@/lib/content/factories";
import { code, md } from "@/lib/content/md";

/* ------------------------------------------------------------------ */
/* Chapter 6 — Functions                                              */
/* ------------------------------------------------------------------ */

export const pyGreetFunction = pyChallenge({
  id: "py-greet-function",
  chapterId: "py-functions",
  minutes: 5,
  title: l("Your first function", "Ensimmäinen funktiosi"),
  summary: l("Define a function that returns a value.", "Määrittele funktio, joka palauttaa arvon."),
  concept: l(
    md`
      A **function** is a named, reusable piece of code. \`def\` defines it, the **parameters** in parentheses are its inputs, and \`return\` sends a result back to the caller:

      ~~~python
      def double(number):
          return number * 2

      print(double(4))   # 8
      ~~~

      \`return\` is different from \`print()\`: printing only shows a value, while returning hands it back so other code can use it.
    `,
    md`
      **Funktio** on nimetty, uudelleenkäytettävä koodin pala. \`def\` määrittelee sen, sulkeissa olevat **parametrit** ovat sen syötteet, ja \`return\` palauttaa tuloksen kutsujalle:

      ~~~python
      def double(number):
          return number * 2

      print(double(4))   # 8
      ~~~

      \`return\` on eri asia kuin \`print()\`: tulostaminen vain näyttää arvon, kun taas palauttaminen antaa sen takaisin muun koodin käytettäväksi.
    `,
  ),
  objectives: [
    l("Define a function with def", "Määritellä funktion def-avainsanalla"),
    l("Return a value instead of printing it", "Palauttaa arvon tulostamisen sijaan"),
  ],
  instructions: l(
    'Define a function `greet(name)` that **returns** the text `Hello, <name>!`. For example, `greet("Ada")` returns `"Hello, Ada!"`.',
    'Määrittele funktio `greet(name)`, joka **palauttaa** tekstin `Hello, <name>!`. Esimerkiksi `greet("Ada")` palauttaa `"Hello, Ada!"`.',
  ),
  hints: [
    l("Start with `def greet(name):` and indent the body.", "Aloita rivillä `def greet(name):` ja sisennä funktion runko."),
    l('Inside the function: `return f"Hello, {name}!"`', 'Funktion sisällä: `return f"Hello, {name}!"`'),
  ],
  tests: [
    check(
      "is-function",
      l("`greet` is a function.", "`greet` on funktio."),
      l("We couldn't find a function named `greet`. Define it with `def greet(name):`.", "Funktiota nimeltä `greet` ei löytynyt. Määrittele se rivillä `def greet(name):`."),
      `expect(callable(var("greet")))`,
    ),
    check(
      "returns",
      l("`greet` returns a value.", "`greet` palauttaa arvon."),
      l(
        '`greet("Ada")` returned `None`. Use `return` — `print()` only shows the text.',
        '`greet("Ada")` palautti arvon `None`. Käytä `return`-lausetta – `print()` vain näyttää tekstin.',
      ),
      `expect(var("greet")("Ada") is not None)`,
    ),
    check(
      "ada",
      l('`greet("Ada")` returns `"Hello, Ada!"`.', '`greet("Ada")` palauttaa `"Hello, Ada!"`.'),
      l("The returned text isn't quite right. Compare the comma, space and exclamation mark.", "Palautettu teksti ei ole aivan oikein. Vertaa pilkkua, välilyöntiä ja huutomerkkiä."),
      `expect_equal(var("greet")("Ada"), "Hello, Ada!")`,
    ),
    check(
      "any-name",
      l("`greet` works for any name.", "`greet` toimii millä tahansa nimellä."),
      l("Some names give the wrong greeting. Use the `name` parameter.", "Jotkin nimet antavat väärän tervehdyksen. Käytä parametria `name`."),
      code`
        for name in ["Matti", "Li"]:
            expect_equal(var("greet")(name), "Hello, " + name + "!")
      `,
    ),
  ],
  starter: "# Define your function below this line.\n",
});

export const pyAreaFunction = pyChallenge({
  id: "py-area-function",
  chapterId: "py-functions",
  minutes: 4,
  title: l("Several parameters", "Useita parametreja"),
  summary: l("Write a function that takes two inputs.", "Kirjoita funktio, jolla on kaksi syötettä."),
  concept: l(
    md`
      A function can take several parameters, separated by commas. When you call it, the arguments are matched to the parameters in order:

      ~~~python
      def total_price(price, quantity):
          return price * quantity

      print(total_price(2.5, 4))   # 10.0
      ~~~
    `,
    md`
      Funktiolla voi olla useita parametreja pilkuilla erotettuina. Kutsuttaessa argumentit sijoitetaan parametreihin järjestyksessä:

      ~~~python
      def total_price(price, quantity):
          return price * quantity

      print(total_price(2.5, 4))   # 10.0
      ~~~
    `,
  ),
  objectives: [
    l("Define a function with several parameters", "Määritellä funktion, jolla on useita parametreja"),
    l("Call a function and print its result", "Kutsua funktiota ja tulostaa sen tuloksen"),
  ],
  instructions: l(
    "Define `rectangle_area(width, height)` that returns the area of a rectangle (width × height). Then print the area of a 3 × 4 rectangle.",
    "Määrittele funktio `rectangle_area(width, height)`, joka palauttaa suorakulmion pinta-alan (leveys × korkeus). Tulosta sitten 3 × 4 -suorakulmion pinta-ala.",
  ),
  hints: [
    l("`return width * height`", "`return width * height`"),
    l("Call it with `print(rectangle_area(3, 4))`.", "Kutsu sitä: `print(rectangle_area(3, 4))`."),
  ],
  tests: [
    check(
      "is-function",
      l("`rectangle_area` is a function.", "`rectangle_area` on funktio."),
      l("Define a function named `rectangle_area`.", "Määrittele funktio nimeltä `rectangle_area`."),
      `expect(callable(var("rectangle_area")))`,
    ),
    check(
      "small",
      l("`rectangle_area(3, 4)` returns `12`.", "`rectangle_area(3, 4)` palauttaa `12`."),
      l("Multiply the width by the height and return the result.", "Kerro leveys korkeudella ja palauta tulos."),
      `expect_close(var("rectangle_area")(3, 4), 12)`,
    ),
    check(
      "decimals",
      l("It works with decimals: `rectangle_area(2.5, 2)` is `5.0`.", "Se toimii desimaaleilla: `rectangle_area(2.5, 2)` on `5.0`."),
      l("Decimal sizes give the wrong area.", "Desimaalimitat antavat väärän pinta-alan."),
      `expect_close(var("rectangle_area")(2.5, 2), 5.0)`,
    ),
    check(
      "zero",
      l("A width of 0 gives an area of `0`.", "Leveys 0 antaa pinta-alaksi `0`."),
      l("`rectangle_area(0, 7)` should return `0`.", "`rectangle_area(0, 7)` pitää palauttaa `0`."),
      `expect_close(var("rectangle_area")(0, 7), 0)`,
    ),
    check(
      "prints",
      l("The program prints the area of a 3 × 4 rectangle.", "Ohjelma tulostaa 3 × 4 -suorakulmion pinta-alan."),
      l("Print `rectangle_area(3, 4)` at the end.", "Tulosta lopuksi `rectangle_area(3, 4)`."),
      `expect_number_in_output(12)`,
    ),
  ],
  starter: "# Define your function below this line.\n",
});

/* ------------------------------------------------------------------ */
/* Chapter 7 — Loops                                                  */
/* ------------------------------------------------------------------ */

export const pyCountUp = pyChallenge({
  id: "py-count-up",
  chapterId: "py-loops",
  minutes: 4,
  title: l("Repeat with for", "Toisto for-silmukalla"),
  summary: l("Let a loop do repetitive work.", "Anna silmukan tehdä toistuva työ."),
  concept: l(
    md`
      A \`for\` loop repeats its block once for each value. \`range(start, stop)\` produces numbers from \`start\` up to, **but not including**, \`stop\`:

      ~~~python
      for number in range(1, 4):
          print(number)   # 1, 2, 3
      ~~~

      Loops let you write an action once and repeat it as many times as needed.
    `,
    md`
      \`for\`-silmukka toistaa lohkonsa kerran jokaiselle arvolle. \`range(start, stop)\` tuottaa lukuja alkaen arvosta \`start\` arvoon \`stop\` asti **sitä itseään lukuun ottamatta**:

      ~~~python
      for number in range(1, 4):
          print(number)   # 1, 2, 3
      ~~~

      Silmukan avulla toiminnon voi kirjoittaa kerran ja toistaa niin monta kertaa kuin tarvitaan.
    `,
  ),
  objectives: [
    l("Repeat code with a for loop", "Toistaa koodia for-silmukalla"),
    l("Use range() with a start and stop", "Käyttää range()-funktiota alku- ja loppuarvolla"),
  ],
  instructions: l(
    "Use a loop to print the numbers 1 to 5, each on its own line.",
    "Tulosta silmukan avulla luvut 1–5, kukin omalle rivilleen.",
  ),
  hints: [
    l("`range(1, 6)` produces 1, 2, 3, 4 and 5.", "`range(1, 6)` tuottaa luvut 1, 2, 3, 4 ja 5."),
    l("`for number in range(1, 6):` followed by an indented `print(number)`.", "`for number in range(1, 6):` ja sen alle sisennetty `print(number)`."),
  ],
  tests: [
    check(
      "uses-loop",
      l("The program uses a loop.", "Ohjelma käyttää silmukkaa."),
      l("Use a `for` loop instead of five separate `print()` calls.", "Käytä `for`-silmukkaa viiden erillisen `print()`-kutsun sijaan."),
      `expect(len(find_nodes(ast.For, ast.While)) > 0)`,
    ),
    check(
      "output",
      l("The output is the numbers 1 to 5, one per line.", "Tulosteena ovat luvut 1–5, yksi kullakin rivillä."),
      l(
        "The output should be 1, 2, 3, 4 and 5 on separate lines. Remember that `range` stops before its second number.",
        "Tulosteen pitää olla 1, 2, 3, 4 ja 5 omilla riveillään. Muista, että `range` pysähtyy ennen toista lukuaan.",
      ),
      `expect_equal(lines, ["1", "2", "3", "4", "5"])`,
    ),
  ],
  starter: "# Write your code below this line.\n",
  expectedOutput: { text: "1\n2\n3\n4\n5" },
});

export const pySumNumbers = pyChallenge({
  id: "py-sum-numbers",
  chapterId: "py-loops",
  minutes: 5,
  title: l("Adding up a list", "Listan summa"),
  summary: l("Use a loop to build up a total.", "Kerrytä summa silmukan avulla."),
  concept: l(
    md`
      A common pattern is the **accumulator**: start from \`0\` and add each value inside a loop.

      ~~~python
      prices = [4, 2, 6]
      total = 0
      for price in prices:
          total = total + price
      print(total)   # 12
      ~~~

      \`total += price\` is a shorter way to write \`total = total + price\`. Python also has a built-in \`sum()\` function that does the same.
    `,
    md`
      Yleinen tapa on **kerääjä**: aloita arvosta \`0\` ja lisää jokainen arvo silmukassa.

      ~~~python
      prices = [4, 2, 6]
      total = 0
      for price in prices:
          total = total + price
      print(total)   # 12
      ~~~

      \`total += price\` on lyhyempi tapa kirjoittaa \`total = total + price\`. Pythonissa on myös sisäänrakennettu \`sum()\`-funktio, joka tekee saman.
    `,
  ),
  objectives: [
    l("Loop over the items of a list", "Käydä listan alkiot läpi silmukassa"),
    l("Use the accumulator pattern", "Käyttää kerääjärakennetta"),
  ],
  instructions: l(
    "Calculate the sum of the numbers in `numbers` and store it in `total`. Your code must work for any list — including an empty one.",
    "Laske listan `numbers` lukujen summa ja tallenna se muuttujaan `total`. Koodisi täytyy toimia millä tahansa listalla – myös tyhjällä.",
  ),
  hints: [
    l("Set `total = 0` before the loop, not inside it.", "Aseta `total = 0` ennen silmukkaa, ei sen sisällä."),
    l("Inside `for number in numbers:` add `total += number`.", "Lisää silmukan `for number in numbers:` sisään `total += number`."),
  ],
  tests: [
    check(
      "total",
      l("`total` is the sum of `numbers`.", "`total` on listan `numbers` summa."),
      l(
        "`total` isn't the sum of the list. Start from 0 before the loop and add every number.",
        "`total` ei ole listan summa. Aloita nollasta ennen silmukkaa ja lisää jokainen luku.",
      ),
      `expect_close(var("total"), sum(var("numbers")))`,
    ),
    check(
      "other-lists",
      l("It works for other lists, including an empty list.", "Se toimii muillakin listoilla, myös tyhjällä."),
      l(
        "With a different list, `total` was wrong or missing. Make sure `total` is created even when the list is empty.",
        "Toisella listalla `total` oli väärin tai puuttui. Varmista, että `total` luodaan myös silloin, kun lista on tyhjä.",
      ),
      code`
        for values, expected in [([10, -2, 5], 13), ([], 0)]:
            expect_close(run(numbers=values).var("total"), expected)
      `,
    ),
    check(
      "hidden-floats",
      l("Works with decimal numbers.", "Toimii desimaaliluvuilla."),
      l("Your sum is wrong for some decimal numbers.", "Summa on väärin joillakin desimaaliluvuilla."),
      `expect_close(run(numbers=[1.5, 2.5, 0.25]).var("total"), 4.25)`,
      { hidden: true },
    ),
  ],
  starter: "numbers = [3, 8, 2, 7]\n\n# Write your code below this line.\n",
});

export const pyCountdown = pyChallenge({
  id: "py-countdown",
  chapterId: "py-loops",
  minutes: 5,
  title: l("Countdown", "Lähtölaskenta"),
  summary: l("Repeat while a condition holds.", "Toista niin kauan kuin ehto on voimassa."),
  concept: l(
    md`
      A \`while\` loop repeats as long as its condition is true. Something inside the loop must eventually make the condition false — otherwise the loop never ends:

      ~~~python
      energy = 3
      while energy > 0:
          print("Swim!")
          energy = energy - 1
      ~~~
    `,
    md`
      \`while\`-silmukka toistuu niin kauan kuin sen ehto on tosi. Silmukan sisällä jonkin täytyy lopulta tehdä ehdosta epätosi – muuten silmukka ei pääty koskaan:

      ~~~python
      energy = 3
      while energy > 0:
          print("Swim!")
          energy = energy - 1
      ~~~
    `,
  ),
  objectives: [
    l("Write a while loop", "Kirjoittaa while-silmukan"),
    l("Make sure a loop ends", "Varmistaa, että silmukka päättyy"),
  ],
  instructions: l(
    md`
      Count down from \`start\` to 1, printing each number, and then print \`Liftoff!\`. For \`start = 3\`:

      ~~~
      3
      2
      1
      Liftoff!
      ~~~
    `,
    md`
      Laske alaspäin luvusta \`start\` lukuun 1 tulostaen jokaisen luvun, ja tulosta sitten \`Liftoff!\`. Kun \`start = 3\`:

      ~~~
      3
      2
      1
      Liftoff!
      ~~~
    `,
  ),
  hints: [
    l("`while start > 0:` repeats until `start` reaches 0.", "`while start > 0:` toistuu, kunnes `start` on 0."),
    l(
      "Inside the loop, print `start` and then decrease it: `start -= 1`. Print `Liftoff!` after the loop (not indented).",
      "Tulosta silmukassa `start` ja pienennä sitä: `start -= 1`. Tulosta `Liftoff!` silmukan jälkeen (ilman sisennystä).",
    ),
  ],
  tests: [
    check(
      "uses-loop",
      l("The program uses a loop.", "Ohjelma käyttää silmukkaa."),
      l("Use a `while` (or `for`) loop to count down.", "Laske alaspäin `while`- (tai `for`-) silmukalla."),
      `expect(len(find_nodes(ast.While, ast.For)) > 0)`,
    ),
    check(
      "from-five",
      l("Starting from 5 prints 5, 4, 3, 2, 1, `Liftoff!`.", "Luvusta 5 alkaen tulostuu 5, 4, 3, 2, 1, `Liftoff!`."),
      l(
        "The countdown from 5 isn't right. Print every number down to 1, then `Liftoff!` once.",
        "Lähtölaskenta luvusta 5 ei ole oikein. Tulosta jokainen luku ykköseen asti ja sitten kerran `Liftoff!`.",
      ),
      `expect_equal(lines, ["5", "4", "3", "2", "1", "Liftoff!"])`,
    ),
    check(
      "other-start",
      l("It works for other start values.", "Se toimii muillakin aloitusarvoilla."),
      l("Starting from 3 should print 3, 2, 1, `Liftoff!`. Use the `start` variable.", "Luvusta 3 alkaen pitää tulostua 3, 2, 1, `Liftoff!`. Käytä muuttujaa `start`."),
      `expect_equal(run(start=3).lines, ["3", "2", "1", "Liftoff!"])`,
    ),
    check(
      "zero",
      l("Starting from 0 prints only `Liftoff!`.", "Luvusta 0 alkaen tulostuu vain `Liftoff!`."),
      l("When `start` is 0 there is nothing to count — print only `Liftoff!`.", "Kun `start` on 0, laskettavaa ei ole – tulosta vain `Liftoff!`."),
      `expect_equal(run(start=0).lines, ["Liftoff!"])`,
    ),
  ],
  starter: "start = 5\n\n# Write your code below this line.\n",
});

/* ------------------------------------------------------------------ */
/* Chapter 8 — Lists and dictionaries                                 */
/* ------------------------------------------------------------------ */

export const pyListAppend = pyChallenge({
  id: "py-list-append",
  chapterId: "py-collections",
  minutes: 4,
  title: l("Growing a list", "Lista kasvaa"),
  summary: l("Add items to a list and count them.", "Lisää listaan alkioita ja laske ne."),
  concept: l(
    md`
      A **list** stores several values in order: \`fruits = ["apple", "banana"]\`. Positions start at 0, so \`fruits[0]\` is \`"apple"\`.

      Lists can change: \`append()\` adds an item to the end, and \`len()\` tells how many items there are.

      ~~~python
      tools = ["paddle"]
      tools.append("map")
      print(len(tools))   # 2
      ~~~
    `,
    md`
      **Lista** tallentaa useita arvoja järjestyksessä: \`fruits = ["apple", "banana"]\`. Kohdat alkavat nollasta, joten \`fruits[0]\` on \`"apple"\`.

      Listaa voi muuttaa: \`append()\` lisää alkion loppuun, ja \`len()\` kertoo alkioiden määrän.

      ~~~python
      tools = ["paddle"]
      tools.append("map")
      print(len(tools))   # 2
      ~~~
    `,
  ),
  objectives: [
    l("Add items with append()", "Lisätä alkioita append()-metodilla"),
    l("Count items with len()", "Laskea alkiot len()-funktiolla"),
  ],
  instructions: l(
    'Add `"cherry"` to the end of the `fruits` list, then print how many fruits the list has.',
    'Lisää `"cherry"` listan `fruits` loppuun ja tulosta sitten listan hedelmien määrä.',
  ),
  hints: [
    l('`fruits.append("cherry")` adds to the end.', '`fruits.append("cherry")` lisää loppuun.'),
    l("`print(len(fruits))` prints the number of items.", "`print(len(fruits))` tulostaa alkioiden määrän."),
  ],
  tests: [
    check(
      "appended",
      l('`"cherry"` is added to the end of `fruits`.', '`"cherry"` on lisätty listan `fruits` loppuun.'),
      l('`fruits` should end with `"cherry"`. Use `append()`.', 'Listan `fruits` pitää päättyä alkioon `"cherry"`. Käytä `append()`-metodia.'),
      `expect_equal(var("fruits"), ["apple", "banana", "cherry"])`,
    ),
    check(
      "other-list",
      l("It works when `fruits` starts with other items.", "Se toimii, vaikka `fruits` sisältäisi alussa muita alkioita."),
      l(
        "When `fruits` started differently, the result was wrong. Add to the existing list instead of writing a new one.",
        "Kun `fruits` alkoi eri alkioilla, tulos oli väärin. Lisää olemassa olevaan listaan sen sijaan, että kirjoittaisit uuden.",
      ),
      `expect_equal(run(fruits=["kiwi"]).var("fruits"), ["kiwi", "cherry"])`,
    ),
    check(
      "prints-count",
      l("The program prints the number of fruits.", "Ohjelma tulostaa hedelmien määrän."),
      l("Print `len(fruits)` after adding the cherry.", "Tulosta `len(fruits)`, kun olet lisännyt kirsikan."),
      `expect_number_in_output(len(var("fruits")))`,
    ),
  ],
  starter: 'fruits = ["apple", "banana"]\n\n# Write your code below this line.\n',
});

export const pyPriceLookup = pyChallenge({
  id: "py-price-lookup",
  chapterId: "py-collections",
  minutes: 5,
  title: l("Café menu", "Kahvilan hinnasto"),
  summary: l("Look up values by key in a dictionary.", "Hae arvoja sanakirjasta avaimen perusteella."),
  concept: l(
    md`
      A **dictionary** maps keys to values, like a menu maps products to prices:

      ~~~python
      ages = {"Saku": 4, "Miri": 2}
      print(ages["Saku"])   # 4
      ~~~

      Square brackets with a key give the matching value. Asking for a key that doesn't exist raises a \`KeyError\`; \`ages.get("Rex", 0)\` returns a default instead.
    `,
    md`
      **Sanakirja** (dictionary) yhdistää avaimet arvoihin samaan tapaan kuin hinnasto yhdistää tuotteet hintoihin:

      ~~~python
      ages = {"Saku": 4, "Miri": 2}
      print(ages["Saku"])   # 4
      ~~~

      Hakasulkeet ja avain antavat vastaavan arvon. Jos avainta ei ole, syntyy \`KeyError\`; \`ages.get("Rex", 0)\` palauttaa sen sijaan oletusarvon.
    `,
  ),
  objectives: [
    l("Read values from a dictionary", "Lukea arvoja sanakirjasta"),
    l("Use a variable as a key", "Käyttää muuttujaa avaimena"),
  ],
  instructions: l(
    "The café's prices are in the dictionary `prices`. Look up the price of `item`, store it in `price` and print it. Your code must work for every item on the menu.",
    "Kahvilan hinnat ovat sanakirjassa `prices`. Hae tuotteen `item` hinta, tallenna se muuttujaan `price` ja tulosta se. Koodisi täytyy toimia jokaisella hinnaston tuotteella.",
  ),
  hints: [
    l("Use the variable as the key: `prices[item]`.", "Käytä muuttujaa avaimena: `prices[item]`."),
    l("`price = prices[item]` and then `print(price)`.", "`price = prices[item]` ja sitten `print(price)`."),
  ],
  tests: [
    check(
      "tea",
      l("`price` is the price of `item`.", "`price` on tuotteen `item` hinta."),
      l("`price` doesn't match the menu. Look it up with `prices[item]`.", "`price` ei vastaa hinnastoa. Hae se lausekkeella `prices[item]`."),
      `expect_close(var("price"), var("prices")[var("item")])`,
    ),
    check(
      "other-items",
      l("It works for other items, such as `\"bun\"`.", "Se toimii muillakin tuotteilla, kuten `\"bun\"`."),
      l(
        "With another `item`, the price was wrong. Use `item` as the key instead of a fixed product.",
        "Toisella tuotteella hinta oli väärin. Käytä avaimena muuttujaa `item` kiinteän tuotteen sijaan.",
      ),
      code`
        expect_close(run(item="bun").var("price"), 2.0)
        expect_close(run(item="coffee").var("price"), 3.5)
      `,
    ),
    check(
      "hidden-new-menu",
      l("Works with a completely different menu.", "Toimii täysin eri hinnastolla."),
      l("Your code doesn't work when the menu changes.", "Koodisi ei toimi, kun hinnasto muuttuu."),
      `expect_close(run(prices={"juice": 4.2}, item="juice").var("price"), 4.2)`,
      { hidden: true },
    ),
    check(
      "prints",
      l("The program prints the price.", "Ohjelma tulostaa hinnan."),
      l("Print `price` at the end.", "Tulosta `price` lopuksi."),
      `expect_number_in_output(var("price"))`,
    ),
  ],
  starter: 'prices = {"coffee": 3.5, "tea": 2.8, "bun": 2.0}\nitem = "tea"\n\n# Write your code below this line.\n',
});

/* ------------------------------------------------------------------ */
/* Chapter 9 — Working with text                                      */
/* ------------------------------------------------------------------ */

export const pyCleanName = pyChallenge({
  id: "py-clean-name",
  chapterId: "py-text",
  minutes: 4,
  title: l("Tidying text", "Tekstin siistiminen"),
  summary: l("Chain string methods to clean up input.", "Siisti syötettä ketjuttamalla merkkijonometodeja."),
  concept: l(
    md`
      Strings have many useful methods. Each returns a **new** string and leaves the original unchanged:

      - \`strip()\` removes spaces from both ends
      - \`lower()\` / \`upper()\` change the case
      - \`title()\` capitalises each word

      Methods can be chained: \`"  hELLo ".strip().lower()\` gives \`"hello"\`.
    `,
    md`
      Merkkijonoilla on monia hyödyllisiä metodeja. Jokainen palauttaa **uuden** merkkijonon ja jättää alkuperäisen ennalleen:

      - \`strip()\` poistaa välilyönnit molemmista päistä
      - \`lower()\` / \`upper()\` muuttavat kirjainkokoa
      - \`title()\` muuttaa jokaisen sanan alkukirjaimen isoksi

      Metodeja voi ketjuttaa: \`"  hELLo ".strip().lower()\` antaa \`"hello"\`.
    `,
  ),
  objectives: [
    l("Use strip() and title()", "Käyttää metodeja strip() ja title()"),
    l("Chain method calls", "Ketjuttaa metodikutsuja"),
  ],
  instructions: l(
    'Names typed into a form are often messy. Create `clean_name` from `raw_name` with the extra spaces removed and each word capitalised: `"  ada LOVELACE "` becomes `"Ada Lovelace"`.',
    'Lomakkeeseen kirjoitetut nimet ovat usein sotkuisia. Luo muuttujasta `raw_name` muuttuja `clean_name`, josta on poistettu ylimääräiset välilyönnit ja jonka jokainen sana alkaa isolla kirjaimella: `"  ada LOVELACE "` muuttuu muotoon `"Ada Lovelace"`.',
  ),
  hints: [
    l("`strip()` removes the spaces, `title()` fixes the capital letters.", "`strip()` poistaa välilyönnit ja `title()` korjaa isot kirjaimet."),
    l("`clean_name = raw_name.strip().title()`", "`clean_name = raw_name.strip().title()`"),
  ],
  tests: [
    check(
      "cleaned",
      l('`clean_name` is `"Ada Lovelace"`.', '`clean_name` on `"Ada Lovelace"`.'),
      l(
        "`clean_name` still has extra spaces or wrong capitals. Use `strip()` and `title()`.",
        "Muuttujassa `clean_name` on yhä ylimääräisiä välilyöntejä tai vääriä kirjainkokoja. Käytä metodeja `strip()` ja `title()`.",
      ),
      `expect_equal(var("clean_name"), "Ada Lovelace")`,
    ),
    check(
      "other-names",
      l("It works for other messy names.", "Se toimii muillakin sotkuisilla nimillä."),
      l("Other names weren't cleaned correctly. Build `clean_name` from `raw_name`.", "Muita nimiä ei siistitty oikein. Muodosta `clean_name` muuttujasta `raw_name`."),
      code`
        expect_equal(run(raw_name="grace hopper   ").var("clean_name"), "Grace Hopper")
        expect_equal(run(raw_name="   ALAN TURING").var("clean_name"), "Alan Turing")
      `,
    ),
  ],
  starter: 'raw_name = "  ada LOVELACE "\n\n# Write your code below this line.\n',
});

export const pySlicing = pyChallenge({
  id: "py-slicing",
  chapterId: "py-text",
  minutes: 5,
  title: l("Slicing strings", "Merkkijonon paloittelu"),
  summary: l("Pick characters and pieces with indexes.", "Poimi merkkejä ja paloja indeksien avulla."),
  concept: l(
    md`
      Each character in a string has a position (index) starting from 0. Negative indexes count from the end:

      ~~~python
      word = "otter"
      word[0]     # "o"
      word[-1]    # "r"
      word[1:4]   # "tte"
      ~~~

      A **slice** \`[start:end]\` takes characters from \`start\` up to, but not including, \`end\`. \`word[:2]\` starts from the beginning.
    `,
    md`
      Jokaisella merkkijonon merkillä on paikka eli indeksi, joka alkaa nollasta. Negatiiviset indeksit laskevat lopusta:

      ~~~python
      word = "otter"
      word[0]     # "o"
      word[-1]    # "r"
      word[1:4]   # "tte"
      ~~~

      **Viipale** \`[start:end]\` ottaa merkit kohdasta \`start\` kohtaan \`end\` asti sitä itseään lukuun ottamatta. \`word[:2]\` alkaa alusta.
    `,
  ),
  objectives: [
    l("Index strings from the start and the end", "Indeksoida merkkijonoja alusta ja lopusta"),
    l("Take slices with [start:end]", "Ottaa viipaleita merkinnällä [start:end]"),
  ],
  instructions: l(
    'Create `first_three` with the first three characters of `word`, and `last_letter` with its last character. For `"Python"` they are `"Pyt"` and `"n"`.',
    'Luo muuttuja `first_three`, jossa on sanan `word` kolme ensimmäistä merkkiä, ja `last_letter`, jossa on sen viimeinen merkki. Sanalle `"Python"` ne ovat `"Pyt"` ja `"n"`.',
  ),
  hints: [
    l("`word[:3]` is the first three characters.", "`word[:3]` on kolme ensimmäistä merkkiä."),
    l("`word[-1]` is the last character, whatever the length.", "`word[-1]` on viimeinen merkki pituudesta riippumatta."),
  ],
  tests: [
    check(
      "first-three",
      l('`first_three` is `"Pyt"`.', '`first_three` on `"Pyt"`.'),
      l("Use a slice: `word[:3]`.", "Käytä viipaletta: `word[:3]`."),
      `expect_equal(var("first_three"), "Pyt")`,
    ),
    check(
      "last-letter",
      l('`last_letter` is `"n"`.', '`last_letter` on `"n"`.'),
      l("Use a negative index for the last character: `word[-1]`.", "Käytä viimeiselle merkille negatiivista indeksiä: `word[-1]`."),
      `expect_equal(var("last_letter"), "n")`,
    ),
    check(
      "other-words",
      l("It works for words of other lengths.", "Se toimii eripituisilla sanoilla."),
      l(
        "Another word gave wrong results. A fixed index like `word[5]` only works for six-letter words — use `word[-1]`.",
        "Toinen sana antoi väärät tulokset. Kiinteä indeksi, kuten `word[5]`, toimii vain kuusikirjaimisilla sanoilla – käytä indeksiä `word[-1]`.",
      ),
      code`
        for word, first, last in [("otter", "ott", "r"), ("koodi", "koo", "i")]:
            result = run(word=word)
            expect_equal(result.var("first_three"), first)
            expect_equal(result.var("last_letter"), last)
      `,
    ),
  ],
  starter: 'word = "Python"\n\n# Write your code below this line.\n',
});

/* ------------------------------------------------------------------ */
/* Chapter 10 — Mini-projects                                         */
/* ------------------------------------------------------------------ */

export const pyWordCounterLab = pyLab({
  id: "py-word-counter-lab",
  chapterId: "py-projects",
  minutes: 20,
  title: l("Lab: Word counter", "Harjoitustyö: Sanalaskuri"),
  summary: l(
    "Combine loops, dictionaries and string methods to analyse text.",
    "Analysoi tekstiä yhdistämällä silmukoita, sanakirjoja ja merkkijonometodeja.",
  ),
  concept: l(
    md`
      Counting things is a classic use for a dictionary. Loop over the items and increase the count for each one:

      ~~~python
      counts = {}
      for animal in ["otter", "fish", "otter"]:
          counts[animal] = counts.get(animal, 0) + 1
      # {"otter": 2, "fish": 1}
      ~~~

      \`text.split()\` turns a sentence into a list of words, and \`max(counts, key=counts.get)\` finds the key with the largest value.
    `,
    md`
      Asioiden laskeminen on sanakirjan klassinen käyttötapa. Käy alkiot läpi silmukassa ja kasvata kunkin laskuria:

      ~~~python
      counts = {}
      for animal in ["otter", "fish", "otter"]:
          counts[animal] = counts.get(animal, 0) + 1
      # {"otter": 2, "fish": 1}
      ~~~

      \`text.split()\` muuttaa lauseen sanalistaksi, ja \`max(counts, key=counts.get)\` löytää avaimen, jolla on suurin arvo.
    `,
  ),
  objectives: [
    l("Count items with a dictionary", "Laskea alkioita sanakirjan avulla"),
    l("Normalise text before comparing", "Yhtenäistää tekstin ennen vertailua"),
    l("Find the maximum by value", "Löytää suurimman arvon perusteella"),
  ],
  requirements: [
    l(
      "Create a dictionary `word_counts` that maps each word in `text` to the number of times it appears.",
      "Luo sanakirja `word_counts`, joka kertoo jokaisen tekstin `text` sanan esiintymiskertojen määrän.",
    ),
    l(
      'Count case-insensitively: `"The"` and `"the"` are the same word. Store the words in lowercase.',
      'Laske kirjainkoosta riippumatta: `"The"` ja `"the"` ovat sama sana. Tallenna sanat pienillä kirjaimilla.',
    ),
    l("Words are separated by spaces; the text has no punctuation.", "Sanat erotetaan välilyönneillä, eikä tekstissä ole välimerkkejä."),
    l(
      "Create `most_common` with the most frequent word. If several words tie, use the one that appears first.",
      "Luo muuttuja `most_common`, jossa on yleisin sana. Jos useampi sana on tasoissa, valitse tekstissä ensimmäisenä esiintyvä.",
    ),
    l("Print `most_common`.", "Tulosta `most_common`."),
  ],
  instructions: l(
    "A nature blog wants to know which words its writers use most. Analyse the sentence in `text` according to the requirements. The tests also try other sentences, so your code must work for any text.",
    "Luontoblogi haluaa tietää, mitä sanoja sen kirjoittajat käyttävät eniten. Analysoi muuttujan `text` lause vaatimusten mukaisesti. Testit kokeilevat myös muita lauseita, joten koodisi täytyy toimia millä tahansa tekstillä.",
  ),
  hints: [
    l("`text.lower().split()` gives a list of lowercase words.", "`text.lower().split()` antaa listan pienillä kirjaimilla kirjoitetuista sanoista."),
    l("Inside the loop: `word_counts[word] = word_counts.get(word, 0) + 1`.", "Silmukan sisällä: `word_counts[word] = word_counts.get(word, 0) + 1`."),
    l(
      "`max(word_counts, key=word_counts.get)` returns the first word with the highest count.",
      "`max(word_counts, key=word_counts.get)` palauttaa ensimmäisen sanan, jolla on suurin määrä.",
    ),
  ],
  tests: [
    check(
      "counts-dict",
      l("`word_counts` is a dictionary.", "`word_counts` on sanakirja."),
      l("Create `word_counts` as a dictionary, for example `word_counts = {}`.", "Luo `word_counts` sanakirjana, esimerkiksi `word_counts = {}`."),
      `expect_type(var("word_counts"), dict)`,
    ),
    check(
      "counts-base",
      l("`word_counts` has the right count for every word.", "`word_counts` sisältää oikean määrän jokaiselle sanalle."),
      l("Some counts are wrong. Every word should be counted once per appearance.", "Jotkin määrät ovat väärin. Jokainen sana lasketaan kerran jokaista esiintymää kohden."),
      `expect_equal(dict(var("word_counts")), {"the": 3, "otter": 2, "saw": 1, "river": 1, "and": 1, "swam": 1})`,
    ),
    check(
      "case-insensitive",
      l("Counting ignores capital letters.", "Laskenta ei välitä isoista kirjaimista."),
      l('`"Code"` and `"code"` were counted separately. Convert the text to lowercase first.', '`"Code"` ja `"code"` laskettiin erikseen. Muuta teksti ensin pienille kirjaimille.'),
      `expect_equal(dict(run(text="Code code CODE fun").var("word_counts")), {"code": 3, "fun": 1})`,
    ),
    check(
      "most-common",
      l('`most_common` is `"the"`.', '`most_common` on `"the"`.'),
      l("`most_common` should be the word with the highest count.", "Muuttujassa `most_common` pitää olla sana, jolla on suurin määrä."),
      `expect_equal(var("most_common"), "the")`,
    ),
    check(
      "prints",
      l("The program prints the most common word.", "Ohjelma tulostaa yleisimmän sanan."),
      l("Print `most_common` at the end.", "Tulosta `most_common` lopuksi."),
      `expect(str(var("most_common")) in output.split(), expected=var("most_common"), actual=output.strip() or "-")`,
    ),
    check(
      "hidden-tie",
      l("Ties go to the word that appears first.", "Tasatilanteessa valitaan ensin esiintyvä sana."),
      l("When two words are equally common, choose the one that appears first.", "Kun kaksi sanaa on yhtä yleisiä, valitse ensin esiintyvä."),
      `expect_equal(run(text="b a b a").var("most_common"), "b")`,
      { hidden: true },
    ),
    check(
      "hidden-other-text",
      l("Works for another sentence.", "Toimii toisellakin lauseella."),
      l("Your program gives wrong results for some sentences.", "Ohjelmasi antaa vääriä tuloksia joillakin lauseilla."),
      code`
        result = run(text="one two two three three three")
        expect_equal(dict(result.var("word_counts")), {"one": 1, "two": 2, "three": 3})
        expect_equal(result.var("most_common"), "three")
      `,
      { hidden: true },
    ),
  ],
  starter: 'text = "the otter saw the river and the otter swam"\n\n# Write your code below this line.\n',
  expectedOutput: { text: "the" },
});

export const pyScoreReportLab = pyLab({
  id: "py-score-report-lab",
  chapterId: "py-projects",
  minutes: 25,
  title: l("Lab: Score report", "Harjoitustyö: Tulosraportti"),
  summary: l(
    "Write small functions and combine them into a report.",
    "Kirjoita pieniä funktioita ja yhdistä ne raportiksi.",
  ),
  concept: l(
    md`
      Bigger programs are easier to build from small functions that each do one job — and then a function that uses the others:

      ~~~python
      def is_even(n):
          return n % 2 == 0

      def count_even(numbers):
          return len([n for n in numbers if is_even(n)])
      ~~~

      \`round(value, 1)\` rounds to one decimal, and an f-string can format a number: \`f"{value:.1f}"\` shows one decimal.
    `,
    md`
      Isommat ohjelmat on helpompi rakentaa pienistä funktioista, joista jokainen tekee yhden asian – ja funktiosta, joka käyttää muita:

      ~~~python
      def is_even(n):
          return n % 2 == 0

      def count_even(numbers):
          return len([n for n in numbers if is_even(n)])
      ~~~

      \`round(value, 1)\` pyöristää yhteen desimaaliin, ja f-merkkijono voi muotoilla luvun: \`f"{value:.1f}"\` näyttää yhden desimaalin.
    `,
  ),
  objectives: [
    l("Split a problem into small functions", "Jakaa ongelman pieniksi funktioiksi"),
    l("Handle edge cases such as empty lists", "Käsitellä erikoistapaukset, kuten tyhjät listat"),
    l("Format numbers in text", "Muotoilla lukuja tekstiin"),
  ],
  requirements: [
    l(
      "`average(scores)` returns the average of a list of scores, or `0` for an empty list.",
      "`average(scores)` palauttaa pistelistan keskiarvon, tai `0`, jos lista on tyhjä.",
    ),
    l(
      "`count_passed(scores, limit)` returns how many scores are **at least** `limit`.",
      "`count_passed(scores, limit)` palauttaa, kuinka monta pistemäärää on **vähintään** `limit`.",
    ),
    l(
      '`report(scores)` returns text like `"3/4 passed, average 69.0"`: a score of 50 or more passes, and the average has one decimal.',
      '`report(scores)` palauttaa tekstin, kuten `"3/4 passed, average 69.0"`: vähintään 50 pistettä on hyväksytty, ja keskiarvossa on yksi desimaali.',
    ),
    l("Print the report for `scores`.", "Tulosta raportti listalle `scores`."),
  ],
  instructions: l(
    "A teacher wants a quick summary of exam scores. Write the three functions described in the requirements and use them to print a report for `scores`.",
    "Opettaja haluaa nopean yhteenvedon koepisteistä. Kirjoita vaatimuksissa kuvatut kolme funktiota ja tulosta niiden avulla raportti listalle `scores`.",
  ),
  hints: [
    l("`sum(scores) / len(scores)` is the average — but check for an empty list first.", "`sum(scores) / len(scores)` on keskiarvo – mutta tarkista ensin, onko lista tyhjä."),
    l("Count with a loop or `len([s for s in scores if s >= limit])`.", "Laske silmukalla tai lausekkeella `len([s for s in scores if s >= limit])`."),
    l(
      'In `report`, call the other functions: `f"{count_passed(scores, 50)}/{len(scores)} passed, average {average(scores):.1f}"`.',
      'Kutsu funktiossa `report` muita funktioita: `f"{count_passed(scores, 50)}/{len(scores)} passed, average {average(scores):.1f}"`.',
    ),
  ],
  tests: [
    check(
      "functions",
      l("`average`, `count_passed` and `report` are functions.", "`average`, `count_passed` ja `report` ovat funktioita."),
      l("Define all three functions with the exact names from the requirements.", "Määrittele kaikki kolme funktiota täsmälleen vaatimusten nimillä."),
      `expect(all(callable(var(name)) for name in ["average", "count_passed", "report"]))`,
    ),
    check(
      "average",
      l("`average` returns the mean of the scores.", "`average` palauttaa pisteiden keskiarvon."),
      l("`average([72, 45, 88, 71])` should be `69.0` and `average([10, 20])` should be `15`.", "`average([72, 45, 88, 71])` pitää olla `69.0` ja `average([10, 20])` pitää olla `15`."),
      code`
        expect_close(var("average")([72, 45, 88, 71]), 69.0)
        expect_close(var("average")([10, 20]), 15)
      `,
    ),
    check(
      "average-empty",
      l("`average([])` returns `0`.", "`average([])` palauttaa `0`."),
      l("An empty list can't be divided by its length. Return `0` when the list is empty.", "Tyhjää listaa ei voi jakaa pituudellaan. Palauta `0`, kun lista on tyhjä."),
      `expect_close(var("average")([]), 0)`,
    ),
    check(
      "count-passed",
      l("`count_passed` counts scores that are at least the limit.", "`count_passed` laskee pistemäärät, jotka ovat vähintään raja."),
      l(
        "Some counts are wrong. A score equal to the limit counts as passed — use `>=`.",
        "Jotkin määrät ovat väärin. Rajan suuruinen pistemäärä lasketaan hyväksytyksi – käytä operaattoria `>=`.",
      ),
      code`
        expect_equal(var("count_passed")([50, 49, 80], 50), 2)
        expect_equal(var("count_passed")([], 50), 0)
        expect_equal(var("count_passed")([90, 95], 92), 1)
      `,
    ),
    check(
      "report",
      l('`report` returns text like `"3/4 passed, average 69.0"`.', '`report` palauttaa tekstin, kuten `"3/4 passed, average 69.0"`.'),
      l("The report text doesn't match the required format exactly.", "Raportin teksti ei vastaa täsmälleen vaadittua muotoa."),
      code`
        expect_equal(var("report")([72, 45, 88, 71]), "3/4 passed, average 69.0")
        expect_equal(var("report")([100, 20]), "1/2 passed, average 60.0")
      `,
    ),
    check(
      "prints",
      l("The program prints the report for `scores`.", "Ohjelma tulostaa raportin listalle `scores`."),
      l("Print `report(scores)` at the end.", "Tulosta lopuksi `report(scores)`."),
      `expect_line("3/4 passed, average 69.0")`,
    ),
    check(
      "hidden-decimals",
      l("Rounds decimal averages to one decimal.", "Pyöristää desimaalikeskiarvot yhteen desimaaliin."),
      l("The average isn't shown with exactly one decimal for some scores.", "Keskiarvoa ei näytetä täsmälleen yhdellä desimaalilla joillakin pisteillä."),
      `expect_equal(var("report")([33.3, 66.6, 99.9]), "2/3 passed, average 66.6")`,
      { hidden: true },
    ),
  ],
  starter: "scores = [72, 45, 88, 71]\n\n# Write your code below this line.\n",
  expectedOutput: { text: "3/4 passed, average 69.0" },
});
