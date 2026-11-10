import { l } from "@/lib/content/factories";
import { md } from "@/lib/content/md";
import type { CourseDefinition } from "@/lib/content/types";

export const pythonCourse: CourseDefinition = {
  id: "python",
  language: "python",
  status: "available",
  title: l("Python Fundamentals", "Pythonin perusteet"),
  summary: l(
    "From your first print() to small programs that make decisions and process data.",
    "Ensimmäisestä print()-kutsusta pieniin ohjelmiin, jotka tekevät päätöksiä ja käsittelevät tietoa.",
  ),
  description: l(
    md`
      Python is a popular first programming language: readable, versatile and used everywhere from data analysis to automation. Each chapter is a short series of challenges, and every chapter ends with a bigger step forward.
    `,
    md`
      Python on suosittu ensimmäinen ohjelmointikieli: helppolukuinen, monipuolinen ja käytössä kaikkialla data-analyysistä automaatioon. Jokainen luku on lyhyt sarja haasteita, ja jokainen luku vie sinua askeleen eteenpäin.
    `,
  ),
  chapters: [
    {
      id: "py-intro",
      status: "available",
      theme: { icon: "compass", tone: "teal" },
      title: l("Hello, Python", "Hei, Python"),
      summary: l("Write and run your first programs.", "Kirjoita ja suorita ensimmäiset ohjelmasi."),
      exerciseIds: ["py-hello-world", "py-multiple-prints"],
    },
    {
      id: "py-strings",
      status: "available",
      theme: { icon: "box", tone: "sky" },
      title: l("Variables and strings", "Muuttujat ja merkkijonot"),
      summary: l("Store values and work with text.", "Tallenna arvoja ja käsittele tekstiä."),
      exerciseIds: ["variables-and-strings", "py-string-length"],
    },
    {
      id: "py-numbers",
      status: "available",
      theme: { icon: "calculator", tone: "violet" },
      title: l("Numbers and operators", "Luvut ja operaattorit"),
      summary: l("Calculate with Python.", "Laske Pythonilla."),
      exerciseIds: ["py-shopping-total", "py-time-converter"],
    },
    {
      id: "py-booleans",
      status: "available",
      theme: { icon: "toggle", tone: "amber" },
      title: l("True or false", "Tosi vai epätosi"),
      summary: l("Compare values and combine conditions.", "Vertaile arvoja ja yhdistä ehtoja."),
      exerciseIds: ["py-comparisons", "py-logical-operators"],
    },
    {
      id: "py-conditions",
      status: "available",
      theme: { icon: "split", tone: "rose" },
      title: l("Making decisions", "Päätösten tekeminen"),
      summary: l("Let your program choose with if, elif and else.", "Anna ohjelmasi valita rakenteilla if, elif ja else."),
      exerciseIds: ["py-if-else", "py-grade-letters", "shipping-cost-lab"],
    },
    {
      id: "py-functions",
      status: "available",
      theme: { icon: "function", tone: "lime" },
      title: l("Functions", "Funktiot"),
      summary: l("Package code into reusable functions.", "Kokoa koodia uudelleenkäytettäviksi funktioiksi."),
      exerciseIds: ["py-greet-function", "py-area-function"],
    },
    {
      id: "py-loops",
      status: "available",
      theme: { icon: "repeat", tone: "indigo" },
      title: l("Loops", "Silmukat"),
      summary: l("Repeat work with for and while.", "Toista työtä for- ja while-silmukoilla."),
      exerciseIds: ["py-count-up", "py-sum-numbers", "py-countdown"],
    },
    {
      id: "py-collections",
      status: "available",
      theme: { icon: "list", tone: "orange" },
      title: l("Lists and dictionaries", "Listat ja sanakirjat"),
      summary: l("Keep many values together.", "Säilytä monta arvoa yhdessä."),
      exerciseIds: ["py-list-append", "py-price-lookup"],
    },
    {
      id: "py-text",
      status: "available",
      theme: { icon: "type", tone: "teal" },
      title: l("Working with text", "Tekstin käsittely"),
      summary: l("Clean, slice and transform strings.", "Siisti, paloittele ja muunna merkkijonoja."),
      exerciseIds: ["py-clean-name", "py-slicing"],
    },
    {
      id: "py-projects",
      status: "available",
      theme: { icon: "rocket", tone: "violet" },
      title: l("Mini-projects", "Miniprojektit"),
      summary: l("Put it all together in bigger labs.", "Yhdistä kaikki opittu isommissa harjoitustöissä."),
      exerciseIds: ["py-word-counter-lab", "py-score-report-lab"],
    },
  ],
};

export const javascriptCourse: CourseDefinition = {
  id: "javascript",
  language: "javascript",
  status: "available",
  title: l("JavaScript Foundations", "JavaScriptin perusteet"),
  summary: l(
    "Learn the language of the web, from your first console.log() to small apps.",
    "Opi webin kieli ensimmäisestä console.log()-kutsusta pieniin sovelluksiin.",
  ),
  description: l(
    md`
      JavaScript runs in every web browser and powers interactive sites, servers and apps. This path starts from values and variables and builds up to functions, arrays and objects — one small challenge at a time.
    `,
    md`
      JavaScript toimii jokaisessa verkkoselaimessa, ja sillä tehdään interaktiivisia sivustoja, palvelimia ja sovelluksia. Tämä polku alkaa arvoista ja muuttujista ja etenee funktioihin, taulukoihin ja olioihin – yksi pieni haaste kerrallaan.
    `,
  ),
  chapters: [
    {
      id: "js-intro",
      status: "available",
      theme: { icon: "compass", tone: "teal" },
      title: l("Hello, JavaScript", "Hei, JavaScript"),
      summary: l("Write and run your first programs.", "Kirjoita ja suorita ensimmäiset ohjelmasi."),
      exerciseIds: ["js-hello-console", "js-multiple-logs"],
    },
    {
      id: "js-variables",
      status: "available",
      theme: { icon: "box", tone: "sky" },
      title: l("Variables and data types", "Muuttujat ja tietotyypit"),
      summary: l("Store and update values.", "Tallenna ja päivitä arvoja."),
      exerciseIds: ["js-let-update", "js-data-types"],
    },
    {
      id: "js-operators",
      status: "available",
      theme: { icon: "calculator", tone: "violet" },
      title: l("Operators and comparisons", "Operaattorit ja vertailut"),
      summary: l("Calculate and compare.", "Laske ja vertaile."),
      exerciseIds: ["js-arithmetic", "js-comparisons"],
    },
    {
      id: "js-conditions",
      status: "available",
      theme: { icon: "split", tone: "rose" },
      title: l("Conditional statements", "Ehtolauseet"),
      summary: l("Make decisions with if and logical operators.", "Tee päätöksiä if-lauseilla ja loogisilla operaattoreilla."),
      exerciseIds: ["js-if-else", "js-logical-operators"],
    },
    {
      id: "js-functions",
      status: "available",
      theme: { icon: "function", tone: "lime" },
      title: l("Functions", "Funktiot"),
      summary: l("Write reusable code that returns results.", "Kirjoita uudelleenkäytettävää koodia, joka palauttaa tuloksia."),
      exerciseIds: ["greeting-functions", "js-rectangle-area", "weather-advisor-lab"],
    },
    {
      id: "js-loops",
      status: "available",
      theme: { icon: "repeat", tone: "indigo" },
      title: l("Loops", "Silmukat"),
      summary: l("Repeat work automatically.", "Toista työtä automaattisesti."),
      exerciseIds: ["js-for-loop", "js-sum-to"],
    },
    {
      id: "js-arrays",
      status: "available",
      theme: { icon: "list", tone: "orange" },
      title: l("Arrays", "Taulukot"),
      summary: l("Work with lists of values.", "Käsittele arvojen listoja."),
      exerciseIds: ["js-array-push", "js-filter-even"],
    },
    {
      id: "js-objects",
      status: "available",
      theme: { icon: "braces", tone: "amber" },
      title: l("Objects", "Oliot"),
      summary: l("Group related data together.", "Ryhmittele toisiinsa liittyvät tiedot."),
      exerciseIds: ["js-object-basics", "js-describe-pet"],
    },
    {
      id: "js-strings",
      status: "available",
      theme: { icon: "type", tone: "teal" },
      title: l("String manipulation", "Merkkijonojen käsittely"),
      summary: l("Transform and analyse text.", "Muunna ja analysoi tekstiä."),
      exerciseIds: ["js-shout", "js-initials"],
    },
    {
      id: "js-projects",
      status: "available",
      theme: { icon: "rocket", tone: "violet" },
      title: l("Mini-projects", "Miniprojektit"),
      summary: l("Build small apps in bigger labs.", "Rakenna pieniä sovelluksia isommissa harjoitustöissä."),
      exerciseIds: ["js-shopping-cart-lab", "js-task-list-lab"],
    },
  ],
};

export const typescriptCourse: CourseDefinition = {
  id: "typescript",
  language: "typescript",
  status: "planned",
  title: l("TypeScript Essentials", "TypeScriptin perusteet"),
  summary: l(
    "Add types to JavaScript to catch mistakes before your code runs.",
    "Lisää JavaScriptiin tyypit ja löydä virheet ennen kuin koodi suoritetaan.",
  ),
  description: l(
    md`
      TypeScript is JavaScript with a type system. Types describe what kind of values your code expects, so the editor can warn you about mistakes before the program runs.

      This course is being built. Its exercises will compile your code, show type errors and run automated tests.
    `,
    md`
      TypeScript on JavaScript, johon on lisätty tyyppijärjestelmä. Tyypit kuvaavat, millaisia arvoja koodisi odottaa, joten editori voi varoittaa virheistä ennen kuin ohjelma suoritetaan.

      Tätä kurssia rakennetaan. Sen harjoitukset kääntävät koodisi, näyttävät tyyppivirheet ja suorittavat automaattiset testit.
    `,
  ),
  chapters: [
    {
      id: "ts-annotations",
      status: "planned",
      theme: { icon: "type", tone: "sky" },
      title: l("Type annotations", "Tyyppimerkinnät"),
      summary: l(
        "Describe values with string, number, boolean and arrays.",
        "Kuvaile arvoja tyypeillä string, number, boolean ja taulukot.",
      ),
      exerciseIds: [],
    },
    {
      id: "ts-objects",
      status: "planned",
      theme: { icon: "braces", tone: "indigo" },
      title: l("Objects and interfaces", "Oliot ja rajapinnat"),
      summary: l(
        "Describe the shape of objects with interfaces and type aliases.",
        "Kuvaile olioiden rakenne rajapinnoilla ja tyyppialiaksilla.",
      ),
      exerciseIds: [],
    },
    {
      id: "ts-unions",
      status: "planned",
      theme: { icon: "split", tone: "violet" },
      title: l("Union types and narrowing", "Yhdistetyypit ja tyypin rajaus"),
      summary: l(
        "Handle values that can be one of several types.",
        "Käsittele arvoja, jotka voivat olla jotain useista tyypeistä.",
      ),
      exerciseIds: [],
    },
  ],
};

export const reactCourse: CourseDefinition = {
  id: "react",
  language: "react",
  status: "planned",
  title: l("React Basics", "Reactin perusteet"),
  summary: l(
    "Build user interfaces from small, reusable components.",
    "Rakenna käyttöliittymiä pienistä, uudelleenkäytettävistä komponenteista.",
  ),
  description: l(
    md`
      React is a library for building user interfaces out of components. In this course you'll write components and see them rendered in a live preview next to your code.

      This course is being built. The live preview and automated tests for React are not available yet.
    `,
    md`
      React on kirjasto, jolla käyttöliittymät rakennetaan komponenteista. Tällä kurssilla kirjoitat komponentteja ja näet ne renderöitynä koodisi vieressä olevassa esikatselussa.

      Tätä kurssia rakennetaan. Reactin esikatselu ja automaattiset testit eivät ole vielä käytettävissä.
    `,
  ),
  chapters: [
    {
      id: "react-components",
      status: "planned",
      theme: { icon: "box", tone: "sky" },
      title: l("Components and JSX", "Komponentit ja JSX"),
      summary: l(
        "Describe UI with JSX and split it into components.",
        "Kuvaile käyttöliittymä JSX:llä ja jaa se komponentteihin.",
      ),
      exerciseIds: [],
    },
    {
      id: "react-props",
      status: "planned",
      theme: { icon: "braces", tone: "teal" },
      title: l("Props", "Propsit"),
      summary: l("Pass data into components.", "Välitä tietoa komponenteille."),
      exerciseIds: [],
    },
    {
      id: "react-state",
      status: "planned",
      theme: { icon: "toggle", tone: "amber" },
      title: l("State with useState", "Tila ja useState"),
      summary: l("Make components interactive with state.", "Tee komponenteista interaktiivisia tilan avulla."),
      exerciseIds: [],
    },
  ],
};
