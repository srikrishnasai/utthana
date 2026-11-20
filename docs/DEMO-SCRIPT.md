# Utthana — Tech Spotlight demo script

**Event:** Barbarian's Tech Spotlight, Friday 11 December 2026, 8:30 PM IST (registered 2026-11-20; confirmation of the actual slot still pending from the organizers).
**Working title:** "Utthana: a workday companion for people who sit at a screen all day." (Named "Unsit" when this script was first written — renamed 2026-11-20 after a trademark conflict; see CLAUDE.md's "Naming history.")
**Assumed slot length: 8–10 minutes** (typical for a monthly internal lightning-talk
format) — adjust the timing boxes below if your actual slot is longer or shorter.
This is a living doc; update it as the app changes or as you rehearse and find
better beats.

## The shape of the talk

```
Hook (own usage data)  →  Live demo  →  How it was built with AI
    →  What didn't work  →  What's next
```

Same structure CLAUDE.md already outlined — this fleshes it out with exact
clicks, timing, and where the newest features (Park This, Focus Protection,
natural-pause/post-meeting delivery) fit in.

---

## 0. Before you go on stage (prep, not part of the talk)

- [ ] Reload the extension (`chrome://extensions` → reload icon) so it's running the exact build you tested.
- [ ] Open **Settings** once beforehand and set **micro every = 5, move every = 8** minutes (or similar short numbers) so the natural "it's due" moments land inside your demo window instead of 20/50 minutes out. Put them back afterward, or just reload the extension after the talk to reset to your own real numbers if you've changed `DEFAULT_SETTINGS`-backed values — easiest is to just remember what you had and type it back in.
- [ ] Make sure you have **a few days of real usage data** showing in the popup/wrap-up before the talk — don't demo on a freshly-reloaded extension with all-zero stats. This is the whole point of the hook.
- [ ] Have a second browser tab ready at `https://meet.google.com/abc-defg-hij` (doesn't need to be a real meeting — the content script's regex only checks the URL shape) for the meeting-deferral bit.
- [ ] Know your own `chrome-extension://<id>/popup.html` etc. aren't needed — you'll drive everything through the real toolbar icon and real guarded sites, which is more convincing live anyway.
- [ ] **Do not** actually wait on stage for the 90-second post-meeting settle or the 3-minute natural-pause bound (see the callout in §2 below) — switching windows yourself (e.g. to your slides) counts as the "transition signal" and fires it almost immediately. This is a feature, not a workaround — say so out loud, it's a good beat.

---

## 1. Hook — "here's my own data" (~1–1.5 min)

Open the toolbar popup on your own, already-lived-in install.

> "I built this because I noticed how much time I was losing to reflexive
> scrolling during the workday — so the first thing I built was something to
> show me the truth about my own day."

Point at, in order:
- **Screen time today** / **breaks today** tile.
- The **7-day breaks chart** — "I've actually been using this daily since I started building it."
- The **end-of-day wrap-up** ("Explain My Day") is the strongest "it already knows things about my day" moment: *"You took 6 quick resets and 4 movement breaks today... you also caught yourself 3 times on a distracting site and chose to close the tab instead — that counts."* That last line especially tends to land with a room — it's not guilt, it's a quiet compliment. There's no in-UI "preview" button for this screen (unlike the micro/move activities), so to show it live, open a new tab to `chrome-extension://<your-extension-id>/summary.html` directly — find your extension's id at `chrome://extensions` with Developer mode on. It'll render against whatever's in today's real stats, so do this after you've already generated a bit of data earlier in the day. Have a screenshot as backup in case the live numbers look thin.
- Scroll down a touch on that same `summary.html` tab to the **Workday Timeline** — a readable strip like *"09:04–10:38 Active, 10:38–11:12 Meeting, 11:12–11:14 On a guarded site..."* turning the whole day into one glance. Worth saying out loud: it's built only from signals Utthana already has (active/idle/meeting/Focus Guard), not from tracking which sites or apps you were actually using — same privacy line as everything else, just visualized.

Keep this tight. The hook's job is "this is real and I use it," not a full feature tour.

---

## 2. Live demo (~4–5 min)

Work through these roughly in order, narrating as you go. You don't need all
of them if time is short — §2.2 (break flow) and §2.4 (Focus Guard) are the
two that must not get cut; the rest are enhancers.

### 2.1 Take a break, live (~45s)
Click **Take a break** in the popup → the activity window opens.
Click through a short one (water or a stretch) to "Nice work." This is the
calmest, most polished screen in the product — good to show early.

### 2.2 Micro/movement rhythm firing on its own (~1 min)
With the short intervals you set in prep, let the room see a break actually
*appear unprompted* at some point during the talk (it will, if you set
micro/move intervals short enough) — or just say "and in the background,
right now, it's counting toward my next one" and glance at the popup's
progress bar. Don't force this; if it doesn't fire during your slot, that's
fine, the manual Take a break already proved the activity itself works.

### 2.3 Natural-pause delivery — the "it waits for a good moment" beat (~45s)
> "It doesn't just fire the second a timer crosses zero — it waits a little,
> hoping for a natural pause, like you switching tabs or windows — so it
> doesn't land mid-keystroke. But it's bounded: if nothing happens, it shows
> up anyway within a few minutes. It never just disappears."

You can *show* this rather than wait for it: if a break happens to be
pending, switch to a different window (e.g. your slides) and switch back —
it should appear right away, because that switch is exactly the signal it
was waiting for.

### 2.4 Focus Guard — the pause screen (~1 min)
Open a new tab to Instagram (or whatever's in your guarded list).
> "What are you here for?" appears. Type a short reason, click **Go in for N
minutes**. Point out the countdown pill bottom-right, and the footer line —
*"Today you've spent X min on guarded sites and closed Y tabs at this
screen"* — that's the same honest-accounting idea as the wrap-up, applied to
distraction instead of breaks.

### 2.5 Meeting deferral + the settling period (~1 min)
Switch to your pre-opened `meet.google.com/abc-defg-hij` tab.
> "If I'm in a call, Utthana will never interrupt — whatever's due just waits."
Switch back to your guarded-site tab or close the Meet tab to end the
"call," and narrate rather than wait the full 90 seconds live:
> "When the call ends, it doesn't fire instantly either — same idea as
> before, a short settle, then a 'meeting's over, quick reset?' prompt, so it
> doesn't feel like it was sitting there waiting to pounce the second you
> hung up."

### 2.6 Park This / Resume Me (~45s)
In the popup's **Quick note** field, type something plausible —
*"Finish the Tech Spotlight slides"* — and click **Save**. Close the popup,
reopen it: the note is still there, with "Parked at [time]."
> "Small thing, but it's the start of a bigger idea — helping you not lose
> your thread when you step away, not just reminding you to step away."

### 2.7 Focus Protection (~45s)
Click **Protect next 60 min**. Point out the popup reframes — "Protecting
your focus" instead of "Breaks paused."

⚠️ **Open a *new* tab to a *different* guarded site than §2.4** (e.g. YouTube,
if Instagram was §2.4's site) — don't just switch back to the Instagram tab.
That tab already has an active Focus Guard *session* running from §2.4 (it
shows the countdown pill, not the gate), and the amber protection note only
renders on the gate screen (`showGate()`), not the timer pill. A fresh tab to
an unvisited guarded site guarantees you see the actual gate with the note:
*"You're about to open YouTube... You're protecting your focus until HH:MM."*

> "This is the same mechanism as Pause under the hood, but it's framed as a
> commitment you made to yourself, not just 'leave me alone' — and Focus
> Guard knows about it too."

Click **End focus protection** to reset before moving on.

---

## 3. How it was built with AI (~1.5–2 min)

Suggested beats, not a script — say this in your own words:
- Built conversationally in Claude chat, then moved into Claude Code for the
  harder engineering pass (bug fixes, tests, the icon, new features).
- No build step, no dependencies, no frameworks — plain Manifest V3 JS/HTML/CSS,
  deliberately, so the whole thing stays inspectable.
- Point at the test suite as a concrete artifact: `node tests/simulate-workday.js`
  runs a fake 9-hour workday against the real scheduling code with a mocked
  Chrome API in about half a second — show the terminal output live if you
  want a "yes, this is actually tested" moment that isn't just a claim.
- A small concrete example worth naming: **adaptive activity selection** — the
  shuffle bag that picks your next break activity now quietly leans toward
  the ones you tend to accept over ones you skip (bounded so nothing can
  dominate or disappear, and never shown to you as a number) — built, tested,
  and done in one focused pass once the pattern from the earlier features was
  already in place.
- Mention there's a longer-term product vision doc (`docs/UNSIT-PRODUCT-VISION-
  AND-BUILD-SPEC.md`) that reframes where this could go — ties directly into
  §5 below.

---

## 4. What didn't work (~1 min)

Pick one or two honest ones — this section lands best when it's genuinely
candid, not a humblebrag:

- **The natural-pause delay has a real side effect**: because a break can now
  wait a few minutes before showing, a break that becomes due right as a
  meeting starts can get swept into the meeting's deferred queue and
  "lost" to a same-slot movement break (movement always wins over micro in
  that queue). Didn't notice this until a regression test's output changed
  shape between runs — a good "AI-assisted development still needs you to
  actually read the diff" anecdote.
- **The name.** Originally picked "Unsit" without doing a real trademark
  search first — a plain web search said it was clear. A direct USPTO
  database search later turned up a live, registered trademark for the exact
  word, held by a company that sells "UnSit" branded standing/treadmill
  desks. Good lesson in "the AI's first answer isn't the thorough one, and
  some checks are worth doing twice, properly" — so the second time around,
  before landing on "Utthana" (Sanskrit for "rising/standing up"), every
  serious candidate got the real USPTO check *and* a search for existing
  apps/extensions under that name, not just a web search. This is a complete,
  resolved story now (name changed, root cause fixed) — a good one to tell
  precisely because it has an ending, not an excuse.

---

## 5. What's next (~1 min)

Briefly gesture at the vision doc's direction without overclaiming it's all
built: context/interruptibility modeling, a readable workday timeline,
eventually (if it ever goes further) desktop awareness and calendar
integration — always under the same privacy-first constraint: nothing leaves
the device, no analytics, ever. That constraint is the actual pitch, not a
footnote — say it plainly at the end.

---

## Fallback plan

If live demo breaks mid-flow (extension needs a reload, a tab misbehaves,
whatever): you already have real multi-day usage data in the popup and the
`simulate-workday.js` terminal output as a backup "proof it works" artifact
that needs zero live interaction. Don't panic-debug in front of the room —
narrate through it from a screenshot or the terminal and move on.
