# Unsit — handoff snapshot (2026-10-07, refreshed)

This is a point-in-time summary of a working session, for handing the project to a
different model/tool. **The authoritative, living reference is [CLAUDE.md](CLAUDE.md)
in this same folder — read that in full first.** This file only adds what CLAUDE.md
doesn't cover: exactly what changed in today's session, current git/test state, and
what's queued up next. (This is a refresh of an earlier same-day version — it now also
covers the product-vision doc and the three new features built after that first pass.)

## What this project is (one paragraph)

Unsit is a Chrome/Edge extension (Manifest V3, plain JS/HTML/CSS, **no build step, no
dependencies**) that nudges people who sit at a computer all day to take short, varied
breaks at the right moments — never during video calls — and includes Focus Guard, a
pause screen on distracting sites (Instagram, YouTube, etc.). Privacy-first: no network
requests, no analytics, everything stays in `chrome.storage.local`. Owner: Krishna
(Hyderabad, India). Full product decisions, file map, storage/message schemas, and
design system are all in CLAUDE.md — don't re-derive them, they're already written down.
As of today there's also a long-term product-vision document (see below) that reframes
where this is headed — read that section before suggesting "new" feature ideas.

## Where things stand right now

- **Git**: repo was initialized this session. One commit exists: `c30043a "Unsit v2.1
  baseline"`. Everything described below is **uncommitted working-tree changes** on top
  of that baseline (`git status` currently shows 13 modified files plus 4 new paths:
  `HANDOFF.md`, `docs/`, `tests/natural-pause.js`, `tests/speak-voice.js`). Nothing has
  been pushed anywhere; there is no remote configured.
- **Version**: `manifest.json` is at `2.2.0` (baseline was `2.1.0`/"2.1" per CLAUDE.md's
  history table — everything below happened today, in order, ending at 2.2.0).
- **Tests**: three scripts, all passing as of this snapshot —
  `node tests/simulate-workday.js`, `node tests/speak-voice.js`,
  `node tests/natural-pause.js`. `node --check` is clean on every `.js` file. Re-run all
  three before trusting any further change to `background.js`/`break.js`/`popup.js`/
  `summary.js` — they're fast, mocked-Chrome-API, no dependencies (see CLAUDE.md's
  Testing section for what each one checks and expects).

## What happened this session, in order

1. **Baseline + initial review.** Turned the folder into a git repo, ran the existing
   test (`tests/simulate-workday.js`), and did a full bug/edge-case/Chrome-Web-Store
   review. Findings were ranked by likelihood of affecting a real user.

2. **`2.1.1` — pre-demo bug fixes** (background.js, options.js, manifest.json):
   - Lunch and end-of-day wrap-up notifications no longer require `chrome.idle` to
     report `"active"` at the exact check minute. They were silently skipped if the
     user was idle (reading, in a desktop-app call, etc.) for the *entire* lunch/wrap-up
     window — now they fire on the clock alone.
   - The minute `tick` handler in `background.js` now wraps its body in `try/finally` so
     `live` state is always persisted, even if showing a break window throws (e.g. a
     `chrome.windows`/`chrome.tabs` hiccup). Before, such an error could leave snooze/reset
     state unsaved and get a break stuck retrying every minute.
   - `openWindow()` hardened with its own try/catch and a safer existing-window check.
   - The v1→v2 settings migration (`breakEvery` → `moveOn`/`moveEvery`, etc.) is now
     also applied in `options.js`, not just `background.js` — Settings no longer
     silently depends on background having run first.
   - Trimmed `manifest.json`'s `description` to 118 chars (was 134, over the Chrome Web
     Store's 132-char limit).
   - Left alone, deliberately: Meet/Zoom meeting-detection over-triggers on the
     pre-join lobby screen (no `audible` check like Teams has) — judged a safer failure
     mode than risking an interrupted call, so documented as a known limitation instead
     of "fixed." Overnight (cross-midnight) work hours are also unsupported — not a
     real use case for Krishna, left as a documented limitation.

3. **`2.1.2` — "Read steps aloud" prototype** (background.js, options.js/html, break.js,
   `tests/speak-voice.js`):
   - New setting `speakSteps` (off by default). When on, `break.js` speaks each step's
     text/hint and the final "done" line via `window.speechSynthesis` — aimed at
     move breaks (walk, stretch) where you're not meant to be looking at the screen.
   - **Privacy-critical detail**: only ever uses a voice with `localService: true` (an
     on-device OS voice). Chrome can otherwise fetch a voice from Google's servers,
     which would quietly violate the product's "nothing leaves your device" promise —
     if no local voice is available, it stays silent rather than risk that. `tests/
     speak-voice.js` regression-tests exactly this (local-voice-present / network-only /
     mixed / no-voices-at-all scenarios).
   - Still not decided: whether to restrict speech to `move` breaks only (vs. all
     breaks), and whether the speech rate/verbosity needs tuning. Flagged to Krishna
     once already, no answer yet — ask before extending this feature further.

4. **`2.1.3` — new icon** (`icons/icon16.png`, `icon48.png`, `icon128.png`):
   - Replaced the plain teal "breath" dot with a teal breathing orb over a bold amber
     upward chevron (a "get up" motion cue), on the same dark rounded-square container
     and exact brand colors as before (`#172230` ink, `#2F7D6D` teal, `#C9892B` amber).
   - Generated from one signed-distance-field design rendered at a single high-res
     master and box-downsampled to all three sizes (a disposable one-off Node script,
     not checked into the repo — no new dependency was added; reused only `zlib` from
     Node's standard library). If the icon needs to change again, it'll need to be
     redrawn (by hand, or regenerate a similar script) rather than edited in place,
     since there's no source yet, only the rasterized PNGs.
   - Krishna picked this from 3 generated concepts (rising-orb-over-a-seat-line,
     vacated-chair-silhouette, orb-with-chevron). The chair concept read poorly at 16px
     (looked like a stray "L") — literal furniture imagery is probably off the table for
     anything that small.

5. **Product-vision document received and banked.** Krishna got a model-generated
   product vision/build spec ("evolve from a break reminder into a workday intelligence
   layer": context/interruptibility/decision engines, natural-pause delivery, Focus
   Protection, Park This/Resume Me, Explain My Day, eventually desktop awareness,
   calendar OAuth, an AI layer, an enterprise tier). It's now checked in at
   [`docs/UNSIT-PRODUCT-VISION-AND-BUILD-SPEC.md`](docs/UNSIT-PRODUCT-VISION-AND-BUILD-SPEC.md),
   and CLAUDE.md's backlog section now points to it as the source of truth, superseding
   the old flat backlog list (per the doc's own instruction, since it reframes those
   same items inside a six-engine model rather than discarding them).
   - **Explicit decision made**: don't attempt the full "Phase 0" architecture rewrite
     (event bus, context engine, centralized decision/suppression path) right now — it's
     a real multi-week undertaking and risks destabilizing what was just hardened in
     2.1.1, with the demo 5 weeks out. Instead, cherry-pick small Phase 1 pieces that
     fit the *current* architecture. Krishna explicitly deferred the "which ones"
     decision ("whichever is best and most audience pulling... in your order of
     preference"), so the choice and ordering below was made by the assistant, not
     dictated by Krishna — worth knowing if a different prioritization seems more sensible
     to whoever picks this up next.

6. **`2.2.0` — first three Phase 1 features**, built in this order (most
   audience-pulling + lowest risk first, most architecturally invasive last):
   - **Explain My Day** (`summary.js`): the end-of-day wrap-up now composes 2-3
     deterministic sentences from stats already tracked — break mix (micro vs.
     movement), a comparison of the longest stretch against the configured `moveEvery`
     rhythm, and a specific callout when Focus Guard `resisted` (tabs closed at the
     pause screen) is > 0. No new storage, no AI. Lowest-risk of the three; verified by
     hand-tracing the note-composition logic across several scenarios (not a committed
     test — the logic is simple string composition, low regression risk).
   - **Park This / Resume Me** (`popup.html`/`popup.js`): a new "Quick note" section in
     the popup — a single text input + Save/Clear buttons, backed by a new `parked`
     storage key (`{ text, createdAt }`). Popup.js reads/writes it directly
     (`background.js` never touches it — no new message type, no scheduling
     implication). Verified end-to-end in a real browser DOM via a temporary mocked-
     chrome test harness (save → simulated popup reopen → value persists → clear →
     resets) — the harness itself was not kept, but the flow is simple enough that
     `popup.js`'s code is the whole story. UX simplification note: the original vision
     doc specified three buttons (Continue/Done/Keep); this implementation collapsed
     that to two (Save/Clear) since "Continue" and "Done" had no behavioral difference
     without a bigger task-tracking model — worth revisiting if Krishna wants closer-to-
     spec button semantics later.
   - **Natural-pause delivery** (`background.js`) — the riskiest of the three, since it
     touches the core minute-tick scheduling logic hardened in 2.1.1. When a break
     becomes due, it's now held for up to `NATURAL_PAUSE_WAIT_MS` (3 minutes, a code
     constant) hoping for a `chrome.tabs.onActivated` or `chrome.windows.onFocusChanged`
     signal (a tab/window switch — a weak but real "likely transition" cue) before
     showing it; if no such signal arrives, it shows anyway once the bound elapses, so a
     break can never be withheld indefinitely. Neither listener needs a new manifest
     permission. New `live.moveWaitSince`/`microWaitSince` fields track when a break
     first became due; a module-level (not persisted) `lastTransitionAt` tracks the last
     signal — if the service worker restarts mid-wait, it simply falls back to the
     bound, never breaking correctness. **New regression test** `tests/natural-pause.js`
     proves both paths in isolation (fast-path-via-transition, and
     held-then-shown-at-the-bound-with-no-transition) — both currently pass.
     - **Known, accepted side effect**: because delivery can now lag a few minutes, a
       break that becomes due just before a meeting starts can get swept into the
       meeting's deferred queue instead of showing standalone — and since "move beats
       micro" was already the rule for that queue, a micro-break can occasionally be
       lost entirely to a same-slot movement break. Confirmed by re-running
       `tests/simulate-workday.js` after this change: it now shows one fewer
       micro-break than before (2 instead of 3 window events pre-16:30ish), exactly for
       this reason. Documented in CLAUDE.md as a deliberate tradeoff (meeting
       suppression always wins), not flagged as a bug — but worth knowing if the break
       count ever looks "off" during testing.
     - `tests/simulate-workday.js` was updated only to add the two new mock listener
       stubs (`tabs.onActivated`, `windows.onFocusChanged`, `windows.WINDOW_ID_NONE`) so
       `eval`-ing `background.js` doesn't throw; it does **not** simulate any tab/window
       transitions, so it exercises the bounded-fallback path, not the fast path. The
       exact clock-minute timings it prints have shifted later by up to ~3 minutes
       compared to pre-2.2.0 runs — CLAUDE.md's Testing section describes this
       honestly rather than pinning exact minutes.

## Immediate priorities (Krishna's stated order)

1. **Demo-ready for Barbarian's internal Tech Spotlight** — submission deadline
   **2026-10-30 EOD**, demo itself **2026-11-13**. Demo plan is in CLAUDE.md under
   "Upcoming dates": own usage stats as the hook → live demo using Settings' Preview
   buttons and short intervals → how it was built with AI → what didn't work → what's
   next. The three 2.2.0 features are plausible additions to that demo narrative
   (Explain My Day in particular slots directly into "own usage stats as the hook") but
   haven't been explicitly folded into the demo script yet — worth asking Krishna.
2. New icon — **done** (2.1.3, see above).
3. Chrome Web Store readiness — **not started**. Still needed: privacy policy (hosted
   somewhere, "no data leaves your device"), store screenshots (1280×800 or 640×400, at
   least one), written permission justifications for `idle`/`notifications`/`scripting`/
   the Meet-Zoom-Teams host permissions/the broad `*://*/*` optional host permission, a
   single-purpose statement, the data-use disclosure in the dashboard, and a Chrome Web
   Store + trademark name check for "Unsit" (explicitly still outstanding per CLAUDE.md's
   intro section).
4. Longer-term: the product-vision doc's remaining Phase 1 ideas (Focus Protection
   mode, a readable Workday Timeline, post-meeting transition framing, local adaptive
   activity selection) and, eventually, the Phase 0 architecture foundation it depends
   on for the bigger Phase 2+ ambitions (desktop awareness, calendar intelligence, AI).
   Not scheduled against the demo date.

## Before building more

- Re-run all three test scripts (`node tests/simulate-workday.js`,
  `node tests/speak-voice.js`, `node tests/natural-pause.js`) after any change to
  `background.js`/`break.js`/`popup.js`/`summary.js` — fast, no dependencies, no
  network.
- Decide whether to `git add`/`git commit` the current working-tree changes before
  starting new work — they are **not committed yet**, only sitting in the working tree
  (17 paths: 13 modified, 4 new).
- Read CLAUDE.md's "Conventions for changes" section before editing — in particular:
  bump `manifest.json`'s `version` per release, keep all stats writes going through
  `updateDay`, every new message type must always call `sendResponse`, and don't add
  network calls/analytics/remote scripts/broad permissions.
- Read CLAUDE.md's "Long-term vision" note under Backlog/ideas before proposing new
  features — check whether the idea is already covered (and possibly already built) in
  `docs/UNSIT-PRODUCT-VISION-AND-BUILD-SPEC.md` before presenting it as novel.
