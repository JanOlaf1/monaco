# Koodaamo – seuraavat Codex / Claude Code -promptit

**Päivitetty:** 10.11.2026  
**Projektin nykytilanne käyttäjän viimeisen raportin mukaan:** Next.js / TypeScript / Tailwind / Monaco; FI+EN; toimiva JavaScript- ja Python-suoritus sekä testaus; 21 JS + 22 Python -harjoitusta; XP, levelit, streakit, 8 saavutusta, saukkomaskotti, oppimispolut; selaintallennus; TypeScript ja React vasta suunnitelmana; Firebase App Hosting kytketty.  
**Tarkoitus:** Suorita promptit yksi kerrallaan; tarkista diffit ja testit ennen seuraavaa. Liitetty 59-sivuinen Claude-dokumentti on **ideapankki**, ei ajantasainen arkkitehtuurimääräys. Projektiin jo toteutetut päätökset voittavat dokumentin ristiriitaiset ehdot.

## Projektin pysyvät reunaehdot

- Käytä projektin juuren `AGENTS.md`:ää, säilytä olemassa oleva rakenne, nykyinen Firebase App Hosting ja toimivat koodin suoritusmoottorit.
- Älä vaihda Cloudflareen, älä aloita monorepoa tai toista Next.js-sovellusta, älä vaihda Koodaamo-nimeä tai alkuperäistä saukkomaskottia ilman omistajan päätöstä.
- Sovellus on **FI/EN**, oppiminen toimii ilman tiliä, eikä Firestore/Auth/Storage ole tässä vaiheessa tarpeen. Älä ota käyttöön maksullisia palveluita tai kaupallisia ominaisuuksia.
- Älä riko vanhoja tallennettuja suorituksia, XP:tä, streakia, saavutuksia, luonnoksia tai määräpäiviä; tee tarvittaessa versioitu migraatio ja testit.
- Älä tee git pushia, mergeä tai deployta ilman lupaa. Raportoi rehellisesti toteutetut ja keskeneräiset ominaisuudet. Suorita lint, typecheck, yksikkötestit, build ja Playwright (sikäli kuin repo tukee niitä).
- Kaikki sisällöt, pelillistäminen ja kuvakset ovat omaperäisiä. Palautteen on tuettava oppimista; ei elämiä, pakollisia asennuksia, häpeyttämistä tai rangaistuksia.

---

# PROMPT 0 – Kun Claude / Codex -keskustelu nollaantuu (jatkokonteksti)

We are continuing an EXISTING Next.js + TypeScript Koodaamo coding education application. Read root `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, current commit/diff, course registry, gamification, persistence, and tests BEFORE editing. The user has already completed two implementation milestones, according to previous reports: 21 functional JavaScript and 22 functional Python exercises, FI/EN, Monaco, browser-side execution and tests, XP/levels/streaks/achievements, otter mascot, visual course paths, and local progress. TypeScript and React have not yet been implemented as runnable languages. Firebase App Hosting is connected, but Auth/Firestore/Storage are intentionally deferred. The attached 59-page blueprint was an early brainstorming proposal, NOT authority to change the now-implemented app name, otter mascot, hosting architecture or languages.

First audit the ACTUAL repo rather than trusting any summary: what exists, what passes, what is unfinished, and whether the red development-overlay '1 Issue' visible in a recent screenshot still occurs. Preserve data and stable exercise IDs, identify the smallest safe next change, then execute the specific milestone prompt provided after this handoff. Do not reinitialize the project, silently overwrite AGENTS.md, deploy or push. Always run actual checks, and report results and limits.

---

# PROMPT 1 – Milestone 3: Osaamistasot, aloituskartoitus ja mukautuva oppiminen

You are continuing the **existing Koodaamo repository**. Read `AGENTS.md`, `docs/ARCHITECTURE.md`, the existing content registry, gamification engine, local storage abstractions and E2E tests before editing. Do not rewrite working features.

**Goal:** The onboarding must ask about the learner's prior programming experience and direct them to an appropriate learning path instead of assuming everyone is a beginner. Separate **learning proficiency** from **gamification XP level**.

Implement:

1. **First-visit proficiency choice**, FI/EN, in a compact welcoming flow: `Beginner / Familiar with basics / Advanced / Professional` with clear non-judgmental descriptions. Allow `Not sure` and `Skip for now`. The user can choose separately for JavaScript, Python, TypeScript and React. Do not pretend TypeScript/React executable courses already exist.
2. **Optional diagnostic placement assessment** per currently working language (JS and Python). Mix small authentic coding tasks with prediction/debugging questions, using the existing runners where possible. Use realistic input variations. The result is a *recommendation*, not a certification. Respect a user's manual override. The professional choice must not claim verified professional competence.
3. **Suggested entry point and path**: beginner starts with a first success; knowledgeable learners can skip trivial chapters or try a checkpoint. Previous content must remain accessible. Do not lock content based on XP. Distinguish recommendation from mandatory prerequisites.
4. **Per-language competency model**: typed schema for `selfReportedLevel`, `placementResult`, `skillEvidence`, `recommendedNext`, `assessmentDate` and `userOverride`. Introduce stable identifiers and a storage migration retaining all existing progress/XP/streaks. Do not duplicate the current XP-level system.
5. **Progressive learning journey**: the homepage shows only the next meaningful task, optional assessment prompt and skill-path overview; detailed skill statistics remain collapsible. The choice must be editable in settings/progress.
6. **Educational content**: review the current 43 playable exercises for progression gaps and create a versioned content coverage matrix (JS, Python, TS, React; beginner/intermediate/advanced/pro). Write a realistic backlog for hundreds of exercises but add an initial verified batch of genuinely distinct, bilingual exercises/checkpoints appropriate to the placement levels. No superficial filler; no fake completions; no starter code passing all checks.
7. **Assessments and test quality**: allow multiple valid solutions, require meaningful behavior checks, and verify good/bad fixture solutions. Put no reliance on raw code-string matching as the main criterion.
8. **Regression tests**: first visit, returning visit, language switch, skip, reassessment, manual override, skill recommendation, local persistence, migration, and both languages. Test keyboard and mobile usability.

**Acceptance criteria:** A new user can choose a level and begin a suitable lesson within a short flow; an advanced user can enter deeper material without grinding beginner XP; XP level remains separate; saved learner data survives migration; no pre-existing feature regresses.

Run the repository's lint, typecheck, unit tests, build and Playwright suite. Fix failures. At the end report exact verified exercise counts by language and level, modified files, migration behavior, UX screenshots if available, and known limits. Do not push or deploy.

---

# PROMPT 2 – Milestone 4: Koodaamon oma maailma, koodikiteet, avatarit ja päivittäiset seikkailut

Continue from the current repository and the results of the previous milestone. Follow `AGENTS.md`. Inspect existing otter mascot, XP/levels, streaks, achievements, paths, storage and localization first. Preserve all existing data and behavior.

**Goal:** Make the platform feel like a distinctive, welcoming learning adventure without copying Duolingo or Boot.dev. Design a cohesive **original Koodaamo universe** around the existing otter explorer, with light fantasy/adventure flavor and authentic coding context. Keep the actual coding workspace calm and professional.

Design direction: **Koodisaaristo / Code Archipelago** (working creative direction, adapt to existing visual identity). Use 4 themed regions that also communicate learning stages: **Aloitussatama / Starter Harbor**, **Logiikkametsä / Logic Forest**, **Sovelluskaupunki / App City**, **Tuotantohuippu / Production Summit**. Don't turn each into an elaborate full-screen game. Add at most a couple of expressive original side characters as helpful guides; keep the otter as main mascot. Create scalable SVG/CSS assets and reusable components, not copyrighted art or an external game engine.

Implement a **non-monetized soft currency** with a localized name (`Koodikiteet / Code Crystals`, rename via a single config if needed). Rules:
- Earn only from genuine first-time completion, chapter milestones, optional daily learning quest and verified review tasks; no rewards for merely opening the app.
- Make rewards deterministic, transparent, accessible without paying, idempotent, and resistant to duplicate awards across refresh/midnight; preserve existing XP independently.
- No purchases, payment integration, purchasable packs, gambling/loot boxes, paid streak freezes, or pay-to-win.
- Do not lock core lessons, skill placement or required curricula behind crystals. If special optional challenge gates are explored, ensure skill-based/free alternative unlock paths and keep them out of this milestone.

Add **avatar customization** with a small real catalog of original cosmetic items (e.g. explorer goggles, scarf, backpack, hat). The user can preview, unlock using crystals, equip and unequip; balance cannot go negative; no duplicate purchases or lost items. Use an extensible catalog, event ledger and versioned local storage with tests. Existing otter SVG should remain recognizable. Avatar cosmetics must not modify code grading or skills.

Add optional daily/weekly learning quests with clear dates and completion events, several additional meaningful achievements, a gentle celebration animation, and an accessible **Collection / Achievements** view. Respect `prefers-reduced-motion`. The game must remain enjoyable if the user ignores streaks, goals and quests.

Add **original motivational microcopy**, and optionally a SMALL curated quote collection after a real chapter completion (not on every click). Avoid fabricated quotations or falsely attributed quotes. Original authored messages are preferred; any historical quote must include verified source, translator, usage rights and FI/EN translation rights. Prepare a typed catalog for future hundreds of reviewed entries but do NOT fabricate 300 attributed quotes. Allow disabling quote cards.

Keep the homepage simple: next challenge, level progress, daily mission and optional crystal balance; advanced panels collapsed. Keep Monaco workspace distraction-free. No extra Firebase services. Verify XP/crystal bookkeeping, repeated awards, timezone changes, store integrity, migrations, all language strings, accessibility and both themes. Report complete item catalog and exact earn/spend logic. No push or deploy.

---

# PROMPT 3 – Milestone 5: Toimiva TypeScript-kurssi ja tyyppitarkistus

Work in the existing Koodaamo repo. Read `AGENTS.md`, architecture notes, editor integrations, JS Worker runner, content schema, existing JavaScript tests and Playwright tests. Do not build another editor, another app or an unprotected server execution endpoint.

**Goal:** Make TypeScript a genuinely playable course with meaningful compiler diagnostics and behavioral tests, not a 'Coming soon' list.

1. Implement a TypeScript execution adapter using the existing isolated browser-side execution strategy. Distinguish (a) Monaco/TS language service diagnostics, (b) transpilation, (c) execution, and (d) automated tests. Type errors should not silently disappear when emitting JS.
2. Reuse the JS worker safely where appropriate. Preserve infinite-loop watchdog behavior and make worker failure recoverable. Do not assume Web Workers alone are a hardened sandbox; document risks before public deployment.
3. Present clear inline editor diagnostics and beginner-friendly FI/EN explanations for representative errors. Map diagnostics to real editor line/column where possible; never fake compilation success.
4. Create an authentic TypeScript learning path with tested exercises at multiple levels: types and annotations, functions, objects, interfaces, unions and narrowing, generics, async typing, refactoring an existing codebase and debugging. Include a first verified batch of at least 12 genuinely functional TypeScript exercises, subject to correctness and tests. Update course counters only for playable content.
5. Keep exercises structurally distinct; prefer working with existing code and real requirements for intermediate/pro tasks. Separate easy practice from practical mini-projects.
6. Verify valid alternatives, several wrong solutions per exercise and starter failures. Ensure migrations preserve all progress and users can continue existing JS/Python work. Tests: typecheck/lint/unit/build/Playwright desktop + touch view as applicable, and malicious/slow code timeout behavior.

Report exact test results and coverage. Do not falsely claim React now works. Do not push or deploy.

---

# PROMPT 4 – Milestone 6: React Live Preview + oikean työelämän Ship It -tehtävät

Continue only after reviewing the completed TypeScript architecture and existing JS/Python engines. Read `AGENTS.md` and architecture docs. Preserve all current courses, local state and gamification.

**Goal:** Transform React from a placeholder to a real coding experience, and create a distinctive work-like learning loop: **Ticket → Explore → Build → Verify → Ship → Debrief**.

1. Design an isolated browser React/TSX preview with a secure sandboxed iframe. Untrusted learner code must not have direct access to the host app's cookies/localStorage/IndexedDB or privileged APIs. Avoid `allow-scripts` combined with `allow-same-origin` on a same-origin sandbox; use a separate origin for a robust public deployment and document any development-only limitations. Validate postMessage origin, payload, correlation IDs and lifecycle; recover from runaway code, crashes and stale results. Do not enable external network access by default.
2. Support project files/tabs and edit permissions (editable/readonly), compile JSX/TSX, and render live UI with console/errors in the existing workspace. Keep the preview independent of the parent React tree.
3. Build an original fictional product that grows through lessons. Example: a small shop or events app, avoiding any code/text copied from PDF examples. Start with a small, complete and tested scenario before scaling.
4. Build an end-to-end **Ship It** loop: realistic user story + acceptance criteria; inspect an existing project; write/edit missing code; run tests; show actual preview; choose `Ship it` after passing; display meaningful before/after change and changelog; explain why this matters at work. A `Ship` event must map to actual completion, not an animation pretending to verify.
5. Add at least three qualitatively different task types: missing feature, bug hunt and refactor-with-green-tests. For advanced learners add one scoped issue/PR review simulation with clear rubric and non-deceptive grading.
6. Deliver a small high-quality React/TSX chapter with real test cases and positive/negative fixture solutions, including props, state, events, lists, controlled input and filtering. Integrate with existing 4-level placement recommendations.
7. Keep beginner UI simple: reveal just the current ticket. Advanced mode may display extra file tree, test details and logs. Provide FI/EN translations and accessible behavior. Test Chrome/Firefox/WebKit if available, desktop/mobile handoff and timeout recovery.

Do not claim UI tests are secure certifications if evaluated in the browser. Document all limits. Do not enable Firebase Auth/Firestore/Storage and do not push/deploy.

---

# PROMPT 5 – Milestone 7: Vapaaehtoinen PWA, mobiiliopetus ja paikalliset varmuuskopiot

Read `AGENTS.md`, current Next.js configuration, routing, public assets, service-worker assumptions, lesson runners, local storage and browser tests. Keep Firebase App Hosting unchanged.

**Goal:** Make Koodaamo installable **optionally** as a PWA, while the full web experience remains available without installation. Provide mobile-native-feeling learning interactions, not a shrunken desktop IDE.

1. Implement a valid Web App Manifest for FI/EN, suitable `name`, `short_name`, standalone display, icons (192px, 512px, maskable), apple-touch-icon, proper theme colors and deep-link launch behavior. Use the existing original brand/otter.
2. Add a gentle, user-initiated installation path (desktop/Android where supported, brief manual 'Add to Home Screen' guidance on iOS). Never block lessons, spam banners or assume every browser supports the same event.
3. Choose a carefully tested caching/offline strategy suitable for the existing Next.js/App Hosting deployment. Cache only versioned public assets and safe lesson content; avoid stale app shells, authentication data, dynamic execution results, and endless growth. Ensure upgrades and service-worker recovery work; do not promise fully offline Python until its 13 MB+ Pyodide runtime and dependencies are deliberately cached and verified.
4. Build touch-first lesson formats using existing lesson schema where feasible: predict output → run, reorder code lines (keyboard alternative to drag/drop), identify the bug, fill the missing token, and short review cards. Do not force Monaco to be the mobile editor; Monaco is officially unsupported on mobile browsers. Desktop remains the best place for long coding tasks.
5. Make short daily reviews completable on mobile and count genuine successful activity consistently toward streaks/rewards. Preserve accessibility and reduced-motion preferences.
6. Before relying on mobile home-screen storage, implement local **Export progress** and **Import progress** with schema validation, confirmation, safe merge/deduplication of XP/crystal events, and clear warnings about browser/device storage separation. Do not falsely promise Safari and iOS standalone PWA share the same local storage.
7. Run a production build and cross-browser E2E tests, including offline/online switch, upgrade and a saved draft. Do not change hosting provider or introduce payments, Firestore or auth.

At the end, list supported/unsupported offline scenarios and installation platforms honestly, files modified, all tests and known limitations. Do not push or deploy.

---

# Lisäprompti tulevaisuuteen: Sisällöntuotannon laatutyökalu

Read the current content registry, course manifests and validators. Add a scalable authoring workflow to build hundreds of bilingual exercises without one-off app logic. Each exercise should declare stable ID/version, locale content, objectives, starter code, hints, reference solutions and several intentionally wrong solutions, plus behavior-based tests. Implement a content-validation CLI that checks schema validity, missing translations, unsatisfiable prompts, starter failure, reference success, wrong-solution failure, reachable paths and unique reward event IDs. Add review templates and CI, and expand the catalog only in verified batches. Prioritize skill depth and recall, not simply high counters. Never overwrite progress with changed lesson IDs.

---

## Tärkeimmät päätökset (ei vielä toteutettu)

- Työnimi **Koodaamo**, päämaskotti **saukko**, oma kevyt seikkailuteema; otetaan enemmän hahmoja ja visuaalisuutta, mutta ei suoraa Boot.dev/Duolingo-kopiota.
- **4 valittavaa osaamistasoa** ovat erillisiä XP-pelitasoista; lisäksi vapaaehtoinen sijoitustesti kielittäin.
- **Koodikiteet/gemit** ansaitaan oikeasta oppimisesta, ei pelkästä kirjautumisesta; ei maksullisia toimintoja nyt. Kosmetiikka ostettavissa kiteillä tulevaisuudessa; sisältö ei saa muuttua pay-to-winiksi.
- Vapaaehtoinen **PWA**, ei pakollinen asennus eikä natiivisovellusta vielä.
- **Oikean työn simulointi** (Ticket–Explore–Build–Verify–Ship–Debrief) täydentää lyhyitä harjoituksia. Mobiiliin erilliset kosketustehtävät.
- **Motivaatiolauseet** voivat olla itse kirjoitettuja; kuuluisia lainauksia ei keksitä eikä väärin nimetä, vaan lähteet tarkistetaan.
- Tallennus edelleen selaimeen; Firebase Auth / Firestore vasta, kun käyttäjätilit ja laitteiden välinen synkronointi ovat oikeasti ajankohtaisia.
