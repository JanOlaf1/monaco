import { code, md } from "@/lib/content/md";
import type { ExerciseDefinition } from "@/lib/content/types";

const header = code`
  # Variables and strings
  # Write your code below this line.
`;

export const variablesAndStrings: ExerciseDefinition = {
  id: "variables-and-strings",
  courseId: "python",
  chapterId: "py-strings",
  language: "python",
  type: "challenge",
  estimatedMinutes: 15,
  title: {
    en: "Variables and strings",
    fi: "Muuttujat ja merkkijonot",
  },
  summary: {
    en: "Store text in variables, combine strings and print the result.",
    fi: "Tallenna tekstiä muuttujiin, yhdistä merkkijonoja ja tulosta tulos.",
  },
  concept: {
    en: md`
      A **variable** is a name that refers to a value. You create one with an equals sign: the name goes on the left and the value on the right.

      ~~~python
      city = "Tampere"
      ~~~

      Python reads this as "let the name \`city\` refer to the text \`"Tampere"\`". Text values are called **strings**, and you write them inside quotes. Variables matter because they let you store a value once and reuse it everywhere — if the value changes, you update it in one place.

      Strings can be combined. The \`+\` operator joins strings together, and an **f-string** (a string with \`f\` in front of the quotes) lets you put variables directly inside the text with curly braces:

      ~~~python
      message = "Hello from " + city
      message = f"Hello from {city}"
      ~~~

      Both lines create the same text. Strings also have **methods**: built-in actions you call with a dot, such as \`city.upper()\`, which returns an uppercase copy of the string.
    `,
    fi: md`
      **Muuttuja** on nimi, joka viittaa arvoon. Muuttuja luodaan yhtäsuuruusmerkillä: nimi tulee vasemmalle ja arvo oikealle.

      ~~~python
      city = "Tampere"
      ~~~

      Python lukee tämän näin: "anna nimen \`city\` viitata tekstiin \`"Tampere"\`". Tekstiarvoja kutsutaan **merkkijonoiksi**, ja ne kirjoitetaan lainausmerkkien sisään. Muuttujat ovat hyödyllisiä, koska arvon voi tallentaa kerran ja käyttää sitä monessa paikassa – jos arvo muuttuu, se päivitetään vain yhteen kohtaan.

      Merkkijonoja voi yhdistää. Operaattori \`+\` liittää merkkijonot yhteen, ja **f-merkkijonon** (merkkijono, jonka lainausmerkkien edessä on \`f\`) avulla muuttujia voi sijoittaa suoraan tekstin sisään aaltosulkeilla:

      ~~~python
      message = "Hello from " + city
      message = f"Hello from {city}"
      ~~~

      Molemmat rivit luovat saman tekstin. Merkkijonoilla on myös **metodeja**: sisäänrakennettuja toimintoja, joita kutsutaan pisteen avulla. Esimerkiksi \`city.upper()\` palauttaa merkkijonosta isoilla kirjaimilla kirjoitetun kopion.
    `,
  },
  objectives: [
    { en: "Create variables and assign strings to them", fi: "Luoda muuttujia ja sijoittaa niihin merkkijonoja" },
    { en: "Combine strings with + or f-strings", fi: "Yhdistää merkkijonoja +-operaattorilla tai f-merkkijonoilla" },
    { en: "Display values with print()", fi: "Näyttää arvoja print()-funktiolla" },
    { en: "Call a string method", fi: "Kutsua merkkijonon metodia" },
  ],
  starterFiles: [{ name: "main.py", language: "python", entry: true, content: `${header}\n\n` }],
  steps: [
    {
      id: "create-variable",
      title: { en: "Create a variable", fi: "Luo muuttuja" },
      instructions: {
        en: md`
          Create a variable named \`first_name\` and assign it a string with a first name — yours or any other.

          For example, this creates a variable named \`pet\`:

          ~~~python
          pet = "Kiki"
          ~~~
        `,
        fi: md`
          Luo muuttuja nimeltä \`first_name\` ja sijoita siihen merkkijono, jossa on etunimi – omasi tai mikä tahansa muu.

          Esimerkiksi tämä luo muuttujan nimeltä \`pet\`:

          ~~~python
          pet = "Kiki"
          ~~~
        `,
      },
      hints: [
        {
          en: "The variable name goes on the left of `=` and the value on the right.",
          fi: "Muuttujan nimi tulee `=`-merkin vasemmalle puolelle ja arvo oikealle.",
        },
        {
          en: 'Strings need quotes: `"Aino"` is a string, but `Aino` without quotes is treated as a variable name.',
          fi: 'Merkkijonot tarvitsevat lainausmerkit: `"Aino"` on merkkijono, mutta ilman lainausmerkkejä `Aino` tulkitaan muuttujan nimeksi.',
        },
      ],
      tests: [
        {
          id: "first-name-exists",
          label: {
            en: "A variable named `first_name` exists.",
            fi: "Muuttuja nimeltä `first_name` on olemassa.",
          },
          failure: {
            en: "We couldn't find a variable named `first_name`. Check the spelling: names are case-sensitive and use an underscore between the words.",
            fi: "Muuttujaa nimeltä `first_name` ei löytynyt. Tarkista kirjoitusasu: nimissä isot ja pienet kirjaimet ovat eri merkkejä, ja sanojen välissä on alaviiva.",
          },
          code: `expect(has_var("first_name"))`,
        },
        {
          id: "first-name-is-string",
          label: { en: "`first_name` holds a string.", fi: "`first_name` sisältää merkkijonon." },
          failure: {
            en: '`first_name` exists but doesn\'t hold text. Put the name inside quotes, like `"Aino"`.',
            fi: '`first_name` on olemassa, mutta se ei sisällä tekstiä. Kirjoita nimi lainausmerkkien sisään, esimerkiksi `"Aino"`.',
          },
          code: `expect_type(var("first_name"), str)`,
        },
        {
          id: "first-name-not-empty",
          label: { en: "The string is not empty.", fi: "Merkkijono ei ole tyhjä." },
          failure: {
            en: "`first_name` is an empty string. Write at least one letter between the quotes.",
            fi: "`first_name` on tyhjä merkkijono. Kirjoita lainausmerkkien väliin vähintään yksi kirjain.",
          },
          code: code`
            value = var("first_name")
            expect(isinstance(value, str) and value.strip() != "", actual=value)
          `,
        },
      ],
    },
    {
      id: "build-greeting",
      title: { en: "Build a greeting", fi: "Rakenna tervehdys" },
      starterFiles: [
        { name: "main.py", language: "python", entry: true, content: `${header}\nfirst_name = "Aino"\n` },
      ],
      instructions: {
        en: md`
          Create a variable named \`greeting\` that combines the text \`Hello, \` with \`first_name\` and an exclamation mark. If \`first_name\` is \`"Aino"\`, then \`greeting\` should be \`"Hello, Aino!"\`.

          Build \`greeting\` **from the \`first_name\` variable** instead of typing the name again. That way the greeting stays correct if the name changes. You can use \`+\` or an f-string — both work.
        `,
        fi: md`
          Luo muuttuja nimeltä \`greeting\`, joka yhdistää tekstin \`Hello, \`, muuttujan \`first_name\` ja huutomerkin. Jos \`first_name\` on \`"Aino"\`, muuttujan \`greeting\` arvon pitää olla \`"Hello, Aino!"\`.

          Rakenna \`greeting\` **muuttujasta \`first_name\`** sen sijaan, että kirjoittaisit nimen uudelleen. Näin tervehdys pysyy oikeana, vaikka nimi muuttuisi. Voit käyttää \`+\`-operaattoria tai f-merkkijonoa – kumpikin toimii.
        `,
      },
      hints: [
        {
          en: 'Remember the space after the comma: the text starts with `"Hello, "`.',
          fi: 'Muista välilyönti pilkun jälkeen: teksti alkaa `"Hello, "`.',
        },
        {
          en: 'With an f-string it looks like `f"Hello, {first_name}!"`.',
          fi: 'F-merkkijonona se näyttää tältä: `f"Hello, {first_name}!"`.',
        },
      ],
      tests: [
        {
          id: "greeting-exists",
          label: { en: "A variable named `greeting` exists.", fi: "Muuttuja nimeltä `greeting` on olemassa." },
          failure: {
            en: "We couldn't find a variable named `greeting`. Create it below `first_name`.",
            fi: "Muuttujaa nimeltä `greeting` ei löytynyt. Luo se muuttujan `first_name` alapuolelle.",
          },
          code: `expect(has_var("greeting"))`,
        },
        {
          id: "greeting-text",
          label: {
            en: "`greeting` is `Hello, ` followed by the name and `!`.",
            fi: "`greeting` on `Hello, `, jota seuraavat nimi ja `!`.",
          },
          failure: {
            en: "`greeting` doesn't match the expected text yet. Compare the comma, the space and the exclamation mark carefully.",
            fi: "`greeting` ei vielä vastaa odotettua tekstiä. Vertaa tarkasti pilkkua, välilyöntiä ja huutomerkkiä.",
          },
          code: `expect_equal(var("greeting"), "Hello, " + str(var("first_name")) + "!")`,
        },
        {
          id: "greeting-uses-variable",
          label: {
            en: "`greeting` is built from `first_name`.",
            fi: "`greeting` rakennetaan muuttujasta `first_name`.",
          },
          failure: {
            en: "When we changed `first_name` to another name, `greeting` didn't follow. Use the `first_name` variable instead of typing the name directly.",
            fi: "Kun vaihdoimme muuttujan `first_name` arvoksi toisen nimen, `greeting` ei muuttunut sen mukana. Käytä muuttujaa `first_name` sen sijaan, että kirjoittaisit nimen suoraan.",
          },
          code: code`
            for name in ["Ada", "Ilmari"]:
                expect_equal(run(first_name=name).var("greeting"), "Hello, " + name + "!")
          `,
        },
      ],
    },
    {
      id: "print-greeting",
      title: { en: "Print the greeting", fi: "Tulosta tervehdys" },
      starterFiles: [
        {
          name: "main.py",
          language: "python",
          entry: true,
          content: `${header}\nfirst_name = "Aino"\ngreeting = f"Hello, {first_name}!"\n`,
        },
      ],
      instructions: {
        en: md`
          Your program now stores a greeting, but it doesn't show anything yet. The \`print()\` function displays a value in the output.

          Print \`greeting\` so that it appears in the output panel. Press **Run** to see the result, then **Check answer**.
        `,
        fi: md`
          Ohjelmasi tallentaa nyt tervehdyksen, mutta ei vielä näytä mitään. Funktio \`print()\` näyttää arvon tulosteessa.

          Tulosta \`greeting\` niin, että se näkyy tulostepaneelissa. Paina **Suorita** nähdäksesi tuloksen ja sitten **Tarkista vastaus**.
        `,
      },
      hints: [
        {
          en: 'Put the variable name inside the parentheses: `print(greeting)`. Without quotes — otherwise Python prints the word "greeting" instead of its value.',
          fi: 'Kirjoita muuttujan nimi sulkeiden sisään: `print(greeting)`. Älä käytä lainausmerkkejä, muuten Python tulostaa sanan "greeting" eikä muuttujan arvoa.',
        },
      ],
      tests: [
        {
          id: "prints-greeting",
          label: { en: "The output contains the greeting.", fi: "Tulosteessa on tervehdys." },
          failure: {
            en: "The output doesn't contain your greeting on its own line. Add `print(greeting)` after the line that creates `greeting`.",
            fi: "Tulosteessa ei ole tervehdystäsi omalla rivillään. Lisää `print(greeting)` sen rivin jälkeen, jolla `greeting` luodaan.",
          },
          code: `expect_line(var("greeting"))`,
        },
        {
          id: "print-follows-name",
          label: {
            en: "The printed greeting changes when `first_name` changes.",
            fi: "Tulostettu tervehdys muuttuu, kun `first_name` muuttuu.",
          },
          failure: {
            en: "With a different `first_name`, the output didn't change. Print the `greeting` variable rather than a fixed text.",
            fi: "Kun `first_name` oli eri, tuloste ei muuttunut. Tulosta muuttuja `greeting` kiinteän tekstin sijaan.",
          },
          code: `expect_line("Hello, Ilmari!", run(first_name="Ilmari"))`,
        },
      ],
    },
    {
      id: "string-method",
      title: { en: "Use a string method", fi: "Käytä merkkijonon metodia" },
      starterFiles: [
        {
          name: "main.py",
          language: "python",
          entry: true,
          content: `${header}\nfirst_name = "Aino"\ngreeting = f"Hello, {first_name}!"\nprint(greeting)\n`,
        },
      ],
      instructions: {
        en: md`
          Methods are actions that belong to a value. You call them with a dot after the value, followed by parentheses: \`"hey".upper()\` returns \`"HEY"\`. The original string doesn't change — the method returns a new one.

          Create a variable named \`shout\` that holds \`greeting\` in uppercase, and print it after the greeting. With the name \`Aino\`, the output should be:

          ~~~
          Hello, Aino!
          HELLO, AINO!
          ~~~
        `,
        fi: md`
          Metodit ovat arvoon kuuluvia toimintoja. Niitä kutsutaan arvon perään kirjoitettavan pisteen ja sulkeiden avulla: \`"hey".upper()\` palauttaa \`"HEY"\`. Alkuperäinen merkkijono ei muutu – metodi palauttaa uuden merkkijonon.

          Luo muuttuja nimeltä \`shout\`, jossa on \`greeting\` isoilla kirjaimilla, ja tulosta se tervehdyksen jälkeen. Nimellä \`Aino\` tulosteen pitää olla:

          ~~~
          Hello, Aino!
          HELLO, AINO!
          ~~~
        `,
      },
      hints: [
        {
          en: "Call the method on the variable: `greeting.upper()`.",
          fi: "Kutsu metodia muuttujalle: `greeting.upper()`.",
        },
        {
          en: "Print `shout` with a second `print()` call on its own line.",
          fi: "Tulosta `shout` toisella `print()`-kutsulla omalla rivillään.",
        },
      ],
      tests: [
        {
          id: "shout-value",
          label: { en: "`shout` is `greeting` in uppercase.", fi: "`shout` on `greeting` isoilla kirjaimilla." },
          failure: {
            en: "`shout` doesn't match `greeting` in capital letters. Create it with `greeting.upper()`.",
            fi: "`shout` ei vastaa muuttujaa `greeting` isoilla kirjaimilla. Luo se lausekkeella `greeting.upper()`.",
          },
          code: `expect_equal(var("shout"), str(var("greeting")).upper())`,
        },
        {
          id: "uses-upper",
          label: { en: "The code uses the `upper()` method.", fi: "Koodi käyttää metodia `upper()`." },
          failure: {
            en: "We didn't find a call to `upper()`. Typing the capital letters yourself only works for one name — the method works for any text.",
            fi: "Koodista ei löytynyt `upper()`-kutsua. Isojen kirjainten kirjoittaminen itse toimii vain yhdelle nimelle – metodi toimii mille tahansa tekstille.",
          },
          code: `expect(calls("upper"))`,
        },
        {
          id: "output-order",
          label: {
            en: "The output shows the greeting, then the uppercase version.",
            fi: "Tulosteessa on ensin tervehdys ja sitten sama isoilla kirjaimilla.",
          },
          failure: {
            en: "The last two lines of the output should be the greeting followed by `shout`. Print `shout` after printing `greeting`.",
            fi: "Tulosteen kahden viimeisen rivin pitää olla tervehdys ja sen jälkeen `shout`. Tulosta `shout` sen jälkeen, kun olet tulostanut muuttujan `greeting`.",
          },
          code: `expect_equal(lines[-2:], [var("greeting"), var("shout")])`,
        },
        {
          id: "shout-follows-name",
          hidden: true,
          label: {
            en: "`shout` follows the name in `first_name`.",
            fi: "`shout` seuraa muuttujan `first_name` nimeä.",
          },
          failure: {
            en: "With a different name, `shout` didn't change. Build it from `greeting`.",
            fi: "Toisella nimellä `shout` ei muuttunut. Rakenna se muuttujasta `greeting`.",
          },
          code: `expect_equal(run(first_name="Ilmari").var("shout"), "HELLO, ILMARI!")`,
        },
      ],
    },
  ],
};
