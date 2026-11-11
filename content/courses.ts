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
      level: "beginner",
      skills: ["py.output"],
      theme: { icon: "compass", tone: "teal" },
      title: l("Hello, Python", "Hei, Python"),
      summary: l("Write and run your first programs.", "Kirjoita ja suorita ensimmäiset ohjelmasi."),
      exerciseIds: ["py-hello-world", "py-multiple-prints"],
    },
    {
      id: "py-strings",
      status: "available",
      level: "beginner",
      skills: ["py.variables"],
      theme: { icon: "box", tone: "sky" },
      title: l("Variables and strings", "Muuttujat ja merkkijonot"),
      summary: l("Store values and work with text.", "Tallenna arvoja ja käsittele tekstiä."),
      exerciseIds: ["variables-and-strings", "py-string-length"],
    },
    {
      id: "py-numbers",
      status: "available",
      level: "beginner",
      skills: ["py.numbers"],
      theme: { icon: "calculator", tone: "violet" },
      title: l("Numbers and operators", "Luvut ja operaattorit"),
      summary: l("Calculate with Python.", "Laske Pythonilla."),
      exerciseIds: ["py-shopping-total", "py-time-converter"],
    },
    {
      id: "py-booleans",
      status: "available",
      level: "beginner",
      skills: ["py.booleans"],
      theme: { icon: "toggle", tone: "amber" },
      title: l("True or false", "Tosi vai epätosi"),
      summary: l("Compare values and combine conditions.", "Vertaile arvoja ja yhdistä ehtoja."),
      exerciseIds: ["py-comparisons", "py-logical-operators"],
    },
    {
      id: "py-conditions",
      status: "available",
      level: "beginner",
      skills: ["py.conditions"],
      theme: { icon: "split", tone: "rose" },
      title: l("Making decisions", "Päätösten tekeminen"),
      summary: l("Let your program choose with if, elif and else.", "Anna ohjelmasi valita rakenteilla if, elif ja else."),
      exerciseIds: ["py-if-else", "py-grade-letters", "shipping-cost-lab"],
    },
    {
      id: "py-checkpoint-basics",
      kind: "checkpoint",
      status: "available",
      level: "beginner",
      skills: ["py.variables", "py.numbers", "py.booleans", "py.conditions"],
      theme: { icon: "flag", tone: "teal" },
      title: l("Checkpoint: the basics", "Tarkistuspiste: perusteet"),
      summary: l(
        "One task that combines variables, numbers, comparisons and conditions.",
        "Yksi tehtävä, joka yhdistää muuttujat, luvut, vertailut ja ehdot.",
      ),
      exerciseIds: ["py-checkpoint-cinema"],
    },
    {
      id: "py-functions",
      status: "available",
      level: "intermediate",
      skills: ["py.functions"],
      theme: { icon: "function", tone: "lime" },
      title: l("Functions", "Funktiot"),
      summary: l("Package code into reusable functions.", "Kokoa koodia uudelleenkäytettäviksi funktioiksi."),
      exerciseIds: ["py-greet-function", "py-area-function"],
    },
    {
      id: "py-loops",
      status: "available",
      level: "intermediate",
      skills: ["py.loops"],
      theme: { icon: "repeat", tone: "indigo" },
      title: l("Loops", "Silmukat"),
      summary: l("Repeat work with for and while.", "Toista työtä for- ja while-silmukoilla."),
      exerciseIds: ["py-count-up", "py-sum-numbers", "py-countdown"],
    },
    {
      id: "py-collections",
      status: "available",
      level: "intermediate",
      skills: ["py.collections"],
      theme: { icon: "list", tone: "orange" },
      title: l("Lists and dictionaries", "Listat ja sanakirjat"),
      summary: l("Keep many values together.", "Säilytä monta arvoa yhdessä."),
      exerciseIds: ["py-list-append", "py-price-lookup"],
    },
    {
      id: "py-text",
      status: "available",
      level: "intermediate",
      skills: ["py.text"],
      theme: { icon: "type", tone: "teal" },
      title: l("Working with text", "Tekstin käsittely"),
      summary: l("Clean, slice and transform strings.", "Siisti, paloittele ja muunna merkkijonoja."),
      exerciseIds: ["py-clean-name", "py-slicing"],
    },
    {
      id: "py-projects",
      status: "available",
      level: "intermediate",
      skills: ["py.problem-solving", "py.collections", "py.text"],
      theme: { icon: "rocket", tone: "violet" },
      title: l("Mini-projects", "Miniprojektit"),
      summary: l("Put it all together in bigger labs.", "Yhdistä kaikki opittu isommissa harjoitustöissä."),
      exerciseIds: ["py-word-counter-lab", "py-score-report-lab"],
    },
    {
      id: "py-checkpoint-intermediate",
      kind: "checkpoint",
      status: "available",
      level: "intermediate",
      skills: ["py.functions", "py.loops", "py.collections", "py.text"],
      theme: { icon: "flag", tone: "indigo" },
      title: l("Checkpoint: functions and data", "Tarkistuspiste: funktiot ja data"),
      summary: l(
        "One task that combines functions, loops, lists, dictionaries and text.",
        "Yksi tehtävä, joka yhdistää funktiot, silmukat, listat, sanakirjat ja tekstin.",
      ),
      exerciseIds: ["py-checkpoint-orders"],
    },
    {
      id: "py-comprehensions",
      status: "available",
      level: "advanced",
      skills: ["py.comprehensions"],
      buildsOn: ["py.loops", "py.collections", "py.functions"],
      theme: { icon: "sparkles", tone: "violet" },
      title: l("Comprehensions and sorting", "Koosteet ja lajittelu"),
      summary: l(
        "Transform and rank data in a single, readable expression.",
        "Muunna ja järjestä dataa yhdellä luettavalla lausekkeella.",
      ),
      exerciseIds: ["py-clean-tags", "py-stock-alerts", "py-top-scores"],
    },
    {
      id: "py-errors",
      status: "available",
      level: "advanced",
      skills: ["py.errors"],
      buildsOn: ["py.functions", "py.conditions"],
      theme: { icon: "shield", tone: "rose" },
      title: l("Exceptions and validation", "Poikkeukset ja validointi"),
      summary: l(
        "Handle bad input calmly and reject invalid values clearly.",
        "Käsittele virheellinen syöte rauhallisesti ja hylkää väärät arvot selkeästi.",
      ),
      exerciseIds: ["py-parse-quantity", "py-valid-username"],
    },
    {
      id: "py-classes",
      status: "available",
      level: "advanced",
      skills: ["py.classes"],
      buildsOn: ["py.functions", "py.collections"],
      theme: { icon: "layers", tone: "orange" },
      title: l("Classes and objects", "Luokat ja oliot"),
      summary: l(
        "Bundle data and behaviour into your own types.",
        "Kokoa data ja toiminta omiksi tyypeiksesi.",
      ),
      exerciseIds: ["py-step-counter", "py-library-shelf-lab"],
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
      level: "beginner",
      skills: ["js.output"],
      theme: { icon: "compass", tone: "teal" },
      title: l("Hello, JavaScript", "Hei, JavaScript"),
      summary: l("Write and run your first programs.", "Kirjoita ja suorita ensimmäiset ohjelmasi."),
      exerciseIds: ["js-hello-console", "js-multiple-logs"],
    },
    {
      id: "js-variables",
      status: "available",
      level: "beginner",
      skills: ["js.variables"],
      theme: { icon: "box", tone: "sky" },
      title: l("Variables and data types", "Muuttujat ja tietotyypit"),
      summary: l("Store and update values.", "Tallenna ja päivitä arvoja."),
      exerciseIds: ["js-let-update", "js-data-types"],
    },
    {
      id: "js-operators",
      status: "available",
      level: "beginner",
      skills: ["js.operators"],
      theme: { icon: "calculator", tone: "violet" },
      title: l("Operators and comparisons", "Operaattorit ja vertailut"),
      summary: l("Calculate and compare.", "Laske ja vertaile."),
      exerciseIds: ["js-arithmetic", "js-comparisons"],
    },
    {
      id: "js-conditions",
      status: "available",
      level: "beginner",
      skills: ["js.conditions"],
      theme: { icon: "split", tone: "rose" },
      title: l("Conditional statements", "Ehtolauseet"),
      summary: l("Make decisions with if and logical operators.", "Tee päätöksiä if-lauseilla ja loogisilla operaattoreilla."),
      exerciseIds: ["js-if-else", "js-logical-operators"],
    },
    {
      id: "js-functions",
      status: "available",
      level: "beginner",
      skills: ["js.functions"],
      theme: { icon: "function", tone: "lime" },
      title: l("Functions", "Funktiot"),
      summary: l("Write reusable code that returns results.", "Kirjoita uudelleenkäytettävää koodia, joka palauttaa tuloksia."),
      exerciseIds: ["greeting-functions", "js-rectangle-area", "weather-advisor-lab"],
    },
    {
      id: "js-checkpoint-basics",
      kind: "checkpoint",
      status: "available",
      level: "beginner",
      skills: ["js.variables", "js.operators", "js.conditions", "js.functions"],
      theme: { icon: "flag", tone: "teal" },
      title: l("Checkpoint: the basics", "Tarkistuspiste: perusteet"),
      summary: l(
        "One task that combines variables, operators, conditions and functions.",
        "Yksi tehtävä, joka yhdistää muuttujat, operaattorit, ehdot ja funktiot.",
      ),
      exerciseIds: ["js-checkpoint-delivery"],
    },
    {
      id: "js-loops",
      status: "available",
      level: "intermediate",
      skills: ["js.loops"],
      theme: { icon: "repeat", tone: "indigo" },
      title: l("Loops", "Silmukat"),
      summary: l("Repeat work automatically.", "Toista työtä automaattisesti."),
      exerciseIds: ["js-for-loop", "js-sum-to"],
    },
    {
      id: "js-arrays",
      status: "available",
      level: "intermediate",
      skills: ["js.arrays"],
      theme: { icon: "list", tone: "orange" },
      title: l("Arrays", "Taulukot"),
      summary: l("Work with lists of values.", "Käsittele arvojen listoja."),
      exerciseIds: ["js-array-push", "js-filter-even"],
    },
    {
      id: "js-objects",
      status: "available",
      level: "intermediate",
      skills: ["js.objects"],
      theme: { icon: "braces", tone: "amber" },
      title: l("Objects", "Oliot"),
      summary: l("Group related data together.", "Ryhmittele toisiinsa liittyvät tiedot."),
      exerciseIds: ["js-object-basics", "js-describe-pet"],
    },
    {
      id: "js-strings",
      status: "available",
      level: "intermediate",
      skills: ["js.strings"],
      theme: { icon: "type", tone: "teal" },
      title: l("String manipulation", "Merkkijonojen käsittely"),
      summary: l("Transform and analyse text.", "Muunna ja analysoi tekstiä."),
      exerciseIds: ["js-shout", "js-initials"],
    },
    {
      id: "js-projects",
      status: "available",
      level: "intermediate",
      skills: ["js.problem-solving", "js.arrays", "js.objects"],
      theme: { icon: "rocket", tone: "violet" },
      title: l("Mini-projects", "Miniprojektit"),
      summary: l("Build small apps in bigger labs.", "Rakenna pieniä sovelluksia isommissa harjoitustöissä."),
      exerciseIds: ["js-shopping-cart-lab", "js-task-list-lab"],
    },
    {
      id: "js-checkpoint-intermediate",
      kind: "checkpoint",
      status: "available",
      level: "intermediate",
      skills: ["js.loops", "js.arrays", "js.objects", "js.strings"],
      theme: { icon: "flag", tone: "indigo" },
      title: l("Checkpoint: arrays and objects", "Tarkistuspiste: taulukot ja oliot"),
      summary: l(
        "One task that combines loops, arrays, objects and strings.",
        "Yksi tehtävä, joka yhdistää silmukat, taulukot, oliot ja merkkijonot.",
      ),
      exerciseIds: ["js-checkpoint-playlist"],
    },
    {
      id: "js-array-methods",
      status: "available",
      level: "advanced",
      skills: ["js.array-methods"],
      buildsOn: ["js.arrays", "js.functions", "js.objects"],
      theme: { icon: "sparkles", tone: "violet" },
      title: l("map, reduce and sort", "map, reduce ja sort"),
      summary: l(
        "Transform, summarise and order data without mutating it.",
        "Muunna, tiivistä ja järjestä dataa muuttamatta alkuperäistä.",
      ),
      exerciseIds: ["js-format-prices", "js-totals-by-category", "js-sort-tasks"],
    },
    {
      id: "js-errors",
      status: "available",
      level: "advanced",
      skills: ["js.errors"],
      buildsOn: ["js.functions", "js.conditions"],
      theme: { icon: "shield", tone: "rose" },
      title: l("Errors and validation", "Virheet ja validointi"),
      summary: l(
        "Throw clear errors for bad input and recover from failures.",
        "Heitä selkeitä virheitä väärästä syötteestä ja toivu epäonnistumisista.",
      ),
      exerciseIds: ["js-validate-signup", "js-parse-settings"],
    },
    {
      id: "js-async",
      status: "available",
      level: "advanced",
      skills: ["js.async"],
      buildsOn: ["js.functions", "js.errors"],
      theme: { icon: "clock", tone: "orange" },
      title: l("Async and await", "Async ja await"),
      summary: l(
        "Wait for slow operations, run them in parallel and handle failures.",
        "Odota hitaita operaatioita, aja niitä rinnakkain ja käsittele epäonnistumiset.",
      ),
      exerciseIds: ["js-await-user", "js-weather-dashboard-lab"],
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
      level: "beginner",
      skills: ["ts.annotations"],
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
      level: "beginner",
      skills: ["ts.objects"],
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
      level: "intermediate",
      skills: ["ts.unions"],
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
      level: "beginner",
      skills: ["react.components"],
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
      level: "beginner",
      skills: ["react.props"],
      theme: { icon: "braces", tone: "teal" },
      title: l("Props", "Propsit"),
      summary: l("Pass data into components.", "Välitä tietoa komponenteille."),
      exerciseIds: [],
    },
    {
      id: "react-state",
      status: "planned",
      level: "beginner",
      skills: ["react.state"],
      theme: { icon: "toggle", tone: "amber" },
      title: l("State with useState", "Tila ja useState"),
      summary: l("Make components interactive with state.", "Tee komponenteista interaktiivisia tilan avulla."),
      exerciseIds: [],
    },
  ],
};
