import { code } from "@/lib/content/md";
import type { SolutionCase } from "./solutions";

/**
 * Reference solutions for the Milestone 3 exercises: checkpoints and the
 * advanced chapters. Each exercise has several valid styles and typical
 * mistakes with the exact tests they must fail.
 */

const sol = (exerciseId: string, stepId: string) => (name: string, source: string, failing: string[] = []): SolutionCase => ({
  exerciseId,
  stepId,
  name,
  code: source,
  failing,
});

/* ------------------------------- Python ------------------------------- */

const cinema = sol("py-checkpoint-cinema", "checkpoint");
const orders = sol("py-checkpoint-orders", "checkpoint");
const cleanTags = sol("py-clean-tags", "task");
const stock = sol("py-stock-alerts", "task");
const topScores = sol("py-top-scores", "task");
const quantity = sol("py-parse-quantity", "task");
const username = sol("py-valid-username", "task");
const counter = sol("py-step-counter", "task");
const shelf = sol("py-library-shelf-lab", "lab");

const CINEMA_HEADER = 'age = 15\nis_student = False\nday = "Tuesday"\n\n';

const ORDERS_LOOP = code`
  def summarize_orders(orders):
      items = 0
      total = 0
      top_item = None
      best = 0
      names = set()
      for order in orders:
          line = order["qty"] * order["price"]
          items += order["qty"]
          total += line
          if top_item is None or line > best:
              best = line
              top_item = order["item"]
          names.add(order["item"].strip().lower())
      return {"items": items, "total": round(total, 2), "top_item": top_item, "names": sorted(names)}
`;

const SHELF_DICTS = code`
  class Shelf:
      def __init__(self):
          self.copies = {}
          self.borrowed = {}

      def add(self, title):
          self.copies[title] = self.copies.get(title, 0) + 1

      def _free(self, title):
          return self.copies.get(title, 0) - self.borrowed.get(title, 0)

      def borrow(self, title):
          if self._free(title) <= 0:
              return False
          self.borrowed[title] = self.borrowed.get(title, 0) + 1
          return True

      def give_back(self, title):
          if self.borrowed.get(title, 0) == 0:
              return False
          self.borrowed[title] -= 1
          return True

      def available(self):
          return sorted(title for title in self.copies if self._free(title) > 0)
`;

const COUNTER = code`
  class StepCounter:
      def __init__(self, goal):
          self.goal = goal
          self.steps = 0
          self.log = []

      def add(self, amount):
          self.steps += amount
          self.log.append(amount)

      def remaining(self):
          return max(self.goal - self.steps, 0)

      def reached(self):
          return self.steps >= self.goal
`;

export const pythonM3Solutions: SolutionCase[] = [
  // py-checkpoint-cinema
  cinema(
    "if/elif chain, discount afterwards",
    CINEMA_HEADER +
      code`
        if age < 12:
            price = 6.0
        elif age >= 65:
            price = 8.0
        elif is_student:
            price = 9.0
        else:
            price = 12.0

        if day == "Tuesday":
            price = price - 2.0

        print(f"Ticket: {price} €")
      `,
  ),
  cinema(
    "separate discount variable",
    CINEMA_HEADER +
      code`
        discount = 2.0 if day == "Tuesday" else 0
        if age >= 65:
            base = 8.0
        elif age < 12:
            base = 6.0
        elif is_student and age >= 12:
            base = 9.0
        else:
            base = 12.0
        price = base - discount
        print("Ticket:", price, "€")
      `,
  ),
  cinema(
    "senior boundary off by one",
    CINEMA_HEADER +
      code`
        if age < 12:
            price = 6.0
        elif age > 65:
            price = 8.0
        elif is_student:
            price = 9.0
        else:
            price = 12.0
        if day == "Tuesday":
            price -= 2.0
        print(price)
      `,
    ["senior"],
  ),
  cinema(
    "student rule before senior rule",
    CINEMA_HEADER +
      code`
        if age < 12:
            price = 6.0
        elif is_student:
            price = 9.0
        elif age >= 65:
            price = 8.0
        else:
            price = 12.0
        if day == "Tuesday":
            price -= 2.0
        print(price)
      `,
    ["senior-student"],
  ),
  cinema(
    "Tuesday discount only for adults",
    CINEMA_HEADER +
      code`
        if age < 12:
            price = 6.0
        elif age >= 65:
            price = 8.0
        elif is_student:
            price = 9.0
        else:
            price = 12.0
            if day == "Tuesday":
                price = price - 2.0
        print(price)
      `,
    ["tuesday"],
  ),
  cinema(
    "hard-coded price",
    CINEMA_HEADER + "price = 10.0\nprint(price)\n",
    ["child", "adult", "senior", "student", "senior-student", "tuesday"],
  ),

  // py-checkpoint-orders
  orders("single loop", ORDERS_LOOP),
  orders(
    "comprehensions with an empty guard",
    code`
      def summarize_orders(orders):
          if not orders:
              return {"items": 0, "total": 0, "top_item": None, "names": []}
          lines = [order["qty"] * order["price"] for order in orders]
          best = max(range(len(orders)), key=lambda i: lines[i])
          return {
              "items": sum(order["qty"] for order in orders),
              "total": round(sum(lines), 2),
              "top_item": orders[best]["item"],
              "names": sorted({order["item"].strip().lower() for order in orders}),
          }
    `,
  ),
  orders("no rounding", ORDERS_LOOP.replace('round(total, 2)', "total"), ["total"]),
  orders(
    "top item by quantity",
    ORDERS_LOOP.replace(
      "if top_item is None or line > best:\n            best = line",
      'if top_item is None or order["qty"] > best:\n            best = order["qty"]',
    ),
    ["top-item"],
  ),
  orders("names not cleaned", ORDERS_LOOP.replace('names.add(order["item"].strip().lower())', 'names.add(order["item"])'), ["names"]),
  orders(
    "crashes on an empty list",
    code`
      def summarize_orders(orders):
          lines = [order["qty"] * order["price"] for order in orders]
          best = max(range(len(orders)), key=lambda i: lines[i])
          return {
              "items": sum(order["qty"] for order in orders),
              "total": round(sum(lines), 2),
              "top_item": orders[best]["item"],
              "names": sorted({order["item"].strip().lower() for order in orders}),
          }
    `,
    ["empty"],
  ),

  // py-clean-tags
  cleanTags("comprehension with filter", "def clean_tags(tags):\n    return [tag.strip().lower() for tag in tags if tag.strip()]\n"),
  cleanTags(
    "nested generator",
    "def clean_tags(tags):\n    return [t.lower() for t in (tag.strip() for tag in tags) if t != \"\"]\n",
  ),
  cleanTags(
    "loop instead of comprehension",
    code`
      def clean_tags(tags):
          result = []
          for tag in tags:
              if tag.strip():
                  result.append(tag.strip().lower())
          return result
    `,
    ["comprehension"],
  ),
  cleanTags("no filter", "def clean_tags(tags):\n    return [tag.strip().lower() for tag in tags]\n", ["drops-empty"]),
  cleanTags(
    "changes the input",
    "def clean_tags(tags):\n    tags[:] = [tag.strip().lower() for tag in tags if tag.strip()]\n    return tags\n",
    ["no-mutation"],
  ),

  // py-stock-alerts
  stock("dict comprehension", "def low_stock(stock, threshold):\n    return {name: qty for name, qty in stock.items() if qty < threshold}\n"),
  stock(
    "comprehension over keys",
    "def low_stock(stock, threshold):\n    return {name: stock[name] for name in stock if stock[name] < threshold}\n",
  ),
  stock("<= instead of <", "def low_stock(stock, threshold):\n    return {name: qty for name, qty in stock.items() if qty <= threshold}\n", ["boundary"]),
  stock(
    "deletes from the input",
    code`
      def low_stock(stock, threshold):
          for name in list(stock):
              if stock[name] >= threshold:
                  del stock[name]
          return stock
    `,
    ["no-mutation", "comprehension"],
  ),
  stock(
    "returns a list of names",
    "def low_stock(stock, threshold):\n    return [name for name, qty in stock.items() if qty < threshold]\n",
    ["filters", "boundary", "empty", "comprehension"],
  ),

  // py-top-scores
  topScores(
    "tuple key",
    code`
      def top_players(results, n):
          ranked = sorted(results, key=lambda r: (-r["score"], r["name"]))
          return [r["name"] for r in ranked[:n]]
    `,
  ),
  topScores(
    "two stable sorts",
    code`
      def top_players(results, n):
          ranked = sorted(results, key=lambda r: r["name"])
          ranked = sorted(ranked, key=lambda r: r["score"], reverse=True)
          return [r["name"] for r in ranked][:n]
    `,
  ),
  topScores(
    "no tie-breaker",
    code`
      def top_players(results, n):
          ranked = sorted(results, key=lambda r: r["score"], reverse=True)
          return [r["name"] for r in ranked[:n]]
    `,
    ["ties"],
  ),
  topScores(
    "sorts the input in place",
    code`
      def top_players(results, n):
          results.sort(key=lambda r: (-r["score"], r["name"]))
          return [r["name"] for r in results[:n]]
    `,
    ["no-mutation"],
  ),
  topScores(
    "lowest score first",
    code`
      def top_players(results, n):
          ranked = sorted(results, key=lambda r: (r["score"], r["name"]))
          return [r["name"] for r in ranked[:n]]
    `,
    ["best-first", "ties"],
  ),

  // py-parse-quantity
  quantity(
    "try/except",
    code`
      def parse_quantity(text):
          try:
              number = int(text)
          except ValueError:
              return None
          if number < 0:
              return None
          return number
    `,
  ),
  quantity(
    "isdigit check",
    code`
      def parse_quantity(text):
          cleaned = text.strip()
          if cleaned.isdigit():
              return int(cleaned)
          return None
    `,
  ),
  quantity(
    "rounds decimals",
    code`
      def parse_quantity(text):
          try:
              number = int(float(text))
          except ValueError:
              return None
          return None if number < 0 else number
    `,
    ["decimal"],
  ),
  quantity(
    "rejects zero",
    code`
      def parse_quantity(text):
          try:
              number = int(text)
          except ValueError:
              return None
          return None if number <= 0 else number
    `,
    ["zero"],
  ),
  quantity(
    "allows negatives",
    code`
      def parse_quantity(text):
          try:
              return int(text)
          except ValueError:
              return None
    `,
    ["negative"],
  ),

  // py-valid-username
  username(
    "two checks",
    code`
      def make_username(name):
          username = name.strip()
          if len(username) < 3:
              raise ValueError("Username must be at least 3 characters")
          if " " in username:
              raise ValueError("Username cannot contain spaces")
          return username.lower()
    `,
  ),
  username(
    "messages with f-strings",
    code`
      MIN_LENGTH = 3

      def make_username(name):
          cleaned = name.strip().lower()
          if " " in cleaned:
              raise ValueError("No spaces allowed in a username")
          if len(cleaned) < MIN_LENGTH:
              raise ValueError(f"Use at least {MIN_LENGTH} characters")
          return cleaned
    `,
  ),
  username(
    "checks the length before stripping",
    code`
      def make_username(name):
          if len(name) < 3:
              raise ValueError("Username must be at least 3 characters")
          username = name.strip()
          if " " in username:
              raise ValueError("Username cannot contain spaces")
          return username.lower()
    `,
    ["short-after-strip"],
  ),
  username(
    "returns None instead of raising",
    code`
      def make_username(name):
          username = name.strip()
          if len(username) < 3 or " " in username:
              return None
          return username.lower()
    `,
    ["too-short", "short-after-strip", "spaces"],
  ),
  username(
    "vague message",
    code`
      def make_username(name):
          username = name.strip()
          if len(username) < 3:
              raise ValueError("Too short")
          if " " in username:
              raise ValueError("Username cannot contain spaces")
          return username.lower()
    `,
    ["too-short"],
  ),

  // py-step-counter
  counter("instance attributes", COUNTER),
  counter(
    "steps derived from the log",
    code`
      class StepCounter:
          def __init__(self, goal):
              self.goal = goal
              self.log = []
              self.steps = 0

          def add(self, amount):
              self.log = self.log + [amount]
              self.steps = sum(self.log)

          def remaining(self):
              left = self.goal - self.steps
              return left if left > 0 else 0

          def reached(self):
              return self.remaining() == 0
    `,
  ),
  counter(
    "shared class-level log",
    code`
      class StepCounter:
          log = []

          def __init__(self, goal):
              self.goal = goal
              self.steps = 0

          def add(self, amount):
              self.steps += amount
              self.log.append(amount)

          def remaining(self):
              return max(self.goal - self.steps, 0)

          def reached(self):
              return self.steps >= self.goal
    `,
    ["separate"],
  ),
  counter("remaining goes negative", COUNTER.replace("return max(self.goal - self.steps, 0)", "return self.goal - self.steps"), ["remaining"]),
  counter("reached needs more than the goal", COUNTER.replace("return self.steps >= self.goal", "return self.steps > self.goal"), ["reached"]),

  // py-library-shelf-lab
  shelf("two dictionaries", SHELF_DICTS),
  shelf(
    "lists of copies",
    code`
      class Shelf:
          def __init__(self):
              self.on_shelf = []
              self.out = []

          def add(self, title):
              self.on_shelf.append(title)

          def borrow(self, title):
              if title in self.on_shelf:
                  self.on_shelf.remove(title)
                  self.out.append(title)
                  return True
              return False

          def give_back(self, title):
              if title in self.out:
                  self.out.remove(title)
                  self.on_shelf.append(title)
                  return True
              return False

          def available(self):
              return sorted(set(self.on_shelf))
    `,
  ),
  shelf(
    "sets lose extra copies",
    code`
      class Shelf:
          def __init__(self):
              self.books = set()
              self.out = set()

          def add(self, title):
              self.books.add(title)

          def borrow(self, title):
              if title in self.books and title not in self.out:
                  self.out.add(title)
                  return True
              return False

          def give_back(self, title):
              if title in self.out:
                  self.out.remove(title)
                  return True
              return False

          def available(self):
              return sorted(self.books - self.out)
    `,
    ["copies"],
  ),
  shelf(
    "accepts returns of books that are not borrowed",
    SHELF_DICTS.replace(
      "        if self.borrowed.get(title, 0) == 0:\n            return False\n        self.borrowed[title] -= 1",
      "        self.borrowed[title] = self.borrowed.get(title, 0) - 1",
    ),
    ["give-back-invalid"],
  ),
  shelf(
    "unsorted titles",
    SHELF_DICTS.replace("return sorted(title for title in self.copies if self._free(title) > 0)", "return [title for title in self.copies if self._free(title) > 0]"),
    ["add-available"],
  ),
];

/* ----------------------------- JavaScript ----------------------------- */

const delivery = sol("js-checkpoint-delivery", "checkpoint");
const playlist = sol("js-checkpoint-playlist", "checkpoint");
const prices = sol("js-format-prices", "task");
const totals = sol("js-totals-by-category", "task");
const sortTasks = sol("js-sort-tasks", "task");
const signup = sol("js-validate-signup", "task");
const settings = sol("js-parse-settings", "task");
const greet = sol("js-await-user", "task");
const dashboard = sol("js-weather-dashboard-lab", "lab");

const DELIVERY = code`
  const distanceKm = 120;
  const isExpress = false;

  function deliveryDays(distanceKm, isExpress) {
    let days;
    if (distanceKm <= 50) {
      days = 1;
    } else if (distanceKm <= 300) {
      days = 2;
    } else {
      days = 4;
    }
    if (isExpress) {
      days = Math.max(days - 1, 1);
    }
    return days;
  }

  const days = deliveryDays(distanceKm, isExpress);
  console.log(days === 1 ? "Arrives in 1 day" : "Arrives in " + days + " days");
`;

const PLAYLIST = code`
  function playlistStats(songs) {
    let total = 0;
    let longest = null;
    let longestSeconds = -1;
    const liked = [];
    for (const song of songs) {
      total += song.seconds;
      if (song.seconds > longestSeconds) {
        longestSeconds = song.seconds;
        longest = song.title;
      }
      if (song.liked) liked.push(song.title.trim());
    }
    return { count: songs.length, minutes: Math.round(total / 60), longest, liked };
  }
`;

const TOTALS = code`
  function totalsByCategory(expenses) {
    return expenses.reduce((totals, expense) => {
      totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
      return totals;
    }, {});
  }
`;

const SORT_TASKS = code`
  function sortByDeadline(tasks) {
    return [...tasks].sort((a, b) => {
      if (a.due === null && b.due === null) return a.title.localeCompare(b.title);
      if (a.due === null) return 1;
      if (b.due === null) return -1;
      return a.due.localeCompare(b.due) || a.title.localeCompare(b.title);
    });
  }
`;

const SIGNUP = code`
  function validateSignup(form) {
    if (!form.email.includes("@")) {
      throw new Error("Email must contain @");
    }
    if (form.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    return { email: form.email.trim().toLowerCase() };
  }
`;

const SETTINGS = code`
  const defaults = { theme: "light", fontSize: 14 };

  function parseSettings(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ...defaults };
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { ...defaults };
    }
    return { ...defaults, ...parsed };
  }
`;

const GREET = code`
  async function greetUser(fetchUser, id) {
    const user = await fetchUser(id);
    if (!user) return "Hello, guest!";
    return "Hello, " + user.name + "!";
  }
`;

const DASHBOARD = code`
  async function loadDashboard(cities, fetchTemperature) {
    return Promise.all(
      cities.map(async (city) => {
        try {
          return { city, temperature: await fetchTemperature(city) };
        } catch {
          return { city, temperature: null };
        }
      }),
    );
  }
`;

export const javascriptM3Solutions: SolutionCase[] = [
  // js-checkpoint-delivery
  delivery("if/else and Math.max", DELIVERY),
  delivery(
    "arrow function with ternaries",
    code`
      const distanceKm = 120;
      const isExpress = false;

      const deliveryDays = (km, express) => {
        const base = km <= 50 ? 1 : km <= 300 ? 2 : 4;
        return express ? Math.max(base - 1, 1) : base;
      };

      const result = deliveryDays(distanceKm, isExpress);
      const unit = result === 1 ? "day" : "days";
      console.log("Arrives in " + result + " " + unit);
    `,
  ),
  delivery("50 km boundary excluded", DELIVERY.replace("distanceKm <= 50", "distanceKm < 50"), ["near"]),
  delivery("express can reach zero days", DELIVERY.replace("days = Math.max(days - 1, 1);", "days = days - 1;"), [
    "express-minimum",
    "singular",
  ]),
  delivery(
    "always plural",
    DELIVERY.replace('console.log(days === 1 ? "Arrives in 1 day" : "Arrives in " + days + " days");', 'console.log("Arrives in " + days + " days");'),
    ["singular"],
  ),

  // js-checkpoint-playlist
  playlist("for...of loop", PLAYLIST),
  playlist(
    "reduce, filter and map",
    code`
      const playlistStats = (songs) => {
        const total = songs.reduce((sum, song) => sum + song.seconds, 0);
        const longestSong = songs.reduce((best, song) => (best === null || song.seconds > best.seconds ? song : best), null);
        return {
          count: songs.length,
          minutes: Math.round(total / 60),
          longest: longestSong ? longestSong.title : null,
          liked: songs.filter((song) => song.liked).map((song) => song.title.trim()),
        };
      };
    `,
  ),
  playlist("last song wins a tie", PLAYLIST.replace("song.seconds > longestSeconds", "song.seconds >= longestSeconds"), ["tie"]),
  playlist("rounds down", PLAYLIST.replace("Math.round(total / 60)", "Math.floor(total / 60)"), ["count-minutes"]),
  playlist("liked titles not trimmed", PLAYLIST.replace("liked.push(song.title.trim())", "liked.push(song.title)"), ["liked"]),
  playlist(
    "sorts the playlist in place",
    code`
      function playlistStats(songs) {
        songs.sort((a, b) => b.seconds - a.seconds);
        const total = songs.reduce((sum, song) => sum + song.seconds, 0);
        return {
          count: songs.length,
          minutes: Math.round(total / 60),
          longest: songs.length ? songs[0].title : null,
          liked: songs.filter((song) => song.liked).map((song) => song.title.trim()),
        };
      }
    `,
    ["liked", "no-mutation"],
  ),

  // js-format-prices
  prices("map", 'const formatPrices = (prices) => prices.map((price) => price.toFixed(2) + " €");\n'),
  prices(
    "for...of loop",
    code`
      function formatPrices(prices) {
        const result = [];
        for (const price of prices) {
          result.push(price.toFixed(2) + " €");
        }
        return result;
      }
    `,
  ),
  prices("no toFixed", 'const formatPrices = (prices) => prices.map((price) => price + " €");\n', ["formats", "rounding"]),
  prices(
    "replaces items in place",
    code`
      function formatPrices(prices) {
        prices.forEach((price, index) => {
          prices[index] = price.toFixed(2) + " €";
        });
        return prices;
      }
    `,
    ["no-mutation"],
  ),

  // js-totals-by-category
  totals("reduce", TOTALS),
  totals(
    "for...of loop",
    code`
      function totalsByCategory(expenses) {
        const totals = {};
        for (const { category, amount } of expenses) {
          if (!(category in totals)) totals[category] = 0;
          totals[category] += amount;
        }
        return totals;
      }
    `,
  ),
  totals(
    "shared totals object",
    code`
      const totals = {};
      function totalsByCategory(expenses) {
        for (const expense of expenses) {
          totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
        }
        return totals;
      }
    `,
    ["single", "empty", "fresh-object"],
  ),
  totals(
    "no starting value per category",
    TOTALS.replace("(totals[expense.category] ?? 0) + expense.amount", "totals[expense.category] + expense.amount"),
    ["groups", "single", "fresh-object"],
  ),
  totals(
    "overwrites instead of adding",
    TOTALS.replace("(totals[expense.category] ?? 0) + expense.amount", "expense.amount"),
    ["groups"],
  ),

  // js-sort-tasks
  sortTasks("compare function with localeCompare", SORT_TASKS),
  sortTasks(
    "fallback date and < comparisons",
    code`
      const sortByDeadline = (tasks) =>
        tasks.slice().sort((a, b) => {
          const dueA = a.due ?? "9999-99-99";
          const dueB = b.due ?? "9999-99-99";
          if (dueA !== dueB) return dueA < dueB ? -1 : 1;
          return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
        });
    `,
  ),
  sortTasks("sorts the input in place", SORT_TASKS.replace("return [...tasks].sort(", "return tasks.sort("), ["no-mutation"]),
  sortTasks(
    "no tie-breaker",
    code`
      function sortByDeadline(tasks) {
        return [...tasks].sort((a, b) => {
          if (a.due === null && b.due === null) return 0;
          if (a.due === null) return 1;
          if (b.due === null) return -1;
          return a.due.localeCompare(b.due);
        });
      }
    `,
    ["ties", "no-date-last"],
  ),
  sortTasks(
    "crashes on missing dates",
    code`
      function sortByDeadline(tasks) {
        return [...tasks].sort((a, b) => a.due.localeCompare(b.due) || a.title.localeCompare(b.title));
      }
    `,
    ["no-date-last"],
  ),

  // js-validate-signup
  signup("throws Error", SIGNUP),
  signup(
    "destructuring and RangeError",
    code`
      const validateSignup = ({ email, password }) => {
        const cleaned = email.trim().toLowerCase();
        if (!cleaned.includes("@")) throw new TypeError("An email address needs an @ sign");
        if (password.length < 8) throw new RangeError("Use 8 or more characters for the password");
        return { email: cleaned };
      };
    `,
  ),
  signup(
    "returns error objects instead of throwing",
    code`
      function validateSignup(form) {
        if (!form.email.includes("@")) return { error: "Email must contain @" };
        if (form.password.length < 8) return { error: "Password must be at least 8 characters" };
        return { email: form.email.trim().toLowerCase() };
      }
    `,
    ["bad-email", "short-password"],
  ),
  signup("rejects exactly 8 characters", SIGNUP.replace("form.password.length < 8", "form.password.length <= 8"), ["exactly-eight"]),
  signup("email not normalised", SIGNUP.replace("return { email: form.email.trim().toLowerCase() };", "return { email: form.email };"), ["valid"]),

  // js-parse-settings
  settings("try/catch and type check", SETTINGS),
  settings(
    "Object.assign",
    code`
      const defaults = { theme: "light", fontSize: 14 };

      function isPlainObject(value) {
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
      }

      function parseSettings(text) {
        try {
          const parsed = JSON.parse(text);
          return Object.assign({}, defaults, isPlainObject(parsed) ? parsed : {});
        } catch (error) {
          return Object.assign({}, defaults);
        }
      }
    `,
  ),
  settings("returns the shared defaults", SETTINGS.replace("  } catch {\n    return { ...defaults };", "  } catch {\n    return defaults;"), [
    "new-object",
  ]),
  settings(
    "no type check",
    code`
      const defaults = { theme: "light", fontSize: 14 };

      function parseSettings(text) {
        try {
          return { ...defaults, ...JSON.parse(text) };
        } catch {
          return { ...defaults };
        }
      }
    `,
    ["not-object"],
  ),
  settings(
    "no try/catch",
    code`
      const defaults = { theme: "light", fontSize: 14 };

      function parseSettings(text) {
        const parsed = JSON.parse(text);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return { ...defaults };
        return { ...defaults, ...parsed };
      }
    `,
    ["invalid-json", "new-object"],
  ),

  // js-await-user
  greet("async/await", GREET),
  greet(
    "promise chain",
    code`
      function greetUser(fetchUser, id) {
        return fetchUser(id).then((user) => (user ? "Hello, " + user.name + "!" : "Hello, guest!"));
      }
    `,
  ),
  greet("missing await", GREET.replace("const user = await fetchUser(id);", "const user = fetchUser(id);"), ["greets", "guest"]),
  greet("no guest case", GREET.replace('  if (!user) return "Hello, guest!";\n', ""), ["guest"]),

  // js-weather-dashboard-lab
  dashboard("Promise.all with per-city catch", DASHBOARD),
  dashboard(
    "Promise.allSettled",
    code`
      async function loadDashboard(cities, fetchTemperature) {
        const settled = await Promise.allSettled(cities.map((city) => fetchTemperature(city)));
        return settled.map((outcome, index) => ({
          city: cities[index],
          temperature: outcome.status === "fulfilled" ? outcome.value : null,
        }));
      }
    `,
  ),
  dashboard(
    "one request at a time",
    code`
      async function loadDashboard(cities, fetchTemperature) {
        const result = [];
        for (const city of cities) {
          try {
            result.push({ city, temperature: await fetchTemperature(city) });
          } catch {
            result.push({ city, temperature: null });
          }
        }
        return result;
      }
    `,
    ["parallel"],
  ),
  dashboard(
    "one failure rejects everything",
    code`
      async function loadDashboard(cities, fetchTemperature) {
        const temperatures = await Promise.all(cities.map((city) => fetchTemperature(city)));
        return cities.map((city, index) => ({ city, temperature: temperatures[index] }));
      }
    `,
    ["failure"],
  ),
];
