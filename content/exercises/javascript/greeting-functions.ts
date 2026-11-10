import { code, md } from "@/lib/content/md";
import type { ExerciseDefinition } from "@/lib/content/types";

const header = code`
  // Variables and functions
  // Write your code below this line.
`;

export const greetingFunctions: ExerciseDefinition = {
  id: "greeting-functions",
  courseId: "javascript",
  chapterId: "js-functions",
  language: "javascript",
  type: "challenge",
  difficulty: "beginner",
  estimatedMinutes: 20,
  title: { en: "Variables and functions", fi: "Muuttujat ja funktiot" },
  summary: {
    en: "Store a value in a constant, write a function that returns a greeting and use it.",
    fi: "Tallenna arvo vakioon, kirjoita tervehdyksen palauttava funktio ja käytä sitä.",
  },
  concept: {
    en: md`
      In JavaScript you store values in **variables**. Use \`const\` for a value that won't be reassigned and \`let\` for one that will:

      ~~~js
      const city = "Oulu";
      let visits = 1;
      ~~~

      A **function** is a reusable piece of code. It can take **parameters** (inputs) and **return** a value (output):

      ~~~js
      function double(number) {
        return number * 2;
      }

      double(4); // 8
      ~~~

      Calling \`double(4)\` runs the function with \`number\` set to \`4\`, and \`return\` hands the result back to the code that called it. Returning is different from printing: \`console.log()\` only shows a value in the console, while \`return\` gives the value back so other code can use it.

      **Template literals** are strings written between backticks. They let you insert values with \`\${...}\`:

      ~~~js
      const message = \`Hello from \${city}\`;
      ~~~
    `,
    fi: md`
      JavaScriptissä arvot tallennetaan **muuttujiin**. Käytä avainsanaa \`const\` arvolle, jota ei sijoiteta uudelleen, ja avainsanaa \`let\` arvolle, joka muuttuu:

      ~~~js
      const city = "Oulu";
      let visits = 1;
      ~~~

      **Funktio** on uudelleenkäytettävä koodin pala. Se voi ottaa vastaan **parametreja** (syötteitä) ja **palauttaa** arvon (tuloksen):

      ~~~js
      function double(number) {
        return number * 2;
      }

      double(4); // 8
      ~~~

      Kutsu \`double(4)\` suorittaa funktion niin, että \`number\` on \`4\`, ja \`return\` palauttaa tuloksen kutsuneelle koodille. Palauttaminen on eri asia kuin tulostaminen: \`console.log()\` vain näyttää arvon konsolissa, kun taas \`return\` antaa arvon takaisin, jotta muu koodi voi käyttää sitä.

      **Template-literaalit** ovat merkkijonoja, jotka kirjoitetaan takahipsujen väliin. Niihin voi lisätä arvoja merkinnällä \`\${...}\`:

      ~~~js
      const message = \`Hello from \${city}\`;
      ~~~
    `,
  },
  objectives: [
    { en: "Declare constants with const", fi: "Esitellä vakioita const-avainsanalla" },
    {
      en: "Write a function with a parameter and a return value",
      fi: "Kirjoittaa funktion, jolla on parametri ja paluuarvo",
    },
    {
      en: "Build strings with template literals or +",
      fi: "Rakentaa merkkijonoja template-literaaleilla tai +-operaattorilla",
    },
    {
      en: "Understand the difference between returning and logging",
      fi: "Ymmärtää palauttamisen ja tulostamisen eron",
    },
    { en: "Give a parameter a default value", fi: "Antaa parametrille oletusarvon" },
  ],
  starterFiles: [{ name: "index.js", language: "javascript", entry: true, content: `${header}\n\n` }],
  steps: [
    {
      id: "store-name",
      title: { en: "Store a name", fi: "Tallenna nimi" },
      instructions: {
        en: md`
          Declare a constant named \`learnerName\` and assign it a string with any name, for example your own.

          ~~~js
          const favoriteColor = "teal";
          ~~~

          The example above declares a different constant — yours must be called \`learnerName\`. Note the capital **N**: JavaScript names are case-sensitive.
        `,
        fi: md`
          Esittele vakio nimeltä \`learnerName\` ja sijoita siihen merkkijono, jossa on mikä tahansa nimi, esimerkiksi omasi.

          ~~~js
          const favoriteColor = "teal";
          ~~~

          Yllä oleva esimerkki esittelee eri vakion – sinun vakiosi nimen pitää olla \`learnerName\`. Huomaa iso **N**: JavaScriptissä isot ja pienet kirjaimet ovat eri merkkejä.
        `,
      },
      hints: [
        {
          en: "A constant is declared with `const`, a name, `=` and a value.",
          fi: "Vakio esitellään kirjoittamalla `const`, nimi, `=` ja arvo.",
        },
        { en: 'Strings go inside quotes: `"Ada"`.', fi: 'Merkkijonot kirjoitetaan lainausmerkkien sisään: `"Ada"`.' },
      ],
      tests: [
        {
          id: "declared-with-const",
          label: {
            en: "`learnerName` is declared with `const`.",
            fi: "`learnerName` on esitelty avainsanalla `const`.",
          },
          failure: {
            en: "We couldn't find `const learnerName = ...` at the top level of your code. Check the spelling and use the `const` keyword.",
            fi: "Koodin ylätasolta ei löytynyt riviä `const learnerName = ...`. Tarkista kirjoitusasu ja käytä avainsanaa `const`.",
          },
          code: `t.equal(t.ast.declarationKind("learnerName"), "const");`,
        },
        {
          id: "is-nonempty-string",
          label: {
            en: "`learnerName` holds a non-empty string.",
            fi: "`learnerName` sisältää merkkijonon, joka ei ole tyhjä.",
          },
          failure: {
            en: '`learnerName` should be text inside quotes, such as `"Ada"`.',
            fi: '`learnerName`-vakion pitää olla lainausmerkkien sisällä olevaa tekstiä, kuten `"Ada"`.',
          },
          code: code`
            t.isType(learnerName, "string");
            t.ok(learnerName.trim().length > 0);
          `,
        },
      ],
    },
    {
      id: "write-function",
      title: { en: "Write a function", fi: "Kirjoita funktio" },
      starterFiles: [
        { name: "index.js", language: "javascript", entry: true, content: `${header}\nconst learnerName = "Ada";\n` },
      ],
      instructions: {
        en: md`
          Write a function named \`greet\` that takes one parameter, \`name\`, and **returns** the text \`Hello, <name>!\`.

          For example, \`greet("Ada")\` should return \`"Hello, Ada!"\` and \`greet("Matti")\` should return \`"Hello, Matti!"\`.

          You can write a function declaration (\`function greet(name) { ... }\`) or an arrow function (\`const greet = (name) => ...\`), and build the text with \`+\` or a template literal.
        `,
        fi: md`
          Kirjoita funktio nimeltä \`greet\`, joka ottaa yhden parametrin \`name\` ja **palauttaa** tekstin \`Hello, <name>!\`.

          Esimerkiksi \`greet("Ada")\` palauttaa \`"Hello, Ada!"\` ja \`greet("Matti")\` palauttaa \`"Hello, Matti!"\`.

          Voit kirjoittaa funktion esittelynä (\`function greet(name) { ... }\`) tai nuolifunktiona (\`const greet = (name) => ...\`) ja rakentaa tekstin \`+\`-operaattorilla tai template-literaalilla.
        `,
      },
      hints: [
        {
          en: "Inside the function, `name` holds whatever value the caller passed in.",
          fi: "Funktion sisällä `name` sisältää sen arvon, jonka kutsuja antoi.",
        },
        {
          en: "Use `return` — a `console.log` inside the function would only print the text, not give it back.",
          fi: "Käytä `return`-lausetta – funktion sisällä oleva `console.log` vain tulostaisi tekstin eikä palauttaisi sitä.",
        },
      ],
      tests: [
        {
          id: "greet-is-function",
          label: { en: "`greet` is a function.", fi: "`greet` on funktio." },
          failure: {
            en: "We couldn't find a function named `greet`. Define it with `function greet(name) { ... }` or as an arrow function.",
            fi: "Funktiota nimeltä `greet` ei löytynyt. Määrittele se muodossa `function greet(name) { ... }` tai nuolifunktiona.",
          },
          code: `t.isType(greet, "function");`,
        },
        {
          id: "greet-returns",
          label: { en: "`greet` returns a value.", fi: "`greet` palauttaa arvon." },
          failure: {
            en: '`greet("Ada")` returned `undefined`. Use `return` to give the text back; `console.log` only prints it.',
            fi: '`greet("Ada")` palautti arvon `undefined`. Palauta teksti `return`-lauseella; `console.log` vain tulostaa sen.',
          },
          code: `t.notEqual(greet("Ada"), undefined);`,
        },
        {
          id: "greet-ada",
          label: { en: '`greet("Ada")` returns `"Hello, Ada!"`.', fi: '`greet("Ada")` palauttaa `"Hello, Ada!"`.' },
          failure: {
            en: "The returned text isn't quite right. Compare the comma, the space and the exclamation mark.",
            fi: "Palautettu teksti ei ole aivan oikein. Vertaa pilkkua, välilyöntiä ja huutomerkkiä.",
          },
          code: `t.equal(greet("Ada"), "Hello, Ada!");`,
        },
        {
          id: "greet-any-name",
          label: { en: "`greet` works for any name.", fi: "`greet` toimii millä tahansa nimellä." },
          failure: {
            en: "`greet` gives the wrong result for some names. Use the `name` parameter instead of a fixed name.",
            fi: "`greet` antaa väärän tuloksen joillakin nimillä. Käytä parametria `name` kiinteän nimen sijaan.",
          },
          code: code`
            t.equal(greet("Matti"), "Hello, Matti!");
            t.equal(greet("Li"), "Hello, Li!");
          `,
        },
      ],
    },
    {
      id: "use-function",
      title: { en: "Use the function", fi: "Käytä funktiota" },
      starterFiles: [
        {
          name: "index.js",
          language: "javascript",
          entry: true,
          content: `${header}\nconst learnerName = "Ada";\n\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n`,
        },
      ],
      instructions: {
        en: md`
          A function does nothing until it is called. Call \`greet\` with \`learnerName\` as the argument and log the result with \`console.log()\`.

          Press **Run** — you should see your greeting in the console.
        `,
        fi: md`
          Funktio ei tee mitään ennen kuin sitä kutsutaan. Kutsu funktiota \`greet\` niin, että argumenttina on \`learnerName\`, ja tulosta tulos funktiolla \`console.log()\`.

          Paina **Suorita** – tervehdyksesi pitäisi näkyä konsolissa.
        `,
      },
      hints: [
        {
          en: "Calls can be nested: `console.log(greet(learnerName))` first calls `greet`, then logs what it returned.",
          fi: "Kutsuja voi sisäkkäistää: `console.log(greet(learnerName))` kutsuu ensin funktiota `greet` ja tulostaa sitten sen palauttaman arvon.",
        },
      ],
      tests: [
        {
          id: "logs-greeting",
          label: {
            en: "The console shows the greeting for `learnerName`.",
            fi: "Konsolissa näkyy tervehdys vakion `learnerName` nimellä.",
          },
          failure: {
            en: "We didn't find `Hello, <your name>!` in the console output. Log `greet(learnerName)` with `console.log()`.",
            fi: "Konsolin tulosteesta ei löytynyt riviä `Hello, <nimesi>!`. Tulosta `greet(learnerName)` funktiolla `console.log()`.",
          },
          code: `t.logged(greet(learnerName));`,
        },
        {
          id: "calls-greet",
          label: {
            en: "The greeting comes from calling `greet`.",
            fi: "Tervehdys syntyy kutsumalla funktiota `greet`.",
          },
          failure: {
            en: "Your code doesn't call `greet`. Use the function instead of writing the greeting by hand.",
            fi: "Koodisi ei kutsu funktiota `greet`. Käytä funktiota sen sijaan, että kirjoittaisit tervehdyksen käsin.",
          },
          code: `t.ok(t.ast.calls("greet"));`,
        },
      ],
    },
    {
      id: "default-parameter",
      title: { en: "Add a default value", fi: "Lisää oletusarvo" },
      starterFiles: [
        {
          name: "index.js",
          language: "javascript",
          entry: true,
          content: `${header}\nconst learnerName = "Ada";\n\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet(learnerName));\n`,
        },
      ],
      instructions: {
        en: md`
          What if someone calls \`greet()\` without a name? Right now it returns \`"Hello, undefined!"\`.

          A parameter can have a **default value** that is used when no argument is given:

          ~~~js
          function repeat(text, times = 2) {
            return text.repeat(times);
          }
          ~~~

          Give \`name\` the default value \`"friend"\`, so that \`greet()\` returns \`"Hello, friend!"\`. Calls that pass a name must keep working.
        `,
        fi: md`
          Entä jos joku kutsuu \`greet()\` ilman nimeä? Nyt funktio palauttaa \`"Hello, undefined!"\`.

          Parametrilla voi olla **oletusarvo**, jota käytetään, kun argumenttia ei anneta:

          ~~~js
          function repeat(text, times = 2) {
            return text.repeat(times);
          }
          ~~~

          Anna parametrille \`name\` oletusarvo \`"friend"\`, jotta \`greet()\` palauttaa \`"Hello, friend!"\`. Kutsujen, joissa nimi annetaan, pitää toimia edelleen.
        `,
      },
      hints: [
        {
          en: 'Write the default right after the parameter name: `function greet(name = "friend")`.',
          fi: 'Kirjoita oletusarvo heti parametrin nimen perään: `function greet(name = "friend")`.',
        },
      ],
      tests: [
        {
          id: "default-friend",
          label: { en: '`greet()` returns `"Hello, friend!"`.', fi: '`greet()` palauttaa `"Hello, friend!"`.' },
          failure: {
            en: 'Calling `greet()` without an argument should return `"Hello, friend!"`. Add `= "friend"` after the parameter name.',
            fi: 'Kun `greet()` kutsutaan ilman argumenttia, sen pitää palauttaa `"Hello, friend!"`. Lisää parametrin nimen perään `= "friend"`.',
          },
          code: `t.equal(greet(), "Hello, friend!");`,
        },
        {
          id: "still-greets-names",
          label: {
            en: '`greet("Ada")` still returns `"Hello, Ada!"`.',
            fi: '`greet("Ada")` palauttaa yhä `"Hello, Ada!"`.',
          },
          failure: {
            en: "Adding the default broke calls that pass a name. A default value is only used when the argument is missing.",
            fi: "Oletusarvon lisääminen rikkoi kutsut, joissa nimi annetaan. Oletusarvoa käytetään vain, kun argumentti puuttuu.",
          },
          code: code`
            t.equal(greet("Ada"), "Hello, Ada!");
            t.equal(greet("Matti"), "Hello, Matti!");
          `,
        },
        {
          id: "still-logs",
          label: {
            en: "The console still shows the greeting for `learnerName`.",
            fi: "Konsolissa näkyy yhä tervehdys vakion `learnerName` nimellä.",
          },
          failure: {
            en: "Keep the `console.log(greet(learnerName))` line from the previous step.",
            fi: "Säilytä edellisen vaiheen rivi `console.log(greet(learnerName))`.",
          },
          code: `t.logged(greet(learnerName));`,
        },
      ],
    },
  ],
};
