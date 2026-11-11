import { l } from "@/lib/content/factories";
import { code } from "@/lib/content/md";
import type { PracticeActivity } from "@/lib/practice/types";

/**
 * Python practice activities. Original content; every answer key is verified
 * by running the code with Pyodide in tests/practice.test.ts.
 */
export const pythonPractice: PracticeActivity[] = [
  {
    id: "pr-py-upper-greeting",
    kind: "predict",
    language: "python",
    exerciseId: "variables-and-strings",
    prompt: l("What does this program print?", "Mitä tämä ohjelma tulostaa?"),
    code: code`
      name = "Ada"
      greeting = "Hi, " + name + "!"
      print(greeting.upper())
    `,
    options: [
      { id: "a", output: "Hi, Ada!" },
      { id: "b", output: "HI, ADA!" },
      { id: "c", output: "hi, ada!" },
      { id: "d", output: "HI, Ada!" },
    ],
    answer: "b",
    explanation: l(
      "`+` joins the strings into `Hi, Ada!`, and `.upper()` returns a copy with every letter in upper case.",
      "`+` yhdistää merkkijonot muotoon `Hi, Ada!`, ja `.upper()` palauttaa kopion, jossa kaikki kirjaimet ovat isoja.",
    ),
  },
  {
    id: "pr-py-dict-update",
    kind: "predict",
    language: "python",
    exerciseId: "py-price-lookup",
    prompt: l("What does this program print?", "Mitä tämä ohjelma tulostaa?"),
    code: code`
      prices = {"tea": 2.5, "bun": 3}
      prices["tea"] = 3
      print(prices["tea"] + prices["bun"])
    `,
    options: [
      { id: "a", output: "5.5" },
      { id: "b", output: "6.0" },
      { id: "c", output: "6" },
      { id: "d", output: "3" },
    ],
    answer: "c",
    explanation: l(
      'Assigning to `prices["tea"]` replaces the old value 2.5 with the integer 3. Adding two integers gives the integer `6` (not `6.0`).',
      'Sijoitus `prices["tea"]` korvaa vanhan arvon 2.5 kokonaisluvulla 3. Kahden kokonaisluvun summa on kokonaisluku `6` (ei `6.0`).',
    ),
  },
  {
    id: "pr-py-range-end",
    kind: "bug",
    language: "python",
    exerciseId: "py-count-up",
    prompt: l(
      "This should print the sum of 1 to 5, which is `15`, but it prints `10`. Which line has the bug?",
      "Tämän pitäisi tulostaa lukujen 1–5 summa eli `15`, mutta se tulostaa `10`. Millä rivillä virhe on?",
    ),
    code: code`
      total = 0
      for number in range(1, 5):
          total = total + number
      print(total)
    `,
    expectedOutput: "15",
    bugLine: 1,
    fix: "for number in range(1, 6):",
    explanation: l(
      "`range(1, 5)` stops before 5, so it gives 1, 2, 3 and 4. To include 5, the end must be 6: `range(1, 6)`.",
      "`range(1, 5)` pysähtyy ennen lukua 5, joten se antaa luvut 1, 2, 3 ja 4. Jotta 5 tulee mukaan, lopun on oltava 6: `range(1, 6)`.",
    ),
  },
  {
    id: "pr-py-strip-call",
    kind: "bug",
    language: "python",
    exerciseId: "py-clean-name",
    prompt: l(
      "This should print `Ada`, but it stops with an `AttributeError`. Which line has the bug?",
      "Tämän pitäisi tulostaa `Ada`, mutta se pysähtyy virheeseen `AttributeError`. Millä rivillä virhe on?",
    ),
    code: code`
      raw = "  ada  "
      name = raw.strip
      print(name.title())
    `,
    expectedOutput: "Ada",
    bugLine: 1,
    fix: "name = raw.strip()",
    explanation: l(
      "Without parentheses, `raw.strip` is the method itself, not its result. Calling it with `raw.strip()` returns the text without the surrounding spaces.",
      "Ilman sulkeita `raw.strip` on itse metodi eikä sen tulos. Kutsu `raw.strip()` palauttaa tekstin ilman ympäröiviä välilyöntejä.",
    ),
  },
  {
    id: "pr-py-adult-check",
    kind: "complete",
    language: "python",
    exerciseId: "py-if-else",
    prompt: l(
      "People aged 18 or over are adults. Complete the condition so that the program prints `Minor`, `Adult`, `Adult`.",
      "18-vuotiaat ja sitä vanhemmat ovat aikuisia. Täydennä ehto niin, että ohjelma tulostaa `Minor`, `Adult`, `Adult`.",
    ),
    code: code`
      for age in [17, 18, 30]:
          if age ___ 18:
              print("Adult")
          else:
              print("Minor")
    `,
    expectedOutput: "Minor\nAdult\nAdult",
    options: [
      { id: "a", text: ">" },
      { id: "b", text: "==" },
      { id: "c", text: ">=" },
      { id: "d", text: "!=" },
    ],
    answers: ["c"],
    explanation: l(
      "`>=` is true when the age is 18 or more. `>` would leave out exactly 18, and `==` would only accept 18.",
      "`>=` on tosi, kun ikä on 18 tai enemmän. `>` jättäisi pois juuri 18-vuotiaat, ja `==` hyväksyisi vain iän 18.",
    ),
  },
  {
    id: "pr-py-first-three",
    kind: "complete",
    language: "python",
    exerciseId: "py-slicing",
    prompt: l(
      "Complete the slice so that the program prints the first three letters: `koo`.",
      "Täydennä viipale niin, että ohjelma tulostaa kolme ensimmäistä kirjainta: `koo`.",
    ),
    code: code`
      word = "koodaamo"
      print(word[___])
    `,
    expectedOutput: "koo",
    options: [
      { id: "a", text: "1:4" },
      { id: "b", text: ":3" },
      { id: "c", text: "-3:" },
      { id: "d", text: "0:3" },
    ],
    answers: ["b", "d"],
    explanation: l(
      "A slice `start:end` stops before `end`. `0:3` takes indexes 0, 1 and 2, and `:3` means the same because the start defaults to 0.",
      "Viipale `alku:loppu` pysähtyy ennen loppua. `0:3` ottaa indeksit 0, 1 ja 2, ja `:3` tarkoittaa samaa, koska alku on oletuksena 0.",
    ),
  },
  {
    id: "pr-py-count-words",
    kind: "reorder",
    language: "python",
    exerciseId: "py-sum-numbers",
    prompt: l(
      "Put the lines in order so that the program counts the words and prints `3`.",
      "Järjestä rivit niin, että ohjelma laskee sanat ja tulostaa `3`.",
    ),
    lines: ['words = ["sun", "sea", "sky"]', "count = 0", "for word in words:", "    count += 1", "print(count)"],
    expectedOutput: "3",
    alsoCorrect: [[1, 0, 2, 3, 4]],
    start: [4, 3, 1, 2, 0],
    explanation: l(
      "Both variables must exist before the loop (in either order), the indented line belongs inside the loop, and `print` comes after the loop.",
      "Molempien muuttujien on oltava olemassa ennen silmukkaa (kummassa järjestyksessä tahansa), sisennetty rivi kuuluu silmukan sisään ja `print` tulee silmukan jälkeen.",
    ),
  },
  {
    id: "pr-py-average",
    kind: "select",
    language: "python",
    exerciseId: "py-sum-numbers",
    prompt: l(
      "Choose an implementation of `average(numbers)` that returns the mean of a non-empty list, for example `average([1, 2, 3, 4])` → `2.5`.",
      "Valitse toteutus funktiolle `average(numbers)`, joka palauttaa ei-tyhjän listan keskiarvon, esimerkiksi `average([1, 2, 3, 4])` → `2.5`.",
    ),
    options: [
      {
        id: "a",
        code: code`
          def average(numbers):
              total = 0
              for n in numbers:
                  total += n
              return total / len(numbers)
        `,
      },
      {
        id: "b",
        code: code`
          def average(numbers):
              return sum(numbers) // len(numbers)
        `,
      },
      {
        id: "c",
        code: code`
          def average(numbers):
              total = 0
              for n in numbers:
                  total += n
                  return total / len(numbers)
        `,
      },
      {
        id: "d",
        code: code`
          def average(numbers):
              return sum(numbers) / len(numbers)
        `,
      },
    ],
    harness: code`
      print(average([2, 4, 6]))
      print(average([1, 2, 3, 4]))
    `,
    expectedOutput: "4.0\n2.5",
    answers: ["a", "d"],
    explanation: l(
      "A and D both divide the full total by the number of items. B uses `//`, which rounds down (2 instead of 2.5), and C returns inside the loop, after the first number only.",
      "A ja D jakavat koko summan alkioiden määrällä. B käyttää jakoa `//`, joka pyöristää alaspäin (2 eikä 2.5), ja C palauttaa arvon silmukan sisällä jo ensimmäisen luvun jälkeen.",
    ),
  },
  {
    id: "pr-py-str-vs-int",
    kind: "quiz",
    language: "python",
    exerciseId: "py-shopping-total",
    prompt: l("Why do these two lines print different results?", "Miksi nämä kaksi riviä tulostavat eri tuloksen?"),
    code: code`
      print("3" + "4")
      print(3 + 4)
    `,
    check: { output: "34\n7" },
    options: [
      {
        id: "a",
        label: l(
          "Text values (`str`) are joined together, while numbers (`int`) are added.",
          "Tekstiarvot (`str`) liitetään yhteen, kun taas luvut (`int`) lasketaan yhteen.",
        ),
      },
      { id: "b", label: l("Python always adds values as numbers.", "Python laskee arvot aina yhteen lukuina.") },
      { id: "c", label: l("The first line is an error.", "Ensimmäinen rivi on virhe.") },
    ],
    answer: "a",
    explanation: l(
      'Quotes make `"3"` and `"4"` strings, so `+` joins them into `34`. Without quotes they are integers and `+` gives `7`.',
      'Lainausmerkit tekevät arvoista `"3"` ja `"4"` merkkijonoja, joten `+` liittää ne muotoon `34`. Ilman lainausmerkkejä ne ovat kokonaislukuja, ja `+` antaa `7`.',
    ),
  },
  {
    id: "pr-py-value-error",
    kind: "quiz",
    language: "python",
    exerciseId: "py-parse-quantity",
    prompt: l(
      "What does `except ValueError:` do in this program?",
      "Mitä `except ValueError:` tekee tässä ohjelmassa?",
    ),
    code: code`
      try:
          quantity = int("three")
      except ValueError:
          quantity = 0
      print(quantity)
    `,
    check: { output: "0" },
    options: [
      { id: "a", label: l('It converts `"three"` to `3`.', 'Se muuntaa tekstin `"three"` luvuksi `3`.') },
      {
        id: "b",
        label: l(
          "It runs when `int()` can't convert the text, so the program continues with `quantity = 0` and prints `0`.",
          "Se suoritetaan, kun `int()` ei pysty muuntamaan tekstiä, joten ohjelma jatkaa arvolla `quantity = 0` ja tulostaa `0`.",
        ),
      },
      {
        id: "c",
        label: l("It hides every possible error in the whole program.", "Se piilottaa kaikki mahdolliset virheet koko ohjelmasta."),
      },
    ],
    answer: "b",
    explanation: l(
      '`int("three")` raises `ValueError`. The `except ValueError:` block handles only that error type, so the program can continue with a fallback value.',
      '`int("three")` aiheuttaa virheen `ValueError`. `except ValueError:` -lohko käsittelee vain sen virhetyypin, joten ohjelma voi jatkaa vara-arvolla.',
    ),
  },
];
