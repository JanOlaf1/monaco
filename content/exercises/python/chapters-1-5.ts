import { check, l, pyChallenge } from "@/lib/content/factories";
import { code, md } from "@/lib/content/md";

/* ------------------------------------------------------------------ */
/* Chapter 1 — Hello, Python                                          */
/* ------------------------------------------------------------------ */

export const pyHelloWorld = pyChallenge({
  id: "py-hello-world",
  chapterId: "py-intro",
  minutes: 2,
  title: l("Your first program", "Ensimmäinen ohjelmasi"),
  summary: l("Make Python say hello with print().", "Saa Python tervehtimään print()-funktiolla."),
  concept: l(
    md`
      A program is a list of instructions that the computer follows from top to bottom. The \`print()\` function shows a value in the output:

      ~~~python
      print("Good morning!")
      ~~~

      Text inside quotes is a **string**. Python prints it exactly as written — capital letters, spaces and punctuation included.
    `,
    md`
      Ohjelma on luettelo ohjeita, joita tietokone noudattaa ylhäältä alaspäin. Funktio \`print()\` näyttää arvon tulosteessa:

      ~~~python
      print("Good morning!")
      ~~~

      Lainausmerkkien sisällä oleva teksti on **merkkijono**. Python tulostaa sen täsmälleen sellaisenaan – isot kirjaimet, välilyönnit ja välimerkit mukaan lukien.
    `,
  ),
  objectives: [
    l("Run a Python program", "Suorittaa Python-ohjelman"),
    l("Show text with print()", "Näyttää tekstiä print()-funktiolla"),
  ],
  instructions: l(
    "Write a program that prints exactly `Hello, world!`\n\nPress **Run** to see the output, then **Check answer**.",
    "Kirjoita ohjelma, joka tulostaa täsmälleen `Hello, world!`\n\nPaina **Suorita** nähdäksesi tulosteen ja sitten **Tarkista vastaus**.",
  ),
  hints: [
    l(
      'Put the text in quotes and the quotes inside the parentheses: `print("...")`.',
      'Kirjoita teksti lainausmerkkeihin ja lainausmerkit sulkeiden sisään: `print("...")`.',
    ),
    l(
      "Check the comma after `Hello` and the exclamation mark at the end.",
      "Tarkista pilkku sanan `Hello` jälkeen ja huutomerkki lopussa.",
    ),
  ],
  tests: [
    check(
      "prints-hello",
      l("The output contains `Hello, world!`", "Tulosteessa on `Hello, world!`"),
      l(
        "The output should contain exactly `Hello, world!` — same capital letter, comma and exclamation mark.",
        "Tulosteessa pitää olla täsmälleen `Hello, world!` – sama iso kirjain, pilkku ja huutomerkki.",
      ),
      `expect_line("Hello, world!")`,
    ),
    check(
      "only-greeting",
      l("Nothing else is printed.", "Muuta ei tulosteta."),
      l("Print only the greeting — remove any extra `print()` lines.", "Tulosta vain tervehdys – poista ylimääräiset `print()`-rivit."),
      `expect_equal(lines, ["Hello, world!"])`,
    ),
  ],
  starter: "# Your first Python program\n# Write your code below this line.\n",
  expectedOutput: { text: "Hello, world!" },
});

export const pyMultiplePrints = pyChallenge({
  id: "py-multiple-prints",
  chapterId: "py-intro",
  minutes: 3,
  title: l("Line by line", "Rivi kerrallaan"),
  summary: l("Print several lines and keep them in order.", "Tulosta useita rivejä oikeassa järjestyksessä."),
  concept: l(
    md`
      Python runs the lines of a program in order, one after another. Each \`print()\` starts a new line in the output, so the order of your \`print()\` calls is the order of the output lines:

      ~~~python
      print("First")
      print("Second")
      ~~~
    `,
    md`
      Python suorittaa ohjelman rivit järjestyksessä yksi kerrallaan. Jokainen \`print()\` aloittaa tulosteessa uuden rivin, joten \`print()\`-kutsujen järjestys on myös tulosterivien järjestys:

      ~~~python
      print("First")
      print("Second")
      ~~~
    `,
  ),
  objectives: [
    l("Understand that code runs from top to bottom", "Ymmärtää, että koodi suoritetaan ylhäältä alas"),
    l("Print several lines", "Tulostaa useita rivejä"),
  ],
  instructions: l(
    md`
      A launch needs a countdown message. Print these three lines, in this order:

      ~~~
      Ready
      Set
      Code!
      ~~~
    `,
    md`
      Laukaisu tarvitsee lähtölaskentaviestin. Tulosta nämä kolme riviä tässä järjestyksessä:

      ~~~
      Ready
      Set
      Code!
      ~~~
    `,
  ),
  hints: [
    l("Use one `print()` call per line.", "Käytä yhtä `print()`-kutsua riviä kohden."),
    l("The order matters: `Ready` must be printed first.", "Järjestyksellä on väliä: `Ready` tulostetaan ensin."),
  ],
  tests: [
    check(
      "all-lines",
      l("All three lines are printed.", "Kaikki kolme riviä tulostetaan."),
      l(
        "At least one of `Ready`, `Set` and `Code!` is missing. Check the spelling and punctuation.",
        "Ainakin yksi riveistä `Ready`, `Set` ja `Code!` puuttuu. Tarkista kirjoitusasu ja välimerkit.",
      ),
      `expect(all(word in lines for word in ["Ready", "Set", "Code!"]), actual=output.strip())`,
    ),
    check(
      "order",
      l("The lines are in the right order.", "Rivit ovat oikeassa järjestyksessä."),
      l(
        "The lines are printed in a different order. Python runs from top to bottom — reorder your `print()` calls.",
        "Rivit tulostuvat eri järjestyksessä. Python suorittaa koodin ylhäältä alas – järjestä `print()`-kutsut uudelleen.",
      ),
      `expect_equal(lines, ["Ready", "Set", "Code!"])`,
    ),
  ],
  starter: "# Write your code below this line.\n",
  expectedOutput: { text: "Ready\nSet\nCode!" },
});

/* ------------------------------------------------------------------ */
/* Chapter 2 — Variables and strings                                  */
/* ------------------------------------------------------------------ */

export const pyStringLength = pyChallenge({
  id: "py-string-length",
  chapterId: "py-strings",
  minutes: 4,
  title: l("Measuring text", "Tekstin pituus"),
  summary: l("Count the characters in a string with len().", "Laske merkkijonon merkit len()-funktiolla."),
  concept: l(
    md`
      \`len()\` is a built-in function that counts the characters in a string. Letters, digits, spaces and punctuation all count:

      ~~~python
      len("otter")      # 5
      len("hi there")   # 8
      ~~~

      You can store the result in a variable and use it later, like any other value.
    `,
    md`
      \`len()\` on sisäänrakennettu funktio, joka laskee merkkijonon merkit. Kirjaimet, numerot, välilyönnit ja välimerkit lasketaan kaikki:

      ~~~python
      len("otter")      # 5
      len("hi there")   # 8
      ~~~

      Tuloksen voi tallentaa muuttujaan ja käyttää myöhemmin kuten mitä tahansa muuta arvoa.
    `,
  ),
  objectives: [
    l("Use the built-in len() function", "Käyttää sisäänrakennettua len()-funktiota"),
    l("Store a computed value in a variable", "Tallentaa lasketun arvon muuttujaan"),
  ],
  instructions: l(
    "A username may be at most 12 characters long. Create a variable `name_length` that holds the number of characters in `username`, then print it.",
    "Käyttäjätunnus saa olla enintään 12 merkkiä pitkä. Luo muuttuja `name_length`, jossa on muuttujan `username` merkkien määrä, ja tulosta se.",
  ),
  hints: [
    l("`len(username)` gives the number of characters.", "`len(username)` antaa merkkien määrän."),
    l(
      "Assign first, then print: `name_length = len(username)` and `print(name_length)`.",
      "Sijoita ensin ja tulosta sitten: `name_length = len(username)` ja `print(name_length)`.",
    ),
  ],
  tests: [
    check(
      "length-value",
      l("`name_length` is the number of characters in `username`.", "`name_length` on muuttujan `username` merkkien määrä."),
      l(
        "`name_length` doesn't match the length of `username`. Use `len(username)`.",
        "`name_length` ei vastaa muuttujan `username` pituutta. Käytä lauseketta `len(username)`.",
      ),
      `expect_equal(var("name_length"), len(var("username")))`,
    ),
    check(
      "follows-username",
      l("`name_length` changes when `username` changes.", "`name_length` muuttuu, kun `username` muuttuu."),
      l(
        "When we changed `username`, `name_length` stayed the same. Calculate it with `len(username)` instead of typing the number.",
        "Kun vaihdoimme muuttujan `username` arvon, `name_length` pysyi samana. Laske se lausekkeella `len(username)` sen sijaan, että kirjoittaisit luvun itse.",
      ),
      code`
        for name in ["ada", "programmer_42"]:
            expect_equal(run(username=name).var("name_length"), len(name))
      `,
    ),
    check(
      "prints-length",
      l("The program prints the length.", "Ohjelma tulostaa pituuden."),
      l("Print `name_length` after calculating it.", "Tulosta `name_length`, kun olet laskenut sen."),
      `expect_number_in_output(len(var("username")))`,
    ),
  ],
  starter: 'username = "saku_otter"\n\n# Write your code below this line.\n',
});

/* ------------------------------------------------------------------ */
/* Chapter 3 — Numbers and operators                                  */
/* ------------------------------------------------------------------ */

export const pyShoppingTotal = pyChallenge({
  id: "py-shopping-total",
  chapterId: "py-numbers",
  minutes: 4,
  title: l("Café receipt", "Kahvilan kuitti"),
  summary: l("Calculate with arithmetic operators.", "Laske aritmeettisilla operaattoreilla."),
  concept: l(
    md`
      Python understands the usual arithmetic operators: \`+\`, \`-\`, \`*\` (multiply) and \`/\` (divide). Multiplication and division happen before addition and subtraction, and parentheses change the order:

      ~~~python
      print(2 + 3 * 4)     # 14
      print((2 + 3) * 4)   # 20
      ~~~

      Numbers with a decimal point, like \`2.5\`, are called **floats**. Whole numbers are **integers**.
    `,
    md`
      Python tuntee tavalliset laskuoperaattorit: \`+\`, \`-\`, \`*\` (kertolasku) ja \`/\` (jakolasku). Kerto- ja jakolasku lasketaan ennen yhteen- ja vähennyslaskua, ja sulkeilla järjestystä voi muuttaa:

      ~~~python
      print(2 + 3 * 4)     # 14
      print((2 + 3) * 4)   # 20
      ~~~

      Desimaalipisteellisiä lukuja, kuten \`2.5\`, kutsutaan **liukuluvuiksi** (float). Kokonaisluvut ovat **integer**-tyyppisiä.
    `,
  ),
  objectives: [
    l("Calculate with + - * /", "Laskea operaattoreilla + - * /"),
    l("Use variables in calculations", "Käyttää muuttujia laskuissa"),
  ],
  instructions: l(
    "A café sells buns. `price` is the price of one bun and `quantity` is how many you buy. Create a variable `total` with the total cost and print it.",
    "Kahvila myy pullia. `price` on yhden pullan hinta ja `quantity` ostettavien pullien määrä. Luo muuttuja `total`, jossa on kokonaishinta, ja tulosta se.",
  ),
  hints: [
    l("The total cost is price times quantity.", "Kokonaishinta on hinta kertaa määrä."),
    l("`total = price * quantity`", "`total = price * quantity`"),
  ],
  tests: [
    check(
      "total-value",
      l("`total` is `price` × `quantity`.", "`total` on `price` × `quantity`."),
      l("`total` doesn't equal the price multiplied by the quantity.", "`total` ei ole hinta kerrottuna määrällä."),
      `expect_close(var("total"), var("price") * var("quantity"))`,
    ),
    check(
      "other-values",
      l("`total` is correct for other prices and quantities.", "`total` on oikein myös muilla hinnoilla ja määrillä."),
      l(
        "With other values for `price` and `quantity`, `total` was wrong. Calculate it from the variables instead of typing the result.",
        "Muilla muuttujien `price` ja `quantity` arvoilla `total` oli väärin. Laske se muuttujista sen sijaan, että kirjoittaisit tuloksen.",
      ),
      code`
        for price, quantity, expected in [(3, 7, 21), (1.2, 10, 12.0)]:
            expect_close(run(price=price, quantity=quantity).var("total"), expected)
      `,
    ),
    check(
      "prints-total",
      l("The program prints the total.", "Ohjelma tulostaa kokonaishinnan."),
      l("Print `total` at the end.", "Tulosta `total` lopuksi."),
      `expect_number_in_output(var("total"))`,
    ),
  ],
  starter: "price = 2.5\nquantity = 4\n\n# Write your code below this line.\n",
});

export const pyTimeConverter = pyChallenge({
  id: "py-time-converter",
  chapterId: "py-numbers",
  minutes: 5,
  title: l("Minutes to hours", "Minuutit tunneiksi"),
  summary: l("Use // and % to split a duration.", "Jaa kesto osiin operaattoreilla // ja %."),
  concept: l(
    md`
      Two operators are handy for splitting numbers into parts:

      - \`//\` divides and drops the remainder: \`17 // 5\` is \`3\`.
      - \`%\` (modulo) gives the remainder: \`17 % 5\` is \`2\`.

      Normal division \`/\` always returns a float: \`17 / 5\` is \`3.4\`.
    `,
    md`
      Kaksi operaattoria on käteviä lukujen jakamiseen osiin:

      - \`//\` jakaa ja jättää jakojäännöksen pois: \`17 // 5\` on \`3\`.
      - \`%\` (modulo) antaa jakojäännöksen: \`17 % 5\` on \`2\`.

      Tavallinen jakolasku \`/\` palauttaa aina liukuluvun: \`17 / 5\` on \`3.4\`.
    `,
  ),
  objectives: [
    l("Use integer division //", "Käyttää kokonaislukujakoa //"),
    l("Use the remainder operator %", "Käyttää jakojäännösoperaattoria %"),
  ],
  instructions: l(
    md`
      A film lasts \`total_minutes\` minutes. Create \`hours\` (whole hours) and \`minutes\` (the minutes left over), then print them like this:

      ~~~
      2 h 15 min
      ~~~
    `,
    md`
      Elokuva kestää \`total_minutes\` minuuttia. Luo muuttujat \`hours\` (kokonaiset tunnit) ja \`minutes\` (jäljelle jäävät minuutit) ja tulosta ne näin:

      ~~~
      2 h 15 min
      ~~~
    `,
  ),
  hints: [
    l("An hour has 60 minutes: `total_minutes // 60` gives the hours.", "Tunnissa on 60 minuuttia: `total_minutes // 60` antaa tunnit."),
    l(
      "`total_minutes % 60` gives what is left over. Print with an f-string: `f\"{hours} h {minutes} min\"`.",
      "`total_minutes % 60` antaa jäljelle jäävät minuutit. Tulosta f-merkkijonolla: `f\"{hours} h {minutes} min\"`.",
    ),
  ],
  tests: [
    check(
      "hours",
      l("`hours` is the number of whole hours.", "`hours` on kokonaisten tuntien määrä."),
      l(
        "`hours` should be a whole number of hours. Use `//` instead of `/`.",
        "Muuttujan `hours` pitää olla kokonaisten tuntien määrä. Käytä operaattoria `//` operaattorin `/` sijaan.",
      ),
      `expect_equal(var("hours"), var("total_minutes") // 60)`,
    ),
    check(
      "minutes",
      l("`minutes` is the number of minutes left over.", "`minutes` on jäljelle jäävien minuuttien määrä."),
      l("`minutes` should be the remainder. Use `% 60`.", "Muuttujan `minutes` pitää olla jakojäännös. Käytä lauseketta `% 60`."),
      `expect_equal(var("minutes"), var("total_minutes") % 60)`,
    ),
    check(
      "other-durations",
      l("It works for other durations, such as 59 and 120 minutes.", "Se toimii myös muilla kestoilla, kuten 59 ja 120 minuuttia."),
      l(
        "Some durations give wrong hours or minutes. Calculate both from `total_minutes`.",
        "Joillakin kestoilla tunnit tai minuutit ovat väärin. Laske molemmat muuttujasta `total_minutes`.",
      ),
      code`
        for total, h, m in [(59, 0, 59), (120, 2, 0), (61, 1, 1)]:
            result = run(total_minutes=total)
            expect_equal(result.var("hours"), h)
            expect_equal(result.var("minutes"), m)
      `,
    ),
    check(
      "output",
      l("The output looks like `2 h 15 min`.", "Tuloste on muotoa `2 h 15 min`."),
      l(
        "Print the result in the format `2 h 15 min`, with spaces as shown.",
        "Tulosta tulos muodossa `2 h 15 min` välilyönteineen.",
      ),
      `expect_line(str(var("hours")) + " h " + str(var("minutes")) + " min")`,
    ),
  ],
  starter: "total_minutes = 135\n\n# Write your code below this line.\n",
  expectedOutput: { text: "2 h 15 min" },
});

/* ------------------------------------------------------------------ */
/* Chapter 4 — True or false                                          */
/* ------------------------------------------------------------------ */

export const pyComparisons = pyChallenge({
  id: "py-comparisons",
  chapterId: "py-booleans",
  minutes: 3,
  title: l("Comparing values", "Arvojen vertailu"),
  summary: l("Create a boolean from a comparison.", "Luo totuusarvo vertailun avulla."),
  concept: l(
    md`
      A comparison asks a yes-or-no question and produces a **boolean**: \`True\` or \`False\`.

      ~~~python
      print(5 > 3)    # True
      print(5 == 3)   # False
      ~~~

      The operators are \`<\`, \`<=\`, \`>\`, \`>=\`, \`==\` (equal) and \`!=\` (not equal). Note the difference: \`=\` assigns a value, \`==\` compares two values.
    `,
    md`
      Vertailu esittää kyllä- tai ei-kysymyksen ja tuottaa **totuusarvon** (boolean): \`True\` tai \`False\`.

      ~~~python
      print(5 > 3)    # True
      print(5 == 3)   # False
      ~~~

      Operaattorit ovat \`<\`, \`<=\`, \`>\`, \`>=\`, \`==\` (yhtä suuri) ja \`!=\` (eri suuri). Huomaa ero: \`=\` sijoittaa arvon, \`==\` vertaa kahta arvoa.
    `,
  ),
  objectives: [
    l("Use comparison operators", "Käyttää vertailuoperaattoreita"),
    l("Store a boolean in a variable", "Tallentaa totuusarvon muuttujaan"),
  ],
  instructions: l(
    "A climbing wall is open to people aged 18 or older. Create `is_adult`, which is `True` when `age` is 18 or more and `False` otherwise. Use a comparison — don't write `True` or `False` yourself.",
    "Kiipeilyseinä on avoin vähintään 18-vuotiaille. Luo muuttuja `is_adult`, joka on `True`, kun `age` on 18 tai enemmän, ja muuten `False`. Käytä vertailua – älä kirjoita arvoja `True` tai `False` itse.",
  ),
  hints: [
    l("“18 or more” is written `>= 18`.", "”18 tai enemmän” kirjoitetaan `>= 18`."),
    l("`is_adult = age >= 18` stores the result of the comparison.", "`is_adult = age >= 18` tallentaa vertailun tuloksen."),
  ],
  tests: [
    check(
      "is-bool",
      l("`is_adult` is a boolean.", "`is_adult` on totuusarvo."),
      l("`is_adult` should be `True` or `False`, the result of a comparison.", "Muuttujan `is_adult` pitää olla `True` tai `False`, vertailun tulos."),
      `expect_type(var("is_adult"), bool)`,
    ),
    check(
      "under",
      l("`is_adult` is `False` for age 17.", "`is_adult` on `False`, kun ikä on 17."),
      l("For age 17, `is_adult` should be `False`.", "Kun ikä on 17, muuttujan `is_adult` pitää olla `False`."),
      `expect_equal(run(age=17).var("is_adult"), False)`,
    ),
    check(
      "boundary",
      l("`is_adult` is `True` for exactly 18.", "`is_adult` on `True`, kun ikä on tasan 18."),
      l(
        "For exactly 18, `is_adult` should be `True`. Check whether you used `>` or `>=`.",
        "Kun ikä on tasan 18, muuttujan `is_adult` pitää olla `True`. Tarkista, käytitkö operaattoria `>` vai `>=`.",
      ),
      `expect_equal(run(age=18).var("is_adult"), True)`,
    ),
    check(
      "over",
      l("`is_adult` is `True` for age 40.", "`is_adult` on `True`, kun ikä on 40."),
      l("For age 40, `is_adult` should be `True`.", "Kun ikä on 40, muuttujan `is_adult` pitää olla `True`."),
      `expect_equal(run(age=40).var("is_adult"), True)`,
    ),
  ],
  starter: "age = 17\n\n# Write your code below this line.\n",
});

export const pyLogicalOperators = pyChallenge({
  id: "py-logical-operators",
  chapterId: "py-booleans",
  minutes: 4,
  title: l("Combining conditions", "Ehtojen yhdistäminen"),
  summary: l("Combine booleans with and, or and not.", "Yhdistä totuusarvoja sanoilla and, or ja not."),
  concept: l(
    md`
      Logical operators combine booleans:

      - \`a and b\` is \`True\` only when **both** are true.
      - \`a or b\` is \`True\` when **at least one** is true.
      - \`not a\` flips the value: \`not True\` is \`False\`.

      ~~~python
      is_weekend = True
      is_raining = False
      print(is_weekend and not is_raining)   # True
      ~~~
    `,
    md`
      Loogiset operaattorit yhdistävät totuusarvoja:

      - \`a and b\` on \`True\` vain, kun **molemmat** ovat tosia.
      - \`a or b\` on \`True\`, kun **ainakin toinen** on tosi.
      - \`not a\` kääntää arvon: \`not True\` on \`False\`.

      ~~~python
      is_weekend = True
      is_raining = False
      print(is_weekend and not is_raining)   # True
      ~~~
    `,
  ),
  objectives: [
    l("Use and, or and not", "Käyttää operaattoreita and, or ja not"),
    l("Translate a rule into a boolean expression", "Muuttaa säännön totuusarvolausekkeeksi"),
  ],
  instructions: l(
    "A concert lets you in if you **have a ticket** and you are **not banned**. Create `can_enter` from `has_ticket` and `is_banned`.",
    "Konserttiin pääsee, jos sinulla **on lippu** etkä ole **porttikiellossa**. Luo muuttuja `can_enter` muuttujista `has_ticket` ja `is_banned`.",
  ),
  hints: [
    l("“Not banned” is `not is_banned`.", "”Ei porttikiellossa” on `not is_banned`."),
    l("Both rules must hold, so join them with `and`.", "Molempien sääntöjen pitää täyttyä, joten yhdistä ne sanalla `and`."),
  ],
  tests: [
    check(
      "is-bool",
      l("`can_enter` is a boolean.", "`can_enter` on totuusarvo."),
      l("`can_enter` should be `True` or `False`.", "Muuttujan `can_enter` pitää olla `True` tai `False`."),
      `expect_type(var("can_enter"), bool)`,
    ),
    check(
      "allowed",
      l("With a ticket and no ban, `can_enter` is `True`.", "Kun lippu on eikä porttikieltoa ole, `can_enter` on `True`."),
      l("A ticket holder who is not banned should get in.", "Lipun haltijan, joka ei ole porttikiellossa, pitää päästä sisään."),
      `expect_equal(run(has_ticket=True, is_banned=False).var("can_enter"), True)`,
    ),
    check(
      "no-ticket",
      l("Without a ticket, `can_enter` is `False`.", "Ilman lippua `can_enter` on `False`."),
      l(
        "Someone without a ticket got in. Both conditions must be true — use `and`, not `or`.",
        "Joku pääsi sisään ilman lippua. Molempien ehtojen pitää olla tosia – käytä sanaa `and`, ei `or`.",
      ),
      `expect_equal(run(has_ticket=False, is_banned=False).var("can_enter"), False)`,
    ),
    check(
      "banned",
      l("A banned person with a ticket can't enter.", "Porttikiellossa oleva ei pääse sisään lipullakaan."),
      l("A banned person got in. Use `not is_banned` in your condition.", "Porttikiellossa oleva pääsi sisään. Käytä ehdossa lauseketta `not is_banned`."),
      `expect_equal(run(has_ticket=True, is_banned=True).var("can_enter"), False)`,
    ),
  ],
  starter: "has_ticket = True\nis_banned = False\n\n# Write your code below this line.\n",
});

/* ------------------------------------------------------------------ */
/* Chapter 5 — Making decisions                                       */
/* ------------------------------------------------------------------ */

export const pyIfElse = pyChallenge({
  id: "py-if-else",
  chapterId: "py-conditions",
  minutes: 4,
  title: l("If this, then that", "Jos näin, niin noin"),
  summary: l("Choose between two actions with if and else.", "Valitse kahden toiminnon välillä if- ja else-rakenteella."),
  concept: l(
    md`
      An \`if\` statement runs its block only when the condition is true. \`else\` runs when it isn't:

      ~~~python
      if points >= 10:
          print("You win!")
      else:
          print("Try again")
      ~~~

      The colon \`:\` starts a block, and the indented lines belong to it. Python uses 4 spaces of indentation by convention.
    `,
    md`
      \`if\`-lause suorittaa lohkonsa vain, kun ehto on tosi. \`else\` suoritetaan, kun ehto ei ole tosi:

      ~~~python
      if points >= 10:
          print("You win!")
      else:
          print("Try again")
      ~~~

      Kaksoispiste \`:\` aloittaa lohkon, ja sisennetyt rivit kuuluvat siihen. Pythonissa sisennetään yleensä neljällä välilyönnillä.
    `,
  ),
  objectives: [
    l("Write an if / else statement", "Kirjoittaa if/else-rakenteen"),
    l("Indent code blocks correctly", "Sisentää koodilohkot oikein"),
  ],
  instructions: l(
    "Print `Warm` when `temperature` is 20 or more, and `Cool` otherwise. Print only one of the two words.",
    "Tulosta `Warm`, kun `temperature` on 20 tai enemmän, ja muuten `Cool`. Tulosta vain toinen sanoista.",
  ),
  hints: [
    l("Start with `if temperature >= 20:` and indent the line below it.", "Aloita rivillä `if temperature >= 20:` ja sisennä sen alla oleva rivi."),
    l("Add `else:` at the same level as `if`, with its own indented `print()`.", "Lisää `else:` samalle tasolle kuin `if` ja sen alle oma sisennetty `print()`."),
  ],
  tests: [
    check(
      "uses-if",
      l("The program uses an `if` statement.", "Ohjelma käyttää `if`-lausetta."),
      l("Use `if` and `else` to choose what to print.", "Valitse tulostettava teksti rakenteella `if` ja `else`."),
      `expect(len(find_nodes(ast.If, ast.IfExp)) > 0)`,
    ),
    check(
      "warm",
      l("25 degrees prints only `Warm`.", "25 astetta tulostaa vain `Warm`."),
      l("For 25 degrees the output should be just `Warm`.", "25 asteessa tulosteen pitää olla pelkkä `Warm`."),
      `expect_equal(run(temperature=25).lines, ["Warm"])`,
    ),
    check(
      "boundary",
      l("Exactly 20 degrees prints `Warm`.", "Tasan 20 astetta tulostaa `Warm`."),
      l(
        "At exactly 20 degrees the output should be `Warm`. Check whether you used `>` or `>=`.",
        "Tasan 20 asteessa tulosteen pitää olla `Warm`. Tarkista, käytitkö operaattoria `>` vai `>=`.",
      ),
      `expect_equal(run(temperature=20).lines, ["Warm"])`,
    ),
    check(
      "cool",
      l("5 degrees prints only `Cool`.", "5 astetta tulostaa vain `Cool`."),
      l("For 5 degrees the output should be just `Cool`.", "5 asteessa tulosteen pitää olla pelkkä `Cool`."),
      `expect_equal(run(temperature=5).lines, ["Cool"])`,
    ),
  ],
  starter: "temperature = 22\n\n# Write your code below this line.\n",
});

export const pyGradeLetters = pyChallenge({
  id: "py-grade-letters",
  chapterId: "py-conditions",
  minutes: 6,
  title: l("Grade calculator", "Arvosanalaskuri"),
  summary: l("Choose between many options with elif.", "Valitse monen vaihtoehdon välillä elif-rakenteella."),
  concept: l(
    md`
      \`elif\` ("else if") adds more conditions. Python checks them from top to bottom and runs only the **first** block whose condition is true:

      ~~~python
      if speed > 120:
          label = "very fast"
      elif speed > 80:
          label = "fast"
      else:
          label = "calm"
      ~~~

      Because only the first match runs, the order of the conditions matters.
    `,
    md`
      \`elif\` (”else if”) lisää ehtoja. Python tarkistaa ne ylhäältä alaspäin ja suorittaa vain **ensimmäisen** lohkon, jonka ehto on tosi:

      ~~~python
      if speed > 120:
          label = "very fast"
      elif speed > 80:
          label = "fast"
      else:
          label = "calm"
      ~~~

      Koska vain ensimmäinen osuma suoritetaan, ehtojen järjestyksellä on väliä.
    `,
  ),
  objectives: [
    l("Write if / elif / else chains", "Kirjoittaa if/elif/else-ketjuja"),
    l("Order conditions correctly", "Järjestää ehdot oikein"),
  ],
  instructions: l(
    md`
      Turn an exam \`score\` (0–100) into a letter in the variable \`grade\`:

      - 90 or more: \`"A"\`
      - 75–89: \`"B"\`
      - 50–74: \`"C"\`
      - below 50: \`"F"\`
    `,
    md`
      Muunna kokeen pistemäärä \`score\` (0–100) kirjaimeksi muuttujaan \`grade\`:

      - 90 tai enemmän: \`"A"\`
      - 75–89: \`"B"\`
      - 50–74: \`"C"\`
      - alle 50: \`"F"\`
    `,
  ),
  hints: [
    l("Start from the highest grade: `if score >= 90:`.", "Aloita korkeimmasta arvosanasta: `if score >= 90:`."),
    l(
      "Then `elif score >= 75:`, `elif score >= 50:` and finally `else:` for `\"F\"`.",
      "Sitten `elif score >= 75:`, `elif score >= 50:` ja lopuksi `else:` arvosanalle `\"F\"`.",
    ),
  ],
  tests: [
    check(
      "grade-a",
      l("Scores of 90 and above get `\"A\"`.", "Vähintään 90 pistettä antaa arvosanan `\"A\"`."),
      l("Scores 95 and 90 should give `\"A\"`.", "Pistemäärien 95 ja 90 pitää antaa `\"A\"`."),
      code`
        for score in [95, 90]:
            expect_equal(run(score=score).var("grade"), "A")
      `,
    ),
    check(
      "grade-b",
      l("Scores 75–89 get `\"B\"`.", "Pistemäärät 75–89 antavat arvosanan `\"B\"`."),
      l(
        "Scores 89 and 75 should give `\"B\"`. If they got `\"C\"`, check the order of your conditions.",
        "Pistemäärien 89 ja 75 pitää antaa `\"B\"`. Jos tulos oli `\"C\"`, tarkista ehtojen järjestys.",
      ),
      code`
        for score in [89, 75]:
            expect_equal(run(score=score).var("grade"), "B")
      `,
    ),
    check(
      "grade-c",
      l("Scores 50–74 get `\"C\"`.", "Pistemäärät 50–74 antavat arvosanan `\"C\"`."),
      l("Scores 74 and 50 should give `\"C\"`.", "Pistemäärien 74 ja 50 pitää antaa `\"C\"`."),
      code`
        for score in [74, 50]:
            expect_equal(run(score=score).var("grade"), "C")
      `,
    ),
    check(
      "grade-f",
      l("Scores below 50 get `\"F\"`.", "Alle 50 pistettä antaa arvosanan `\"F\"`."),
      l("Scores 49 and 0 should give `\"F\"`.", "Pistemäärien 49 ja 0 pitää antaa `\"F\"`."),
      code`
        for score in [49, 0]:
            expect_equal(run(score=score).var("grade"), "F")
      `,
    ),
  ],
  starter: "score = 72\n\n# Write your code below this line.\n",
});
