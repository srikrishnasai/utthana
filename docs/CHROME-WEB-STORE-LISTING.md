# Unsit — Chrome Web Store submission draft

⚠️ **Written entirely under the old name "Unsit," before the 2026-11-20 rename
to "Utthana."** This whole draft — single-purpose statement, permission
justifications, data safety table, screenshots — needs a full refresh for the
new name before it's usable for real submission. Left as-is for now since the
Web Store track itself is still paused pending a separate decision; see
CLAUDE.md's "Naming history" section for the full story.

Draft text for the Developer Dashboard. Everything here is ready to paste in, but
the exact field names/layout in the dashboard can shift — check this against the
live form rather than assuming a 1:1 match. Written against the Developer Program
Policy update that took effect **2026-08-01** (see "Why this update helps us"
below).

## Name / trademark check — UPDATED 2026-10-08, real conflict found

**An initial web-search pass (earlier the same day) found no conflict. A
follow-up direct search of the actual USPTO trademark database overturned
that — there is a real, live, active conflict. Don't trust the earlier
"no existing extension / no conflict" summary if it resurfaces anywhere; this
section supersedes it.**

Searched `tmsearch.uspto.gov` (USPTO's live trademark search system) directly
for "UNSIT" and found:

- **A LIVE, REGISTERED, PRINCIPAL-register US trademark for the exact word
  "UNSIT"** — serial 99151920, registration number 7969003, filed
  2025-04-23, registered 2025-09-30. Owner: **InMovement Co LLC** (Indiana,
  USA). Classes 020 and 028, covering *"Desks, standing desks, writing desks,
  work stations being furniture and office chairs that are height-adjustable
  for use with exercise machines"* and *"Exercise treadmills with integrated
  desks, writing desks and work stations sold as a unit."*
- This isn't a defensive/unused filing — **"UnSit" is an actively sold,
  branded product**: InMovement/iMovR sells an under-desk walking treadmill
  called the "UnSit Office Treadmill" (~$2,495, sold at imovr.com), reviewed
  by multiple treadmill/fitness sites. It **syncs via Bluetooth to a
  smartphone app** — meaning the same brand already has a software/app
  presence adjacent to its "UnSit" hardware line, which narrows the gap
  between their registered furniture/exercise classes and a software product
  using the same name.
- An earlier, now-cancelled registration (serial 86702884, same wordmark,
  filed by a predecessor entity "InMovement LLC," Colorado) shows this brand
  has used the name consistently for years, not just since 2025.
- A second, separate wordmark search (standard web search) also confirmed:
  no existing *Chrome extension* is named exactly "Unsit" (closest is
  "Unsitely — Website Safety Scanner," an unrelated website-safety tool), and
  no unrelated prior-art name collisions (e.g. "Usit," a student babysitting
  app, different spelling and category).

**What this means, in plain terms:** the registered classes (020 furniture,
028 exercise equipment) are legally distinct from software (Class 009) or
SaaS (Class 042), so this registration wouldn't automatically block a
trademark *application* for a software product called "Unsit." But:
1. The product categories are thematically about as close as two different
   legal classes can get — both are explicitly "help people who sit too much
   at a desk move more" products, aimed at the same buyers, through
   overlapping channels (workplace wellness, standing-desk accessories).
2. Trademark "likelihood of confusion" analysis weighs exactly this kind of
   relatedness, not just the literal class numbers — and the existing brand
   already bridges into software via its companion app.
3. This is a **real, currently-enforceable, PRINCIPAL-register federal
   registration** held by a company actively selling a product under this
   exact name today, not a stale or abandoned mark.

**This is not a web-search approximation — it's a direct read of the live
USPTO registration record.** It's still not a substitute for an actual
trademark attorney's opinion (this summary doesn't assess likelihood of
confusion as a matter of law, just flags that a real registration exists in
a closely related space), but it's a materially different and more serious
finding than the earlier pass suggested. Worth deciding deliberately — keep
the name and accept the risk (reasonable for an internal demo / personal
use, less so for a paid public Chrome Web Store listing), rename before
wider publication, or get an actual attorney's read before publishing or
monetizing under "Unsit."

## Why the 2026-08-01 policy update helps us

Chrome's Developer Program Policy update (effective 2026-08-01) now requires
that any data collection be *strictly necessary* for the extension's disclosed
single purpose, bans collecting data for unrelated uses (analytics,
advertising, "future features"), and requires proactive disclosure if data
practices ever change. Unsit was already built this way from the start — zero
network requests, zero analytics, everything local — so this update is a
non-event for us. Worth saying so explicitly in the listing description; it's
a genuine differentiator right now.

## Single purpose statement

> Unsit helps people who sit at a computer all day take short, well-timed
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
> Used to show Unsit's "Focus Guard" pause screen (a reason-for-visiting
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
| Health information | No | Only break/activity counts and timers — no biometric, medical, or diagnostic data, and Unsit makes no health claims |
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

## Still needed before submitting (not done in this pass)

- **Host the privacy policy somewhere with a public URL** — `docs/
  PRIVACY-POLICY.md` is written but sitting in the repo; the dashboard needs a
  real link. GitHub Pages on this same repo is the path of least resistance
  if the repo is (or becomes) public.
- **Fill in the two placeholders** in PRIVACY-POLICY.md (`[DATE]` and
  `[YOUR CONTACT EMAIL]`) before publishing it.
- **Screenshots** (1280×800 or 640×400, at least one, up to five) — **draft
  images produced 2026-10-08**, all with fabricated demo data (no real usage
  data, no real Chrome profile — rendered in an isolated sandbox, not
  Krishna's actual browser): the popup, the Settings page, the break/activity
  flow mid-stretch, the richer end-of-day wrap-up, and the Focus Guard pause
  screen on Instagram's own public login page. **None are cropped to the
  Store's exact accepted dimensions yet** (actual sizes: 1280×2560, 1000×847,
  800×667, 1280×1400, 1536×695) — each needs a final resize/crop to either
  1280×800 or 640×400 before upload, which needs a real image editor/library
  this session didn't have available.
- **A real USPTO trademark search**, not just the web-search pass above.
