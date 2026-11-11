import { check, l } from "@/lib/content/factories";
import { code } from "@/lib/content/md";
import type { PlacementDefinition } from "@/lib/learning/placement";

/**
 * Python placement check. Predict and debug items are verified by running
 * every snippet with Pyodide in tests/placement.test.ts; coding items have
 * reference solutions there too.
 */
export const pythonPlacement: PlacementDefinition = {
  id: "placement-python",
  version: 1,
  courseId: "python",
  language: "python",
  minutes: 6,
  items: [
    /* --------------------------- Beginner --------------------------- */
    {
      id: "py-b-predict",
      kind: "predict",
      level: "beginner",
      skills: ["py.variables", "py.numbers"],
      prompt: l("What does this program print?", "Mitä tämä ohjelma tulostaa?"),
      code: code`
        price = 4
        quantity = 3
        total = price * quantity
        print(f"Total: {total} €")
      `,
      options: [
        { id: "a", output: "Total: {total} €" },
        { id: "b", output: "Total: 12 €" },
        { id: "c", output: "Total: 7 €" },
        { id: "d", output: "Total: 43 €" },
      ],
      answer: "b",
      explanation: l(
        "`total` is 4 * 3 = 12, and the f-string puts its value inside the text.",
        "`total` on 4 * 3 = 12, ja f-merkkijono sijoittaa arvon tekstin sisään.",
      ),
    },
    {
      id: "py-b-debug",
      kind: "debug",
      level: "beginner",
      skills: ["py.variables"],
      prompt: l(
        "This program should print `Saku is 7 years old`, but it stops with a `TypeError`. Which change fixes it?",
        "Tämän ohjelman pitäisi tulostaa `Saku is 7 years old`, mutta se pysähtyy virheeseen `TypeError`. Mikä muutos korjaa sen?",
      ),
      code: code`
        name = "Saku"
        age = 7
        print(name + " is " + age + " years old")
      `,
      expectedOutput: "Saku is 7 years old",
      options: [
        {
          id: "a",
          label: l("Convert the name: `int(name)`.", "Muunna nimi: `int(name)`."),
          fixed: 'name = "Saku"\nage = 7\nprint(int(name) + " is " + age + " years old")\n',
        },
        {
          id: "b",
          label: l("Use commas: `print(name, \" is \", age, \" years old\")`.", "Käytä pilkkuja: `print(name, \" is \", age, \" years old\")`."),
          fixed: 'name = "Saku"\nage = 7\nprint(name, " is ", age, " years old")\n',
        },
        {
          id: "c",
          label: l("Convert the number: `str(age)`.", "Muunna luku: `str(age)`."),
          fixed: 'name = "Saku"\nage = 7\nprint(name + " is " + str(age) + " years old")\n',
        },
      ],
      answer: "c",
      explanation: l(
        "`+` can't join text and a number. `str(age)` turns 7 into `\"7\"` first. Commas add extra spaces around each value.",
        "`+` ei voi yhdistää tekstiä ja lukua. `str(age)` muuttaa luvun 7 ensin muotoon `\"7\"`. Pilkut lisäisivät ylimääräisiä välilyöntejä.",
      ),
    },
    {
      id: "py-b-code",
      kind: "code",
      level: "beginner",
      skills: ["py.conditions"],
      prompt: l(
        "Write `water_state(celsius)` that returns `\"ice\"` at 0 °C or below, `\"steam\"` at 100 °C or above and `\"water\"` otherwise.",
        "Kirjoita funktio `water_state(celsius)`, joka palauttaa `\"ice\"`, kun lämpötila on enintään 0 °C, `\"steam\"`, kun se on vähintään 100 °C, ja muuten `\"water\"`.",
      ),
      starter: 'def water_state(celsius):\n    # Return "ice", "water" or "steam".\n    pass\n',
      tests: [
        check(
          "ice",
          l("`-5` and `0` give `\"ice\"`.", "`-5` ja `0` antavat `\"ice\"`."),
          l("Use `celsius <= 0` so that exactly 0 counts as ice.", "Käytä ehtoa `celsius <= 0`, jotta tasan 0 lasketaan jääksi."),
          code`
            expect_equal(var("water_state")(-5), "ice")
            expect_equal(var("water_state")(0), "ice")
          `,
        ),
        check(
          "steam",
          l("`100` and `120` give `\"steam\"`.", "`100` ja `120` antavat `\"steam\"`."),
          l("Use `celsius >= 100` so that exactly 100 counts as steam.", "Käytä ehtoa `celsius >= 100`, jotta tasan 100 lasketaan höyryksi."),
          code`
            expect_equal(var("water_state")(100), "steam")
            expect_equal(var("water_state")(120), "steam")
          `,
        ),
        check(
          "water",
          l("Temperatures in between give `\"water\"`.", "Väliin jäävät lämpötilat antavat `\"water\"`."),
          l("Return `\"water\"` when neither of the other rules applies.", "Palauta `\"water\"`, kun kumpikaan muu sääntö ei päde."),
          code`
            expect_equal(var("water_state")(25), "water")
            expect_equal(var("water_state")(99.5), "water")
          `,
        ),
      ],
      explanation: l(
        "An `if`/`elif`/`else` chain with `celsius <= 0` and `celsius >= 100` covers all three cases.",
        "`if`/`elif`/`else`-ketju ehdoilla `celsius <= 0` ja `celsius >= 100` kattaa kaikki kolme tapausta.",
      ),
    },

    /* ------------------------- Intermediate ------------------------- */
    {
      id: "py-i-predict",
      kind: "predict",
      level: "intermediate",
      skills: ["py.loops", "py.collections"],
      prompt: l("What does this program print?", "Mitä tämä ohjelma tulostaa?"),
      code: code`
        scores = {"Ada": 7, "Linus": 4, "Grace": 9}
        best = ""
        for name, score in scores.items():
            if score > 5:
                best += name[0]
        print(best)
      `,
      options: [
        { id: "a", output: "ALG" },
        { id: "b", output: "AdaGrace" },
        { id: "c", output: "G" },
        { id: "d", output: "AG" },
      ],
      answer: "d",
      explanation: l(
        "Only Ada (7) and Grace (9) score more than 5, and `name[0]` is the first letter of each name.",
        "Vain Ada (7) ja Grace (9) saavat yli 5 pistettä, ja `name[0]` on kunkin nimen ensimmäinen kirjain.",
      ),
    },
    {
      id: "py-i-debug",
      kind: "debug",
      level: "intermediate",
      skills: ["py.functions", "py.loops"],
      prompt: l(
        "`add_all([1, 2, 3])` should return `6`, but the program prints `1`. Which change fixes it?",
        "Kutsun `add_all([1, 2, 3])` pitäisi palauttaa `6`, mutta ohjelma tulostaa `1`. Mikä muutos korjaa sen?",
      ),
      code: code`
        def add_all(numbers):
            total = 0
            for n in numbers:
                total += n
                return total

        print(add_all([1, 2, 3]))
      `,
      expectedOutput: "6",
      options: [
        {
          id: "a",
          label: l("Move `return total` out of the loop (one level less indentation).", "Siirrä `return total` silmukan ulkopuolelle (yksi sisennystaso vähemmän)."),
          fixed: "def add_all(numbers):\n    total = 0\n    for n in numbers:\n        total += n\n    return total\n\nprint(add_all([1, 2, 3]))\n",
        },
        {
          id: "b",
          label: l("Start with `total = 1`.", "Aloita arvosta `total = 1`."),
          fixed: "def add_all(numbers):\n    total = 1\n    for n in numbers:\n        total += n\n        return total\n\nprint(add_all([1, 2, 3]))\n",
        },
        {
          id: "c",
          label: l("Call `add_all(1, 2, 3)` instead.", "Kutsu sen sijaan `add_all(1, 2, 3)`."),
          fixed: "def add_all(numbers):\n    total = 0\n    for n in numbers:\n        total += n\n        return total\n\nprint(add_all(1, 2, 3))\n",
        },
      ],
      answer: "a",
      explanation: l(
        "A `return` inside the loop ends the function during the first round. Returning after the loop adds every number first.",
        "Silmukan sisällä oleva `return` lopettaa funktion jo ensimmäisellä kierroksella. Kun palautus on silmukan jälkeen, kaikki luvut lasketaan ensin yhteen.",
      ),
    },
    {
      id: "py-i-code",
      kind: "code",
      level: "intermediate",
      skills: ["py.collections", "py.functions"],
      prompt: l(
        "Write `cheapest(prices)`. `prices` maps product names to prices, such as `{\"tea\": 2.5, \"bun\": 1.8}`. Return the name of the cheapest product; if several are equally cheap, return the alphabetically first. Return `None` for an empty dictionary.",
        "Kirjoita funktio `cheapest(prices)`. `prices` liittää tuotenimet hintoihin, esimerkiksi `{\"tea\": 2.5, \"bun\": 1.8}`. Palauta halvimman tuotteen nimi; jos useampi on yhtä halpa, palauta aakkosjärjestyksessä ensimmäinen. Palauta `None` tyhjälle sanakirjalle.",
      ),
      starter: "def cheapest(prices):\n    # Return the name of the cheapest product.\n    pass\n",
      tests: [
        check(
          "cheapest",
          l("The cheapest product is returned.", "Halvin tuote palautetaan."),
          l("Compare the prices and return the name with the smallest one.", "Vertaa hintoja ja palauta nimi, jolla on pienin hinta."),
          `expect_equal(var("cheapest")({"tea": 2.5, "bun": 1.8, "cake": 4.2}), "bun")`,
        ),
        check(
          "tie",
          l("Equally cheap products: the alphabetically first wins.", "Yhtä halvoista tuotteista aakkosjärjestyksessä ensimmäinen voittaa."),
          l("When two prices are equal, pick the name that comes first alphabetically.", "Kun kaksi hintaa on sama, valitse aakkosjärjestyksessä ensimmäinen nimi."),
          `expect_equal(var("cheapest")({"tea": 2.0, "bun": 2.0, "jam": 3.0}), "bun")`,
        ),
        check(
          "empty",
          l("An empty dictionary gives `None`.", "Tyhjä sanakirja antaa `None`."),
          l("Return `None` before looking for a minimum in an empty dictionary.", "Palauta `None` ennen kuin etsit pienintä tyhjästä sanakirjasta."),
          `expect_equal(var("cheapest")({}), None)`,
        ),
      ],
      explanation: l(
        "`min(sorted(prices), key=lambda name: prices[name])` checks names alphabetically and keeps the first cheapest one. Guard the empty case first.",
        "`min(sorted(prices), key=lambda name: prices[name])` käy nimet aakkosjärjestyksessä ja säilyttää ensimmäisen halvimman. Käsittele tyhjä sanakirja ensin.",
      ),
    },

    /* --------------------------- Advanced --------------------------- */
    {
      id: "py-a-predict",
      kind: "predict",
      level: "advanced",
      skills: ["py.comprehensions"],
      prompt: l("What does this program print?", "Mitä tämä ohjelma tulostaa?"),
      code: code`
        words = ["otter", "Koala", "ant", "Bee"]
        result = sorted(w.lower() for w in words if len(w) > 3)
        print(result)
      `,
      options: [
        { id: "a", output: "['koala', 'otter']" },
        { id: "b", output: "['Koala', 'otter']" },
        { id: "c", output: "['ant', 'bee', 'koala', 'otter']" },
        { id: "d", output: "['otter', 'koala']" },
      ],
      answer: "a",
      explanation: l(
        "Only words longer than 3 letters are kept, they are lowercased, and `sorted` returns them alphabetically.",
        "Vain yli 3 kirjaimen sanat säilytetään, ne muutetaan pieniksi kirjaimiksi, ja `sorted` palauttaa ne aakkosjärjestyksessä.",
      ),
    },
    {
      id: "py-a-debug",
      kind: "debug",
      level: "advanced",
      skills: ["py.errors"],
      prompt: l(
        "This program should print `Invalid number`, but it crashes with a `ValueError`. Which change fixes it?",
        "Tämän ohjelman pitäisi tulostaa `Invalid number`, mutta se kaatuu virheeseen `ValueError`. Mikä muutos korjaa sen?",
      ),
      code: code`
        def to_int(text):
            try:
                return int(text)
            except TypeError:
                return None

        value = to_int("12a")
        print("Invalid number" if value is None else value)
      `,
      expectedOutput: "Invalid number",
      options: [
        {
          id: "a",
          label: l("Convert with `int(float(text))`.", "Muunna lausekkeella `int(float(text))`."),
          fixed:
            'def to_int(text):\n    try:\n        return int(float(text))\n    except TypeError:\n        return None\n\nvalue = to_int("12a")\nprint("Invalid number" if value is None else value)\n',
        },
        {
          id: "b",
          label: l("Catch the error that is raised: `except ValueError:`.", "Ota kiinni nostettu virhe: `except ValueError:`."),
          fixed:
            'def to_int(text):\n    try:\n        return int(text)\n    except ValueError:\n        return None\n\nvalue = to_int("12a")\nprint("Invalid number" if value is None else value)\n',
        },
        {
          id: "c",
          label: l("Print the error: `except TypeError as error: print(error)`.", "Tulosta virhe: `except TypeError as error: print(error)`."),
          fixed:
            'def to_int(text):\n    try:\n        return int(text)\n    except TypeError as error:\n        print(error)\n        return None\n\nvalue = to_int("12a")\nprint("Invalid number" if value is None else value)\n',
        },
      ],
      answer: "b",
      explanation: l(
        "`int(\"12a\")` raises `ValueError`, not `TypeError`, so the `except` clause never matched.",
        "`int(\"12a\")` nostaa virheen `ValueError`, ei `TypeError`, joten `except`-lohko ei koskaan osunut.",
      ),
    },
    {
      id: "py-a-code",
      kind: "code",
      level: "advanced",
      skills: ["py.comprehensions", "py.text"],
      prompt: l(
        "Write `normalize_emails(emails)` that returns an alphabetical list of unique addresses, stripped and in lowercase. Leave out entries without `@`.",
        "Kirjoita funktio `normalize_emails(emails)`, joka palauttaa aakkosjärjestetyn listan yksilöllisistä osoitteista siistittyinä ja pienillä kirjaimilla. Jätä pois merkinnät, joissa ei ole merkkiä `@`.",
      ),
      starter: "def normalize_emails(emails):\n    # Return a sorted list of unique, cleaned addresses.\n    return emails\n",
      tests: [
        check(
          "cleans",
          l("Addresses are cleaned, de-duplicated and sorted.", "Osoitteet siistitään, kaksoiskappaleet poistetaan ja tulos lajitellaan."),
          l("Use `.strip().lower()`, a set for uniqueness and `sorted(...)`.", "Käytä metodeja `.strip().lower()`, joukkoa yksilöllisyyteen ja funktiota `sorted(...)`."),
          `expect_equal(var("normalize_emails")([" Ada@Example.com", "grace@navy.mil", "ada@example.com "]), ["ada@example.com", "grace@navy.mil"])`,
        ),
        check(
          "skips-invalid",
          l("Entries without `@` are left out.", "Merkinnät ilman merkkiä `@` jätetään pois."),
          l("Keep an address only if it contains `@`.", "Säilytä osoite vain, jos siinä on `@`."),
          `expect_equal(var("normalize_emails")(["no-at-sign", "x@y.fi"]), ["x@y.fi"])`,
        ),
        check(
          "empty",
          l("An empty list gives `[]`.", "Tyhjä lista antaa `[]`."),
          l("`normalize_emails([])` should return an empty list.", "`normalize_emails([])` pitää palauttaa tyhjä lista."),
          `expect_equal(var("normalize_emails")([]), [])`,
        ),
      ],
      explanation: l(
        "`sorted({e.strip().lower() for e in emails if \"@\" in e})` — a set comprehension removes duplicates.",
        "`sorted({e.strip().lower() for e in emails if \"@\" in e})` — joukkokooste poistaa kaksoiskappaleet.",
      ),
    },
  ],
};
