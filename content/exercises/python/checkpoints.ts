import { check, l, pyCheckpoint } from "@/lib/content/factories";
import { code, md } from "@/lib/content/md";

/**
 * Checkpoints between bands. Each one reviews a whole band in a single task,
 * so learners who already know the material can confirm it and move on.
 * Passing a checkpoint never marks the chapters it covers as completed.
 */

/* ------------------------------------------------------------------ */
/* After chapter 5 — the basics                                        */
/* ------------------------------------------------------------------ */

export const pyCheckpointCinema = pyCheckpoint({
  id: "py-checkpoint-cinema",
  chapterId: "py-checkpoint-basics",
  minutes: 12,
  title: l("Checkpoint: Cinema ticket", "Tarkistuspiste: Elokuvalippu"),
  summary: l(
    "Combine variables, arithmetic and conditions to price a cinema ticket.",
    "Yhdistä muuttujat, laskutoimitukset ja ehdot ja hinnoittele elokuvalippu.",
  ),
  concept: l(
    md`
      This checkpoint reviews chapters 1–5: variables, numbers, comparisons, \`and\`/\`or\` and \`if\`/\`elif\`/\`else\`. If you can solve it without hints, you are ready for functions and loops.

      Order matters in an \`if\`/\`elif\` chain: Python uses the **first** branch whose condition is true. Put the most specific rules first:

      ~~~python
      if temperature < 0:
          advice = "Wear a coat"
      elif temperature < 15:
          advice = "Take a jacket"
      else:
          advice = "T-shirt weather"
      ~~~

      A rule that applies on top of the others (like a discount) is easiest to apply **after** the chain.
    `,
    md`
      Tämä tarkistuspiste kertaa luvut 1–5: muuttujat, luvut, vertailut, \`and\`/\`or\` ja \`if\`/\`elif\`/\`else\`. Jos ratkaiset sen ilman vihjeitä, olet valmis funktioihin ja silmukoihin.

      Järjestyksellä on väliä \`if\`/\`elif\`-ketjussa: Python käyttää **ensimmäistä** haaraa, jonka ehto on tosi. Laita tarkimmat säännöt ensin:

      ~~~python
      if temperature < 0:
          advice = "Wear a coat"
      elif temperature < 15:
          advice = "Take a jacket"
      else:
          advice = "T-shirt weather"
      ~~~

      Muiden päälle tuleva sääntö (kuten alennus) on helpointa tehdä ketjun **jälkeen**.
    `,
  ),
  objectives: [
    l("Choose between several prices with `if`/`elif`/`else`", "Valita useasta hinnasta rakenteella `if`/`elif`/`else`"),
    l("Apply an extra rule on top of a result", "Soveltaa lisäsääntöä tuloksen päälle"),
    l("Print a calculated value", "Tulostaa lasketun arvon"),
  ],
  requirements: [
    l("Children under 12 pay `6.0`.", "Alle 12-vuotiaat maksavat `6.0`."),
    l("People aged 65 or more pay `8.0`.", "65 vuotta täyttäneet maksavat `8.0`."),
    l("Other students pay `9.0`; everyone else pays `12.0`.", "Muut opiskelijat maksavat `9.0`; kaikki muut `12.0`."),
    l("On `\"Tuesday\"` every ticket is `2.0` cheaper.", "Päivänä `\"Tuesday\"` jokainen lippu on `2.0` halvempi."),
    l("Store the result in `price` and print it.", "Tallenna tulos muuttujaan `price` ja tulosta se."),
  ],
  instructions: l(
    md`
      Calculate the ticket price into a variable called \`price\` using \`age\`, \`is_student\` and \`day\`, then print it (for example \`Ticket: 10.0 €\`).

      The checks re-run your program with other ages, student statuses and days, so use the variables instead of fixed numbers.
    `,
    md`
      Laske lipun hinta muuttujaan \`price\` muuttujien \`age\`, \`is_student\` ja \`day\` avulla ja tulosta se (esimerkiksi \`Ticket: 10.0 €\`).

      Tarkistukset ajavat ohjelmasi uudelleen muilla iillä, opiskelijatiedoilla ja päivillä, joten käytä muuttujia kiinteiden lukujen sijaan.
    `,
  ),
  hints: [
    l(
      "Start with the age rules: `if age < 12:` … `elif age >= 65:` … `elif is_student:` … `else:` …",
      "Aloita ikäsäännöistä: `if age < 12:` … `elif age >= 65:` … `elif is_student:` … `else:` …",
    ),
    l(
      "After the chain, apply the discount: `if day == \"Tuesday\": price = price - 2.0`.",
      "Tee ketjun jälkeen alennus: `if day == \"Tuesday\": price = price - 2.0`.",
    ),
  ],
  tests: [
    check(
      "child",
      l("An 8-year-old pays `6.0` on a Friday.", "8-vuotias maksaa perjantaina `6.0`."),
      l("Children under 12 should pay `6.0`.", "Alle 12-vuotiaiden pitää maksaa `6.0`."),
      `expect_close(run(age=8, is_student=False, day="Friday").var("price"), 6.0)`,
    ),
    check(
      "adult",
      l("A 12-year-old who is not a student pays the full `12.0`.", "12-vuotias, joka ei ole opiskelija, maksaa täyden `12.0`."),
      l(
        "Age 12 is no longer a child. Check that the child rule is `age < 12`.",
        "12-vuotias ei ole enää lapsi. Tarkista, että lapsisääntö on `age < 12`.",
      ),
      `expect_close(run(age=12, is_student=False, day="Friday").var("price"), 12.0)`,
    ),
    check(
      "senior",
      l("A 65-year-old pays `8.0`.", "65-vuotias maksaa `8.0`."),
      l("People aged exactly 65 count as seniors: use `>= 65`.", "Tasan 65-vuotiaat lasketaan senioreiksi: käytä vertailua `>= 65`."),
      `expect_close(run(age=65, is_student=False, day="Friday").var("price"), 8.0)`,
    ),
    check(
      "student",
      l("A 20-year-old student pays `9.0`.", "20-vuotias opiskelija maksaa `9.0`."),
      l("Students who are not children or seniors pay `9.0`.", "Opiskelijat, jotka eivät ole lapsia tai senioreita, maksavat `9.0`."),
      `expect_close(run(age=20, is_student=True, day="Friday").var("price"), 9.0)`,
    ),
    check(
      "senior-student",
      l("A 70-year-old student pays the senior price `8.0`.", "70-vuotias opiskelija maksaa seniorihinnan `8.0`."),
      l(
        "The senior rule should win over the student rule. Check the order of your branches.",
        "Seniorisäännön pitää voittaa opiskelijasääntö. Tarkista haarojen järjestys.",
      ),
      `expect_close(run(age=70, is_student=True, day="Friday").var("price"), 8.0)`,
    ),
    check(
      "tuesday",
      l("On Tuesday an adult pays `10.0` and a child `4.0`.", "Tiistaina aikuinen maksaa `10.0` ja lapsi `4.0`."),
      l(
        "The Tuesday discount of `2.0` applies to every ticket, after the age rules.",
        "Tiistain `2.0`:n alennus koskee jokaista lippua, ikäsääntöjen jälkeen.",
      ),
      code`
        expect_close(run(age=30, is_student=False, day="Tuesday").var("price"), 10.0)
        expect_close(run(age=8, is_student=False, day="Tuesday").var("price"), 4.0)
      `,
    ),
    check(
      "prints",
      l("The program prints the price.", "Ohjelma tulostaa hinnan."),
      l("Print `price` at the end of the program.", "Tulosta `price` ohjelman lopussa."),
      `expect_number_in_output(var("price"))`,
    ),
  ],
  starter: code`
    age = 15
    is_student = False
    day = "Tuesday"

    # Work out the ticket price below and store it in price.
  `,
});

/* ------------------------------------------------------------------ */
/* After chapter 10 — functions and data                               */
/* ------------------------------------------------------------------ */

export const pyCheckpointOrders = pyCheckpoint({
  id: "py-checkpoint-orders",
  chapterId: "py-checkpoint-intermediate",
  minutes: 18,
  title: l("Checkpoint: Order summary", "Tarkistuspiste: Tilausyhteenveto"),
  summary: l(
    "Summarise a list of orders with a function, a loop, dictionaries and text cleaning.",
    "Tee tilauslistasta yhteenveto funktiolla, silmukalla, sanakirjoilla ja tekstin siistimisellä.",
  ),
  concept: l(
    md`
      This checkpoint reviews chapters 6–10: functions, loops, lists, dictionaries and string methods. If you solve it comfortably, the advanced chapters are a good next step.

      A common pattern is to walk through a list once and update several running values:

      ~~~python
      total = 0
      best = None
      for row in rows:
          total += row["amount"]
          if best is None or row["amount"] > best["amount"]:
              best = row
      ~~~

      Floating-point sums can end in tiny errors (\`0.1 + 0.2\` is \`0.30000000000000004\`), so round money with \`round(value, 2)\`.
    `,
    md`
      Tämä tarkistuspiste kertaa luvut 6–10: funktiot, silmukat, listat, sanakirjat ja merkkijonometodit. Jos ratkaiset sen sujuvasti, edistyneet luvut ovat hyvä seuraava askel.

      Yleinen tapa on käydä lista läpi kerran ja päivittää useaa kertyvää arvoa:

      ~~~python
      total = 0
      best = None
      for row in rows:
          total += row["amount"]
          if best is None or row["amount"] > best["amount"]:
              best = row
      ~~~

      Liukulukujen summiin voi jäädä pieniä virheitä (\`0.1 + 0.2\` on \`0.30000000000000004\`), joten pyöristä rahasummat: \`round(value, 2)\`.
    `,
  ),
  objectives: [
    l("Write a function that returns a dictionary", "Kirjoittaa funktion, joka palauttaa sanakirjan"),
    l("Track several values in one loop", "Seurata useaa arvoa yhdessä silmukassa"),
    l("Clean and de-duplicate text", "Siistiä tekstiä ja poistaa kaksoiskappaleet"),
    l("Handle an empty list", "Käsitellä tyhjän listan"),
  ],
  requirements: [
    l(
      "`summarize_orders(orders)` returns a dictionary with the keys `\"items\"`, `\"total\"`, `\"top_item\"` and `\"names\"`.",
      "`summarize_orders(orders)` palauttaa sanakirjan, jossa on avaimet `\"items\"`, `\"total\"`, `\"top_item\"` ja `\"names\"`.",
    ),
    l("`\"items\"` is the sum of all quantities (`qty`).", "`\"items\"` on kaikkien määrien (`qty`) summa."),
    l(
      "`\"total\"` is the sum of `qty * price`, rounded to 2 decimals.",
      "`\"total\"` on lausekkeiden `qty * price` summa pyöristettynä kahteen desimaaliin.",
    ),
    l(
      "`\"top_item\"` is the `item` of the order with the biggest `qty * price` (or `None` for no orders).",
      "`\"top_item\"` on sen tilauksen `item`, jonka `qty * price` on suurin (tai `None`, jos tilauksia ei ole).",
    ),
    l(
      "`\"names\"` is an alphabetical list of the different item names, stripped and in lowercase.",
      "`\"names\"` on aakkosjärjestetty lista eri tuotenimistä ilman ylimääräisiä välilyöntejä ja pienillä kirjaimilla.",
    ),
  ],
  instructions: l(
    md`
      Each order is a dictionary such as \`{"item": "Coffee", "qty": 2, "price": 3.5}\`. Write \`summarize_orders(orders)\` as described in the requirements. An empty list gives \`{"items": 0, "total": 0, "top_item": None, "names": []}\`.
    `,
    md`
      Jokainen tilaus on sanakirja, esimerkiksi \`{"item": "Coffee", "qty": 2, "price": 3.5}\`. Kirjoita funktio \`summarize_orders(orders)\` vaatimusten mukaan. Tyhjä lista antaa tuloksen \`{"items": 0, "total": 0, "top_item": None, "names": []}\`.
    `,
  ),
  hints: [
    l(
      "Create `items = 0`, `total = 0`, `top_item = None`, `best = 0` and a list or set for names before the loop.",
      "Luo ennen silmukkaa `items = 0`, `total = 0`, `top_item = None`, `best = 0` sekä lista tai joukko nimille.",
    ),
    l(
      "Inside the loop: `line = order[\"qty\"] * order[\"price\"]`. Clean a name with `order[\"item\"].strip().lower()`.",
      "Silmukassa: `line = order[\"qty\"] * order[\"price\"]`. Siisti nimi: `order[\"item\"].strip().lower()`.",
    ),
    l(
      "At the end: `return {\"items\": items, \"total\": round(total, 2), \"top_item\": top_item, \"names\": sorted(names)}`.",
      "Lopuksi: `return {\"items\": items, \"total\": round(total, 2), \"top_item\": top_item, \"names\": sorted(names)}`.",
    ),
  ],
  tests: [
    check(
      "is-function",
      l("`summarize_orders` is a function.", "`summarize_orders` on funktio."),
      l("Define a function named `summarize_orders`.", "Määrittele funktio nimeltä `summarize_orders`."),
      `expect(callable(var("summarize_orders")))`,
    ),
    check(
      "items",
      l("`\"items\"` adds up the quantities.", "`\"items\"` laskee määrät yhteen."),
      l("Add `order[\"qty\"]` of every order to `items`.", "Lisää jokaisen tilauksen `order[\"qty\"]` muuttujaan `items`."),
      code`
        orders = [{"item": "Coffee", "qty": 2, "price": 3.5}, {"item": "Bun", "qty": 3, "price": 2.0}]
        expect_equal(var("summarize_orders")(orders)["items"], 5)
      `,
    ),
    check(
      "total",
      l("`\"total\"` is the rounded sum of `qty * price`.", "`\"total\"` on lausekkeiden `qty * price` pyöristetty summa."),
      l(
        "Multiply quantity by price for every order, add them up and `round(total, 2)`.",
        "Kerro jokaisen tilauksen määrä hinnalla, laske yhteen ja käytä `round(total, 2)`.",
      ),
      code`
        orders = [{"item": "Candy", "qty": 3, "price": 0.1}, {"item": "Muffin", "qty": 2, "price": 1.15}]
        expect_equal(var("summarize_orders")(orders)["total"], 2.6)
      `,
    ),
    check(
      "top-item",
      l("`\"top_item\"` is the order with the largest `qty * price`.", "`\"top_item\"` on tilaus, jonka `qty * price` on suurin."),
      l(
        "Compare line totals (`qty * price`), not the quantity or the unit price alone.",
        "Vertaa rivisummia (`qty * price`), älä pelkkää määrää tai yksikköhintaa.",
      ),
      code`
        orders = [
            {"item": "Bun", "qty": 4, "price": 1.5},
            {"item": "Sandwich", "qty": 1, "price": 7.9},
            {"item": "Juice", "qty": 3, "price": 3.0},
        ]
        expect_equal(var("summarize_orders")(orders)["top_item"], "Juice")
      `,
    ),
    check(
      "names",
      l("`\"names\"` is sorted, unique, stripped and lowercase.", "`\"names\"` on järjestetty, yksilöllinen, siistitty ja pienillä kirjaimilla."),
      l(
        "Clean each name with `.strip().lower()`, skip duplicates and return them with `sorted(...)`.",
        "Siisti jokainen nimi metodeilla `.strip().lower()`, ohita kaksoiskappaleet ja palauta ne funktiolla `sorted(...)`.",
      ),
      code`
        orders = [
            {"item": " Coffee", "qty": 1, "price": 3.0},
            {"item": "coffee", "qty": 1, "price": 3.0},
            {"item": "Bun ", "qty": 2, "price": 1.5},
        ]
        expect_equal(var("summarize_orders")(orders)["names"], ["bun", "coffee"])
      `,
    ),
    check(
      "empty",
      l("An empty list gives zeros, `None` and `[]`.", "Tyhjä lista antaa nollat, arvon `None` ja listan `[]`."),
      l(
        "With no orders, return `{\"items\": 0, \"total\": 0, \"top_item\": None, \"names\": []}`.",
        "Kun tilauksia ei ole, palauta `{\"items\": 0, \"total\": 0, \"top_item\": None, \"names\": []}`.",
      ),
      code`
        result = var("summarize_orders")([])
        expect_equal(result["items"], 0)
        expect_close(result["total"], 0)
        expect_equal(result["top_item"], None)
        expect_equal(result["names"], [])
      `,
    ),
  ],
  starter: code`
    def summarize_orders(orders):
        # Return a dictionary with items, total, top_item and names.
        pass
  `,
});
