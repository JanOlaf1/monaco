import { code, md } from "@/lib/content/md";
import type { ExerciseDefinition, TestDefinition } from "@/lib/content/types";

function weatherTest(
  id: string,
  celsius: number,
  expected: string,
  label: TestDefinition["label"],
  failure: TestDefinition["failure"],
): TestDefinition {
  return { id, label, failure, code: `t.equal(describeWeather(${celsius}), ${JSON.stringify(expected)});` };
}

export const weatherAdvisorLab: ExerciseDefinition = {
  id: "weather-advisor-lab",
  courseId: "javascript",
  chapterId: "js-functions",
  language: "javascript",
  type: "lab",
  difficulty: "beginner",
  estimatedMinutes: 25,
  title: { en: "Lab: Weather advisor", fi: "Harjoitustyö: Sääneuvoja" },
  summary: {
    en: "Write two functions that convert temperatures and describe the weather using conditionals.",
    fi: "Kirjoita kaksi funktiota, jotka muuntavat lämpötiloja ja kuvailevat säätä ehtorakenteiden avulla.",
  },
  concept: {
    en: md`
      Functions become really useful when they make decisions. An \`if\` statement runs code only when its condition is \`true\`:

      ~~~js
      function ticketPrice(age) {
        if (age < 7) {
          return 0;
        } else if (age < 18) {
          return 5;
        }
        return 10;
      }
      ~~~

      Conditions are checked from top to bottom, and \`return\` ends the function immediately, so only one price is returned. Comparison operators include \`<\`, \`<=\`, \`>\`, \`>=\`, \`===\` (strictly equal) and \`!==\` (not equal).

      Arithmetic works as in mathematics: \`*\` and \`/\` happen before \`+\` and \`-\`. Use parentheses when you want to make the order explicit.
    `,
    fi: md`
      Funktioista tulee todella hyödyllisiä, kun ne tekevät päätöksiä. \`if\`-lause suorittaa koodin vain, kun sen ehto on \`true\`:

      ~~~js
      function ticketPrice(age) {
        if (age < 7) {
          return 0;
        } else if (age < 18) {
          return 5;
        }
        return 10;
      }
      ~~~

      Ehdot tarkistetaan ylhäältä alaspäin, ja \`return\` lopettaa funktion heti, joten vain yksi hinta palautetaan. Vertailuoperaattoreita ovat esimerkiksi \`<\`, \`<=\`, \`>\`, \`>=\`, \`===\` (täsmälleen yhtä suuri) ja \`!==\` (eri suuri).

      Laskutoimitukset toimivat kuten matematiikassa: \`*\` ja \`/\` lasketaan ennen \`+\`- ja \`-\`-operaatioita. Sulkeilla voit tehdä laskujärjestyksen selväksi.
    `,
  },
  objectives: [
    {
      en: "Write functions that take a parameter and return a result",
      fi: "Kirjoittaa funktioita, jotka ottavat parametrin ja palauttavat tuloksen",
    },
    { en: "Use arithmetic operators in the right order", fi: "Käyttää laskuoperaattoreita oikeassa järjestyksessä" },
    {
      en: "Choose between values with if / else if / else",
      fi: "Valita arvojen välillä if-, else if- ja else-rakenteilla",
    },
    { en: "Handle boundary values precisely", fi: "Käsitellä raja-arvot tarkasti" },
  ],
  requirements: [
    {
      en: "`toFahrenheit(celsius)` returns the temperature in Fahrenheit: multiply by 9, divide by 5 and add 32.",
      fi: "`toFahrenheit(celsius)` palauttaa lämpötilan Fahrenheit-asteina: kerro yhdeksällä, jaa viidellä ja lisää 32.",
    },
    {
      en: '`describeWeather(celsius)` returns `"freezing"` below 0.',
      fi: '`describeWeather(celsius)` palauttaa `"freezing"`, kun lämpötila on alle 0.',
    },
    {
      en: 'It returns `"cold"` from 0 up to, but not including, 15.',
      fi: 'Se palauttaa `"cold"`, kun lämpötila on vähintään 0 mutta alle 15.',
    },
    {
      en: 'It returns `"mild"` from 15 up to, but not including, 25.',
      fi: 'Se palauttaa `"mild"`, kun lämpötila on vähintään 15 mutta alle 25.',
    },
    { en: 'It returns `"hot"` at 25 and above.', fi: 'Se palauttaa `"hot"`, kun lämpötila on 25 tai enemmän.' },
    {
      en: "Both functions **return** their results. Logging is optional.",
      fi: "Molemmat funktiot **palauttavat** tuloksensa. Tulostaminen on vapaaehtoista.",
    },
  ],
  starterFiles: [
    {
      name: "index.js",
      language: "javascript",
      entry: true,
      content: `${code`
        // Weather advisor
        // The tests call both functions with many different temperatures.

        function toFahrenheit(celsius) {
          // Return the temperature in Fahrenheit.
        }

        function describeWeather(celsius) {
          // Return "freezing", "cold", "mild" or "hot".
        }

        console.log(toFahrenheit(20));
        console.log(describeWeather(20));
      `}\n`,
    },
  ],
  expectedOutput: {
    text: "68\nmild",
    note: {
      en: "With the two console.log lines from the starter code.",
      fi: "Aloituskoodin kahdella console.log-rivillä.",
    },
  },
  steps: [
    {
      id: "lab",
      title: { en: "Build the weather helpers", fi: "Rakenna säätoiminnot" },
      instructions: {
        en: md`
          A weather app needs two helper functions, and you'll write both in \`index.js\`. The starter code already contains empty functions and two \`console.log\` calls, so you can try your code with **Run**.

          The tests call your functions with many different temperatures, including the exact boundary values 0, 15 and 25, so read the requirements carefully. The returned words are part of the code, so keep them in English exactly as written.
        `,
        fi: md`
          Sääsovellus tarvitsee kaksi apufunktiota, ja kirjoitat molemmat tiedostoon \`index.js\`. Aloituskoodissa on valmiina tyhjät funktiot ja kaksi \`console.log\`-kutsua, joten voit kokeilla koodiasi painamalla **Suorita**.

          Testit kutsuvat funktioitasi monilla eri lämpötiloilla, myös tarkoilla raja-arvoilla 0, 15 ja 25, joten lue vaatimukset huolellisesti. Palautettavat sanat ovat osa koodia, joten kirjoita ne englanniksi täsmälleen kuten ohjeessa.
        `,
      },
      hints: [
        {
          en: 'Order matters: if you check `celsius < 15` before `celsius < 0`, temperatures below zero return `"cold"`. Start from the lowest range.',
          fi: 'Järjestyksellä on väliä: jos tarkistat ehdon `celsius < 15` ennen ehtoa `celsius < 0`, pakkaslämpötilat palauttavat `"cold"`. Aloita pienimmästä välistä.',
        },
        {
          en: "For the conversion, `celsius * 9 / 5 + 32` works because multiplication and division happen before addition.",
          fi: "Muunnoksessa `celsius * 9 / 5 + 32` toimii, koska kerto- ja jakolasku lasketaan ennen yhteenlaskua.",
        },
      ],
      tests: [
        {
          id: "functions-defined",
          label: {
            en: "`toFahrenheit` and `describeWeather` are functions.",
            fi: "`toFahrenheit` ja `describeWeather` ovat funktioita.",
          },
          failure: {
            en: "Keep both functions from the starter code and don't rename them.",
            fi: "Säilytä molemmat aloituskoodin funktiot äläkä nimeä niitä uudelleen.",
          },
          code: code`
            t.isType(toFahrenheit, "function");
            t.isType(describeWeather, "function");
          `,
        },
        {
          id: "f-freezing-point",
          label: { en: "`toFahrenheit(0)` returns `32`.", fi: "`toFahrenheit(0)` palauttaa `32`." },
          failure: {
            en: "`toFahrenheit(0)` should return `32`. Make sure the function **returns** the converted value.",
            fi: "`toFahrenheit(0)`:n pitää palauttaa `32`. Varmista, että funktio **palauttaa** muunnetun arvon.",
          },
          code: `t.closeTo(toFahrenheit(0), 32);`,
        },
        {
          id: "f-boiling-point",
          label: { en: "`toFahrenheit(100)` returns `212`.", fi: "`toFahrenheit(100)` palauttaa `212`." },
          failure: {
            en: "`toFahrenheit(100)` should return `212`. Multiply by 9, divide by 5, then add 32.",
            fi: "`toFahrenheit(100)`:n pitää palauttaa `212`. Kerro yhdeksällä, jaa viidellä ja lisää sitten 32.",
          },
          code: `t.closeTo(toFahrenheit(100), 212);`,
        },
        {
          id: "f-negative",
          label: { en: "`toFahrenheit(-40)` returns `-40`.", fi: "`toFahrenheit(-40)` palauttaa `-40`." },
          failure: {
            en: "Negative temperatures should convert too: −40 °C is −40 °F.",
            fi: "Myös pakkaslämpötilojen pitää muuntua: −40 °C on −40 °F.",
          },
          code: `t.closeTo(toFahrenheit(-40), -40);`,
        },
        {
          id: "f-decimal",
          label: { en: "`toFahrenheit(37)` returns about `98.6`.", fi: "`toFahrenheit(37)` palauttaa noin `98.6`." },
          failure: {
            en: "`toFahrenheit(37)` should return approximately `98.6`. Don't round the result.",
            fi: "`toFahrenheit(37)`:n pitää palauttaa noin `98.6`. Älä pyöristä tulosta.",
          },
          code: `t.closeTo(toFahrenheit(37), 98.6, 1e-9);`,
        },
        weatherTest(
          "w-freezing",
          -5,
          "freezing",
          { en: '`describeWeather(-5)` returns `"freezing"`.', fi: '`describeWeather(-5)` palauttaa `"freezing"`.' },
          {
            en: 'Temperatures below 0 should return `"freezing"`.',
            fi: 'Alle 0 asteen lämpötilojen pitää palauttaa `"freezing"`.',
          },
        ),
        weatherTest(
          "w-zero",
          0,
          "cold",
          { en: '`describeWeather(0)` returns `"cold"`.', fi: '`describeWeather(0)` palauttaa `"cold"`.' },
          {
            en: '0 is not *below* 0, so it should be `"cold"`. Check whether you used `<` or `<=`.',
            fi: '0 ei ole *alle* 0, joten tuloksen pitää olla `"cold"`. Tarkista, käytitkö operaattoria `<` vai `<=`.',
          },
        ),
        weatherTest(
          "w-cold",
          10,
          "cold",
          { en: '`describeWeather(10)` returns `"cold"`.', fi: '`describeWeather(10)` palauttaa `"cold"`.' },
          { en: '10 °C should be `"cold"`.', fi: '10 °C:n pitää olla `"cold"`.' },
        ),
        weatherTest(
          "w-mild-boundary",
          15,
          "mild",
          { en: '`describeWeather(15)` returns `"mild"`.', fi: '`describeWeather(15)` palauttaa `"mild"`.' },
          {
            en: '15 is where `"mild"` starts. Check the comparison at 15.',
            fi: '`"mild"` alkaa 15 asteesta. Tarkista vertailu kohdassa 15.',
          },
        ),
        weatherTest(
          "w-hot-boundary",
          25,
          "hot",
          { en: '`describeWeather(25)` returns `"hot"`.', fi: '`describeWeather(25)` palauttaa `"hot"`.' },
          {
            en: '25 and above should be `"hot"`. Check the comparison at 25.',
            fi: '25 astetta ja enemmän pitää olla `"hot"`. Tarkista vertailu kohdassa 25.',
          },
        ),
        {
          id: "uses-conditional",
          label: {
            en: "`describeWeather` makes decisions with a conditional.",
            fi: "`describeWeather` tekee päätöksiä ehtorakenteella.",
          },
          failure: {
            en: "Use `if` / `else if` / `else` (or a `switch` or the `? :` operator) to choose the description.",
            fi: "Valitse kuvaus rakenteella `if` / `else if` / `else` (tai `switch`-lauseella tai `? :`-operaattorilla).",
          },
          code: `t.ok(t.ast.has("IfStatement") || t.ast.has("ConditionalExpression") || t.ast.has("SwitchStatement"));`,
        },
        {
          id: "hidden-decimals",
          hidden: true,
          label: {
            en: "Handles decimal temperatures near the limits.",
            fi: "Käsittelee desimaalilämpötilat rajojen lähellä.",
          },
          failure: {
            en: "Some temperatures with decimals get the wrong description. Make sure every temperature falls into exactly one range.",
            fi: "Jotkin desimaalilämpötilat saavat väärän kuvauksen. Varmista, että jokainen lämpötila osuu täsmälleen yhteen väliin.",
          },
          code: code`
            t.equal(describeWeather(-0.5), "freezing");
            t.equal(describeWeather(14.9), "cold");
            t.equal(describeWeather(24.99), "mild");
          `,
        },
        {
          id: "hidden-extremes",
          hidden: true,
          label: {
            en: "Handles very cold and very hot temperatures.",
            fi: "Käsittelee hyvin kylmät ja hyvin kuumat lämpötilat.",
          },
          failure: {
            en: "Extreme temperatures give a wrong result.",
            fi: "Äärimmäiset lämpötilat antavat väärän tuloksen.",
          },
          code: code`
            t.equal(describeWeather(-30), "freezing");
            t.equal(describeWeather(41), "hot");
            t.closeTo(toFahrenheit(-17.5), 0.5);
          `,
        },
      ],
    },
  ],
};
