# Content coverage matrix

**Version 1 · 2026-11-11 (Milestone 3)**

Counts are playable, verified exercises per track and level. An exercise counts at the level of its
chapter (`ChapterDefinition.level`). `tests/coverage.test.ts` recomputes the table from the content
registry and fails when this document is out of date, so update the numbers whenever content changes.

## Playable exercises by level

| Track | Beginner | Intermediate | Advanced | Professional | Total |
| ----- | -------: | -----------: | -------: | -----------: | ----: |
| Python | 12 | 12 | 7 | 0 | 31 |
| JavaScript | 12 | 11 | 7 | 0 | 30 |
| TypeScript | 0 | 0 | 0 | 0 | 0 |
| React | 0 | 0 | 0 | 0 | 0 |

By type: Python has 25 challenges, 4 labs and 2 checkpoints; JavaScript has 24 challenges, 4 labs
and 2 checkpoints. TypeScript and React have planned chapters only (no runner yet), so they have no
playable content and no placement check.

"Familiar with basics" in the UI is the `intermediate` level. There is no professional content yet:
learners who choose *Professional* are pointed at the advanced chapters, and the UI says so.

## Bands and skills

| Band | Python chapters (skills) | JavaScript chapters (skills) |
| ---- | ------------------------ | ---------------------------- |
| Beginner | 1–5: output, variables and strings, numbers, booleans, conditions + checkpoint | 1–5: output, variables and types, operators, conditions, functions + checkpoint |
| Intermediate | 6–10: functions, loops, lists and dictionaries, text, projects + checkpoint | 6–10: loops, arrays, objects, string methods, projects + checkpoint |
| Advanced | 11–13: comprehensions and sorting, exceptions, classes | 11–13: map/reduce/sort, errors and validation, async/await |

Skill ids are defined in `content/skills.ts` and are stable storage keys.

## Review of the original 43 exercises

Strengths: every beginner concept has at least two exercises, labs combine concepts, and tests check
behaviour with several inputs. Gaps found before this milestone:

- **No advanced material at all.** Everything ended at basic loops, lists and objects, so a learner
  who already knew the basics had nothing new to do. *Addressed:* three advanced chapters per
  language.
- **No way to skip ahead with confidence.** *Addressed:* a checkpoint between each pair of bands,
  plus the placement check.
- **Error handling was missing** (Python exceptions, JavaScript `throw`/`try`/`catch`, invalid
  JSON). *Addressed* in the new errors chapters.
- **Data transformation stopped at `filter`/`append`** (no comprehensions, `map`, `reduce`, sorting
  with keys or comparators). *Addressed.*
- **No asynchronous JavaScript and no Python classes.** *Addressed.*
- **Still open:** `while` loops in JavaScript, nested loops, tuples and sets, default/keyword
  arguments, scope and closures, modules, JSON in Python, dates, recursion, reading tracebacks as an
  exercise type, and testing your own code. These are in the backlog below.
- **Few guided multi-step exercises** (two). Most challenges are single-step; that is fine for review
  but beginners would benefit from more guided steps in the first chapters.

## Added in this milestone (verified batch)

Each exercise has bilingual text, hints, at least two valid reference solutions, typical mistakes
with the exact failing checks, and a starter that does not pass (`tests/fixtures/solutions-m3.ts`).

| Track | Checkpoints | Advanced exercises |
| ----- | ----------- | ------------------ |
| Python | Cinema ticket (basics), Order summary (functions and data) | Cleaning tags, Low-stock alerts, Leaderboard, Reading a quantity safely, Rejecting bad usernames, A step counter class, Lab: Library shelf |
| JavaScript | Delivery estimate (basics), Playlist stats (arrays and objects) | Formatting prices, Spending by category, Sorting by deadline, Validating a sign-up form, Loading saved settings, Waiting for data, Lab: Weather dashboard |

The placement checks (`content/placement/`) add 9 items per language: for each level one
"predict the output" question, one "choose the fix" question and one small coding task. Every
predict answer and every fix is verified by running the code in `tests/placement.test.ts`.

## Backlog (realistic plan for several hundred exercises)

Targets are per track and assume batches of 10–15 verified exercises per language. TypeScript and
React depend on their runners (Milestones 5 and 6).

| Track | Beginner | Intermediate | Advanced | Professional | Target |
| ----- | -------: | -----------: | -------: | -----------: | -----: |
| Python | +15 | +35 | +45 | +35 | ~160 |
| JavaScript | +15 | +35 | +45 | +35 | ~160 |
| TypeScript | +25 | +25 | +20 | +10 | ~80 |
| React | +25 | +25 | +20 | +10 | ~80 |

Planned topics, in priority order:

- **Python** — beginner: rounding and number formatting, nested conditions, reading a traceback.
  Intermediate: `while` with `break`/`continue`, nested loops, tuples and unpacking, sets, counting
  patterns, default and keyword arguments, scope, recursion intro, a data-cleaning lab. Advanced:
  `enumerate`/`zip`/`any`/`all`, generators, dataclasses, inheritance vs. composition, custom
  exceptions, type hints, the `json` and `datetime` modules, writing tests with `assert`.
  Professional: refactoring legacy code, test-first tasks, data pipelines, code-review exercises,
  realistic "ticket" labs.
- **JavaScript** — beginner: `while`, string templates, `null`/`undefined`. Intermediate: nested
  loops, destructuring, spread/rest, default parameters, scope and closures, `find`/`some`/`every`.
  Advanced: classes, modules (multi-file), `Map`/`Set`, dates, timers, `Promise.race`/retries,
  error classes. Professional: refactoring, performance, API-shaped data, review exercises; DOM tasks
  once a preview runner exists.
- **TypeScript** — annotations, interfaces, unions and narrowing, generics, utility types, strict
  null checks, typing API responses.
- **React** — components and JSX, props, state and events, lists and keys, forms, effects, context,
  custom hooks, loading and error states, accessibility.

Quality bar for every batch (enforced by tests): stable ids that never change, a level and skills on
every chapter, bilingual text with identical code identifiers, hints, at least two checks per step,
valid and invalid fixtures with exact failing checks, starters that fail, and no source-text matching
as the main check (structural checks are only used when the chapter is about that structure, such as
comprehensions).
