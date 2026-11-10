import { code } from "@/lib/content/md";

/**
 * Reference solutions used to verify exercise tests. Each step has several
 * valid solutions written in different styles (tests must accept all of
 * them) and invalid solutions that must fail specific tests.
 *
 * These live in the test suite, not in the shipped content.
 */
export interface SolutionCase {
  exerciseId: string;
  stepId: string;
  name: string;
  code: string;
  /** Test ids expected to fail; an empty list means every test must pass. */
  failing: string[];
}

const PY_HEADER = "# Variables and strings\n# Write your code below this line.\n";

export const pythonSolutions: SolutionCase[] = [
  // --- variables-and-strings / create-variable
  {
    exerciseId: "variables-and-strings",
    stepId: "create-variable",
    name: "double quotes",
    code: `${PY_HEADER}first_name = "Aino"\n`,
    failing: [],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "create-variable",
    name: "single quotes",
    code: "first_name = 'Matti'\n",
    failing: [],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "create-variable",
    name: "misspelled name",
    code: 'firstname = "Aino"\n',
    failing: ["first-name-exists", "first-name-is-string", "first-name-not-empty"],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "create-variable",
    name: "number instead of string",
    code: "first_name = 42\n",
    failing: ["first-name-is-string", "first-name-not-empty"],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "create-variable",
    name: "empty string",
    code: 'first_name = ""\n',
    failing: ["first-name-not-empty"],
  },
  // --- build-greeting
  {
    exerciseId: "variables-and-strings",
    stepId: "build-greeting",
    name: "concatenation",
    code: 'first_name = "Aino"\ngreeting = "Hello, " + first_name + "!"\n',
    failing: [],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "build-greeting",
    name: "f-string",
    code: 'first_name = "Aino"\ngreeting = f"Hello, {first_name}!"\n',
    failing: [],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "build-greeting",
    name: "str.format",
    code: 'first_name = "Aino"\ngreeting = "Hello, {}!".format(first_name)\n',
    failing: [],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "build-greeting",
    name: "hard-coded greeting",
    code: 'first_name = "Aino"\ngreeting = "Hello, Aino!"\n',
    failing: ["greeting-uses-variable"],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "build-greeting",
    name: "missing space",
    code: 'first_name = "Aino"\ngreeting = "Hello," + first_name + "!"\n',
    failing: ["greeting-text", "greeting-uses-variable"],
  },
  // --- print-greeting
  {
    exerciseId: "variables-and-strings",
    stepId: "print-greeting",
    name: "print variable",
    code: 'first_name = "Aino"\ngreeting = f"Hello, {first_name}!"\nprint(greeting)\n',
    failing: [],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "print-greeting",
    name: "print expression",
    code: 'first_name = "Aino"\ngreeting = f"Hello, {first_name}!"\nprint("Hello, " + first_name + "!")\n',
    failing: [],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "print-greeting",
    name: "prints the variable name as text",
    code: 'first_name = "Aino"\ngreeting = f"Hello, {first_name}!"\nprint("greeting")\n',
    failing: ["prints-greeting", "print-follows-name"],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "print-greeting",
    name: "prints fixed text",
    code: 'first_name = "Aino"\ngreeting = f"Hello, {first_name}!"\nprint("Hello, Aino!")\n',
    failing: ["print-follows-name"],
  },
  // --- string-method
  {
    exerciseId: "variables-and-strings",
    stepId: "string-method",
    name: "upper on greeting",
    code: 'first_name = "Aino"\ngreeting = f"Hello, {first_name}!"\nprint(greeting)\nshout = greeting.upper()\nprint(shout)\n',
    failing: [],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "string-method",
    name: "str.upper call",
    code: 'first_name = "Aino"\ngreeting = "Hello, " + first_name + "!"\nshout = str.upper(greeting)\nprint(greeting)\nprint(shout)\n',
    failing: [],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "string-method",
    name: "typed in capitals",
    code: 'first_name = "Aino"\ngreeting = f"Hello, {first_name}!"\nprint(greeting)\nshout = "HELLO, AINO!"\nprint(shout)\n',
    failing: ["uses-upper", "shout-follows-name"],
  },
  {
    exerciseId: "variables-and-strings",
    stepId: "string-method",
    name: "wrong print order",
    code: 'first_name = "Aino"\ngreeting = f"Hello, {first_name}!"\nshout = greeting.upper()\nprint(shout)\nprint(greeting)\n',
    failing: ["output-order"],
  },
  // --- shipping-cost-lab
  {
    exerciseId: "shipping-cost-lab",
    stepId: "lab",
    name: "if / elif / else with or",
    code: code`
      distance_km = 30
      is_member = False

      if is_member or distance_km < 10:
          shipping_cost = 0
      elif distance_km <= 50:
          shipping_cost = 4.9
      else:
          shipping_cost = 9.9

      print(shipping_cost)
    `,
    failing: [],
  },
  {
    exerciseId: "shipping-cost-lab",
    stepId: "lab",
    name: "nested if, formatted output",
    code: code`
      distance_km = 30
      is_member = False

      if is_member:
          shipping_cost = 0
      else:
          if distance_km > 50:
              shipping_cost = 9.90
          elif distance_km >= 10:
              shipping_cost = 4.90
          else:
              shipping_cost = 0.0

      print(f"Shipping: {shipping_cost:.2f} EUR")
    `,
    failing: [],
  },
  {
    exerciseId: "shipping-cost-lab",
    stepId: "lab",
    name: "conditional expression",
    code: code`
      distance_km = 30
      is_member = False
      shipping_cost = 0 if is_member or distance_km < 10 else (4.9 if distance_km <= 50 else 9.9)
      print("Cost:", shipping_cost)
    `,
    failing: [],
  },
  {
    exerciseId: "shipping-cost-lab",
    stepId: "lab",
    name: "excludes 50 from the standard rate",
    code: code`
      distance_km = 30
      is_member = False
      if is_member or distance_km < 10:
          shipping_cost = 0
      elif distance_km < 50:
          shipping_cost = 4.9
      else:
          shipping_cost = 9.9
      print(shipping_cost)
    `,
    failing: ["boundary-50"],
  },
  {
    exerciseId: "shipping-cost-lab",
    stepId: "lab",
    name: "makes 10 km free",
    code: code`
      distance_km = 30
      is_member = False
      if is_member or distance_km <= 10:
          shipping_cost = 0
      elif distance_km <= 50:
          shipping_cost = 4.9
      else:
          shipping_cost = 9.9
      print(shipping_cost)
    `,
    failing: ["boundary-10"],
  },
  {
    exerciseId: "shipping-cost-lab",
    stepId: "lab",
    name: "ignores membership",
    code: code`
      distance_km = 30
      is_member = False
      if distance_km < 10:
          shipping_cost = 0
      elif distance_km <= 50:
          shipping_cost = 4.9
      else:
          shipping_cost = 9.9
      print(shipping_cost)
    `,
    failing: ["member-free", "hidden-members"],
  },
  {
    exerciseId: "shipping-cost-lab",
    stepId: "lab",
    name: "forgets to print",
    code: code`
      distance_km = 30
      is_member = False
      if is_member or distance_km < 10:
          shipping_cost = 0
      elif distance_km <= 50:
          shipping_cost = 4.9
      else:
          shipping_cost = 9.9
    `,
    failing: ["prints-cost"],
  },
  {
    exerciseId: "shipping-cost-lab",
    stepId: "lab",
    name: "uses strings for the cost",
    code: code`
      distance_km = 30
      is_member = False
      if is_member or distance_km < 10:
          shipping_cost = "0"
      elif distance_km <= 50:
          shipping_cost = "4.90"
      else:
          shipping_cost = "9.90"
      print(shipping_cost)
    `,
    failing: [
      "cost-is-number",
      "short-free",
      "boundary-10",
      "middle-30",
      "boundary-50",
      "long-120",
      "member-free",
      "hidden-decimals",
      "hidden-members",
    ],
  },
  {
    exerciseId: "shipping-cost-lab",
    stepId: "lab",
    name: "hard-codes the starter values",
    code: code`
      distance_km = 30
      is_member = False
      shipping_cost = 4.9
      print(shipping_cost)
    `,
    failing: ["uses-if", "short-free", "long-120", "member-free", "hidden-decimals", "hidden-members"],
  },
];

const JS_HEADER = "// Variables and functions\n// Write your code below this line.\n";

export const javascriptSolutions: SolutionCase[] = [
  // --- greeting-functions / store-name
  {
    exerciseId: "greeting-functions",
    stepId: "store-name",
    name: "double quotes",
    code: `${JS_HEADER}const learnerName = "Ada";\n`,
    failing: [],
  },
  {
    exerciseId: "greeting-functions",
    stepId: "store-name",
    name: "single quotes, no semicolon",
    code: "const learnerName = 'Matti'\n",
    failing: [],
  },
  {
    exerciseId: "greeting-functions",
    stepId: "store-name",
    name: "declared with let",
    code: 'let learnerName = "Ada";\n',
    failing: ["declared-with-const"],
  },
  {
    exerciseId: "greeting-functions",
    stepId: "store-name",
    name: "wrong capitalization",
    code: 'const learnername = "Ada";\n',
    failing: ["declared-with-const", "is-nonempty-string"],
  },
  // --- write-function
  {
    exerciseId: "greeting-functions",
    stepId: "write-function",
    name: "declaration with template literal",
    code: 'const learnerName = "Ada";\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n',
    failing: [],
  },
  {
    exerciseId: "greeting-functions",
    stepId: "write-function",
    name: "arrow function with concatenation",
    code: 'const learnerName = "Ada";\nconst greet = (name) => "Hello, " + name + "!";\n',
    failing: [],
  },
  {
    exerciseId: "greeting-functions",
    stepId: "write-function",
    name: "function expression",
    code: 'const learnerName = "Ada";\nconst greet = function (who) {\n  const text = "Hello, " + who;\n  return text + "!";\n};\n',
    failing: [],
  },
  {
    exerciseId: "greeting-functions",
    stepId: "write-function",
    name: "logs instead of returning",
    code: 'const learnerName = "Ada";\nfunction greet(name) {\n  console.log(`Hello, ${name}!`);\n}\n',
    failing: ["greet-returns", "greet-ada", "greet-any-name"],
  },
  {
    exerciseId: "greeting-functions",
    stepId: "write-function",
    name: "hard-coded name",
    code: 'const learnerName = "Ada";\nfunction greet(name) {\n  return "Hello, Ada!";\n}\n',
    failing: ["greet-any-name"],
  },
  // --- use-function
  {
    exerciseId: "greeting-functions",
    stepId: "use-function",
    name: "nested call",
    code: 'const learnerName = "Ada";\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet(learnerName));\n',
    failing: [],
  },
  {
    exerciseId: "greeting-functions",
    stepId: "use-function",
    name: "intermediate variable",
    code: 'const learnerName = "Aino";\nconst greet = (name) => `Hello, ${name}!`;\nconst message = greet(learnerName);\nconsole.log(message);\n',
    failing: [],
  },
  {
    exerciseId: "greeting-functions",
    stepId: "use-function",
    name: "logs a fixed string",
    code: 'const learnerName = "Ada";\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\nconsole.log("Hello, Ada!");\n',
    failing: ["calls-greet"],
  },
  // --- default-parameter
  {
    exerciseId: "greeting-functions",
    stepId: "default-parameter",
    name: "default parameter",
    code: 'const learnerName = "Ada";\nfunction greet(name = "friend") {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet(learnerName));\n',
    failing: [],
  },
  {
    exerciseId: "greeting-functions",
    stepId: "default-parameter",
    name: "nullish coalescing",
    code: 'const learnerName = "Ada";\nconst greet = (name) => `Hello, ${name ?? "friend"}!`;\nconsole.log(greet(learnerName));\n',
    failing: [],
  },
  {
    exerciseId: "greeting-functions",
    stepId: "default-parameter",
    name: "no default",
    code: 'const learnerName = "Ada";\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet(learnerName));\n',
    failing: ["default-friend"],
  },
  {
    exerciseId: "greeting-functions",
    stepId: "default-parameter",
    name: "removed the log",
    code: 'const learnerName = "Ada";\nfunction greet(name = "friend") {\n  return `Hello, ${name}!`;\n}\n',
    failing: ["still-logs"],
  },
  // --- weather-advisor-lab
  {
    exerciseId: "weather-advisor-lab",
    stepId: "lab",
    name: "if / else if chain",
    code: code`
      function toFahrenheit(celsius) {
        return celsius * 9 / 5 + 32;
      }

      function describeWeather(celsius) {
        if (celsius < 0) {
          return "freezing";
        } else if (celsius < 15) {
          return "cold";
        } else if (celsius < 25) {
          return "mild";
        }
        return "hot";
      }

      console.log(toFahrenheit(20));
      console.log(describeWeather(20));
    `,
    failing: [],
  },
  {
    exerciseId: "weather-advisor-lab",
    stepId: "lab",
    name: "arrow functions with ternaries",
    code: code`
      const toFahrenheit = (c) => (c * 9) / 5 + 32;
      const describeWeather = (c) =>
        c < 0 ? "freezing" : c < 15 ? "cold" : c < 25 ? "mild" : "hot";
    `,
    failing: [],
  },
  {
    exerciseId: "weather-advisor-lab",
    stepId: "lab",
    name: "switch (true) from the top",
    code: code`
      function toFahrenheit(celsius) {
        const factor = 1.8;
        return celsius * factor + 32;
      }
      function describeWeather(celsius) {
        switch (true) {
          case celsius >= 25:
            return "hot";
          case celsius >= 15:
            return "mild";
          case celsius >= 0:
            return "cold";
          default:
            return "freezing";
        }
      }
    `,
    failing: [],
  },
  {
    exerciseId: "weather-advisor-lab",
    stepId: "lab",
    name: "15 counted as cold",
    code: code`
      function toFahrenheit(celsius) {
        return celsius * 9 / 5 + 32;
      }
      function describeWeather(celsius) {
        if (celsius < 0) return "freezing";
        if (celsius <= 15) return "cold";
        if (celsius < 25) return "mild";
        return "hot";
      }
    `,
    failing: ["w-mild-boundary"],
  },
  {
    exerciseId: "weather-advisor-lab",
    stepId: "lab",
    name: "operator precedence mistake",
    code: code`
      function toFahrenheit(celsius) {
        return celsius * (9 / 5 + 32);
      }
      function describeWeather(celsius) {
        if (celsius < 0) return "freezing";
        if (celsius < 15) return "cold";
        if (celsius < 25) return "mild";
        return "hot";
      }
    `,
    failing: ["f-freezing-point", "f-boiling-point", "f-negative", "f-decimal", "hidden-extremes"],
  },
  {
    exerciseId: "weather-advisor-lab",
    stepId: "lab",
    name: "logs instead of returning",
    code: code`
      function toFahrenheit(celsius) {
        console.log(celsius * 9 / 5 + 32);
      }
      function describeWeather(celsius) {
        if (celsius < 0) console.log("freezing");
        else if (celsius < 15) console.log("cold");
        else if (celsius < 25) console.log("mild");
        else console.log("hot");
      }
    `,
    failing: [
      "f-freezing-point",
      "f-boiling-point",
      "f-negative",
      "f-decimal",
      "w-freezing",
      "w-zero",
      "w-cold",
      "w-mild-boundary",
      "w-hot-boundary",
      "hidden-decimals",
      "hidden-extremes",
    ],
  },
];
