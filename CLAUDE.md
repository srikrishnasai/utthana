# Unsit — project context for Claude Code

## What this is

A Chrome (and Edge) extension, Manifest V3, that works as a **workday companion for people who sit at a computer 8–9 hours a day**. It shows short, varied breaks at the right moments (never during video calls), tracks real screen time, and includes **Focus Guard**, a pause screen on distracting sites like Instagram.

Owner: Krishna (Hyderabad, India). Built iteratively in Claude chat, now moving to Claude Code. Krishna prefers working, tested deliverables and plain step-by-step instructions for anything he has to do in Chrome himself.

**Name: Unsit** (chosen Oct 2026; previously "Scroll Guard" up to v2.0). Meaning: get up from the chair — the product's core promise. Tagline: "Get up, feel better." Other names considered and rejected: Halftime, Vishram (close to existing "Viraam" break app and "Vishrant"), Thehrav, Desk Reset/Refresh/Daybreak/Head Reset (taken or crowded). The name appears in `manifest.json` (`name`, `short_name`, `action.default_title`), `popup.html`, `options.html`, `options.js`, `summary.html` and code comments. Internal ids (`sg-custom`, storage keys) still use the old prefix on purpose; changing them would break existing installs.

⚠️ **Naming conflict found 2026-10-08 — read before publishing or promoting this name further.** A direct USPTO trademark-database search turned up a **live, registered, principal-register US trademark for "UNSIT"** (serial 99151920, reg. 7969003, filed 2025-04-23, registered 2025-09-30), owned by **InMovement Co LLC**, covering standing desks / height-adjustable office furniture and exercise treadmills with integrated desks. It's not a dormant filing — "UnSit" is an actively sold ~$2,495 under-desk treadmill product (via imovr.com) with its own companion smartphone app. Full detail, including why the different trademark classes don't fully resolve the risk, is in [`docs/CHROME-WEB-STORE-LISTING.md`](docs/CHROME-WEB-STORE-LISTING.md)'s "Name / trademark check" section. An earlier same-day pass (web search only) wrongly concluded there was no conflict; that conclusion is superseded and should not be repeated.

**Decision (2026-10-08, Krishna):** keep the name "Unsit" for now — **demo and personal use only**. Do **not** publish to the Chrome Web Store, promote publicly, or build/enable any paid tier under this name until this is explicitly revisited. Don't silently resume Web Store submission prep (screenshots, hosting the privacy policy, etc.) without checking in first — that track is paused specifically because of this finding, not abandoned.

## History

| Version | What changed |
|---|---|
| 1.0 | Pause screen ("What are you here for?") on Instagram, YouTube, Facebook, X, Reddit; session timer; time-up screen; popup with daily minutes and 7-day chart |
| 1.1 | Fixed `No tab with id` error (tabs.remove on an already-closed tab); 1-minute breathing page; break reminder notifications; daily limit and calm streak |
| 1.2 | Rotating activity library (water, stretch, push-ups, squats, eyes, shoulders, walk, breathe) with a shuffle bag so nothing repeats back to back |
| 1.3 | Custom intervals; activity opens automatically at the interval; custom domains via optional host permissions; full Settings page |
| 2.0 | Repositioned for corporate employees: work hours, lunch nudge, end-of-day wrap-up, active-time tracking via idle API, micro + movement rhythms, meeting detection with deferral, office/home mode, compact activity window, pause controls, new popup |
| 2.1 | Renamed from Scroll Guard to **Unsit** |
| 2.1.1 | Pre-demo bug fixes: lunch/wrap-up nudges no longer depend on `chrome.idle` reporting "active" at the exact check minute (were being missed if idle the whole window); the minute tick now always persists `live` state even if showing a break window fails; the v1 settings migration is also applied in `options.js` instead of relying on `background.js` having run first; trimmed the manifest description under the Chrome Web Store's 132-character limit |
| 2.1.2 | Prototype: "Read steps aloud" (`speakSteps`, off by default) — speaks break steps via `speechSynthesis` on `break.html`, on-device voice only, silent otherwise. See `tests/speak-voice.js`. |
| 2.1.3 | New icon: teal breathing orb over an amber upward chevron, replacing the plain teal dot. Same ink rounded-square container and brand colors as before. Picked from 3 concepts Krishna reviewed (rising orb + seat-line, vacated chair, orb + chevron). |
| 2.2.0 | First three "workday intelligence" features from `docs/UNSIT-PRODUCT-VISION-AND-BUILD-SPEC.md`: natural-pause delivery (hold a due break up to 3 min for a tab/window-switch signal before showing it anyway), Park This/Resume Me (a quick local note in the popup), and a richer, still fully deterministic "Explain My Day" wrap-up. See `tests/natural-pause.js`. |
| 2.3.0 | Trademark check turned up a live "UNSIT" registration (InMovement Co LLC, standing/treadmill desks) — name kept for demo/personal use only, Chrome Web Store publishing paused until revisited; see the ⚠️ note near the top of this file. Two more Phase 1 features from the vision doc: a post-meeting settling period (`POST_MEETING_SETTLE_MS`, same transition-aware mechanism as natural-pause delivery, see `tests/post-meeting-settle.js`) and Focus Protection mode ("Protect next 60 min" — a positively-framed popup action and a Focus Guard note, both layered over the existing pause mechanism with no new background.js scheduling logic). |
| 2.4.0 | Workday Timeline (vision doc §8): a readable "09:04–10:38 Active, 10:38–11:12 Meeting, ..." view in the end-of-day wrap-up, built from a new per-day event log (`stats[date].timeline`) logged only from signals already in hand (idle, meeting detection, an active Focus Guard session) — deliberately not the vision doc's own site-category example, which Unsit doesn't and shouldn't track. See `tests/workday-timeline.js`. |
| 2.5.0 | Adaptive activity selection (vision doc §11, the last of the six small Phase 1 pieces): lifetime accept/skip history per activity (`activityStats`) now gives a bounded 0.4x-1.6x nudge to the shuffle-bag order — no activity can dominate or be excluded, never shown to the user as a number. "Something else" and "Not now" record a skip; "One more break" doesn't. A "Reset activity preferences" button in Settings clears it. See `tests/adaptive-activities.js`. |

## Upcoming dates

- **Tech Spotlight** (Barbarian's monthly internal tech show-and-tell, every 2nd Friday): the originally planned 2026-11-13 slot **did not happen** — as of 2026-11-20, Krishna hasn't demoed Unsit yet, and is now targeting a **future** Tech Spotlight (date not yet set/registered). Demo title idea unchanged: "Unsit: a workday companion I built after noticing my scrolling habit" — recently reframed in the registration brief around employee wellness (long hours sitting at a screen) rather than the scrolling-habit origin story specifically; use whichever framing Krishna is actually pitching at registration time. Demo plan: own usage stats as the hook → live demo → how it was built with AI → what didn't work → what's next. Full script with exact clicks, timing, and a prep checklist: [`docs/DEMO-SCRIPT.md`](docs/DEMO-SCRIPT.md) — written 2026-10-12, covers the 2.2.0/2.3.0 features (Park This, Focus Protection, natural-pause/post-meeting delivery) but **not yet the 2.4.0 Workday Timeline** — update it to include that before the next rehearsal. A partial live rehearsal happened 2026-10-21 (Focus Guard, popup, Focus Protection, meeting detection all confirmed working in real Chrome); it was never finished (never watched the post-meeting settle actually fire end-to-end live, though it's thoroughly covered by `tests/post-meeting-settle.js`). Also surfaced one real finding worth remembering: `inMeeting()` only checks a Meet tab's URL shape, so it still reads as "in a call" until that tab is closed or navigated away, even after you've actually left the call.

## Product decisions already made

- **Extension first, desktop app later.** Extension: easy corporate rollout (IT can force-install via Chrome/Edge policy), $5 store fee, auto-updates, works in Edge (default on most corporate Windows). Desktop tray app (Tauri) only if companies ask for full-screen overlays or desktop Teams/Zoom call detection.
- **Healthy habit, not addiction.** Use genuine habit loops (streaks, varied activities, a daily summary). No dark patterns; trust is the product.
- **Privacy first.** No data leaves the device. No analytics, no remote code, no network requests. This is a key selling point for companies.
- **Minimal permissions.** Custom sites use optional host permissions requested per site. Meeting detection uses host permissions for meeting domains only, not the `tabs` permission.
- **Never interrupt a call.** Timing is the make-or-break detail.
- **Monetization ideas (not built):** free individual version; Pro (custom activities, focus schedules, longer history, weekly report, themes) via a service like ExtensionPay; later a team version with opt-in, aggregate-only, anonymous insights for HR/wellbeing budgets. Never per-person monitoring.
- **Wellness claims:** keep to common, sensible guidance (look away from the screen regularly, move every hour). No medical claims.

## Tech stack

- Manifest V3, plain JavaScript, HTML and CSS. **No build step, no dependencies, no frameworks.** Keep it that way unless there's a strong reason.
- Load for development: `chrome://extensions` → Developer mode → Load unpacked → select this folder. After code changes, click reload on the extension card and reload any guarded tabs.

## File map

| File | Role |
|---|---|
| `manifest.json` | MV3 manifest. Permissions: storage, alarms, notifications, idle, scripting. Host permissions: Meet, Zoom, Teams. Optional host permissions: `*://*/*` (requested per custom site). Static content script on built-in social sites, `run_at: document_start`. |
| `background.js` | Service worker. The 1-minute `tick` alarm, break scheduling, meeting detection, activity rotation, activity window, notifications, stats writes, custom-site registration, message handling. Loads `activities.js` via `importScripts`. |
| `activities.js` | Shared activity library (`ACTIVITIES`) and `availableActivities(settings, kind)`. Loaded by background, break page, popup and settings via plain `<script>`. |
| `content.js` | Focus Guard. Runs on guarded sites. Pause screen, session timer pill, time-up screen. UI lives in a shadow DOM. Sends Focus Guard minutes to background. The pause screen shows an extra note during Focus Protection (reads `protectUntil`, set by the popup). |
| `break.html` / `break.js` | Activity page. Shown in a compact popup window (or a tab, when launched from Focus Guard). Intro → steps → done. "Something else" and "Not now" both report a skip for adaptive activity selection; "One more break" does not (that activity was already completed). |
| `summary.html` / `summary.js` | End-of-day wrap-up window. "Explain My Day": a short, deterministic 1-3 sentence summary built only from stats already tracked (break mix, longest stretch vs. `moveEvery` rhythm, Focus Guard resisted-tabs) — no new data collection, no AI. Also renders the Workday Timeline (`buildTimelineRows` in `summary.js`) — see its own section below. |
| `popup.html` / `popup.js` | Toolbar popup: time since last break, today's stats, take a break, Focus Protection, pause controls, 7-day breaks chart, Focus Guard line, Park This/Resume Me quick note, link to Settings. |
| `options.html` / `options.js` | Full Settings page (`options_ui`, opens in a tab). Activities section has a "Reset activity preferences" button for adaptive activity selection. |
| `icons/` | 16/48/128 PNG icons (dark rounded square with a teal breathing orb over an amber upward chevron). Generated by a one-off, dependency-free script (signed-distance shapes rasterized via Node + `zlib`), not checked in — regenerate by hand if the design needs to change. |
| `tests/simulate-workday.js` | Node simulation of a workday against `background.js` with a mocked Chrome API and fake clock. Run `node tests/simulate-workday.js`. |
| `tests/speak-voice.js` | Node regression test for the "read steps aloud" feature's on-device-voice-only safeguard. Run `node tests/speak-voice.js`. |
| `tests/natural-pause.js` | Node regression test for natural-pause delivery (fast path via a transition signal, and the bounded fallback with no transition). Run `node tests/natural-pause.js`. |
| `tests/post-meeting-settle.js` | Node regression test for the post-meeting settling period (held right after a call ends, shown once settled or on a transition, yields to a new meeting mid-settle). Run `node tests/post-meeting-settle.js`. |
| `tests/workday-timeline.js` | Node regression test for the Workday Timeline: background.js's state-change/mark logging (Part A) and summary.js's `buildTimelineRows` rendering logic (Part B, via a `vm` sandbox, no DOM needed). Run `node tests/workday-timeline.js`. |
| `tests/adaptive-activities.js` | Node regression test for adaptive activity selection: `activityWeight`/`weightedShuffle` as pure functions (bounds, a true-permutation structural check, a statistical bias check), plus end-to-end message-handler behavior (accept/skip tallies, reset, variety preserved even after heavy skipping). Run `node tests/adaptive-activities.js`. |

## How the background tick works (`background.js`)

A single alarm `tick` runs every minute. Each tick:

1. `chrome.idle.queryState(120)`. If `active`: `stretch += 1`, `sinceMicro += 1`, and today's `stats.active` and `stats.longest` update. If idle or locked: `idleRun += 1`; at 5 minutes away or on lock, `stretch`, `sinceMicro` and `deferred` reset (being away counts as a break).
2. **Workday Timeline**: during work hours only, classify the current minute as `meeting` > `idle` > `focusguard` > `active` (priority order) and, if that differs from `live.timelineState`, append a `{type:"state", state, t}` entry to today's `stats.timeline` and update `live.timelineState`. See its own section below.
3. Lunch notification once per workday within an hour after `lunchTime` (also logs a `timeline` mark). Wrap-up window once per workday within 2 hours after `workEnd`, only if active time today ≥ 60 minutes.
4. If inside work hours, active and not paused:
   - `moveDue` = movement on, `stretch >= moveEvery`, past `moveSnoozeUntil`.
   - `microDue` = micro on, `sinceMicro >= microEvery`, past `microSnoozeUntil`.
   - In a meeting: remember the due kind in `live.deferred` (move beats micro); clear any natural-pause wait and any post-meeting settle in progress.
   - Not in a meeting and something deferred: **post-meeting settling period** — wait, hoping for a tab/window switch, for up to `POST_MEETING_SETTLE_MS` (90 seconds) from when the meeting ended; show it (reason `meeting`) as soon as either happens. If a new meeting starts during the settle window, the branch above takes over next tick and the deferred break stays queued rather than firing mid-call.
   - Else move/micro due: **natural-pause delivery** — hold it, hoping for a tab/window switch (see below), for up to `NATURAL_PAUSE_WAIT_MS` (3 minutes) from when it first became due; show it as soon as either happens. Skip a micro-break when a movement break is ≤ 5 minutes away (treated as already satisfied, no wait). Showing resets `sinceMicro`; showing move also sets `moveSnoozeUntil = now + 10 min` so an ignored break comes back in 10 minutes — completing it (via `breakDone`) resets `stretch`.

**Natural-pause delivery**: `chrome.tabs.onActivated` and `chrome.windows.onFocusChanged` (no extra permission needed for either) update an in-memory `lastTransitionAt` timestamp — a tab/window switch is a weak signal that someone just finished one thing and is starting another, a better moment to interrupt than mid-keystroke. `live.moveWaitSince`/`microWaitSince` record when a break first became due; a tick shows it once `lastTransitionAt` is at or after that timestamp, or once the bound elapses, whichever comes first — so a break can never be withheld indefinitely during one long continuous stretch. `lastTransitionAt` is deliberately not persisted: if the service worker restarts, the wait simply falls back to the bound, never breaking correctness. Verified by `tests/natural-pause.js` (both the fast path and the bounded fallback). A real consequence worth knowing: because delivery can now be delayed a few minutes, a break that becomes due just before a meeting starts can end up swept into the meeting's deferred queue instead of showing on its own — and since move always beats micro there, a micro-break can occasionally be "lost" to a same-slot movement break that happened to come due around the same time. This is a deliberate tradeoff (meeting suppression always wins), not a bug.

The post-meeting settle uses the exact same `lastTransitionAt` mechanism via its own `live.postMeetingSince` field — same shape as the natural-pause wait, just a shorter bound (90s vs. 3 min) and a different trigger (a call ending, not a break interval elapsing). Verified by `tests/post-meeting-settle.js` (held immediately after the call ends, shown once settled, shown fast on a transition, and yields cleanly if a new meeting starts mid-settle).

**Workday Timeline** (vision doc §8): a readable "09:04–10:38 Active, 10:38–11:12 Meeting, ..." view of the day, shown in the end-of-day wrap-up (`summary.html`). Deliberately scoped to signals Unsit already has — `active`/`idle`/`meeting`/`focusguard` — **not** the vision doc's own example categories ("Focus — Development" vs. "Planning"), which would need knowing which site/app is open and isn't something this extension tracks or should start tracking just for this. `focusguard` means "an active Focus Guard session right now," detected each tick via `chrome.storage.local.get([...builtInSites, ...customSites].map(d => "session:"+d))` — a plain array-of-known-keys read, not a wildcard storage scan (keeps it simple and keeps the mocked-Chrome test harnesses working unchanged). Raw log lives at `stats[date].timeline`, an array of `{type:"state", state, t}` (only appended when the state actually changes, not once a minute) and `{type:"mark", label, t, extra?}` (point events: `micro`/`move` from `breakDone`, `lunch` from the lunch nudge). `summary.js`'s `buildTimelineRows(timeline, nowTs)` turns that into display rows: builds segments from consecutive state entries (last one runs to "now"), merges any segment shorter than `MIN_SEGMENT_MS` (2 min) into whatever came before it so one-minute idle blips don't clutter the view, then interleaves the point marks in chronological order. Pure function, no DOM — tested directly via a `vm` sandbox in `tests/workday-timeline.js`, alongside Part A's test of the background.js logging itself.

Meeting detection (`inMeeting`): `chrome.tabs.query` on Meet/Zoom/Teams URLs. In a call if a Meet URL has a meeting code (`abc-defg-hij`), a Zoom web-client URL (`/wc/` or `/j/`), or a Teams tab is audible. Desktop-app calls can't be detected; users use Pause in the popup.

Showing an activity (`showActivity`): `breakMode === "window"` opens/reuses a 460×660 popup window centred over the last focused window (id stored in `activityWindow`). `"notify"` sends a notification with Start / Remind me in 10 min.

Activity rotation (`nextActivity(kind, skippedId?)`): a shuffle bag per kind (`bag:micro`, `bag:move`) over `availableActivities`; refilled when empty; never the same id twice in a row (`last:<kind>`). Picks are serialized through a promise queue. **Adaptive activity selection** (vision doc §11): when a bag is refilled, the shuffle is weighted (`weightedShuffle`) by each activity's lifetime accept/skip history (`activityStats`, via `activityWeight` — bounded to 0.4x-1.6x, so no activity can dominate or be excluded; see `tests/adaptive-activities.js`, including a statistical check that the bias is real and a structural check that every id still appears exactly once per cycle regardless). `activityWeight`/`weightedShuffle` are pure functions, independently testable. Feedback is recorded via `recordActivityFeedback(id, "accepted"|"skipped")`, its own serialized queue: `breakDone` records an accept; `activitySkipped` (break.js's "Not now") and `nextActivity`'s optional `skippedId` (break.js's "Something else," not "One more break" — that one already completed, so it's not a skip) both record a skip. `resetActivityPrefs` clears `activityStats` entirely — wired to Settings' "Reset activity preferences" button. None of this is ever shown to the user as a number or a score; it's a silent, bounded nudge, not a self-assessment.

All stats writes go through one promise queue (`updateDay`) so concurrent tabs never overwrite each other.

## Storage (`chrome.storage.local`)

| Key | Contents |
|---|---|
| `settings` | See settings schema below |
| `stats` | `{ "YYYY-MM-DD": { active, longest, breaks, micro, move, activities: {id: n}, seconds, resisted, sessions, timeline } }`. Kept for the last 60 days. `seconds`/`resisted`/`sessions` are Focus Guard. `timeline` is the Workday Timeline's raw per-day log: an array of `{type:"state", state, t}` and `{type:"mark", label, t, extra?}` — see its own section above. |
| `live` | Today's running state: `{ date, stretch, sinceMicro, idleRun, deferred, moveSnoozeUntil, microSnoozeUntil, lunchShown, wrapShown, moveWaitSince, microWaitSince, postMeetingSince, timelineState }`. `moveWaitSince`/`microWaitSince` support natural-pause delivery; `postMeetingSince` supports the post-meeting settling period; `timelineState` is the last state logged to the Workday Timeline, so a tick only appends when it actually changes (see below). Resets when the date changes. |
| `pausedUntil` | Timestamp; breaks paused until then (0 = not paused). Set by both plain Pause and Focus Protection (they share this one suppression mechanism). |
| `protectUntil` | Timestamp, or absent/0. Set alongside `pausedUntil` when Focus Protection is started (popup's "Protect next 60 min"); purely a *framing* flag — `background.js` doesn't read it, it only changes what the popup and Focus Guard's gate say. Cleared whenever any pause/resume button is clicked. |
| `pending` | Last activity shown: `{ id, kind, reason }` (used by notification clicks) |
| `activityWindow` | Window id of the open activity window |
| `bag:micro`, `bag:move`, `last:micro`, `last:move` | Rotation state |
| `session:<domain>` | Focus Guard session for a site: `{ end, extended, intent }` (shared across tabs) |
| `installDate` | First install date |
| `parked` | Park This / Resume Me: `{ text, createdAt }` or absent. Set/read/cleared directly by `popup.js` — `background.js` never touches it. |
| `activityStats` | Adaptive activity selection: `{ [activityId]: { accepted, skipped } }`, lifetime counts (not per-day). Only ever read to compute a shuffle weight; never surfaced in any UI. Cleared by the `resetActivityPrefs` message. |

### Settings schema (defaults)

```js
{
  workDays: [1,2,3,4,5], workStart: "09:30", workEnd: "18:30",
  lunchOn: true, lunchTime: "13:00", wrapUpOn: true,
  microOn: true, microEvery: 20, moveOn: true, moveEvery: 50,
  workplace: "office",        // "office" | "home"
  breakMode: "window",        // "window" | "notify"
  meetingDetect: true,
  speakSteps: false,          // read break steps aloud (break.html only), on-device voice only
  activities: { [id]: true },
  sessionMinutes: 5, dailyGoal: 30,            // Focus Guard
  sites: { "instagram.com": true, ... },       // built-in Focus Guard sites
  customSites: ["netflix.com"]                 // user-added, permission-gated
}
```

Defaults are duplicated in `background.js` (`DEFAULT_SETTINGS`) and `options.js` (`DEFAULTS`); keep them in sync. `getSettings()` migrates v1 keys (`breakEvery` → `moveOn`/`moveEvery`, `breakMode: "open"` → `"window"`).

## Messages (`chrome.runtime.sendMessage` → background)

| `type` | Payload | Does |
|---|---|---|
| `status` | — | Returns `{ live, pausedUntil, working, meeting }` (popup) |
| `openBreak` | `kind`, `newWindow?` | From a Focus Guard tab: replace that tab with an activity. From popup: open the activity window. |
| `nextActivity` | `kind`, `skipped?` | Returns `{ id }` ("Something else" button). `skipped` (an activity id) records a skip for it first — set by break.js when swapping away from one, not when starting another after already finishing one. |
| `activitySkipped` | `activity`, `kind` | Records a skip for that activity (break.js's "Not now", declined before starting) |
| `resetActivityPrefs` | — | Clears `activityStats` (Settings' "Reset activity preferences") |
| `breakDone` | `activity`, `kind` | Records the break; records an accept for that activity; resets `sinceMicro`, and `stretch` for movement breaks |
| `snooze` | `kind` | Comes back in 10 minutes |
| `pause` | `minutes` (number, `"day"`, or 0 to resume) | Sets `pausedUntil` |
| `preview` | `kind` | Settings "Try it" buttons |
| `bump` | `field`, `amount` | Focus Guard counters (`seconds`, `resisted`, `sessions`) |
| `closeTab` | — | Closes the sender tab (errors ignored if already closed) |

The background listener handles every message in an async IIFE and always calls `sendResponse`, so senders never see "message port closed" errors.

## Activities (`activities.js`)

Each activity: `{ id, kind: "micro"|"move", office, home, emoji, title, nudge, intro, done, steps }`.
Steps are either timed `{ text, hint, seconds, orb: "big"|"small"|"mid" }` or confirm `{ text, hint, confirm: "button label" }` (for reps like push-ups, where people go at their own pace).

Current set — micro (all office-friendly): eyes, posture, wrists, breaths. Move: water, stretch, walk, stairs, colleague (office only), shoulders, twist, breathe, pushups (home only), squats (home only).

`notification title` format for notify mode: `${emoji} ${title}`. `nudge` is the one-line notification body.

## Break page URL parameters (`break.html`)

`a` (activity id), `kind`, `reason` (`timer` | `meeting` | `focus` | `manual` | `preview`, sets the small kicker text), `auto=1` (shows "Remind me in 10 min"). Timed steps of 15 seconds or more (except breathing) end with a soft Web Audio chime so people can look away or close their eyes.

### Read steps aloud (`speakSteps`, prototype)

Off by default; toggled in Settings. When on, `break.js` speaks each step's text (+ hint, for confirm steps) and the activity's `done` line via `window.speechSynthesis`, for breaks like walk/stretch where you're not meant to be looking at the screen.

Only ever uses a voice with `localService: true` (an on-device OS voice, e.g. Windows SAPI). If the only voices available are non-local (Chrome can fetch "Google ..." voices from the network), it stays silent rather than risk a network call — this is the one place in the codebase that could otherwise quietly break the "no data leaves the device" promise, so don't loosen that check. `tests/speak-voice.js` is a regression test for exactly this: it asserts speech happens with a local voice present, and stays silent with network-only or no voices.

## Focus Guard (`content.js`)

- Runs only in the top frame, once per page (`window.__scrollGuardLoaded`).
- Site detection happens in `init()` after loading settings: built-in sites from the `SITES` map, custom sites from `settings.customSites`.
- Pause screen requires a reason (≥ 3 characters) to continue; also offers "Take a quick break instead" and "Close this tab".
- Overlays use shadow DOM, lock page scroll, pause videos (including a capture-phase `play` listener), and stop key events from reaching site shortcuts.
- Timer pill counts only visible-tab seconds and flushes to background every 15 seconds and on hide.
- One +2-minute extension per session; after that, "Start over with a new reason".
- `safe()` wraps `chrome.*` calls because old content scripts lose extension context after a reload.

Custom sites: Settings requests `*://domain/*` and `*://*.domain/*` with `chrome.permissions.request`; on success saves to `customSites`. Background watches `settings.customSites` and re-registers one dynamic content script (`id: "sg-custom"`) for the sites whose permission is granted.

### Focus Protection ("Protect next 60 min")

A popup button, positively framed as protecting a work block rather than just silencing reminders. Mechanically it's the *exact same suppression* as plain Pause — clicking it sends the normal `pause` message with `minutes: 60` (so `background.js` needs no new logic at all) and additionally stores `protectUntil` to the same timestamp the pause message returned, purely so the popup and Focus Guard can recognize and frame this specific case differently:

- Popup header shows "Protecting your focus" / "Until HH:MM..." instead of the generic "Breaks paused," and the resume button reads "End focus protection."
- Focus Guard's pause screen (`content.js`) adds an amber note — "You're protecting your focus until HH:MM" — above the usual reason prompt when a guarded site is opened during protection. It's still just a note: the same reason input, same buttons, same way out. Per the vision doc's own caution (§7), this must never become a rigid productivity prison — there's always an obvious override.
- Clicking plain Pause (1h / today) or Resume while protecting clears `protectUntil`, falling back to the generic paused framing.
- No dedicated test file (it's a thin framing layer over already-tested pause/Focus-Guard mechanics); verified by hand via a mocked-storage browser harness for both the popup and the pause-screen note.

## Design system

- Colours: ink `#172230` (dark surfaces), text `#1E2B33`, mist `#EEF2F0` (light surfaces), sage-teal accent `#2F7D6D` (hover `#276A5C`), amber `#C9892B` (focus rings, warnings, "due"), muted text `#4A5A63` / `#6B7A82`, borders `#BFCCC6` / `#D3DDD8`.
- Type: headings in a serif stack (`"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`), body in system UI. No web fonts (no network).
- Signature element: the breathing "orb" circle that scales slowly. Respect `prefers-reduced-motion` everywhere.
- Accessible: visible amber focus rings, labels on all inputs, `role="status"`/`aria-live` for changing text, dialogs labelled.
- Copy tone: warm, short, never preachy or guilt-tripping. Plain words.

## Testing

- `node tests/simulate-workday.js` — fake clock + mocked Chrome API; prints when windows/notifications would appear and the day's stats. No tab/window transitions are simulated, so this exercises both bounded-fallback paths: expect a micro-break a few minutes after :20 (not exactly :20 — it waits up to 3 minutes for a transition that never comes), a movement break deferred during a Meet call and shown about 2 minutes after it ends (the 90-second post-meeting settle, rounded up to the next tick), lunch at 13:00, wrap-up at 18:30. Exactly which further micro/move breaks show (and in what order) can shift a little run to run — that's expected, not a regression; see "Natural-pause delivery" above for why a break due right before a meeting can occasionally be absorbed into the meeting's deferred slot.
- `node tests/natural-pause.js` — confirms both natural-pause paths in isolation: a transition signal right after a break becomes due shows it almost immediately, and with no transition at all it still shows once `NATURAL_PAUSE_WAIT_MS` elapses, never later. Expected: `PASS`.
- `node tests/post-meeting-settle.js` — confirms the post-meeting settle in isolation: held immediately after a call ends, shown once `POST_MEETING_SETTLE_MS` elapses or a transition arrives (whichever first), and yields cleanly (nothing shown) if a new meeting starts mid-settle. Expected: `PASS`.
- `node tests/workday-timeline.js` — Part A confirms background.js logs state changes (not one entry per tick), idle/meeting/focusguard detection, break/lunch marks, and nothing at all outside work hours; Part B confirms `buildTimelineRows` builds correct segments, merges short blips, and interleaves marks chronologically. Expected: `PASS`.
- `node tests/adaptive-activities.js` — confirms `activityWeight` is bounded (0.4x-1.6x) and `weightedShuffle` is always a true permutation (every id appears exactly once) even under extreme weights, that the bias is statistically real (a heavily-favored activity comes up first well above uniform chance over 1000 trials), and end-to-end that accept/skip messages update the tally, reset clears it, and a heavily-skipped activity still appears in rotation. Expected: `PASS`.
- `node tests/speak-voice.js` — mocked `speechSynthesis`; confirms "read steps aloud" only speaks when an on-device voice is present and stays silent otherwise. Expected: `PASS`.
- `node --check <file>.js` on every changed file.
- UI pages (popup, options, break, summary) can be rendered with Playwright by injecting a mocked `window.chrome` via `add_init_script` and opening the HTML files directly. `content.js` can be tested by routing a fake `https://www.instagram.com/` page and adding the script with `add_script_tag`.
- Manual: Settings → "Preview a micro-break" / "Preview a movement break"; set intervals to the minimum for quick checks; open `https://meet.google.com/abc-defg-hij`-style URL to see meeting deferral.

## Known limitations

- Can't see calls in the Teams/Zoom desktop apps (Pause buttons cover this).
- Idle detection treats watching a long video without input as "away" after 2 minutes.
- Works only while the browser is running.
- Focus Guard only covers the browser, not phone apps.
- Defaults (and the v1 settings migration) live in two places (background and options); keep them in sync by hand.
- Meet/Zoom meeting detection trusts the URL alone (no `audible` check like Teams), so a Meet/Zoom tab sitting on the pre-join lobby screen can read as "in a call" and defer a break. Deliberate tradeoff — over-detecting a call is safer than interrupting one.
- Work hours must not cross midnight (`workEnd` must be later than `workStart` on the same day); overnight shifts aren't supported.

## Backlog / ideas

- Chrome Web Store listing — **drafted 2026-10-08, then PAUSED the same day** after the trademark search (see the ⚠️ note near the top of this file) turned up a live "UNSIT" registration. Drafts exist at [`docs/PRIVACY-POLICY.md`](docs/PRIVACY-POLICY.md) and [`docs/CHROME-WEB-STORE-LISTING.md`](docs/CHROME-WEB-STORE-LISTING.md) (single purpose statement, per-permission justifications, data safety disclosure table, draft screenshots with fabricated demo data) and are fine to keep as reference, but **don't advance this toward actual publishing** (hosting the privacy policy publicly, finalizing screenshots, submitting) without checking with Krishna first — he decided to keep the name for demo/personal use only, not for a public listing, until the naming conflict is explicitly revisited.
- Polish from Krishna's real-use notes (collect before building).

### Long-term vision

[`docs/UNSIT-PRODUCT-VISION-AND-BUILD-SPEC.md`](docs/UNSIT-PRODUCT-VISION-AND-BUILD-SPEC.md) is a long-term product vision (added 2026-10-07): evolving Unsit from a break reminder into a "workday intelligence" layer — context/interruptibility/decision engines, natural-pause delivery, Focus Protection mode, Park This/Resume Me, Explain My Day, and eventually desktop awareness, calendar integration, and an AI layer. It **supersedes and reorganizes** the old flat backlog above (custom activities, weekly summary, team challenge, calendar-aware breaks, desktop tray app, etc. all show up there, reframed within the six-engine model) — treat that doc as the source of truth for "what's next," not a list to rebuild from scratch. It's explicitly staged (Phase 0 architecture foundation → Phase 1 in-extension intelligence → Phase 2 desktop → Phase 3 schedule → Phase 4 AI → Phase 5 enterprise) and says plainly not to attempt the whole roadmap at once.

**All six small Phase 1 pieces identified so far have now been built** this way, without the Phase 0 event-bus/decision-engine rewrite — **don't re-suggest or re-build these, they exist**: Park This/Resume Me (§9, `parked` storage key, popup.js), an enhanced Explain My Day using stats already tracked (§12, `summary.js`), natural-pause delivery bounded by a 3-minute deferral window (§6.1, `background.js`'s `NATURAL_PAUSE_WAIT_MS`), a post-meeting settling period bounded by 90 seconds (§10, same mechanism, `POST_MEETING_SETTLE_MS`), Focus Protection mode (§7, `protectUntil`, a framing layer over the existing pause mechanism — see its own subsection under Focus Guard above), a Workday Timeline (§8, `stats[date].timeline`, scoped to Active/Away/Meeting/On a guarded site rather than the vision doc's own site-category example — see its own section under "How the background tick works" above), and adaptive activity selection (§11, `activityStats`, a bounded weighted shuffle — see "Activity rotation" under "How the background tick works" above). The full Phase 0 rewrite (centralized event model, context engine, interruptibility scoring, a single decision/suppression path every reminder goes through) is a real multi-week undertaking — don't start it without discussing scope first. There is no small Phase 1 candidate left at this point; the next step into this vision doc is either Phase 0 itself, or a Phase 2+ idea (desktop awareness, calendar integration, AI) — both deserve an explicit scoping conversation before any code, not a quick addition.

## Conventions for changes

- Bump `version` in `manifest.json` for every release; package as `unsit-vX.Y.zip` with the folder at the root.
- Keep all stats writes in background through `updateDay`.
- Any new message type must always `sendResponse`.
- Ignore errors from closing/updating tabs or windows that may already be gone.
- Don't add network calls, analytics, remote scripts or broad permissions.
- Keep activities office-appropriate by default; floor exercises are home-only.
- Test with the simulation and Playwright before handing over; describe install/update steps for Krishna in plain language.
