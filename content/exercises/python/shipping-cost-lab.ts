import { code, md } from "@/lib/content/md";
import type { ExerciseDefinition, TestDefinition } from "@/lib/content/types";

function costTest(
  id: string,
  distance: number,
  isMember: boolean,
  expected: number,
  label: TestDefinition["label"],
  failure: TestDefinition["failure"],
): TestDefinition {
  const member = isMember ? "True" : "False";
  return {
    id,
    label,
    failure,
    code: `expect_close(run(distance_km=${distance}, is_member=${member}).var("shipping_cost"), ${expected})`,
  };
}

export const shippingCostLab: ExerciseDefinition = {
  id: "shipping-cost-lab",
  courseId: "python",
  chapterId: "py-conditions",
  language: "python",
  type: "lab",
  estimatedMinutes: 25,
  title: {
    en: "Lab: Shipping cost calculator",
    fi: "Harjoitustyö: Toimituskulujen laskuri",
  },
  summary: {
    en: "Use if, elif and else to calculate shipping costs for different customers and distances.",
    fi: "Laske toimituskulut eri asiakkaille ja etäisyyksille if-, elif- ja else-rakenteilla.",
  },
  concept: {
    en: md`
      Programs often need to make decisions. An **\`if\` statement** runs a block of code only when its condition is true:

      ~~~python
      if temperature < 0:
          print("Wear a warm coat")
      elif temperature < 15:
          print("Bring a jacket")
      else:
          print("T-shirt weather")
      ~~~

      Python checks the conditions from top to bottom and runs the **first** block whose condition is true. \`elif\` ("else if") adds more conditions, and \`else\` catches everything left over. The indented lines belong to the block above them — indentation is how Python knows where a block starts and ends.

      Conditions use comparison operators such as \`<\`, \`<=\`, \`>\`, \`>=\`, \`==\` (equal) and \`!=\` (not equal). You can combine conditions with \`and\`, \`or\` and \`not\`.

      Pay attention to **boundary values**: \`distance < 10\` and \`distance <= 10\` give different results when the distance is exactly 10.
    `,
    fi: md`
      Ohjelmien täytyy usein tehdä päätöksiä. **\`if\`-lause** suorittaa koodilohkon vain silloin, kun ehto on tosi:

      ~~~python
      if temperature < 0:
          print("Wear a warm coat")
      elif temperature < 15:
          print("Bring a jacket")
      else:
          print("T-shirt weather")
      ~~~

      Python tarkistaa ehdot ylhäältä alaspäin ja suorittaa **ensimmäisen** lohkon, jonka ehto on tosi. \`elif\` ("else if") lisää uusia ehtoja, ja \`else\` kattaa kaikki loput tapaukset. Sisennetyt rivit kuuluvat niiden yläpuolella olevaan lohkoon – sisennyksestä Python tietää, missä lohko alkaa ja päättyy.

      Ehdoissa käytetään vertailuoperaattoreita, kuten \`<\`, \`<=\`, \`>\`, \`>=\`, \`==\` (yhtä suuri) ja \`!=\` (eri suuri). Ehtoja voi yhdistää sanoilla \`and\`, \`or\` ja \`not\`.

      Kiinnitä huomiota **raja-arvoihin**: \`distance < 10\` ja \`distance <= 10\` antavat eri tuloksen, kun etäisyys on tasan 10.
    `,
  },
  objectives: [
    { en: "Write if / elif / else statements", fi: "Kirjoittaa if-, elif- ja else-rakenteita" },
    {
      en: "Choose the right comparison operator for boundary values",
      fi: "Valita oikea vertailuoperaattori raja-arvoille",
    },
    { en: "Combine conditions with or / and", fi: "Yhdistää ehtoja sanoilla or ja and" },
    {
      en: "Write a program that works for any input, not just one example",
      fi: "Kirjoittaa ohjelman, joka toimii millä tahansa syötteellä eikä vain yhdellä esimerkillä",
    },
  ],
  requirements: [
    {
      en: "Members (`is_member` is `True`) always get free shipping: `shipping_cost` is `0`.",
      fi: "Jäsenet (`is_member` on `True`) saavat aina ilmaisen toimituksen: `shipping_cost` on `0`.",
    },
    {
      en: "For other customers, deliveries under 10 km are free.",
      fi: "Muille asiakkaille alle 10 km:n toimitukset ovat ilmaisia.",
    },
    {
      en: "Deliveries from 10 km up to and including 50 km cost `4.90`.",
      fi: "Toimitukset 10 kilometristä 50 kilometriin (50 mukaan lukien) maksavat `4.90`.",
    },
    { en: "Deliveries over 50 km cost `9.90`.", fi: "Yli 50 km:n toimitukset maksavat `9.90`." },
    {
      en: "The program prints the value of `shipping_cost`.",
      fi: "Ohjelma tulostaa muuttujan `shipping_cost` arvon.",
    },
    {
      en: "Keep the assignments of `distance_km` and `is_member` at the top of the file — the tests replace their values.",
      fi: "Pidä muuttujien `distance_km` ja `is_member` sijoitukset tiedoston alussa – testit vaihtavat niiden arvot.",
    },
  ],
  starterFiles: [
    {
      name: "main.py",
      language: "python",
      entry: true,
      content: `${code`
        # Shipping cost calculator
        # The tests replace these two values with different inputs.
        distance_km = 30
        is_member = False

        # Write your code below this line.
      `}\n\n`,
    },
  ],
  expectedOutput: {
    text: "4.9",
    note: {
      en: 'With distance_km = 30 and is_member = False. Formatting such as 4.90 or "Shipping: 4.90 EUR" is also fine.',
      fi: 'Kun distance_km = 30 ja is_member = False. Myös muotoilu, kuten 4.90 tai "Shipping: 4.90 EUR", kelpaa.',
    },
  },
  steps: [
    {
      id: "lab",
      title: { en: "Calculate the shipping cost", fi: "Laske toimituskulut" },
      instructions: {
        en: md`
          An online bookshop wants its shipping costs calculated automatically. The program starts with two values: \`distance_km\`, the delivery distance in kilometres, and \`is_member\`, which tells whether the customer has a membership.

          Below them, write code that creates a variable named \`shipping_cost\` following the requirements, and then prints it.

          The tests run your program **several times with different values** for \`distance_km\` and \`is_member\`, so your code has to work for any input — not just the values in the starter code. Try changing the values yourself and pressing **Run** to see what happens.
        `,
        fi: md`
          Verkkokirjakauppa haluaa laskea toimituskulut automaattisesti. Ohjelma alkaa kahdella arvolla: \`distance_km\` on toimitusmatka kilometreinä ja \`is_member\` kertoo, onko asiakas jäsen.

          Kirjoita niiden alle koodi, joka luo vaatimusten mukaisen muuttujan \`shipping_cost\` ja tulostaa sen.

          Testit suorittavat ohjelmasi **useita kertoja eri arvoilla** muuttujille \`distance_km\` ja \`is_member\`, joten koodisi täytyy toimia millä tahansa syötteellä – ei vain aloituskoodin arvoilla. Kokeile vaihtaa arvoja itse ja paina **Suorita** nähdäksesi, mitä tapahtuu.
        `,
      },
      hints: [
        {
          en: "Check the member rule first: if `is_member` is true, the distance doesn't matter.",
          fi: "Tarkista jäsensääntö ensin: jos `is_member` on tosi, etäisyydellä ei ole merkitystä.",
        },
        {
          en: "`elif distance_km <= 50:` includes 50 itself. `< 50` would not.",
          fi: "`elif distance_km <= 50:` sisältää myös luvun 50. `< 50` ei sisältäisi.",
        },
        {
          en: "You can write the member rule and the short-distance rule as one condition: `if is_member or distance_km < 10:`.",
          fi: "Jäsensäännön ja lyhyen matkan säännön voi kirjoittaa yhdeksi ehdoksi: `if is_member or distance_km < 10:`.",
        },
      ],
      tests: [
        {
          id: "uses-if",
          label: { en: "The program uses an `if` statement.", fi: "Ohjelma käyttää `if`-lausetta." },
          failure: {
            en: "We couldn't find an `if` statement. This lab is about making decisions with `if`, `elif` and `else`.",
            fi: "Koodista ei löytynyt `if`-lausetta. Tässä harjoitustyössä päätökset tehdään rakenteilla `if`, `elif` ja `else`.",
          },
          code: `expect(len(find_nodes(ast.If, ast.IfExp, ast.Match)) > 0)`,
        },
        {
          id: "cost-is-number",
          label: { en: "`shipping_cost` is a number.", fi: "`shipping_cost` on luku." },
          failure: {
            en: "`shipping_cost` should be a number such as `0` or `4.9`, not text. Write numbers without quotes.",
            fi: "Muuttujan `shipping_cost` pitää olla luku, kuten `0` tai `4.9`, eikä tekstiä. Kirjoita luvut ilman lainausmerkkejä.",
          },
          code: `expect_type(var("shipping_cost"), int, float)`,
        },
        costTest(
          "short-free",
          5,
          false,
          0,
          { en: "A 5 km delivery to a non-member costs `0`.", fi: "5 km:n toimitus ei-jäsenelle maksaa `0`." },
          {
            en: "For `distance_km = 5` and `is_member = False`, `shipping_cost` should be `0`. Deliveries under 10 km are free.",
            fi: "Kun `distance_km = 5` ja `is_member = False`, muuttujan `shipping_cost` pitää olla `0`. Alle 10 km:n toimitukset ovat ilmaisia.",
          },
        ),
        costTest(
          "boundary-10",
          10,
          false,
          4.9,
          { en: "Exactly 10 km costs `4.90`.", fi: "Tasan 10 km maksaa `4.90`." },
          {
            en: "For exactly 10 km the cost should be `4.90` — 10 is not *under* 10. Check whether you used `<` or `<=`.",
            fi: "Tasan 10 km:n toimituksen pitää maksaa `4.90` – 10 ei ole *alle* 10. Tarkista, käytitkö operaattoria `<` vai `<=`.",
          },
        ),
        costTest(
          "middle-30",
          30,
          false,
          4.9,
          { en: "A 30 km delivery costs `4.90`.", fi: "30 km:n toimitus maksaa `4.90`." },
          {
            en: "For 30 km the cost should be `4.90`.",
            fi: "30 km:n toimituksen pitää maksaa `4.90`.",
          },
        ),
        costTest(
          "boundary-50",
          50,
          false,
          4.9,
          { en: "Exactly 50 km still costs `4.90`.", fi: "Tasan 50 km maksaa yhä `4.90`." },
          {
            en: "For exactly 50 km the cost should be `4.90`, because the rule includes 50. Check whether you used `<` or `<=`.",
            fi: "Tasan 50 km:n toimituksen pitää maksaa `4.90`, koska sääntö sisältää luvun 50. Tarkista, käytitkö operaattoria `<` vai `<=`.",
          },
        ),
        costTest(
          "long-120",
          120,
          false,
          9.9,
          { en: "A 120 km delivery costs `9.90`.", fi: "120 km:n toimitus maksaa `9.90`." },
          {
            en: "Deliveries over 50 km should cost `9.90`.",
            fi: "Yli 50 km:n toimitusten pitää maksaa `9.90`.",
          },
        ),
        costTest(
          "member-free",
          120,
          true,
          0,
          { en: "Members pay `0` even for 120 km.", fi: "Jäsenet maksavat `0` myös 120 km:n toimituksesta." },
          {
            en: "When `is_member` is `True`, shipping should be free regardless of the distance. Check the member rule first.",
            fi: "Kun `is_member` on `True`, toimituksen pitää olla ilmainen etäisyydestä riippumatta. Tarkista jäsensääntö ensin.",
          },
        ),
        {
          id: "prints-cost",
          label: { en: "The program prints the shipping cost.", fi: "Ohjelma tulostaa toimituskulut." },
          failure: {
            en: "We ran the program with `distance_km = 30` and didn't see `4.9` in the output. Print `shipping_cost` at the end.",
            fi: "Suoritimme ohjelman arvolla `distance_km = 30`, eikä tulosteessa näkynyt lukua `4.9`. Tulosta `shipping_cost` lopuksi.",
          },
          code: `expect_number_in_output(4.9, run(distance_km=30, is_member=False))`,
        },
        {
          id: "hidden-decimals",
          hidden: true,
          label: {
            en: "Works with decimal distances near the limits.",
            fi: "Toimii desimaalietäisyyksillä lähellä rajoja.",
          },
          failure: {
            en: "Your program gives a wrong cost for some distances with decimals. Make sure every distance falls into exactly one rule.",
            fi: "Ohjelmasi antaa väärät kulut joillekin desimaalietäisyyksille. Varmista, että jokainen etäisyys osuu täsmälleen yhteen sääntöön.",
          },
          code: code`
            for distance, expected in [(9.99, 0), (10.5, 4.9), (50.01, 9.9)]:
                expect_close(run(distance_km=distance, is_member=False).var("shipping_cost"), expected)
          `,
        },
        {
          id: "hidden-members",
          hidden: true,
          label: {
            en: "Members get free shipping at every distance.",
            fi: "Jäsenet saavat ilmaisen toimituksen kaikilla etäisyyksillä.",
          },
          failure: {
            en: "For members, `shipping_cost` should be `0` at every distance.",
            fi: "Jäsenillä muuttujan `shipping_cost` pitää olla `0` kaikilla etäisyyksillä.",
          },
          code: code`
            for distance in [3, 30, 75]:
                expect_close(run(distance_km=distance, is_member=True).var("shipping_cost"), 0)
          `,
        },
      ],
    },
  ],
};
