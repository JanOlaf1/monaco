import { check, jsCheckpoint, l } from "@/lib/content/factories";
import { code, md } from "@/lib/content/md";

/**
 * Checkpoints between bands. Each one reviews a whole band in a single task,
 * so learners who already know the material can confirm it and move on.
 * Passing a checkpoint never marks the chapters it covers as completed.
 */

/* ------------------------------------------------------------------ */
/* After chapter 5 — the basics                                        */
/* ------------------------------------------------------------------ */

export const jsCheckpointDelivery = jsCheckpoint({
  id: "js-checkpoint-delivery",
  chapterId: "js-checkpoint-basics",
  minutes: 12,
  title: l("Checkpoint: Delivery estimate", "Tarkistuspiste: Toimitusarvio"),
  summary: l(
    "Combine variables, comparisons, conditions and a function to estimate delivery time.",
    "Yhdistä muuttujat, vertailut, ehdot ja funktio ja arvioi toimitusaika.",
  ),
  concept: l(
    md`
      This checkpoint reviews chapters 1–5: variables, operators, \`if\`/\`else\` and functions. If you can solve it without hints, you are ready for loops and arrays.

      A function that **returns** a value is easy to test and reuse. Keep the printing outside it:

      ~~~js
      function shippingCost(weightKg) {
        if (weightKg <= 2) return 4.9;
        return 8.9;
      }
      console.log(\`Shipping: \${shippingCost(3)} €\`);
      ~~~

      \`Math.max(a, b)\` returns the larger number. It is handy for "never less than" rules.
    `,
    md`
      Tämä tarkistuspiste kertaa luvut 1–5: muuttujat, operaattorit, \`if\`/\`else\` ja funktiot. Jos ratkaiset sen ilman vihjeitä, olet valmis silmukoihin ja taulukoihin.

      Funktiota, joka **palauttaa** arvon, on helppo testata ja käyttää uudelleen. Pidä tulostus sen ulkopuolella:

      ~~~js
      function shippingCost(weightKg) {
        if (weightKg <= 2) return 4.9;
        return 8.9;
      }
      console.log(\`Shipping: \${shippingCost(3)} €\`);
      ~~~

      \`Math.max(a, b)\` palauttaa suuremman luvun. Se sopii "ei koskaan vähemmän kuin" -sääntöihin.
    `,
  ),
  objectives: [
    l("Write a function with several branches", "Kirjoittaa funktion, jossa on useita haaroja"),
    l("Apply a rule with a lower limit", "Soveltaa sääntöä, jolla on alaraja"),
    l("Build a message with correct singular and plural", "Muodostaa viestin oikealla yksikkö- ja monikkomuodolla"),
  ],
  requirements: [
    l(
      "`deliveryDays(distanceKm, isExpress)` returns `1` for up to 50 km, `2` for up to 300 km and `4` beyond that.",
      "`deliveryDays(distanceKm, isExpress)` palauttaa `1` enintään 50 km:n, `2` enintään 300 km:n ja `4` pidemmille matkoille.",
    ),
    l("Express delivery is one day faster, but never less than `1` day.", "Pikatoimitus on päivän nopeampi, mutta ei koskaan alle `1` päivää."),
    l(
      "The program logs `Arrives in 2 days` for the given values, and `Arrives in 1 day` when the result is one day.",
      "Ohjelma tulostaa annetuilla arvoilla `Arrives in 2 days` ja yhden päivän tuloksella `Arrives in 1 day`.",
    ),
  ],
  instructions: l(
    md`
      Write the function \`deliveryDays(distanceKm, isExpress)\` described in the requirements. Then log the message for the constants \`distanceKm\` and \`isExpress\` at the top of the file.

      The checks call your function with many values and re-run the program with other constants.
    `,
    md`
      Kirjoita vaatimuksissa kuvattu funktio \`deliveryDays(distanceKm, isExpress)\`. Tulosta sitten viesti tiedoston alussa olevilla vakioilla \`distanceKm\` ja \`isExpress\`.

      Tarkistukset kutsuvat funktiotasi monilla arvoilla ja ajavat ohjelman uudelleen muilla vakioilla.
    `,
  ),
  hints: [
    l(
      "Inside the function, first pick `days` with `if (distanceKm <= 50) … else if (distanceKm <= 300) … else …`.",
      "Valitse funktiossa ensin `days`: `if (distanceKm <= 50) … else if (distanceKm <= 300) … else …`.",
    ),
    l(
      "For express: `if (isExpress) days = Math.max(days - 1, 1);`",
      "Pikatoimitukselle: `if (isExpress) days = Math.max(days - 1, 1);`",
    ),
    l(
      "Store `const days = deliveryDays(distanceKm, isExpress);`, then log `\"Arrives in 1 day\"` when `days === 1` and otherwise `\"Arrives in \" + days + \" days\"`.",
      "Tallenna `const days = deliveryDays(distanceKm, isExpress);` ja tulosta `\"Arrives in 1 day\"`, kun `days === 1`, muuten `\"Arrives in \" + days + \" days\"`.",
    ),
  ],
  tests: [
    check(
      "is-function",
      l("`deliveryDays` is a function.", "`deliveryDays` on funktio."),
      l("Define a function named `deliveryDays`.", "Määrittele funktio nimeltä `deliveryDays`."),
      `t.isType(deliveryDays, "function");`,
    ),
    check(
      "near",
      l("Up to 50 km takes `1` day.", "Enintään 50 km kestää `1` päivän."),
      l("Distances of 50 km or less should return `1`.", "Enintään 50 km:n matkojen pitää palauttaa `1`."),
      code`
        t.equal(deliveryDays(10, false), 1);
        t.equal(deliveryDays(50, false), 1);
      `,
    ),
    check(
      "middle",
      l("51–300 km takes `2` days.", "51–300 km kestää `2` päivää."),
      l("Check the boundaries: 51 km and 300 km both take 2 days.", "Tarkista rajat: sekä 51 km että 300 km kestävät 2 päivää."),
      code`
        t.equal(deliveryDays(51, false), 2);
        t.equal(deliveryDays(300, false), 2);
      `,
    ),
    check(
      "far",
      l("More than 300 km takes `4` days.", "Yli 300 km kestää `4` päivää."),
      l("Distances over 300 km should return `4`.", "Yli 300 km:n matkojen pitää palauttaa `4`."),
      `t.equal(deliveryDays(301, false), 4);`,
    ),
    check(
      "express",
      l("Express is one day faster.", "Pikatoimitus on päivän nopeampi."),
      l("When `isExpress` is `true`, subtract one day.", "Kun `isExpress` on `true`, vähennä yksi päivä."),
      code`
        t.equal(deliveryDays(120, true), 1);
        t.equal(deliveryDays(900, true), 3);
      `,
    ),
    check(
      "express-minimum",
      l("Express never goes below `1` day.", "Pikatoimitus ei koskaan alita `1` päivää."),
      l("A 1-day delivery stays 1 day with express. Use `Math.max(days - 1, 1)`.", "Yhden päivän toimitus pysyy pikana yhden päivän mittaisena. Käytä `Math.max(days - 1, 1)`."),
      `t.equal(deliveryDays(20, true), 1);`,
    ),
    check(
      "message",
      l("The program logs `Arrives in 2 days`.", "Ohjelma tulostaa `Arrives in 2 days`."),
      l(
        "Log the message for the constants at the top: 120 km without express is 2 days.",
        "Tulosta viesti alun vakioilla: 120 km ilman pikatoimitusta on 2 päivää.",
      ),
      `t.logged("Arrives in 2 days");`,
    ),
    check(
      "singular",
      l("A one-day result logs `Arrives in 1 day`.", "Yhden päivän tulos tulostaa `Arrives in 1 day`."),
      l(
        "Use the singular `day` when the result is 1, and compute the message from the constants.",
        "Käytä yksikkömuotoa `day`, kun tulos on 1, ja laske viesti vakioista.",
      ),
      code`
        const run = await t.runWith({ distanceKm: 20, isExpress: true });
        t.includes(run.logs, "Arrives in 1 day");
      `,
    ),
  ],
  starter: code`
    const distanceKm = 120;
    const isExpress = false;

    // Write deliveryDays(distanceKm, isExpress) below, then log the message.
  `,
});

/* ------------------------------------------------------------------ */
/* After chapter 10 — arrays and objects                               */
/* ------------------------------------------------------------------ */

export const jsCheckpointPlaylist = jsCheckpoint({
  id: "js-checkpoint-playlist",
  chapterId: "js-checkpoint-intermediate",
  minutes: 18,
  title: l("Checkpoint: Playlist stats", "Tarkistuspiste: Soittolistan tilastot"),
  summary: l(
    "Summarise a playlist with loops, arrays, objects and string methods.",
    "Tee soittolistasta yhteenveto silmukoilla, taulukoilla, olioilla ja merkkijonometodeilla.",
  ),
  concept: l(
    md`
      This checkpoint reviews chapters 6–10: loops, arrays, objects and string methods. If you solve it comfortably, the advanced chapters are a good next step.

      Returning an **object** lets a function hand back several results at once:

      ~~~js
      function stats(numbers) {
        let sum = 0;
        for (const n of numbers) sum += n;
        return { count: numbers.length, sum };
      }
      ~~~

      When you look for "the biggest" item, start with \`null\` and replace it only when you find something **strictly** bigger. Then the first item wins a tie.
    `,
    md`
      Tämä tarkistuspiste kertaa luvut 6–10: silmukat, taulukot, oliot ja merkkijonometodit. Jos ratkaiset sen sujuvasti, edistyneet luvut ovat hyvä seuraava askel.

      Kun funktio palauttaa **olion**, se voi palauttaa useita tuloksia kerralla:

      ~~~js
      function stats(numbers) {
        let sum = 0;
        for (const n of numbers) sum += n;
        return { count: numbers.length, sum };
      }
      ~~~

      Kun etsit "suurinta" alkiota, aloita arvosta \`null\` ja korvaa se vain, kun löydät **aidosti** suuremman. Silloin ensimmäinen alkio voittaa tasapelin.
    `,
  ),
  objectives: [
    l("Loop over an array of objects", "Käydä läpi taulukon olioita"),
    l("Return several results in one object", "Palauttaa useita tuloksia yhdessä oliossa"),
    l("Clean text with string methods", "Siistiä tekstiä merkkijonometodeilla"),
    l("Handle an empty array", "Käsitellä tyhjän taulukon"),
  ],
  requirements: [
    l(
      "`playlistStats(songs)` returns an object with `count`, `minutes`, `longest` and `liked`.",
      "`playlistStats(songs)` palauttaa olion, jolla on kentät `count`, `minutes`, `longest` ja `liked`.",
    ),
    l(
      "`minutes` is the total of all `seconds` divided by 60 and rounded with `Math.round`.",
      "`minutes` on kaikkien `seconds`-arvojen summa jaettuna 60:llä ja pyöristettynä funktiolla `Math.round`.",
    ),
    l(
      "`longest` is the title of the longest song (the first one if there is a tie), or `null` for an empty playlist.",
      "`longest` on pisimmän kappaleen nimi (tasapelissä ensimmäinen) tai `null`, jos soittolista on tyhjä.",
    ),
    l(
      "`liked` lists the titles of liked songs in playlist order, without surrounding spaces.",
      "`liked` sisältää tykättyjen kappaleiden nimet soittolistan järjestyksessä ilman ympäröiviä välilyöntejä.",
    ),
    l("The input array is not changed.", "Annettua taulukkoa ei muuteta."),
  ],
  instructions: l(
    md`
      Each song is an object such as \`{ title: "Ocean", seconds: 215, liked: true }\`. Write \`playlistStats(songs)\` as described in the requirements. An empty playlist gives \`{ count: 0, minutes: 0, longest: null, liked: [] }\`.
    `,
    md`
      Jokainen kappale on olio, esimerkiksi \`{ title: "Ocean", seconds: 215, liked: true }\`. Kirjoita funktio \`playlistStats(songs)\` vaatimusten mukaan. Tyhjä soittolista antaa tuloksen \`{ count: 0, minutes: 0, longest: null, liked: [] }\`.
    `,
  ),
  hints: [
    l(
      "Before the loop: `let total = 0; let longest = null; let longestSeconds = -1; const liked = [];`",
      "Ennen silmukkaa: `let total = 0; let longest = null; let longestSeconds = -1; const liked = [];`",
    ),
    l(
      "In `for (const song of songs)`: add to `total`, update `longest` when `song.seconds > longestSeconds`, and `liked.push(song.title.trim())` when `song.liked`.",
      "Silmukassa `for (const song of songs)`: lisää `total`-muuttujaan, päivitä `longest`, kun `song.seconds > longestSeconds`, ja tee `liked.push(song.title.trim())`, kun `song.liked`.",
    ),
    l(
      "`return { count: songs.length, minutes: Math.round(total / 60), longest, liked };`",
      "`return { count: songs.length, minutes: Math.round(total / 60), longest, liked };`",
    ),
  ],
  tests: [
    check(
      "is-function",
      l("`playlistStats` is a function.", "`playlistStats` on funktio."),
      l("Define a function named `playlistStats`.", "Määrittele funktio nimeltä `playlistStats`."),
      `t.isType(playlistStats, "function");`,
    ),
    check(
      "count-minutes",
      l("`count` and rounded `minutes` are correct.", "`count` ja pyöristetty `minutes` ovat oikein."),
      l(
        "Add up `seconds`, divide by 60 and use `Math.round`. `count` is the number of songs.",
        "Laske `seconds`-arvot yhteen, jaa 60:llä ja käytä funktiota `Math.round`. `count` on kappaleiden määrä.",
      ),
      code`
        const result = playlistStats([
          { title: "Ocean", seconds: 215, liked: true },
          { title: "Pine", seconds: 190, liked: false },
          { title: "Ember", seconds: 250, liked: true },
        ]);
        t.equal(result.count, 3);
        t.equal(result.minutes, 11);
      `,
    ),
    check(
      "longest",
      l("`longest` is the title of the longest song.", "`longest` on pisimmän kappaleen nimi."),
      l("Compare `seconds` and remember the title of the biggest one.", "Vertaa `seconds`-arvoja ja muista suurimman nimi."),
      code`
        const result = playlistStats([
          { title: "Short", seconds: 100, liked: false },
          { title: "Epic", seconds: 420, liked: false },
          { title: "Mid", seconds: 200, liked: true },
        ]);
        t.equal(result.longest, "Epic");
      `,
    ),
    check(
      "tie",
      l("On a tie, the first longest song wins.", "Tasapelissä ensimmäinen pisin kappale voittaa."),
      l("Replace the longest song only when a song is strictly longer (`>`).", "Korvaa pisin kappale vain, kun kappale on aidosti pidempi (`>`)."),
      code`
        const result = playlistStats([
          { title: "First", seconds: 300, liked: false },
          { title: "Second", seconds: 300, liked: false },
        ]);
        t.equal(result.longest, "First");
      `,
    ),
    check(
      "liked",
      l("`liked` has trimmed titles of liked songs, in order.", "`liked` sisältää tykättyjen kappaleiden siistityt nimet järjestyksessä."),
      l("Push `song.title.trim()` for every song where `song.liked` is `true`.", "Lisää `song.title.trim()` jokaisesta kappaleesta, jonka `song.liked` on `true`."),
      code`
        const result = playlistStats([
          { title: " Ocean ", seconds: 215, liked: true },
          { title: "Pine", seconds: 190, liked: false },
          { title: "Ember  ", seconds: 250, liked: true },
        ]);
        t.deepEqual(result.liked, ["Ocean", "Ember"]);
      `,
    ),
    check(
      "empty",
      l("An empty playlist gives zeros, `null` and `[]`.", "Tyhjä soittolista antaa nollat, arvon `null` ja taulukon `[]`."),
      l(
        "With no songs, return `{ count: 0, minutes: 0, longest: null, liked: [] }`.",
        "Kun kappaleita ei ole, palauta `{ count: 0, minutes: 0, longest: null, liked: [] }`.",
      ),
      `t.deepEqual(playlistStats([]), { count: 0, minutes: 0, longest: null, liked: [] });`,
    ),
    check(
      "no-mutation",
      l("The playlist is not changed.", "Soittolistaa ei muuteta."),
      l("Don't sort, trim or remove songs in the array you were given.", "Älä lajittele, siisti tai poista kappaleita saamastasi taulukosta."),
      code`
        const songs = [
          { title: " B ", seconds: 10, liked: true },
          { title: "A", seconds: 20, liked: false },
        ];
        playlistStats(songs);
        t.deepEqual(songs, [
          { title: " B ", seconds: 10, liked: true },
          { title: "A", seconds: 20, liked: false },
        ]);
      `,
    ),
  ],
  starter: code`
    function playlistStats(songs) {
      // Return { count, minutes, longest, liked }.
    }
  `,
});
