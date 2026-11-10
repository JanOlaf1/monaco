# AGENTS.md — Coding Learning Platform

Instructions for coding agents (Codex, Claude Code, etc.) working in this repository.
These rules apply across the project. Follow the user's current request when it explicitly changes a project priority.

## 1. Project and priorities

Build a clean, accessible, bilingual (English/Finnish) interactive coding learning platform with Next.js, TypeScript, React, Tailwind CSS and Monaco Editor.

The learning tracks are **JavaScript, Python, TypeScript and React**. The application should teach concepts, let students write and run real code, check solutions with meaningful automated tests, and show understandable feedback.

**Implementation order:**
1. Reliable learning workspace and Monaco editor, bilingual UI, clear exercise navigation.
2. Actual code execution and automated feedback: JavaScript/Python first, then TypeScript/React.
3. High-quality lessons, hints, progression, optional self-set deadlines and local persistence.
4. Accessibility, responsive UX, security, performance and verification.
5. Only later, if requested: user accounts, Firebase Authentication, Cloud Firestore and cross-device sync.

**Current infrastructure:** The Next.js app and Firebase App Hosting/GitHub connection already exist. Firebase Authentication and Firestore have **not** been enabled. Do not enable or configure them without an explicit request. The platform must work without a login or database.

## 2. Before changing code

- Inspect the existing repository, `package.json`, App Router structure, configuration, scripts and relevant components before editing.
- Check `git status` and the current diff. Other agents may be changing files; do not overwrite or revert their work.
- Read any more specific `AGENTS.md` files in directories you touch.
- Reuse the project's existing patterns, components, dependencies and design conventions.
- Prefer focused changes with small diffs. Do not refactor unrelated code, create duplicate implementations or reorganize the repository without a clear need.
- Solve the root cause of a defect rather than hiding errors or adding fragile workarounds.
- Do not create another Next.js app or Firebase project inside this repository.

## 3. Code quality and architecture

- Use strict, readable TypeScript; avoid `any` unless justified. Keep types and contracts explicit at module boundaries.
- Favor simple, maintainable code over clever abstractions. Avoid premature generalization and unnecessary files.
- Keep UI, exercise content, language runners, evaluation logic and persistence separate.
- Prefer Next.js Server Components where appropriate; use Client Components for Monaco, browser storage, workers and interactive UI.
- Do not access browser-only APIs during server rendering. Guard hydration and clean up subscriptions, workers and timers.
- Use a reusable typed exercise schema instead of one bespoke component per task.
- Keep one authoritative source for a course, exercise, translation and completion state; avoid duplicated or contradictory data.
- Add a new dependency only if it provides clear value and cannot reasonably be replaced with existing tools. Explain nontrivial additions.
- Preserve working behavior and compatibility unless the task explicitly requires a change.

## 4. Product and user experience

- Use the supplied freeCodeCamp screenshots as **functional references**, not UI or content to copy.
- Aim for a modern, lightweight, professional developer-tool experience: clear hierarchy, restrained styling, consistent spacing, accessible contrast and excellent usability.
- Learning workspace: instructions/tests, Monaco editor, and console/output or React preview. Provide independent scrolling and a usable small-screen/tab layout.
- Support step-by-step lessons and larger labs. Explain **what**, **why** and **how**; provide optional progressive hints.
- Prefer precise, actionable error messages over generic failures; show each test's pass/fail state.
- Keep UI and educational content available in **English and Finnish**. Do not translate programming language syntax or API identifiers. Centralize translations; do not scatter hardcoded strings.
- Save drafts/progress locally where useful. Optional deadlines may be 7 days, 14 days or a chosen date; they must be removable/reschedulable. **Missing a deadline never locks a lesson or penalizes a learner.**
- Do not add unrequested gamification, AI tutors, payments, certificates, admin consoles or authentication during the early milestones.

## 5. Code execution and grading — safety-critical

- Monaco is an editor, **not** an execution sandbox. Keep execution engines replaceable and separate from the UI.
- Never run arbitrary learner code directly in the Next.js server process or the main application UI context.
- Prefer isolated browser workers for supported languages (e.g. Pyodide for Python) and an isolated preview frame for React. Apply timeouts, cancellation, cleanup and appropriate resource limits.
- Treat learner code and console output as untrusted. Avoid exposing secrets, privileged APIs or unsanitized HTML. Do not claim workers/iframes are a fully secure sandbox; document remaining risks.
- Use real, deterministic checks: syntax, structure where necessary, observable behavior and multiple input/output cases. Avoid exact source-string matching or regex-only grading as the main strategy.
- Accept equivalent correct solutions. Provide individual, understandable test results and genuine failure messages.
- **Do not fake execution, test success, a working terminal, a live preview or a completed exercise.** Mark unfinished TypeScript/React execution explicitly until implemented.
- Use original educational text and test cases; do not copy freeCodeCamp's course materials.

## 6. Persistence and Firebase boundaries

- For now use local React state and browser storage behind a small, replaceable persistence interface.
- Handle storage failures, malformed old data, schema changes and SSR/hydration safely.
- Do not require Firebase services for local learning, grading or deadline scheduling.
- Never hardcode API keys, credentials or secrets. Do not commit `.env` values or service-account files.
- Do not create billable cloud resources, change production Firebase settings, modify production data or deploy without explicit approval.

## 7. Validation and change discipline

- For each change, add or update focused tests where reasonable, especially for grading, code runners, persistence, deadlines and regressions.
- Cover successful and failing solutions, edge cases, repeated clicks, timeouts, invalid input, worker cleanup and keyboard/mobile behavior as relevant.
- Run the smallest relevant verification first. Before declaring a major milestone complete, run the repository's available typecheck, lint, tests and production build.
- Use scripts defined in `package.json`; do not invent commands or claim unexecuted checks passed.
- If a check fails or cannot be run, report the actual result and remaining risk. Never suppress errors solely to make CI green.
- Do not run destructive cleanup commands, reset other people's changes, push, merge, tag, deploy or publish without explicit permission.
- Keep documentation concise and accurate when implementation or commands change.

## 8. Response format for coding tasks

At the end of a task, briefly report:
1. **Changed:** behavior and important files.
2. **Verified:** exact checks run and results.
3. **Remaining:** known limitations or unimplemented behavior.
4. **Next:** the smallest logical follow-up, only if useful.

If you are uncertain, inspect the code and state the uncertainty instead of guessing. Prioritize working functionality, simplicity, security and a polished learning experience over adding more features.
