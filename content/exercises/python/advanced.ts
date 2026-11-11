import { check, l, pyChallenge, pyLab } from "@/lib/content/factories";
import { code, md } from "@/lib/content/md";

/* ------------------------------------------------------------------ */
/* Comprehensions and sorting                                          */
/* ------------------------------------------------------------------ */

export const pyCleanTags = pyChallenge({
  id: "py-clean-tags",
  chapterId: "py-comprehensions",
  minutes: 6,
  title: l("Cleaning tags", "Tunnisteiden siivous"),
  summary: l("Build a cleaned list with a list comprehension.", "Rakenna siistitty lista listakoosteella."),
  concept: l(
    md`
      A **list comprehension** builds a new list from another one in a single expression. It reads like a sentence: *"this value, for each item, if a condition holds"*.

      ~~~python
      prices = [4.0, 0, 12.5, 0]
      paid = [price * 1.24 for price in prices if price > 0]
      ~~~

      It is the same as a loop that appends to an empty list, but shorter and harder to get wrong. The original list is not changed.
    `,
    md`
      **Listakooste** (list comprehension) rakentaa uuden listan toisesta yhdellä lausekkeella. Se luetaan kuin lause: *"tämä arvo jokaiselle alkiolle, jos ehto pätee"*.

      ~~~python
      prices = [4.0, 0, 12.5, 0]
      paid = [price * 1.24 for price in prices if price > 0]
      ~~~

      Se tekee saman kuin silmukka, joka lisää alkioita tyhjään listaan, mutta lyhyemmin ja pienemmällä virheriskillä. Alkuperäinen lista ei muutu.
    `,
  ),
  objectives: [
    l("Transform items with a list comprehension", "Muuntaa alkioita listakoosteella"),
    l("Filter items with an `if` clause", "Suodattaa alkioita `if`-osalla"),
  ],
  instructions: l(
    "Write `clean_tags(tags)` that returns a new list where every tag is stripped of surrounding spaces and in lowercase. Leave out tags that are empty after stripping. Keep the original order. Use a list comprehension.",
    "Kirjoita funktio `clean_tags(tags)`, joka palauttaa uuden listan, jossa jokaisesta tunnisteesta on poistettu ympäröivät välilyönnit ja joka on pienillä kirjaimilla. Jätä pois tunnisteet, jotka ovat siistimisen jälkeen tyhjiä. Säilytä alkuperäinen järjestys. Käytä listakoostetta.",
  ),
  hints: [
    l("The shape is `[... for tag in tags if ...]`.", "Rakenne on `[... for tag in tags if ...]`."),
    l(
      "`return [tag.strip().lower() for tag in tags if tag.strip()]` — an empty string counts as false.",
      "`return [tag.strip().lower() for tag in tags if tag.strip()]` — tyhjä merkkijono on epätosi.",
    ),
  ],
  tests: [
    check(
      "is-function",
      l("`clean_tags` is a function.", "`clean_tags` on funktio."),
      l("Define a function named `clean_tags`.", "Määrittele funktio nimeltä `clean_tags`."),
      `expect(callable(var("clean_tags")))`,
    ),
    check(
      "cleans",
      l("Tags are stripped and lowercased.", "Tunnisteet siistitään ja muutetaan pieniksi kirjaimiksi."),
      l("Use `tag.strip().lower()` for each tag.", "Käytä jokaiselle tunnisteelle `tag.strip().lower()`."),
      `expect_equal(var("clean_tags")([" Python", "WEB ", "Data"]), ["python", "web", "data"])`,
    ),
    check(
      "drops-empty",
      l("Empty and space-only tags are left out.", "Tyhjät ja pelkistä välilyönneistä koostuvat tunnisteet jätetään pois."),
      l(
        "Add a condition: keep a tag only if `tag.strip()` is not empty.",
        "Lisää ehto: säilytä tunniste vain, jos `tag.strip()` ei ole tyhjä.",
      ),
      `expect_equal(var("clean_tags")(["ok", "", "   ", " Fine "]), ["ok", "fine"])`,
    ),
    check(
      "empty-list",
      l("An empty list gives an empty list.", "Tyhjä lista antaa tyhjän listan."),
      l("`clean_tags([])` should return `[]`.", "`clean_tags([])` pitää palauttaa `[]`."),
      `expect_equal(var("clean_tags")([]), [])`,
    ),
    check(
      "no-mutation",
      l("The original list is not changed.", "Alkuperäinen lista ei muutu."),
      l("Build a new list instead of changing `tags`.", "Rakenna uusi lista sen sijaan, että muuttaisit listaa `tags`."),
      code`
        tags = [" A ", ""]
        var("clean_tags")(tags)
        expect_equal(tags, [" A ", ""])
      `,
    ),
    check(
      "comprehension",
      l("The function uses a list comprehension.", "Funktio käyttää listakoostetta."),
      l(
        "This chapter practises comprehensions: write the result as `[... for tag in tags if ...]`.",
        "Tässä luvussa harjoitellaan koosteita: kirjoita tulos muotoon `[... for tag in tags if ...]`.",
      ),
      `expect(len(find_nodes(ast.ListComp)) > 0)`,
    ),
  ],
  starter: code`
    def clean_tags(tags):
        # Return a new, cleaned list.
        return tags
  `,
});

export const pyStockAlerts = pyChallenge({
  id: "py-stock-alerts",
  chapterId: "py-comprehensions",
  minutes: 7,
  title: l("Low-stock alerts", "Varastohälytykset"),
  summary: l("Filter a dictionary with a dictionary comprehension.", "Suodata sanakirja sanakirjakoosteella."),
  concept: l(
    md`
      A **dictionary comprehension** works like a list comprehension but produces key–value pairs. Loop over \`.items()\` to get both:

      ~~~python
      temperatures = {"Oulu": -4, "Turku": 3, "Inari": -15}
      freezing = {city: value for city, value in temperatures.items() if value < 0}
      # {"Oulu": -4, "Inari": -15}
      ~~~
    `,
    md`
      **Sanakirjakooste** toimii kuten listakooste, mutta tuottaa avain–arvo-pareja. Käy läpi \`.items()\`, niin saat molemmat:

      ~~~python
      temperatures = {"Oulu": -4, "Turku": 3, "Inari": -15}
      freezing = {city: value for city, value in temperatures.items() if value < 0}
      # {"Oulu": -4, "Inari": -15}
      ~~~
    `,
  ),
  objectives: [
    l("Loop over `.items()`", "Käydä läpi `.items()`"),
    l("Build a filtered dictionary", "Rakentaa suodatetun sanakirjan"),
  ],
  instructions: l(
    "Write `low_stock(stock, threshold)` that returns a new dictionary with only the products whose quantity is **below** `threshold`. `stock` maps product names to quantities. Use a dictionary comprehension.",
    "Kirjoita funktio `low_stock(stock, threshold)`, joka palauttaa uuden sanakirjan, jossa on vain tuotteet, joiden määrä on **alle** `threshold`. `stock` liittää tuotenimet määriin. Käytä sanakirjakoostetta.",
  ),
  hints: [
    l("Start with `{name: qty for name, qty in stock.items() ...}`.", "Aloita muodosta `{name: qty for name, qty in stock.items() ...}`."),
    l("Add `if qty < threshold` at the end.", "Lisää loppuun `if qty < threshold`."),
  ],
  tests: [
    check(
      "is-function",
      l("`low_stock` is a function.", "`low_stock` on funktio."),
      l("Define a function named `low_stock`.", "Määrittele funktio nimeltä `low_stock`."),
      `expect(callable(var("low_stock")))`,
    ),
    check(
      "filters",
      l("Only products below the threshold are returned.", "Vain kynnyksen alittavat tuotteet palautetaan."),
      l("Keep a product when `qty < threshold`.", "Säilytä tuote, kun `qty < threshold`."),
      `expect_equal(var("low_stock")({"milk": 2, "eggs": 12, "bread": 0}, 3), {"milk": 2, "bread": 0})`,
    ),
    check(
      "boundary",
      l("A quantity equal to the threshold is not low.", "Kynnyksen suuruinen määrä ei ole vähissä."),
      l("Use `<`, not `<=`: exactly `threshold` items is enough.", "Käytä vertailua `<`, ei `<=`: tasan `threshold` kappaletta riittää."),
      `expect_equal(var("low_stock")({"tea": 5, "jam": 4}, 5), {"jam": 4})`,
    ),
    check(
      "empty",
      l("An empty stock gives `{}`.", "Tyhjä varasto antaa `{}`."),
      l("`low_stock({}, 3)` should return an empty dictionary.", "`low_stock({}, 3)` pitää palauttaa tyhjä sanakirja."),
      `expect_equal(var("low_stock")({}, 3), {})`,
    ),
    check(
      "no-mutation",
      l("The original dictionary is not changed.", "Alkuperäinen sanakirja ei muutu."),
      l("Don't delete keys from `stock`; build a new dictionary.", "Älä poista avaimia sanakirjasta `stock`; rakenna uusi sanakirja."),
      code`
        stock = {"a": 1, "b": 9}
        var("low_stock")(stock, 5)
        expect_equal(stock, {"a": 1, "b": 9})
      `,
    ),
    check(
      "comprehension",
      l("The function uses a dictionary comprehension.", "Funktio käyttää sanakirjakoostetta."),
      l(
        "This chapter practises comprehensions: write the result as `{name: qty for ... in stock.items() if ...}`.",
        "Tässä luvussa harjoitellaan koosteita: kirjoita tulos muotoon `{name: qty for ... in stock.items() if ...}`.",
      ),
      `expect(len(find_nodes(ast.DictComp)) > 0)`,
    ),
  ],
  starter: code`
    def low_stock(stock, threshold):
        # Return only the products below the threshold.
        return {}
  `,
});

export const pyTopScores = pyChallenge({
  id: "py-top-scores",
  chapterId: "py-comprehensions",
  minutes: 9,
  title: l("Leaderboard", "Tulostaulukko"),
  summary: l("Sort records with a key function and pick the best ones.", "Lajittele tietueita avainfunktiolla ja valitse parhaat."),
  concept: l(
    md`
      \`sorted(items, key=...)\` returns a **new** sorted list. The \`key\` function says what to compare. A \`lambda\` is a short, unnamed function:

      ~~~python
      people = [{"name": "Ada", "age": 36}, {"name": "Linus", "age": 21}]
      youngest_first = sorted(people, key=lambda person: person["age"])
      ~~~

      To sort by several things, return a **tuple**: Python compares the first values, and only uses the second when the first are equal. Negating a number reverses its order: \`key=lambda p: (-p["score"], p["name"])\` means highest score first, then alphabetical.

      \`list.sort()\` sorts **in place** and changes the original list, so prefer \`sorted()\` when the caller still needs the original.
    `,
    md`
      \`sorted(items, key=...)\` palauttaa **uuden** lajitellun listan. \`key\`-funktio kertoo, mitä verrataan. \`lambda\` on lyhyt, nimetön funktio:

      ~~~python
      people = [{"name": "Ada", "age": 36}, {"name": "Linus", "age": 21}]
      youngest_first = sorted(people, key=lambda person: person["age"])
      ~~~

      Jos lajittelet usean asian mukaan, palauta **monikko** (tuple): Python vertaa ensin ensimmäisiä arvoja ja käyttää toista vain, kun ensimmäiset ovat samat. Luvun vastaluku kääntää järjestyksen: \`key=lambda p: (-p["score"], p["name"])\` tarkoittaa suurin pistemäärä ensin, sitten aakkosjärjestys.

      \`list.sort()\` lajittelee **paikallaan** ja muuttaa alkuperäistä listaa, joten käytä mieluummin \`sorted()\`-funktiota, kun alkuperäistä listaa vielä tarvitaan.
    `,
  ),
  objectives: [
    l("Sort with `sorted()` and a `key` function", "Lajitella funktiolla `sorted()` ja `key`-funktiolla"),
    l("Break ties with a tuple key", "Ratkaista tasapelit monikkoavaimella"),
    l("Return the first `n` results with slicing", "Palauttaa `n` ensimmäistä tulosta viipaloinnilla"),
  ],
  instructions: l(
    md`
      Write \`top_players(results, n)\`. \`results\` is a list of dictionaries such as \`{"name": "Ada", "score": 42}\`. Return a list with the **names** of the \`n\` best players, highest score first. Players with the same score are listed alphabetically. Don't change \`results\`.
    `,
    md`
      Kirjoita funktio \`top_players(results, n)\`. \`results\` on lista sanakirjoja, kuten \`{"name": "Ada", "score": 42}\`. Palauta lista \`n\` parhaan pelaajan **nimistä** suurimmasta pistemäärästä alkaen. Saman pistemäärän pelaajat luetellaan aakkosjärjestyksessä. Älä muuta listaa \`results\`.
    `,
  ),
  hints: [
    l(
      "`ranked = sorted(results, key=lambda r: (-r[\"score\"], r[\"name\"]))`",
      "`ranked = sorted(results, key=lambda r: (-r[\"score\"], r[\"name\"]))`",
    ),
    l(
      "Then `return [r[\"name\"] for r in ranked[:n]]`.",
      "Sitten `return [r[\"name\"] for r in ranked[:n]]`.",
    ),
  ],
  tests: [
    check(
      "is-function",
      l("`top_players` is a function.", "`top_players` on funktio."),
      l("Define a function named `top_players`.", "Määrittele funktio nimeltä `top_players`."),
      `expect(callable(var("top_players")))`,
    ),
    check(
      "best-first",
      l("The best players come first.", "Parhaat pelaajat tulevat ensin."),
      l(
        "Sort by score from highest to lowest and return names only.",
        "Lajittele pistemäärän mukaan suurimmasta pienimpään ja palauta pelkät nimet.",
      ),
      code`
        results = [{"name": "Ada", "score": 30}, {"name": "Linus", "score": 50}, {"name": "Grace", "score": 40}]
        expect_equal(var("top_players")(results, 2), ["Linus", "Grace"])
      `,
    ),
    check(
      "ties",
      l("Equal scores are ordered alphabetically.", "Samat pistemäärät järjestetään aakkosjärjestykseen."),
      l(
        "Use a tuple key so names decide when scores are equal: `(-r[\"score\"], r[\"name\"])`.",
        "Käytä monikkoavainta, jotta nimet ratkaisevat tasapelit: `(-r[\"score\"], r[\"name\"])`.",
      ),
      code`
        results = [{"name": "Mia", "score": 10}, {"name": "Eli", "score": 10}, {"name": "Ola", "score": 20}]
        expect_equal(var("top_players")(results, 3), ["Ola", "Eli", "Mia"])
      `,
    ),
    check(
      "short-list",
      l("Asking for more players than exist returns everyone.", "Jos pyydetään enemmän pelaajia kuin on, palautetaan kaikki."),
      l("Slicing with `[:n]` works even when `n` is larger than the list.", "Viipalointi `[:n]` toimii, vaikka `n` olisi listaa suurempi."),
      `expect_equal(var("top_players")([{"name": "Ada", "score": 1}], 5), ["Ada"])`,
    ),
    check(
      "no-mutation",
      l("`results` keeps its original order.", "`results` säilyttää alkuperäisen järjestyksensä."),
      l("Use `sorted(...)` instead of `results.sort(...)`.", "Käytä `sorted(...)`-funktiota metodin `results.sort(...)` sijaan."),
      code`
        results = [{"name": "B", "score": 1}, {"name": "A", "score": 2}]
        var("top_players")(results, 1)
        expect_equal([r["name"] for r in results], ["B", "A"])
      `,
    ),
  ],
  starter: code`
    def top_players(results, n):
        # Return the names of the n best players.
        return []
  `,
});

/* ------------------------------------------------------------------ */
/* Exceptions and validation                                           */
/* ------------------------------------------------------------------ */

export const pyParseQuantity = pyChallenge({
  id: "py-parse-quantity",
  chapterId: "py-errors",
  minutes: 7,
  title: l("Reading a quantity safely", "Määrän turvallinen lukeminen"),
  summary: l("Turn text into a number without crashing on bad input.", "Muunna teksti luvuksi kaatumatta virheelliseen syötteeseen."),
  concept: l(
    md`
      Converting user input can fail: \`int("12a")\` raises a \`ValueError\`. An **exception** stops the program unless you catch it with \`try\`/\`except\`:

      ~~~python
      try:
          age = int(answer)
      except ValueError:
          age = None
      ~~~

      Catch only the error you expect (\`ValueError\` here). A bare \`except:\` would also hide real bugs.
    `,
    md`
      Käyttäjän syötteen muuntaminen voi epäonnistua: \`int("12a")\` nostaa poikkeuksen \`ValueError\`. **Poikkeus** pysäyttää ohjelman, ellei sitä oteta kiinni rakenteella \`try\`/\`except\`:

      ~~~python
      try:
          age = int(answer)
      except ValueError:
          age = None
      ~~~

      Ota kiinni vain odottamasi virhe (tässä \`ValueError\`). Pelkkä \`except:\` piilottaisi myös oikeat bugit.
    `,
  ),
  objectives: [
    l("Catch a `ValueError` with `try`/`except`", "Ottaa kiinni `ValueError`-poikkeuksen rakenteella `try`/`except`"),
    l("Return a clear value for invalid input", "Palauttaa selkeän arvon virheelliselle syötteelle"),
  ],
  instructions: l(
    "Write `parse_quantity(text)`. Return the whole number in `text` (surrounding spaces are fine). Return `None` if the text is not a whole number or if the number is negative.",
    "Kirjoita funktio `parse_quantity(text)`. Palauta merkkijonon `text` kokonaisluku (ympäröivät välilyönnit sallitaan). Palauta `None`, jos teksti ei ole kokonaisluku tai jos luku on negatiivinen.",
  ),
  hints: [
    l("`int(\" 7 \")` is `7`, but `int(\"3.5\")` and `int(\"\")` raise `ValueError`.", "`int(\" 7 \")` on `7`, mutta `int(\"3.5\")` ja `int(\"\")` nostavat `ValueError`-poikkeuksen."),
    l(
      "Put `number = int(text)` inside `try:`, return `None` in `except ValueError:`, then check `number < 0`.",
      "Laita `number = int(text)` lohkoon `try:`, palauta `None` lohkossa `except ValueError:` ja tarkista sitten `number < 0`.",
    ),
  ],
  tests: [
    check(
      "is-function",
      l("`parse_quantity` is a function.", "`parse_quantity` on funktio."),
      l("Define a function named `parse_quantity`.", "Määrittele funktio nimeltä `parse_quantity`."),
      `expect(callable(var("parse_quantity")))`,
    ),
    check(
      "valid",
      l("`\"12\"` gives `12` and `\" 7 \"` gives `7`.", "`\"12\"` antaa `12` ja `\" 7 \"` antaa `7`."),
      l("Convert the text with `int(...)`.", "Muunna teksti funktiolla `int(...)`."),
      code`
        expect_equal(var("parse_quantity")("12"), 12)
        expect_equal(var("parse_quantity")(" 7 "), 7)
      `,
    ),
    check(
      "zero",
      l("`\"0\"` gives `0`.", "`\"0\"` antaa `0`."),
      l("Zero is a valid quantity. Check `number < 0`, not `number <= 0`.", "Nolla on kelvollinen määrä. Tarkista `number < 0`, ei `number <= 0`."),
      `expect_equal(var("parse_quantity")("0"), 0)`,
    ),
    check(
      "letters",
      l("Text that is not a number gives `None`.", "Teksti, joka ei ole luku, antaa `None`."),
      l(
        "`int(\"abc\")` raises `ValueError`. Catch it and return `None`.",
        "`int(\"abc\")` nostaa poikkeuksen `ValueError`. Ota se kiinni ja palauta `None`.",
      ),
      code`
        expect_equal(var("parse_quantity")("abc"), None)
        expect_equal(var("parse_quantity")(""), None)
      `,
    ),
    check(
      "decimal",
      l("A decimal such as `\"3.5\"` gives `None`.", "Desimaaliluku, kuten `\"3.5\"`, antaa `None`."),
      l("Only whole numbers are quantities. Don't round decimals.", "Vain kokonaisluvut ovat määriä. Älä pyöristä desimaalilukuja."),
      `expect_equal(var("parse_quantity")("3.5"), None)`,
    ),
    check(
      "negative",
      l("A negative number gives `None`.", "Negatiivinen luku antaa `None`."),
      l("Return `None` when the number is below zero.", "Palauta `None`, kun luku on alle nollan."),
      `expect_equal(var("parse_quantity")("-2"), None)`,
    ),
  ],
  starter: code`
    def parse_quantity(text):
        return int(text)
  `,
});

export const pyValidUsername = pyChallenge({
  id: "py-valid-username",
  chapterId: "py-errors",
  minutes: 8,
  title: l("Rejecting bad usernames", "Virheellisten käyttäjänimien hylkääminen"),
  summary: l("Raise a `ValueError` with a helpful message.", "Nosta `ValueError` hyödyllisellä viestillä."),
  concept: l(
    md`
      Your own functions can refuse invalid input by **raising** an exception. The caller then decides how to handle it:

      ~~~python
      def set_volume(level):
          if not 0 <= level <= 10:
              raise ValueError("Volume must be between 0 and 10")
          return level
      ~~~

      A good error message says what was wrong and what is allowed. Raising is better than returning a "magic" value, because a mistake cannot go unnoticed.
    `,
    md`
      Omat funktiosi voivat torjua virheellisen syötteen **nostamalla** poikkeuksen. Kutsuja päättää, miten se käsitellään:

      ~~~python
      def set_volume(level):
          if not 0 <= level <= 10:
              raise ValueError("Volume must be between 0 and 10")
          return level
      ~~~

      Hyvä virheviesti kertoo, mikä oli vialla ja mikä on sallittua. Poikkeuksen nostaminen on parempi kuin "taikuusarvon" palauttaminen, koska virhe ei voi jäädä huomaamatta.
    `,
  ),
  objectives: [
    l("Raise a `ValueError` with a message", "Nostaa `ValueError`-poikkeuksen viestin kanssa"),
    l("Validate input before using it", "Tarkistaa syötteen ennen sen käyttämistä"),
  ],
  instructions: l(
    md`
      Write \`make_username(name)\`:

      - Strip surrounding spaces from \`name\`.
      - If the result is shorter than 3 characters, raise \`ValueError\` with a message that mentions \`3\`.
      - If it contains a space, raise \`ValueError\` with a message that mentions spaces (the word \`space\`).
      - Otherwise return it in lowercase.
    `,
    md`
      Kirjoita funktio \`make_username(name)\`:

      - Poista ympäröivät välilyönnit merkkijonosta \`name\`.
      - Jos tulos on alle 3 merkkiä pitkä, nosta \`ValueError\` viestillä, jossa mainitaan \`3\`.
      - Jos siinä on välilyönti, nosta \`ValueError\` viestillä, jossa mainitaan välilyönnit (englanniksi \`space\`).
      - Muuten palauta se pienillä kirjaimilla.
    `,
  ),
  hints: [
    l("`raise ValueError(\"Username must be at least 3 characters\")`", "`raise ValueError(\"Username must be at least 3 characters\")`"),
    l("Check spaces with `if \" \" in username:`.", "Tarkista välilyönnit ehdolla `if \" \" in username:`."),
  ],
  tests: [
    check(
      "is-function",
      l("`make_username` is a function.", "`make_username` on funktio."),
      l("Define a function named `make_username`.", "Määrittele funktio nimeltä `make_username`."),
      `expect(callable(var("make_username")))`,
    ),
    check(
      "valid",
      l("`\"Saku\"` becomes `\"saku\"` and `\"  Ada  \"` becomes `\"ada\"`.", "`\"Saku\"` muuttuu muotoon `\"saku\"` ja `\"  Ada  \"` muotoon `\"ada\"`."),
      l("Return the stripped name in lowercase.", "Palauta siistitty nimi pienillä kirjaimilla."),
      code`
        expect_equal(var("make_username")("Saku"), "saku")
        expect_equal(var("make_username")("  Ada  "), "ada")
      `,
    ),
    check(
      "too-short",
      l("A name shorter than 3 characters raises `ValueError` mentioning 3.", "Alle 3 merkin nimi nostaa `ValueError`-poikkeuksen, jossa mainitaan 3."),
      l(
        "`make_username(\"ab\")` must raise `ValueError` whose message contains `3`.",
        "`make_username(\"ab\")` pitää nostaa `ValueError`, jonka viestissä on `3`.",
      ),
      code`
        try:
            var("make_username")("ab")
        except ValueError as error:
            expect("3" in str(error))
        else:
            expect(False)
      `,
    ),
    check(
      "short-after-strip",
      l("Spaces don't count towards the length.", "Välilyönnit eivät kasvata pituutta."),
      l("Strip the name before checking its length.", "Siisti nimi ennen pituuden tarkistamista."),
      code`
        try:
            var("make_username")("  x  ")
        except ValueError:
            pass
        else:
            expect(False)
      `,
    ),
    check(
      "spaces",
      l("A name with a space inside raises `ValueError` mentioning spaces.", "Nimi, jonka sisällä on välilyönti, nostaa `ValueError`-poikkeuksen, jossa mainitaan välilyönnit."),
      l(
        "`make_username(\"Ada Lovelace\")` must raise `ValueError` whose message contains the word `space`.",
        "`make_username(\"Ada Lovelace\")` pitää nostaa `ValueError`, jonka viestissä on sana `space`.",
      ),
      code`
        try:
            var("make_username")("Ada Lovelace")
        except ValueError as error:
            expect("space" in str(error).lower())
        else:
            expect(False)
      `,
    ),
  ],
  starter: code`
    def make_username(name):
        return name.lower()
  `,
});

/* ------------------------------------------------------------------ */
/* Classes and objects                                                 */
/* ------------------------------------------------------------------ */

export const pyStepCounter = pyChallenge({
  id: "py-step-counter",
  chapterId: "py-classes",
  minutes: 10,
  title: l("A step counter class", "Askelmittariluokka"),
  summary: l("Define a class with state and methods.", "Määrittele luokka, jolla on tila ja metodeja."),
  concept: l(
    md`
      A **class** describes a new kind of object: what data it holds and what it can do. \`__init__\` runs when an object is created and stores data on \`self\`:

      ~~~python
      class Timer:
          def __init__(self, minutes):
              self.minutes = minutes
              self.laps = []

          def lap(self, seconds):
              self.laps.append(seconds)

      tea = Timer(4)
      tea.lap(30)
      ~~~

      Create lists inside \`__init__\` (\`self.laps = []\`). A list written directly in the class body would be **shared** by every object.
    `,
    md`
      **Luokka** kuvaa uudenlaisen olion: mitä tietoa se sisältää ja mitä se osaa tehdä. \`__init__\` suoritetaan, kun olio luodaan, ja se tallentaa tiedot muuttujaan \`self\`:

      ~~~python
      class Timer:
          def __init__(self, minutes):
              self.minutes = minutes
              self.laps = []

          def lap(self, seconds):
              self.laps.append(seconds)

      tea = Timer(4)
      tea.lap(30)
      ~~~

      Luo listat metodissa \`__init__\` (\`self.laps = []\`). Suoraan luokan runkoon kirjoitettu lista olisi **yhteinen** kaikille olioille.
    `,
  ),
  objectives: [
    l("Define a class with `__init__`", "Määritellä luokan, jolla on `__init__`"),
    l("Write methods that read and change `self`", "Kirjoittaa metodeja, jotka lukevat ja muuttavat `self`-oliota"),
    l("Keep each object's data separate", "Pitää jokaisen olion tiedot erillään"),
  ],
  instructions: l(
    md`
      Write a class \`StepCounter\`:

      - \`StepCounter(goal)\` stores \`goal\`, starts \`steps\` at \`0\` and \`log\` as an empty list.
      - \`add(amount)\` adds \`amount\` to \`steps\` and appends it to \`log\`.
      - \`remaining()\` returns how many steps are left to the goal (never below \`0\`).
      - \`reached()\` returns \`True\` when \`steps\` is at least \`goal\`.
    `,
    md`
      Kirjoita luokka \`StepCounter\`:

      - \`StepCounter(goal)\` tallentaa muuttujan \`goal\`, aloittaa muuttujan \`steps\` nollasta ja muuttujan \`log\` tyhjänä listana.
      - \`add(amount)\` lisää määrän \`amount\` muuttujaan \`steps\` ja listaan \`log\`.
      - \`remaining()\` palauttaa, montako askelta tavoitteeseen on jäljellä (ei koskaan alle \`0\`).
      - \`reached()\` palauttaa \`True\`, kun \`steps\` on vähintään \`goal\`.
    `,
  ),
  hints: [
    l(
      "In `__init__`: `self.goal = goal`, `self.steps = 0`, `self.log = []`.",
      "Metodissa `__init__`: `self.goal = goal`, `self.steps = 0`, `self.log = []`.",
    ),
    l("`remaining` can return `max(self.goal - self.steps, 0)`.", "`remaining` voi palauttaa `max(self.goal - self.steps, 0)`."),
  ],
  tests: [
    check(
      "is-class",
      l("`StepCounter` is a class.", "`StepCounter` on luokka."),
      l("Define it with `class StepCounter:`.", "Määrittele se rivillä `class StepCounter:`."),
      `expect(isinstance(var("StepCounter"), type))`,
    ),
    check(
      "init",
      l("A new counter has `steps == 0`, its `goal` and an empty `log`.", "Uudella mittarilla on `steps == 0`, sen `goal` ja tyhjä `log`."),
      l("Store `goal`, `steps = 0` and `log = []` on `self` in `__init__`.", "Tallenna metodissa `__init__` muuttujaan `self` arvot `goal`, `steps = 0` ja `log = []`."),
      code`
        counter = var("StepCounter")(5000)
        expect_equal(counter.goal, 5000)
        expect_equal(counter.steps, 0)
        expect_equal(counter.log, [])
      `,
    ),
    check(
      "add",
      l("`add` increases `steps` and records the amount in `log`.", "`add` kasvattaa muuttujaa `steps` ja kirjaa määrän listaan `log`."),
      l("In `add`, do `self.steps += amount` and `self.log.append(amount)`.", "Tee metodissa `add` `self.steps += amount` ja `self.log.append(amount)`."),
      code`
        counter = var("StepCounter")(1000)
        counter.add(300)
        counter.add(450)
        expect_equal(counter.steps, 750)
        expect_equal(counter.log, [300, 450])
      `,
    ),
    check(
      "remaining",
      l("`remaining()` counts down and stops at 0.", "`remaining()` laskee alaspäin ja pysähtyy nollaan."),
      l("Return `goal - steps`, but never less than `0`.", "Palauta `goal - steps`, mutta ei koskaan alle `0`."),
      code`
        counter = var("StepCounter")(1000)
        counter.add(400)
        expect_equal(counter.remaining(), 600)
        counter.add(900)
        expect_equal(counter.remaining(), 0)
      `,
    ),
    check(
      "reached",
      l("`reached()` is `True` exactly when the goal is met.", "`reached()` on `True` täsmälleen silloin, kun tavoite täyttyy."),
      l("Return `self.steps >= self.goal`.", "Palauta `self.steps >= self.goal`."),
      code`
        counter = var("StepCounter")(100)
        counter.add(99)
        expect_equal(counter.reached(), False)
        counter.add(1)
        expect_equal(counter.reached(), True)
      `,
    ),
    check(
      "separate",
      l("Two counters don't share their data.", "Kaksi mittaria eivät jaa tietojaan."),
      l(
        "Create `log` inside `__init__` with `self.log = []`, not in the class body.",
        "Luo `log` metodissa `__init__` rivillä `self.log = []`, ei luokan rungossa.",
      ),
      code`
        first = var("StepCounter")(10)
        second = var("StepCounter")(10)
        first.add(5)
        expect_equal(second.log, [])
        expect_equal(second.steps, 0)
      `,
    ),
  ],
  starter: code`
    class StepCounter:
        def __init__(self, goal):
            pass
  `,
});

export const pyLibraryShelfLab = pyLab({
  id: "py-library-shelf-lab",
  chapterId: "py-classes",
  minutes: 20,
  title: l("Lab: Library shelf", "Harjoitustyö: Kirjahylly"),
  summary: l(
    "Model a small library shelf with copies you can borrow and return.",
    "Mallinna pieni kirjahylly, jonka kirjoja voi lainata ja palauttaa.",
  ),
  concept: l(
    md`
      Real programs keep **state** that changes over time. A class keeps that state together with the rules for changing it, so the rest of the program cannot break those rules by accident.

      A dictionary is a good fit for counts per name:

      ~~~python
      self.copies = {}            # title -> number of copies
      self.copies[title] = self.copies.get(title, 0) + 1
      ~~~

      Methods that may fail (like borrowing a book that is out) can return \`True\` or \`False\` so the caller knows what happened.
    `,
    md`
      Oikeat ohjelmat säilyttävät **tilaa**, joka muuttuu ajan mittaan. Luokka pitää tilan ja sen muuttamisen säännöt yhdessä, jotta muu ohjelma ei voi rikkoa sääntöjä vahingossa.

      Sanakirja sopii hyvin nimikohtaisiin määriin:

      ~~~python
      self.copies = {}            # nimi -> kappaleiden määrä
      self.copies[title] = self.copies.get(title, 0) + 1
      ~~~

      Metodit, jotka voivat epäonnistua (kuten lainassa olevan kirjan lainaaminen), voivat palauttaa \`True\` tai \`False\`, jotta kutsuja tietää, mitä tapahtui.
    `,
  ),
  objectives: [
    l("Design a class with several methods", "Suunnitella luokan, jolla on useita metodeja"),
    l("Keep counts in a dictionary", "Pitää määriä sanakirjassa"),
    l("Report success or failure with booleans", "Kertoa onnistumisesta tai epäonnistumisesta totuusarvoilla"),
  ],
  requirements: [
    l("`Shelf()` starts empty.", "`Shelf()` on aluksi tyhjä."),
    l("`add(title)` adds one copy. The same title can have several copies.", "`add(title)` lisää yhden kappaleen. Samaa kirjaa voi olla useampi kappale."),
    l(
      "`borrow(title)` lends one available copy and returns `True`, or returns `False` if no copy is available.",
      "`borrow(title)` lainaa yhden vapaan kappaleen ja palauttaa `True`, tai palauttaa `False`, jos vapaata kappaletta ei ole.",
    ),
    l(
      "`give_back(title)` returns a borrowed copy and returns `True`, or `False` if no copy of it is borrowed.",
      "`give_back(title)` palauttaa lainatun kappaleen ja palauttaa `True`, tai `False`, jos kirjaa ei ole lainassa.",
    ),
    l(
      "`available()` returns an alphabetical list of titles with at least one copy on the shelf.",
      "`available()` palauttaa aakkosjärjestetyn listan kirjoista, joista vähintään yksi kappale on hyllyssä.",
    ),
  ],
  instructions: l(
    "Write a class `Shelf` that meets the requirements. Each shelf keeps its own books.",
    "Kirjoita vaatimukset täyttävä luokka `Shelf`. Jokaisella hyllyllä on omat kirjansa.",
  ),
  hints: [
    l(
      "Keep two dictionaries: `self.copies` (all copies per title) and `self.borrowed` (borrowed copies per title).",
      "Pidä kahta sanakirjaa: `self.copies` (kaikki kappaleet kirjoittain) ja `self.borrowed` (lainatut kappaleet kirjoittain).",
    ),
    l(
      "A title is available when `self.copies.get(title, 0) - self.borrowed.get(title, 0) > 0`.",
      "Kirja on saatavilla, kun `self.copies.get(title, 0) - self.borrowed.get(title, 0) > 0`.",
    ),
    l(
      "`available()` can be `sorted(title for title in self.copies if ...)`.",
      "`available()` voi olla `sorted(title for title in self.copies if ...)`.",
    ),
  ],
  tests: [
    check(
      "is-class",
      l("`Shelf` is a class.", "`Shelf` on luokka."),
      l("Define it with `class Shelf:`.", "Määrittele se rivillä `class Shelf:`."),
      `expect(isinstance(var("Shelf"), type))`,
    ),
    check(
      "add-available",
      l("Added books are available, alphabetically.", "Lisätyt kirjat ovat saatavilla aakkosjärjestyksessä."),
      l("`available()` should list added titles with `sorted(...)`.", "`available()` pitää listata lisätyt kirjat funktiolla `sorted(...)`."),
      code`
        shelf = var("Shelf")()
        expect_equal(shelf.available(), [])
        shelf.add("Moomin")
        shelf.add("Kalevala")
        expect_equal(shelf.available(), ["Kalevala", "Moomin"])
      `,
    ),
    check(
      "borrow",
      l("Borrowing the only copy succeeds and removes it from the shelf.", "Ainoan kappaleen lainaaminen onnistuu ja poistaa sen hyllystä."),
      l("`borrow` should return `True` and the title should no longer be available.", "`borrow` pitää palauttaa `True`, eikä kirja saa enää olla saatavilla."),
      code`
        shelf = var("Shelf")()
        shelf.add("Moomin")
        expect_equal(shelf.borrow("Moomin"), True)
        expect_equal(shelf.available(), [])
      `,
    ),
    check(
      "borrow-unavailable",
      l("Borrowing a missing or already borrowed book returns `False`.", "Puuttuvan tai jo lainatun kirjan lainaaminen palauttaa `False`."),
      l("Return `False` when there is no free copy, without changing anything.", "Palauta `False`, kun vapaata kappaletta ei ole, muuttamatta mitään."),
      code`
        shelf = var("Shelf")()
        expect_equal(shelf.borrow("Unknown"), False)
        shelf.add("Moomin")
        shelf.borrow("Moomin")
        expect_equal(shelf.borrow("Moomin"), False)
      `,
    ),
    check(
      "copies",
      l("With two copies, one can be borrowed and the title is still available.", "Kahdesta kappaleesta voi lainata yhden, ja kirja on yhä saatavilla."),
      l("Count copies per title instead of storing each title once.", "Laske kappaleet kirjoittain sen sijaan, että tallentaisit jokaisen kirjan kerran."),
      code`
        shelf = var("Shelf")()
        shelf.add("Kalevala")
        shelf.add("Kalevala")
        expect_equal(shelf.borrow("Kalevala"), True)
        expect_equal(shelf.available(), ["Kalevala"])
        expect_equal(shelf.borrow("Kalevala"), True)
        expect_equal(shelf.available(), [])
      `,
    ),
    check(
      "give-back",
      l("Returning a borrowed book makes it available again.", "Lainatun kirjan palauttaminen tekee siitä taas saatavilla olevan."),
      l("`give_back` should return `True` and put the copy back on the shelf.", "`give_back` pitää palauttaa `True` ja laittaa kappale takaisin hyllyyn."),
      code`
        shelf = var("Shelf")()
        shelf.add("Moomin")
        shelf.borrow("Moomin")
        expect_equal(shelf.give_back("Moomin"), True)
        expect_equal(shelf.available(), ["Moomin"])
      `,
    ),
    check(
      "give-back-invalid",
      l("Returning a book that isn't borrowed returns `False`.", "Lainaamattoman kirjan palauttaminen palauttaa `False`."),
      l(
        "Only borrowed copies can be returned; otherwise return `False` and change nothing.",
        "Vain lainattuja kappaleita voi palauttaa; muuten palauta `False` äläkä muuta mitään.",
      ),
      code`
        shelf = var("Shelf")()
        shelf.add("Moomin")
        expect_equal(shelf.give_back("Moomin"), False)
        expect_equal(shelf.give_back("Unknown"), False)
        expect_equal(shelf.borrow("Moomin"), True)
        expect_equal(shelf.borrow("Moomin"), False)
      `,
    ),
    check(
      "separate",
      l("Two shelves keep their own books.", "Kahdella hyllyllä on omat kirjansa."),
      l("Create your dictionaries in `__init__`, not in the class body.", "Luo sanakirjat metodissa `__init__`, ei luokan rungossa."),
      code`
        first = var("Shelf")()
        second = var("Shelf")()
        first.add("Moomin")
        expect_equal(second.available(), [])
      `,
    ),
  ],
  starter: code`
    class Shelf:
        def __init__(self):
            pass
  `,
});
