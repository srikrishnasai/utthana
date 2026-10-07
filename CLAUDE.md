# Unsit — project context for Claude Code

## What this is

A Chrome (and Edge) extension, Manifest V3, that works as a **workday companion for people who sit at a computer 8–9 hours a day**. It shows short, varied breaks at the right moments (never during video calls), tracks real screen time, and includes **Focus Guard**, a pause screen on distracting sites like Instagram.

Owner: Krishna (Hyderabad, India). Built iteratively in Claude chat, now moving to Claude Code. Krishna prefers working, tested deliverables and plain step-by-step instructions for anything he has to do in Chrome himself.

**Name: Unsit** (chosen Oct 2026; previously "Scroll Guard" up to v2.0). Meaning: get up from the chair — the product's core promise. Tagline: "Get up, feel better." Other names considered and rejected: Halftime, Vishram (close to existing "Viraam" break app and "Vishrant"), Thehrav, Desk Reset/Refresh/Daybreak/Head Reset (taken or crowded). A quick search found no existing "Unsit" app, but do a proper Chrome Web Store and trademark check before publishing. The name appears in `manifest.json` (`name`, `short_name`, `action.default_title`), `popup.html`, `options.html`, `options.js`, `summary.html` and code comments. Internal ids (`sg-custom`, storage keys) still use the old prefix on purpose; changing them would break existing installs.

## History

| Version | What changed |
|---|---|
| 1.0 | Pause screen ("What are you here for?") on Instagram, YouTube, Facebook, X, Reddit; session timer; time-up screen; popup with daily minutes and 7-day chart |
| 1.1 | Fixed `No tab with id` error (tabs.remove on an already-closed tab); 1-minute breathing page; break reminder notifications; daily limit and calm streak |
| 1.2 | Rotating activity library (water, stretch, push-ups, squats, eyes, shoulders, walk, breathe) with a shuffle bag so nothing repeats back to back |
| 1.3 | Custom intervals; activity opens automatically at the interval; custom domains via optional host permissions; full Settings page |
| 2.0 | Repositioned for corporate employees: work hours, lunch nudge, end-of-day wrap-up, active-time tracking via idle API, micro + movement rhythms, meeting detection with deferral, office/home mode, compact activity window, pause controls, new popup |
| 2.1 | Renamed from Scroll Guard to **Unsit** |

## Upcoming dates

- **Oct 30, 2026 (EOD):** submission deadline for Tech Spotlight, Barbarian's monthly internal tech show-and-tell. Krishna plans to demo this.
- **Nov 13, 2026:** first Tech Spotlight (then every 2nd Friday). Demo title idea: "Unsit: a workday companion I built after noticing my scrolling habit". Demo plan: own usage stats as the hook → live demo (use Settings "Preview a micro-break / movement break" buttons and short intervals so nobody waits) → how it was built with AI → what didn't work → what's next.

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
| `content.js` | Focus Guard. Runs on guarded sites. Pause screen, session timer pill, time-up screen. UI lives in a shadow DOM. Sends Focus Guard minutes to background. |
| `break.html` / `break.js` | Activity page. Shown in a compact popup window (or a tab, when launched from Focus Guard). Intro → steps → done. |
| `summary.html` / `summary.js` | End-of-day wrap-up window. |
| `popup.html` / `popup.js` | Toolbar popup: time since last break, today's stats, take a break, pause controls, 7-day breaks chart, Focus Guard line, link to Settings. |
| `options.html` / `options.js` | Full Settings page (`options_ui`, opens in a tab). |
| `icons/` | 16/48/128 PNG icons (dark rounded square with a teal "breath" dot). |
| `tests/simulate-workday.js` | Node simulation of a workday against `background.js` with a mocked Chrome API and fake clock. Run `node tests/simulate-workday.js`. |

## How the background tick works (`background.js`)

A single alarm `tick` runs every minute. Each tick:

1. `chrome.idle.queryState(120)`. If `active`: `stretch += 1`, `sinceMicro += 1`, and today's `stats.active` and `stats.longest` update. If idle or locked: `idleRun += 1`; at 5 minutes away or on lock, `stretch`, `sinceMicro` and `deferred` reset (being away counts as a break).
2. Lunch notification once per workday within an hour after `lunchTime`. Wrap-up window once per workday within 2 hours after `workEnd`, only if active time today ≥ 60 minutes.
3. If inside work hours, active and not paused:
   - `moveDue` = movement on, `stretch >= moveEvery`, past `moveSnoozeUntil`.
   - `microDue` = micro on, `sinceMicro >= microEvery`, past `microSnoozeUntil`.
   - In a meeting: remember the due kind in `live.deferred` (move beats micro).
   - Not in a meeting and something deferred: show it with reason `meeting`.
   - Else move due: show move; set `moveSnoozeUntil = now + 10 min` so an ignored break comes back in 10 minutes. Completing it resets `stretch`.
   - Else micro due: reset `sinceMicro`; skip if a movement break is ≤ 5 minutes away.

Meeting detection (`inMeeting`): `chrome.tabs.query` on Meet/Zoom/Teams URLs. In a call if a Meet URL has a meeting code (`abc-defg-hij`), a Zoom web-client URL (`/wc/` or `/j/`), or a Teams tab is audible. Desktop-app calls can't be detected; users use Pause in the popup.

Showing an activity (`showActivity`): `breakMode === "window"` opens/reuses a 460×660 popup window centred over the last focused window (id stored in `activityWindow`). `"notify"` sends a notification with Start / Remind me in 10 min.

Activity rotation (`nextActivity(kind)`): a shuffle bag per kind (`bag:micro`, `bag:move`) over `availableActivities`; refilled when empty; never the same id twice in a row (`last:<kind>`). Picks are serialized through a promise queue.

All stats writes go through one promise queue (`updateDay`) so concurrent tabs never overwrite each other.

## Storage (`chrome.storage.local`)

| Key | Contents |
|---|---|
| `settings` | See settings schema below |
| `stats` | `{ "YYYY-MM-DD": { active, longest, breaks, micro, move, activities: {id: n}, seconds, resisted, sessions } }`. Kept for the last 60 days. `seconds`/`resisted`/`sessions` are Focus Guard. |
| `live` | Today's running state: `{ date, stretch, sinceMicro, idleRun, deferred, moveSnoozeUntil, microSnoozeUntil, lunchShown, wrapShown }`. Resets when the date changes. |
| `pausedUntil` | Timestamp; breaks paused until then (0 = not paused) |
| `pending` | Last activity shown: `{ id, kind, reason }` (used by notification clicks) |
| `activityWindow` | Window id of the open activity window |
| `bag:micro`, `bag:move`, `last:micro`, `last:move` | Rotation state |
| `session:<domain>` | Focus Guard session for a site: `{ end, extended, intent }` (shared across tabs) |
| `installDate` | First install date |

### Settings schema (defaults)

```js
{
  workDays: [1,2,3,4,5], workStart: "09:30", workEnd: "18:30",
  lunchOn: true, lunchTime: "13:00", wrapUpOn: true,
  microOn: true, microEvery: 20, moveOn: true, moveEvery: 50,
  workplace: "office",        // "office" | "home"
  breakMode: "window",        // "window" | "notify"
  meetingDetect: true,
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
| `nextActivity` | `kind` | Returns `{ id }` ("Something else" button) |
| `breakDone` | `activity`, `kind` | Records the break; resets `sinceMicro`, and `stretch` for movement breaks |
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

## Focus Guard (`content.js`)

- Runs only in the top frame, once per page (`window.__scrollGuardLoaded`).
- Site detection happens in `init()` after loading settings: built-in sites from the `SITES` map, custom sites from `settings.customSites`.
- Pause screen requires a reason (≥ 3 characters) to continue; also offers "Take a quick break instead" and "Close this tab".
- Overlays use shadow DOM, lock page scroll, pause videos (including a capture-phase `play` listener), and stop key events from reaching site shortcuts.
- Timer pill counts only visible-tab seconds and flushes to background every 15 seconds and on hide.
- One +2-minute extension per session; after that, "Start over with a new reason".
- `safe()` wraps `chrome.*` calls because old content scripts lose extension context after a reload.

Custom sites: Settings requests `*://domain/*` and `*://*.domain/*` with `chrome.permissions.request`; on success saves to `customSites`. Background watches `settings.customSites` and re-registers one dynamic content script (`id: "sg-custom"`) for the sites whose permission is granted.

## Design system

- Colours: ink `#172230` (dark surfaces), text `#1E2B33`, mist `#EEF2F0` (light surfaces), sage-teal accent `#2F7D6D` (hover `#276A5C`), amber `#C9892B` (focus rings, warnings, "due"), muted text `#4A5A63` / `#6B7A82`, borders `#BFCCC6` / `#D3DDD8`.
- Type: headings in a serif stack (`"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`), body in system UI. No web fonts (no network).
- Signature element: the breathing "orb" circle that scales slowly. Respect `prefers-reduced-motion` everywhere.
- Accessible: visible amber focus rings, labels on all inputs, `role="status"`/`aria-live` for changing text, dialogs labelled.
- Copy tone: warm, short, never preachy or guilt-tripping. Plain words.

## Testing

- `node tests/simulate-workday.js` — fake clock + mocked Chrome API; prints when windows/notifications would appear and the day's stats. Expected: micro-breaks at :20/:40, a movement break deferred during a Meet call and shown after it, lunch at 13:00, wrap-up at 18:30.
- `node --check <file>.js` on every changed file.
- UI pages (popup, options, break, summary) can be rendered with Playwright by injecting a mocked `window.chrome` via `add_init_script` and opening the HTML files directly. `content.js` can be tested by routing a fake `https://www.instagram.com/` page and adding the script with `add_script_tag`.
- Manual: Settings → "Preview a micro-break" / "Preview a movement break"; set intervals to the minimum for quick checks; open `https://meet.google.com/abc-defg-hij`-style URL to see meeting deferral.

## Known limitations

- Can't see calls in the Teams/Zoom desktop apps (Pause buttons cover this).
- Idle detection treats watching a long video without input as "away" after 2 minutes.
- Works only while the browser is running.
- Focus Guard only covers the browser, not phone apps.
- Defaults live in two places (background and options).

## Backlog / ideas

- New icon to match the Unsit name (current icon is the original teal "breath" dot).
- Demo mode for Tech Spotlight (compress timers to seconds) — currently covered by Preview buttons.
- Polish from Krishna's real-use notes (collect before building).
- Custom activities written by the user; desk-yoga sets; more activities.
- Weekly summary; longer history.
- Optional "Tomorrow, start with…" note in the wrap-up.
- Team challenge (opt-in, aggregate counts only).
- Calendar-aware breaks (would need OAuth; weigh against privacy positioning).
- Chrome Web Store listing: screenshots, privacy policy ("no data leaves your device"), permission justifications for idle, notifications, scripting, meeting hosts and optional hosts.
- Desktop tray app (Tauri) only if company pilots ask for it.

## Conventions for changes

- Bump `version` in `manifest.json` for every release; package as `unsit-vX.Y.zip` with the folder at the root.
- Keep all stats writes in background through `updateDay`.
- Any new message type must always `sendResponse`.
- Ignore errors from closing/updating tabs or windows that may already be gone.
- Don't add network calls, analytics, remote scripts or broad permissions.
- Keep activities office-appropriate by default; floor exercises are home-only.
- Test with the simulation and Playwright before handing over; describe install/update steps for Krishna in plain language.
