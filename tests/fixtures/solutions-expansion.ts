import { code } from "@/lib/content/md";
import type { SolutionCase } from "./solutions";

/** Reference solutions for the Milestone 2 exercises (valid styles + typical mistakes). */

const py = (exerciseId: string, name: string, source: string, failing: string[] = []): SolutionCase => ({
  exerciseId,
  stepId: "task",
  name,
  code: source,
  failing,
});
const pyLab = (exerciseId: string, name: string, source: string, failing: string[] = []): SolutionCase => ({
  exerciseId,
  stepId: "lab",
  name,
  code: source,
  failing,
});

export const pythonExpansionSolutions: SolutionCase[] = [
  // py-hello-world
  py("py-hello-world", "double quotes", 'print("Hello, world!")\n'),
  py("py-hello-world", "single quotes", "print('Hello, world!')\n"),
  py("py-hello-world", "wrong text", 'print("hello world")\n', ["prints-hello", "only-greeting"]),
  py("py-hello-world", "extra line", 'print("Hello, world!")\nprint("Bye")\n', ["only-greeting"]),

  // py-multiple-prints
  py("py-multiple-prints", "three prints", 'print("Ready")\nprint("Set")\nprint("Code!")\n'),
  py("py-multiple-prints", "one print with newlines", 'print("Ready\\nSet\\nCode!")\n'),
  py("py-multiple-prints", "loop", 'for word in ["Ready", "Set", "Code!"]:\n    print(word)\n'),
  py("py-multiple-prints", "wrong order", 'print("Set")\nprint("Ready")\nprint("Code!")\n', ["order"]),

  // py-string-length
  py("py-string-length", "len", 'username = "saku_otter"\nname_length = len(username)\nprint(name_length)\n'),
  py("py-string-length", "f-string output", 'username = "saku_otter"\nname_length = len(username)\nprint(f"Length: {name_length}")\n'),
  py("py-string-length", "hard-coded", 'username = "saku_otter"\nname_length = 10\nprint(name_length)\n', ["follows-username"]),
  py("py-string-length", "no print", 'username = "saku_otter"\nname_length = len(username)\n', ["prints-length"]),

  // py-shopping-total
  py("py-shopping-total", "multiply", "price = 2.5\nquantity = 4\ntotal = price * quantity\nprint(total)\n"),
  py("py-shopping-total", "formatted", 'price = 2.5\nquantity = 4\ntotal = quantity * price\nprint(f"Total: {total} EUR")\n'),
  py("py-shopping-total", "adds instead", "price = 2.5\nquantity = 4\ntotal = price + quantity\nprint(total)\n", ["total-value", "other-values"]),
  py("py-shopping-total", "hard-coded", "price = 2.5\nquantity = 4\ntotal = 10.0\nprint(total)\n", ["other-values"]),

  // py-time-converter
  py("py-time-converter", "// and %", 'total_minutes = 135\nhours = total_minutes // 60\nminutes = total_minutes % 60\nprint(f"{hours} h {minutes} min")\n'),
  py(
    "py-time-converter",
    "int() and subtraction",
    'total_minutes = 135\nhours = int(total_minutes / 60)\nminutes = total_minutes - hours * 60\nprint(hours, "h", minutes, "min")\n',
  ),
  py(
    "py-time-converter",
    "float division",
    'total_minutes = 135\nhours = total_minutes / 60\nminutes = total_minutes % 60\nprint(f"{hours} h {minutes} min")\n',
    ["hours", "other-durations"],
  ),
  py(
    "py-time-converter",
    "wrong format",
    'total_minutes = 135\nhours = total_minutes // 60\nminutes = total_minutes % 60\nprint(hours, "hours", minutes, "minutes")\n',
    ["output"],
  ),

  // py-comparisons
  py("py-comparisons", ">=", "age = 17\nis_adult = age >= 18\n"),
  py("py-comparisons", "not <", "age = 17\nis_adult = not age < 18\n"),
  py("py-comparisons", "> 18", "age = 17\nis_adult = age > 18\n", ["boundary"]),
  py("py-comparisons", "hard-coded False", "age = 17\nis_adult = False\n", ["boundary", "over"]),

  // py-logical-operators
  py("py-logical-operators", "and not", "has_ticket = True\nis_banned = False\ncan_enter = has_ticket and not is_banned\n"),
  py("py-logical-operators", "explicit comparisons", "has_ticket = True\nis_banned = False\ncan_enter = has_ticket == True and is_banned == False\n"),
  py("py-logical-operators", "or", "has_ticket = True\nis_banned = False\ncan_enter = has_ticket or not is_banned\n", ["no-ticket", "banned"]),

  // py-if-else
  py("py-if-else", "if / else", 'temperature = 22\nif temperature >= 20:\n    print("Warm")\nelse:\n    print("Cool")\n'),
  py("py-if-else", "conditional expression", 'temperature = 22\nprint("Warm" if temperature >= 20 else "Cool")\n'),
  py("py-if-else", "> 20", 'temperature = 22\nif temperature > 20:\n    print("Warm")\nelse:\n    print("Cool")\n', ["boundary"]),
  py("py-if-else", "missing else", 'temperature = 22\nif temperature >= 20:\n    print("Warm")\nprint("Cool")\n', ["warm", "boundary"]),

  // py-grade-letters
  py(
    "py-grade-letters",
    "descending",
    code`
      score = 72
      if score >= 90:
          grade = "A"
      elif score >= 75:
          grade = "B"
      elif score >= 50:
          grade = "C"
      else:
          grade = "F"
    `,
  ),
  py(
    "py-grade-letters",
    "ascending with <",
    code`
      score = 72
      if score < 50:
          grade = "F"
      elif score < 75:
          grade = "C"
      elif score < 90:
          grade = "B"
      else:
          grade = "A"
    `,
  ),
  py(
    "py-grade-letters",
    "wrong order",
    code`
      score = 72
      if score >= 50:
          grade = "C"
      elif score >= 75:
          grade = "B"
      elif score >= 90:
          grade = "A"
      else:
          grade = "F"
    `,
    ["grade-a", "grade-b"],
  ),

  // py-greet-function
  py("py-greet-function", "f-string", 'def greet(name):\n    return f"Hello, {name}!"\n'),
  py("py-greet-function", "concatenation", 'def greet(name):\n    message = "Hello, " + name\n    return message + "!"\n'),
  py("py-greet-function", "prints instead", 'def greet(name):\n    print(f"Hello, {name}!")\n', ["returns", "ada", "any-name"]),
  py("py-greet-function", "hard-coded", 'def greet(name):\n    return "Hello, Ada!"\n', ["any-name"]),

  // py-area-function
  py("py-area-function", "multiply", "def rectangle_area(width, height):\n    return width * height\n\nprint(rectangle_area(3, 4))\n"),
  py(
    "py-area-function",
    "adds instead",
    "def rectangle_area(width, height):\n    return width + height\n\nprint(rectangle_area(3, 4))\n",
    ["small", "decimals", "zero", "prints"],
  ),
  py("py-area-function", "no print", "def rectangle_area(width, height):\n    return width * height\n", ["prints"]),

  // py-count-up
  py("py-count-up", "for range", "for number in range(1, 6):\n    print(number)\n"),
  py("py-count-up", "while", "number = 1\nwhile number <= 5:\n    print(number)\n    number += 1\n"),
  py("py-count-up", "five prints", "print(1)\nprint(2)\nprint(3)\nprint(4)\nprint(5)\n", ["uses-loop"]),
  py("py-count-up", "range(5)", "for number in range(5):\n    print(number)\n", ["output"]),

  // py-sum-numbers
  py("py-sum-numbers", "loop", "numbers = [3, 8, 2, 7]\ntotal = 0\nfor number in numbers:\n    total += number\n"),
  py("py-sum-numbers", "sum()", "numbers = [3, 8, 2, 7]\ntotal = sum(numbers)\n"),
  py("py-sum-numbers", "hard-coded", "numbers = [3, 8, 2, 7]\ntotal = 20\n", ["other-lists", "hidden-floats"]),
  py(
    "py-sum-numbers",
    "reset inside the loop",
    "numbers = [3, 8, 2, 7]\nfor number in numbers:\n    total = 0\n    total += number\n",
    ["total", "other-lists", "hidden-floats"],
  ),

  // py-countdown
  py("py-countdown", "while", 'start = 5\nwhile start > 0:\n    print(start)\n    start -= 1\nprint("Liftoff!")\n'),
  py("py-countdown", "for range", 'start = 5\nfor number in range(start, 0, -1):\n    print(number)\nprint("Liftoff!")\n'),
  py("py-countdown", "no liftoff", "start = 5\nwhile start > 0:\n    print(start)\n    start -= 1\n", ["from-five", "other-start", "zero"]),
  py("py-countdown", "stops at 2", 'start = 5\nwhile start > 1:\n    print(start)\n    start -= 1\nprint("Liftoff!")\n', ["from-five", "other-start"]),

  // py-list-append
  py("py-list-append", "append", 'fruits = ["apple", "banana"]\nfruits.append("cherry")\nprint(len(fruits))\n'),
  py("py-list-append", "concatenation", 'fruits = ["apple", "banana"]\nfruits = fruits + ["cherry"]\nprint(f"{len(fruits)} fruits")\n'),
  py(
    "py-list-append",
    "new hard-coded list",
    'fruits = ["apple", "banana"]\nfruits = ["apple", "banana", "cherry"]\nprint(len(fruits))\n',
    ["other-list"],
  ),
  py("py-list-append", "insert at start", 'fruits = ["apple", "banana"]\nfruits.insert(0, "cherry")\nprint(len(fruits))\n', ["appended", "other-list"]),

  // py-price-lookup
  py("py-price-lookup", "square brackets", 'prices = {"coffee": 3.5, "tea": 2.8, "bun": 2.0}\nitem = "tea"\nprice = prices[item]\nprint(price)\n'),
  py("py-price-lookup", "get()", 'prices = {"coffee": 3.5, "tea": 2.8, "bun": 2.0}\nitem = "tea"\nprice = prices.get(item, 0)\nprint(f"{item}: {price} EUR")\n'),
  py(
    "py-price-lookup",
    "hard-coded",
    'prices = {"coffee": 3.5, "tea": 2.8, "bun": 2.0}\nitem = "tea"\nprice = 2.8\nprint(price)\n',
    ["other-items", "hidden-new-menu"],
  ),

  // py-clean-name
  py("py-clean-name", "strip + title", 'raw_name = "  ada LOVELACE "\nclean_name = raw_name.strip().title()\n'),
  py("py-clean-name", "split + capitalize", 'raw_name = "  ada LOVELACE "\nclean_name = " ".join(word.capitalize() for word in raw_name.split())\n'),
  py("py-clean-name", "title only", 'raw_name = "  ada LOVELACE "\nclean_name = raw_name.title()\n', ["cleaned", "other-names"]),
  py("py-clean-name", "hard-coded", 'raw_name = "  ada LOVELACE "\nclean_name = "Ada Lovelace"\n', ["other-names"]),

  // py-slicing
  py("py-slicing", "slices", 'word = "Python"\nfirst_three = word[:3]\nlast_letter = word[-1]\n'),
  py("py-slicing", "indexes", 'word = "Python"\nfirst_three = word[0] + word[1] + word[2]\nlast_letter = word[len(word) - 1]\n'),
  py("py-slicing", "fixed last index", 'word = "Python"\nfirst_three = word[:3]\nlast_letter = word[5]\n', ["other-words"]),

  // py-word-counter-lab
  pyLab(
    "py-word-counter-lab",
    "dict.get loop",
    code`
      text = "the otter saw the river and the otter swam"
      word_counts = {}
      for word in text.lower().split():
          word_counts[word] = word_counts.get(word, 0) + 1
      most_common = max(word_counts, key=word_counts.get)
      print(most_common)
    `,
  ),
  pyLab(
    "py-word-counter-lab",
    "Counter",
    code`
      from collections import Counter
      text = "the otter saw the river and the otter swam"
      word_counts = Counter(text.lower().split())
      most_common = word_counts.most_common(1)[0][0]
      print("Most common word:", most_common)
    `,
  ),
  pyLab(
    "py-word-counter-lab",
    "case-sensitive",
    code`
      text = "the otter saw the river and the otter swam"
      word_counts = {}
      for word in text.split():
          word_counts[word] = word_counts.get(word, 0) + 1
      most_common = max(word_counts, key=word_counts.get)
      print(most_common)
    `,
    ["case-insensitive"],
  ),
  pyLab(
    "py-word-counter-lab",
    "forgets to print",
    code`
      text = "the otter saw the river and the otter swam"
      word_counts = {}
      for word in text.lower().split():
          word_counts[word] = word_counts.get(word, 0) + 1
      most_common = max(word_counts, key=word_counts.get)
    `,
    ["prints"],
  ),

  // py-score-report-lab
  pyLab(
    "py-score-report-lab",
    "loops and f-string",
    code`
      scores = [72, 45, 88, 71]

      def average(scores):
          if not scores:
              return 0
          return sum(scores) / len(scores)

      def count_passed(scores, limit):
          count = 0
          for score in scores:
              if score >= limit:
                  count += 1
          return count

      def report(scores):
          passed = count_passed(scores, 50)
          return f"{passed}/{len(scores)} passed, average {average(scores):.1f}"

      print(report(scores))
    `,
  ),
  pyLab(
    "py-score-report-lab",
    "comprehension and round()",
    code`
      scores = [72, 45, 88, 71]

      def average(values):
          return sum(values) / len(values) if values else 0

      def count_passed(values, limit):
          return len([value for value in values if value >= limit])

      def report(values):
          return str(count_passed(values, 50)) + "/" + str(len(values)) + " passed, average " + str(round(average(values), 1))

      print(report(scores))
    `,
  ),
  pyLab(
    "py-score-report-lab",
    "strictly greater than the limit",
    code`
      scores = [72, 45, 88, 71]

      def average(scores):
          if not scores:
              return 0
          return sum(scores) / len(scores)

      def count_passed(scores, limit):
          return len([s for s in scores if s > limit])

      def report(scores):
          return f"{count_passed(scores, 50)}/{len(scores)} passed, average {average(scores):.1f}"

      print(report(scores))
    `,
    ["count-passed"],
  ),
  pyLab(
    "py-score-report-lab",
    "empty list crashes",
    code`
      scores = [72, 45, 88, 71]

      def average(scores):
          return sum(scores) / len(scores)

      def count_passed(scores, limit):
          return len([s for s in scores if s >= limit])

      def report(scores):
          return f"{count_passed(scores, 50)}/{len(scores)} passed, average {average(scores):.1f}"

      print(report(scores))
    `,
    ["average-empty"],
  ),
];

const js = (exerciseId: string, name: string, source: string, failing: string[] = []): SolutionCase => ({
  exerciseId,
  stepId: "task",
  name,
  code: source,
  failing,
});
const jsLab = (exerciseId: string, name: string, source: string, failing: string[] = []): SolutionCase => ({
  exerciseId,
  stepId: "lab",
  name,
  code: source,
  failing,
});

const CART = `const cart = [
  { name: "Notebook", price: 4.5, quantity: 2 },
  { name: "Pen", price: 1.25, quantity: 4 },
];
`;

export const javascriptExpansionSolutions: SolutionCase[] = [
  // js-hello-console
  js("js-hello-console", "double quotes", 'console.log("Hello, world!");\n'),
  js("js-hello-console", "template literal", "console.log(`Hello, world!`)\n"),
  js("js-hello-console", "wrong text", 'console.log("hello world");\n', ["logs-hello", "only-greeting"]),

  // js-multiple-logs
  js("js-multiple-logs", "three logs", 'console.log("Ready");\nconsole.log("Set");\nconsole.log("Code!");\n'),
  js("js-multiple-logs", "loop", 'for (const word of ["Ready", "Set", "Code!"]) {\n  console.log(word);\n}\n'),
  js("js-multiple-logs", "wrong order", 'console.log("Set");\nconsole.log("Ready");\nconsole.log("Code!");\n', ["order"]),

  // js-let-update
  js("js-let-update", "assignment", "let score = 0;\nconst bonus = 10;\nscore = score + bonus;\nconsole.log(score);\n"),
  js("js-let-update", "+=", "let score = 0;\nconst bonus = 10;\nscore += bonus;\nconsole.log(score);\n"),
  js("js-let-update", "hard-coded", "let score = 0;\nconst bonus = 10;\nscore = 10;\nconsole.log(score);\n", ["other-values"]),
  js(
    "js-let-update",
    "new variable",
    "let score = 0;\nconst bonus = 10;\nconst total = score + bonus;\nconsole.log(total);\n",
    ["updated", "other-values", "logged"],
  ),

  // js-data-types
  js("js-data-types", "three types", 'const title = "Moomins";\nconst pages = 160;\nconst isAvailable = true;\nconsole.log(typeof pages);\n'),
  js(
    "js-data-types",
    "number in quotes",
    'const title = "Moomins";\nconst pages = "160";\nconst isAvailable = true;\nconsole.log(typeof pages);\n',
    ["pages-number", "logs-type"],
  ),
  js(
    "js-data-types",
    "boolean as text",
    'const title = "Moomins";\nconst pages = 160;\nconst isAvailable = "yes";\nconsole.log(typeof pages);\n',
    ["available-boolean"],
  ),

  // js-arithmetic
  js("js-arithmetic", "multiply", "const price = 2.5;\nconst quantity = 4;\nconst total = price * quantity;\nconsole.log(total);\n"),
  js("js-arithmetic", "formatted log", "const price = 2.5;\nconst quantity = 4;\nconst total = quantity * price;\nconsole.log(`Total: ${total} €`);\n"),
  js(
    "js-arithmetic",
    "adds instead",
    "const price = 2.5;\nconst quantity = 4;\nconst total = price + quantity;\nconsole.log(total);\n",
    ["total-value", "other-values"],
  ),
  js("js-arithmetic", "hard-coded", "const price = 2.5;\nconst quantity = 4;\nconst total = 10;\nconsole.log(total);\n", ["other-values"]),

  // js-comparisons
  js("js-comparisons", ">=", "const age = 17;\nconst isAdult = age >= 18;\n"),
  js("js-comparisons", "negated <", "const age = 17;\nconst isAdult = !(age < 18);\n"),
  js("js-comparisons", "> 18", "const age = 17;\nconst isAdult = age > 18;\n", ["boundary"]),

  // js-if-else
  js("js-if-else", "if / else", 'const temperature = 22;\nif (temperature >= 20) {\n  console.log("Warm");\n} else {\n  console.log("Cool");\n}\n'),
  js("js-if-else", "ternary", 'const temperature = 22;\nconsole.log(temperature >= 20 ? "Warm" : "Cool");\n'),
  js(
    "js-if-else",
    "> 20",
    'const temperature = 22;\nif (temperature > 20) {\n  console.log("Warm");\n} else {\n  console.log("Cool");\n}\n',
    ["boundary"],
  ),
  js(
    "js-if-else",
    "missing else",
    'const temperature = 22;\nif (temperature >= 20) {\n  console.log("Warm");\n}\nconsole.log("Cool");\n',
    ["warm", "boundary"],
  ),

  // js-logical-operators
  js("js-logical-operators", "&& and !", "const hasTicket = true;\nconst isBanned = false;\nconst canEnter = hasTicket && !isBanned;\n"),
  js(
    "js-logical-operators",
    "strict comparisons",
    "const hasTicket = true;\nconst isBanned = false;\nconst canEnter = hasTicket === true && isBanned === false;\n",
  ),
  js(
    "js-logical-operators",
    "|| instead of &&",
    "const hasTicket = true;\nconst isBanned = false;\nconst canEnter = hasTicket || !isBanned;\n",
    ["no-ticket", "banned"],
  ),

  // js-rectangle-area
  js("js-rectangle-area", "declaration", "function rectangleArea(width, height) {\n  return width * height;\n}\nconsole.log(rectangleArea(3, 4));\n"),
  js("js-rectangle-area", "arrow", "const rectangleArea = (w, h) => w * h;\nconsole.log(rectangleArea(3, 4));\n"),
  js(
    "js-rectangle-area",
    "adds instead",
    "function rectangleArea(width, height) {\n  return width + height;\n}\nconsole.log(rectangleArea(3, 4));\n",
    ["small", "decimals", "zero", "logged"],
  ),

  // js-for-loop
  js("js-for-loop", "for", "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}\n"),
  js("js-for-loop", "while", "let i = 1;\nwhile (i <= 5) {\n  console.log(i);\n  i++;\n}\n"),
  js("js-for-loop", "five logs", "console.log(1);\nconsole.log(2);\nconsole.log(3);\nconsole.log(4);\nconsole.log(5);\n", ["uses-loop"]),
  js("js-for-loop", "starts at 0", "for (let i = 0; i < 5; i++) {\n  console.log(i);\n}\n", ["output"]),

  // js-sum-to
  js("js-sum-to", "loop", "function sumTo(n) {\n  let total = 0;\n  for (let i = 1; i <= n; i++) {\n    total += i;\n  }\n  return total;\n}\n"),
  js("js-sum-to", "formula", "const sumTo = (n) => (n * (n + 1)) / 2;\n"),
  js(
    "js-sum-to",
    "off by one",
    "function sumTo(n) {\n  let total = 0;\n  for (let i = 0; i < n; i++) {\n    total += i;\n  }\n  return total;\n}\n",
    ["small", "one-and-zero", "large"],
  ),

  // js-array-push
  js("js-array-push", "push", 'const colors = ["red", "green"];\ncolors.push("blue");\nconsole.log(colors.length);\n'),
  js("js-array-push", "index", 'const colors = ["red", "green"];\ncolors[colors.length] = "blue";\nconsole.log(`${colors.length} colors`);\n'),
  js("js-array-push", "hard-coded array", 'const colors = ["red", "green", "blue"];\nconsole.log(3);\n', ["other-array"]),

  // js-filter-even
  js("js-filter-even", "filter", "function onlyEven(numbers) {\n  return numbers.filter((n) => n % 2 === 0);\n}\n"),
  js(
    "js-filter-even",
    "loop",
    "function onlyEven(numbers) {\n  const result = [];\n  for (const n of numbers) {\n    if (n % 2 === 0) result.push(n);\n  }\n  return result;\n}\n",
  ),
  js("js-filter-even", "odd check misses negatives", "const onlyEven = (numbers) => numbers.filter((n) => n % 2 !== 1);\n", ["negatives"]),
  js(
    "js-filter-even",
    "mutates the input",
    "function onlyEven(numbers) {\n  for (let i = numbers.length - 1; i >= 0; i--) {\n    if (numbers[i] % 2 !== 0) numbers.splice(i, 1);\n  }\n  return numbers;\n}\n",
    ["no-mutation"],
  ),

  // js-object-basics
  js("js-object-basics", "object literal", 'const book = { title: "Moomins", pages: 160 };\nconsole.log(book.title);\n'),
  js("js-object-basics", "logs whole object", 'const book = { title: "Moomins", pages: 160 };\nconsole.log(book);\n', ["logs-title"]),
  js("js-object-basics", "pages as text", 'const book = { title: "Moomins", pages: "160" };\nconsole.log(book.title);\n', ["pages"]),

  // js-describe-pet
  js("js-describe-pet", "properties", 'function describePet(pet) {\n  return pet.name + " the " + pet.species;\n}\n'),
  js("js-describe-pet", "destructuring", "const describePet = ({ name, species }) => `${name} the ${species}`;\n"),
  js("js-describe-pet", "hard-coded", 'function describePet(pet) {\n  return "Saku the otter";\n}\n', ["other-pets"]),

  // js-shout
  js("js-shout", "chained", 'function shout(text) {\n  return text.trim().toUpperCase() + "!";\n}\n'),
  js("js-shout", "template", "const shout = (text) => `${text.trim().toUpperCase()}!`;\n"),
  js("js-shout", "no trim", 'function shout(text) {\n  return text.toUpperCase() + "!";\n}\n', ["basic"]),

  // js-initials
  js("js-initials", "regex split", 'function initials(fullName) {\n  return fullName.trim().split(/\\s+/).map((w) => w[0].toUpperCase() + ".").join("");\n}\n'),
  js(
    "js-initials",
    "loop with filter",
    'function initials(fullName) {\n  let result = "";\n  for (const word of fullName.split(" ").filter((w) => w.length > 0)) {\n    result += word[0].toUpperCase() + ".";\n  }\n  return result;\n}\n',
  ),
  js(
    "js-initials",
    "no upper case",
    'function initials(fullName) {\n  return fullName.split(" ").map((w) => w[0] + ".").join("");\n}\n',
    ["lowercase", "three-names", "hidden-spaces"],
  ),
  js(
    "js-initials",
    "no trim",
    'function initials(fullName) {\n  return fullName.split(" ").map((w) => w[0].toUpperCase() + ".").join("");\n}\n',
    ["hidden-spaces"],
  ),

  // js-shopping-cart-lab
  jsLab(
    "js-shopping-cart-lab",
    "loop and ifs",
    `${CART}
function cartTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  return total;
}

function applyDiscount(total, code) {
  if (code === "SAVE10") return total * 0.9;
  if (code === "HALF") return total * 0.5;
  return total;
}

function formatPrice(amount) {
  return amount.toFixed(2) + " €";
}

console.log(formatPrice(applyDiscount(cartTotal(cart), "SAVE10")));
`,
  ),
  jsLab(
    "js-shopping-cart-lab",
    "reduce and switch",
    `${CART}
const cartTotal = (items) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);
const applyDiscount = (total, code) => {
  switch (code) {
    case "SAVE10":
      return total - total * 0.1;
    case "HALF":
      return total / 2;
    default:
      return total;
  }
};
const formatPrice = (amount) => \`\${amount.toFixed(2)} €\`;
const finalPrice = applyDiscount(cartTotal(cart), "SAVE10");
console.log(formatPrice(finalPrice));
`,
  ),
  jsLab(
    "js-shopping-cart-lab",
    "returns the discount, not the total",
    `${CART}
function cartTotal(items) {
  let total = 0;
  for (const item of items) total += item.price * item.quantity;
  return total;
}
function applyDiscount(total, code) {
  if (code === "SAVE10") return total * 0.1;
  if (code === "HALF") return total * 0.5;
  return total;
}
function formatPrice(amount) {
  return amount.toFixed(2) + " €";
}
console.log(formatPrice(applyDiscount(cartTotal(cart), "SAVE10")));
`,
    ["discount-save10", "logged"],
  ),
  jsLab(
    "js-shopping-cart-lab",
    "no toFixed",
    `${CART}
function cartTotal(items) {
  let total = 0;
  for (const item of items) total += item.price * item.quantity;
  return total;
}
function applyDiscount(total, code) {
  if (code === "SAVE10") return total * 0.9;
  if (code === "HALF") return total * 0.5;
  return total;
}
function formatPrice(amount) {
  return amount + " €";
}
console.log(formatPrice(applyDiscount(cartTotal(cart), "SAVE10")));
`,
    ["format", "logged", "hidden-small-amounts"],
  ),

  // js-task-list-lab
  jsLab(
    "js-task-list-lab",
    "spread, map and filter",
    `function addTask(tasks, title) {
  return [...tasks, { title, done: false }];
}
function completeTask(tasks, title) {
  return tasks.map((task) => (task.title === title ? { ...task, done: true } : task));
}
function remainingCount(tasks) {
  return tasks.filter((task) => !task.done).length;
}
let tasks = addTask([], "Write code");
tasks = addTask(tasks, "Test code");
tasks = completeTask(tasks, "Write code");
console.log(remainingCount(tasks));
`,
  ),
  jsLab(
    "js-task-list-lab",
    "loops with copies",
    `function addTask(tasks, title) {
  const copy = tasks.slice();
  copy.push({ title: title, done: false });
  return copy;
}
function completeTask(tasks, title) {
  const result = [];
  for (const task of tasks) {
    result.push(task.title === title ? Object.assign({}, task, { done: true }) : task);
  }
  return result;
}
function remainingCount(tasks) {
  let count = 0;
  for (const task of tasks) if (!task.done) count++;
  return count;
}
const list = completeTask(addTask(addTask([], "Write code"), "Test code"), "Write code");
console.log(remainingCount(list));
`,
  ),
  jsLab(
    "js-task-list-lab",
    "push mutates",
    `function addTask(tasks, title) {
  tasks.push({ title, done: false });
  return tasks;
}
function completeTask(tasks, title) {
  return tasks.map((task) => (task.title === title ? { ...task, done: true } : task));
}
function remainingCount(tasks) {
  return tasks.filter((task) => !task.done).length;
}
let tasks = addTask([], "Write code");
tasks = addTask(tasks, "Test code");
tasks = completeTask(tasks, "Write code");
console.log(remainingCount(tasks));
`,
    ["add-immutable"],
  ),
  jsLab(
    "js-task-list-lab",
    "complete mutates tasks",
    `function addTask(tasks, title) {
  return [...tasks, { title, done: false }];
}
function completeTask(tasks, title) {
  for (const task of tasks) {
    if (task.title === title) task.done = true;
  }
  return tasks;
}
function remainingCount(tasks) {
  return tasks.filter((task) => !task.done).length;
}
let tasks = addTask([], "Write code");
tasks = addTask(tasks, "Test code");
tasks = completeTask(tasks, "Write code");
console.log(remainingCount(tasks));
`,
    ["complete-immutable"],
  ),
];
