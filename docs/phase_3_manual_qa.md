# Phase 3 Manual QA Checklist — Classic Practice

Manual verification for the multilingual Classic Practice prototype (English, French, Spanish).

**Scope:** Browser prototype only. No backend, accounts, Challenge mode, ads, payments, rankings, or messaging.

---

## Before you start

### Commands

| Task | Command |
|------|---------|
| Dev server (debug tools visible) | `npm run prototype:dev` → open http://localhost:5173 |
| Production build | `npm run prototype:build` |
| Preview production build | `cd prototype && npm run preview` → open http://localhost:4173 |
| Automated regression | `npm test` |
| Word set validation | `npm run validate:wordsets` |

### Test environment

- [ ] Use a current Chromium, Safari, or Firefox browser.
- [ ] Test at least once at a **desktop-width** window (~1024px+).
- [ ] Test at least once at a **narrow width** (~320–390px, phone-sized).
- [ ] Optional: test touch input on a real phone or device emulator.

### How to use this checklist

- Mark each item **Pass / Fail / N/A** and add notes for failures.
- One full pass per language (EN, FR, ES) is recommended for sections 2–4.
- Masking checks (section 5) require advancing to specific grids — use **Skip** or play through.

### Clue masking reference

Each grid has six words. Mask types in the clue list:

| Mask type | What you should see (unfound word) |
|-----------|-------------------------------------|
| **None** | Full word letters visible (uppercased; accents/ñ preserved) |
| **Full** | `#` characters only, length matches word length |
| **Partial** | Leading `#` characters, then visible letters at the end |

Expected mask counts by grid (play order):

| Grid | Full masks | Partial masks | Unmasked words |
|------|------------|---------------|----------------|
| 1 | 0 | 0 | 6 |
| 2 | 0 | 0 | 6 |
| 3 | 1 | 1 | 4 |
| 4 | 0 | 0 | 6 |
| 5 | 2 | 2 | 2 |
| 6 | 1 | 1 | 4 |
| 7 | 2 | 2 | 2 |

---

## 1. Startup

- [ ] App launches without console errors on the start screen.
- [ ] Title and subtitle appear.
- [ ] **Language** selector shows **English**, **French**, and **Spanish**.
- [ ] **Start Practice Round** button is visible and clickable.
- [ ] Selecting **French**, starting a round, then refreshing the page restores **French** as the selected language.
- [ ] Selecting **Spanish**, refreshing, confirms **Spanish** persists.
- [ ] Selecting **English**, refreshing, confirms **English** persists.

---

## 2. English Practice round

- [ ] Start a Practice round with **English** selected.
- [ ] Game screen loads: score, timer, grid counter, theme label, word gauge, letter grid, clue list, and Skip button.
- [ ] Timer shows **1:30** (90 seconds) at round start.
- [ ] Grid counter shows **1/7**.
- [ ] Letter grid is 7×7 and readable.
- [ ] Six clues appear; unfound clues show masked or full letters (not blank).
- [ ] Drag/swipe across a valid English word — word is accepted, score increases, clue shows **Found** with strikethrough, gauge notch fills, grid cells highlight.
- [ ] Drag/swipe in **reverse** along the same word — swipe is **rejected** (no score change).
- [ ] Complete all words on a grid (or skip through) and finish the round — end screen appears.
- [ ] Round can end by **timeout** (wait for 0:00) or by **completing all grids**.

---

## 3. French Practice round

- [ ] Select **French** on the start screen and start a Practice round.
- [ ] UI chrome is in French (labels such as score, time, grid, skip, clues).
- [ ] Round starts successfully with seven grids.
- [ ] Theme labels and clues use French vocabulary.
- [ ] **Accents display correctly** where present (e.g. é, è, ê in clues or grid letters) — not replaced by plain ASCII.
- [ ] Swipes on valid French words are accepted and update score, clues, and gauge.
- [ ] Reverse swipes are rejected.
- [ ] Round can complete or expire normally.

---

## 4. Spanish Practice round

- [ ] Select **Spanish** on the start screen and start a Practice round.
- [ ] UI chrome is in Spanish.
- [ ] Round starts successfully with seven grids.
- [ ] Theme labels and clues use Spanish vocabulary.
- [ ] **Accents display correctly** (e.g. á, é, í, ó, ú) in clues and grid where present.
- [ ] **ñ displays correctly** in clues and on the letter grid (e.g. words like *niño*, *montaña*, *caña*, *tamaño*, *señor* may appear depending on theme).
- [ ] **ñ is not treated as n:** swiping a path that spells the word with **n** instead of **ñ** does **not** match a word that requires **ñ** (swipe fails or matches a different word only if that path exists).
- [ ] Valid Spanish swipes score correctly.
- [ ] Reverse swipes are rejected.
- [ ] Round can complete or expire normally.

---

## 5. Masking

Advance to each grid (play or skip) and verify clue mask types for **unfound** words.

### Grids 1, 2, 4 (no masking)

- [ ] **Grid 1:** All six unfound clues show full visible letters (no `#` masking).
- [ ] **Grid 2:** Same — no `#` masking on unfound clues.
- [ ] **Grid 4:** Same — no `#` masking on unfound clues.

### Grid 3

- [ ] Exactly **one** unfound clue is **full** mask (`#` only).
- [ ] Exactly **one** unfound clue is **partial** mask (`#` + visible trailing letters).
- [ ] Remaining unfound clues are unmasked (full letters visible).

### Grid 5

- [ ] Exactly **two** unfound clues are **full** mask.
- [ ] Exactly **two** unfound clues are **partial** mask.
- [ ] Remaining unfound clues are unmasked.

### Grid 6

- [ ] Exactly **one** unfound clue is **full** mask.
- [ ] Exactly **one** unfound clue is **partial** mask.

### Grid 7

- [ ] Exactly **two** unfound clues are **full** mask.
- [ ] Exactly **two** unfound clues are **partial** mask.

### After finding a masked word

- [ ] Finding a masked word reveals the full word in the clue list (no `#` remaining for that word).

---

## 6. Skip behavior

- [ ] **Skip** is enabled when more than one unfinished grid remains.
- [ ] Tapping **Skip** moves to another unfinished grid without scoring the current grid.
- [ ] Skipped grid returns later in the rotation (skip away from grid 1, complete/skip others, eventually return to grid 1).
- [ ] Completing all words on a grid removes that grid from the active loop.
- [ ] On the **last unfinished grid**, **Skip** is **disabled** and a hint indicates skip is unavailable (e.g. “Last unfinished grid”).
- [ ] Grid counter and unfinished-grid hint update after skip.

---

## 7. Timer behavior

- [ ] Timer starts at **1:30** and counts down during gameplay.
- [ ] Timer display updates smoothly (does not freeze while the game screen is active).
- [ ] When remaining time is low (≤ 10 seconds), a **Low time** indicator appears (not color alone).
- [ ] When time reaches **0:00**, the round ends and the end screen shows (time expired / round over).
- [ ] Timer does not continue counting on the end or review screens.
- [ ] Completing all grids **before** timeout ends the round early; end screen may show a **time bonus** in the final score.

---

## 8. End screen

- [ ] End screen appears after timeout or completing all grids.
- [ ] Shows **Round over** (or localized equivalent) and status (all grids complete vs. time is up).
- [ ] **Final score** is prominent and matches expectations (word points ± time bonus).
- [ ] Stats show words found, grids completed, and time remaining.
- [ ] **Grid summary** lists all seven grids with complete/incomplete status and words-found counts.
- [ ] **Review Grids** opens the review screen.
- [ ] **Start New Round** begins a fresh Practice round in the current language.
- [ ] **Back to Start** returns to the language selection / start screen.

---

## 9. Review screen

- [ ] Review opens from the end screen.
- [ ] Read-only hint is visible (no scoring or swiping in review).
- [ ] **Seven grid tabs** (1–7) are present; selected tab is indicated.
- [ ] Tabs reflect complete vs. missed-word status (not color-only — check labels/aria if using assistive tech).
- [ ] **Previous / Next grid** navigation works; buttons disable at first/last grid.
- [ ] Letter grid shows all words revealed (found and missed paths highlighted).
- [ ] Word list below grid shows every target word with **Found** or **Missed** text labels.
- [ ] **Back to results** returns to the end screen.

---

## 10. Debug tools hidden in production build

### Development (`npm run prototype:dev`)

- [ ] Start a Practice round — **Dev tools** panel appears at the bottom of the game screen.
- [ ] Panel includes controls such as Show Solutions, Complete Current Grid, Pause Timer, Regenerate Round, Log Round State.

### Production (`npm run prototype:build` then `npm run preview` in `prototype/`)

- [ ] Start a Practice round — **no Dev tools** panel or debug buttons visible.
- [ ] No debug-only actions available in the UI (show solutions, pause timer, complete grid, regenerate, log state).

---

## 11. Layout at desktop and narrow widths

### Desktop (~1024px+)

- [ ] Start screen is centered and readable.
- [ ] Game screen: header stats, grid, clues, and Skip fit without horizontal scroll.
- [ ] Letter grid stays square and legible.
- [ ] End and review screens scroll cleanly if content exceeds viewport height.

### Narrow (~320–390px)

- [ ] Start screen language options and start button remain usable (no clipped text).
- [ ] Game header (grid / time / score) remains readable; text is not uncomfortably tiny.
- [ ] Letter grid remains square and swipeable.
- [ ] Clue list scrolls when needed.
- [ ] Skip button and hint are reachable.
- [ ] Review grid tabs and prev/next controls remain tappable.
- [ ] No unintended horizontal page scroll.

---

## 12. Error handling

Under normal conditions with validated word sets, round generation should succeed. Still verify recovery UI if a failure occurs, or spot-check the error screen via a developer who can simulate a failed start.

- [ ] If round generation fails, an **error screen** appears (not a blank page or silent failure).
- [ ] Error title and body message are **localized** to the current UI language (EN/FR/ES).
- [ ] Message is user-friendly — **no raw engine error codes** (e.g. `theme-selection-failed`) shown to the player.
- [ ] **Try Again** attempts to start a new Practice round.
- [ ] **Back to Start** returns to the start screen without leaving a broken game state.
- [ ] After **Back to Start**, language selection still works and a subsequent round can start normally.

---

## Sign-off

| Field | Value |
|-------|-------|
| Tester | |
| Date | |
| Browser / OS | |
| Dev server pass | ☐ |
| Production preview pass | ☐ |
| Languages tested (EN / FR / ES) | |
| Narrow-width pass | ☐ |
| Blocking issues | |
| Notes | |

---

## Related automated checks

These manual steps complement automated coverage:

- `npm test` — engine + prototype logic (round generation, i18n, persistence, errors)
- `npm run validate:wordsets` — English, French, and Spanish sample word sets validate

If manual QA finds a bug, note the language, grid number, steps to reproduce, and whether it occurs in dev, production preview, or both.
