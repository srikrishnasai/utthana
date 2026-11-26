# Utthana — Chrome Web Store submission draft

Refreshed 2026-11-20 for the rename from "Unsit" to "Utthana." Draft text for
the Developer Dashboard. Everything here is ready to paste in, but the exact
field names/layout in the dashboard can shift — check this against the live
form rather than assuming a 1:1 match. Written against the Developer Program
Policy update that took effect **2026-08-01** (see "Why this update helps us"
below).

## Name / trademark check

**"Utthana" has been checked two ways and comes back clear**: a direct search
of the live USPTO trademark database (`tmsearch.uspto.gov`) for the exact word
returns zero results, and a separate search turned up no existing Chrome
extension, iOS app, or Android app under this name.

This product was originally named "Unsit," and that name was dropped
specifically because this same direct-USPTO-search process (only adopted
*after* an earlier plain web search had wrongly cleared "Unsit") turned up a
real, live, registered trademark for the exact word "UNSIT," held by a company
selling a similarly-themed standing/treadmill-desk product. That finding is
the reason this draft exists under a different name today. Full story,
including the specific registration details and every name considered along
the way, is in CLAUDE.md's "Naming history" section — worth reading once
before submitting, so the reasoning behind the current name isn't lost.

## Why the 2026-08-01 policy update helps us

Chrome's Developer Program Policy update (effective 2026-08-01) now requires
that any data collection be *strictly necessary* for the extension's disclosed
single purpose, bans collecting data for unrelated uses (analytics,
advertising, "future features"), and requires proactive disclosure if data
practices ever change. Utthana was already built this way from the start —
zero network requests, zero analytics, everything local — so this update is a
non-event for us. Worth saying so explicitly in the listing description; it's
a genuine differentiator right now.

## Single purpose statement

> Utthana helps people who sit at a computer all day take short, well-timed
> breaks, and includes an optional pause screen ("Focus Guard") that asks for
> a quick reason before opening a distracting site. Everything it does serves
> that one purpose: encouraging healthier breaks during a workday, without
> ever sending data anywhere.

## Permission justifications

Paste one of these per permission the dashboard asks about.

**storage**
> Used to save the user's own settings and break/activity statistics locally
> on their device, via `chrome.storage.local`. Nothing is stored remotely;
> nothing is synced to any server.

**alarms**
> Used to check once a minute whether a break is due, based on the user's own
> configured break rhythm and work hours. This is the extension's core
> timing mechanism.

**notifications**
> Used to show a break reminder, a lunch reminder, or an end-of-day summary
> prompt, only when the user has chosen notification-style delivery (an
> alternative to the default pop-up window) in Settings.

**idle**
> Used to tell whether the user is actively at their computer or away, so the
> extension can count real active screen time and avoid showing reminders
> while the user isn't present. No data from this API is stored beyond a
> simple active/idle/locked state used for that one purpose.

**scripting**
> Used to show Utthana's "Focus Guard" pause screen (a reason-for-visiting
> prompt and session timer) on websites the user has chosen to guard — either
> a small built-in list (e.g. Instagram, YouTube) or a site the user adds
> themselves. The script only overlays the page visually; it does not read or
> modify the site's own content or data.

**Host permissions: meet.google.com, *.zoom.us, teams.microsoft.com, teams.live.com**
> Used only to detect whether the user currently has an active video call open
> in one of these sites, so the extension can avoid interrupting a call with a
> break reminder. The extension checks only the tab's URL pattern (and, for
> Teams, whether the tab is producing audio) — it never reads any call
> content, participant information, or page data.

**Optional host permission (`*://*/*`, requested per site via `chrome.permissions.request`)**
> Focus Guard's built-in site list covers a handful of well-known distracting
> sites. If a user wants to guard an additional site of their own choosing,
> Chrome's permission API requires the extension to declare a broad optional
> permission bucket upfront, but the extension only ever requests — and the
> user only ever grants — the specific site they typed in, one at a time, via
> an explicit browser permission prompt. No origin is ever accessed without
> that specific, visible, user-initiated grant.

## Data safety / privacy practices disclosure

Chrome's dashboard asks about data categories in a checkbox-style form; exact
wording may differ from what's below; match this document's *intent* to
whatever the live form presents, not necessarily the ids/snippets shown here.

| Category | Collected? | Notes |
|---|---|---|
| Personally identifiable information | No | No accounts, no sign-in, no name/email collected |
| Health information | No | Only break/activity counts and timers — no biometric, medical, or diagnostic data, and Utthana makes no health claims |
| Financial / payment information | No | Not applicable |
| Authentication information | No | Not applicable |
| Personal communications | No | Not applicable |
| Location | No | Not applicable |
| Web history | Limited, local only | Only whether a tab matches one of a small, user-controlled list of guarded domains, and how many seconds were spent there. Not a browsing history; never transmitted |
| User activity | Yes, local only | Active/idle screen time, breaks taken, activities completed, an optional free-text note the user writes themselves ("Park This") |
| Website content | No | The extension overlays its own UI; it does not read or store page content |

For every category above where something is collected: it is used **solely**
to power the extension's own on-device features (showing the user their own
stats back to them), is **never transmitted off the device**, **never sold**,
**never shared with any third party**, and **never used for advertising or
analytics**.

**Privacy policy URL to paste in the dashboard:** link to
`docs/PRIVACY-POLICY.md` once hosted somewhere public (e.g. GitHub Pages) —
see the note in that file.

## Still needed before submitting

- ~~A real USPTO trademark search~~ — **done** (see "Name / trademark check"
  above).
- ~~Host the privacy policy at a public URL~~ — **done, 2026-11-26**. Repo
  renamed from "Unsit" to **utthana** on GitHub, made public, GitHub Pages
  enabled on `master` / `/docs`. Confirmed live at:
  `https://srikrishnasai.github.io/utthana/privacy-policy.html` — **this is
  the URL to paste into the dashboard's privacy policy field.**
- ~~Fill in the privacy policy's contact email~~ — **done**:
  krishna161095@gmail.com.
- ~~Screenshots~~ — **done, 2026-11-26**. Five real screenshots, captured from
  the actual extension loaded unpacked in Krishna's own Chrome (real usage
  data, not fabricated), each cropped to exactly 640×400: the popup, the
  Settings page, the break/activity flow mid-stretch, the end-of-day wrap-up
  ("Explain My Day"), and the Focus Guard pause screen. Checked into
  `docs/store-screenshots/`, ready to upload as-is. (The Workday Timeline
  didn't make the cut of 5 — Chrome caps screenshots at five, and the other
  five were a stronger set; worth a bonus screenshot later if the Store ever
  allows more, or for other marketing use.)
- **Pay the one-time $5 Chrome Web Store developer registration fee** and
  **submit through the Developer Dashboard** — both require Krishna's own
  Google account and payment method.
