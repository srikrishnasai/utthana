# Unsit — Product Vision & Build Specification

> **Audience:** Codex, Claude Code, Cursor, Abacus, and human engineers
>
> **Purpose:** This document is the source of truth for evolving Unsit from a Chrome/Edge break-reminder extension into a broader personal workday intelligence product.
>
> **Status:** Product direction + architecture + phased implementation plan. The current extension remains the starting point. Do not attempt the entire roadmap in one change set.

---

# 1. Product thesis

## 1.1 What Unsit is becoming

Unsit should evolve from:

> **A break reminder with Focus Guard**

to:

> **A personal workday intelligence layer that understands how a person is working, protects attention, helps with transitions, remembers context, and creates better opportunities to pause and recover.**

The Chrome/Edge extension is the first client/surface, not the final product boundary.

The long-term product should be able to understand the shape of a user's digital workday without becoming employee-surveillance software.

## 1.2 The five questions Unsit should answer

1. **What am I doing?**
2. **How am I working?**
3. **Is this a good moment to interrupt me?**
4. **What should happen next?**
5. **What should I remember when I come back?**

## 1.3 Product promise

Unsit should optimize for:

- fewer badly timed interruptions
- better focus opportunities
- better transitions between tasks and meetings
- better awareness of where the workday went
- easier return to interrupted work
- healthier breaks without guilt, shame, or medical claims

The product should feel like a calm assistant, not a supervisor.

---

# 2. Current product baseline

The current product is approximately v2.1.3 and already contains substantial functionality. Do not rebuild these from scratch.

## Existing functionality

- Manifest V3 Chrome/Edge extension
- plain JavaScript / HTML / CSS
- no build step
- no dependencies
- work-hours-aware scheduling
- micro-break activities (roughly 20–30 seconds)
- movement-break activities (roughly 1–2 minutes)
- activity rotation so the same activity does not repeat back-to-back
- meeting detection for Google Meet / Zoom / Teams
- break deferral during detected meetings
- lunch reminder
- end-of-day wrap-up
- idle / active tracking using `chrome.idle`
- idle-away time can count as a break with appropriate semantics
- office vs home mode
- Focus Guard
- user-addable Focus Guard sites using optional per-site permissions
- Focus Guard intent prompt
- Focus Guard session timer
- Focus Guard time-up screen
- one 2-minute Focus Guard extension per session
- toolbar popup
- time since last break
- today's stats
- 7-day breaks chart
- Focus Guard statistics
- pause controls
- full Settings page
- opt-in on-device text-to-speech prototype for suitable breaks

## Existing planned roadmap — do not recreate as “new ideas”

These are already planned and should not be presented to the owner as novel additions:

- paid tier
- custom activities
- focus schedules
- longer history
- weekly report / weekly summary
- themes
- user-written custom activities
- more desk-yoga-style activities
- optional “tomorrow, start with…” wrap-up note
- opt-in team challenge
- opt-in aggregate-only anonymous team tier
- calendar-aware breaks using OAuth
- desktop tray app if a corporate pilot specifically requires full-screen overlays or desktop-call detection

The new direction may supersede, broaden, or reorganize these items, but do not silently treat them as undiscovered features.

---

# 3. New strategic direction

The product should be thought of as six cooperating engines:

```text
                         UNSIT
                           |
                    WORKDAY ENGINE
                           |
       +-------------------+-------------------+
       |         |          |         |         |
    Context    Focus    Schedule   Memory   Wellbeing
    Engine     Engine    Engine    Engine     Engine
       |         |          |         |         |
       +---------+----------+---------+---------+
                           |
                     DECISION ENGINE
                           |
              +------------+------------+
              |            |            |
             Nudge       Protect     Remember
```

## 3.1 Context Engine

Understands coarse work context.

Potential states:

- `IDLE`
- `NORMAL_WORK`
- `FOCUS`
- `DEEP_WORK`
- `MEETING`
- `PRESENTING`
- `TRANSITION`
- `POST_MEETING`
- `DISTRACTION`
- `HIGH_FRAGMENTATION`
- `LUNCH`
- `WRAP_UP`
- `AFTER_HOURS`
- `UNKNOWN`

The context model should be probabilistic/heuristic, not falsely certain.

Bad:

> “You are stressed.”

Good:

> “Your recent activity looks highly fragmented.”

## 3.2 Focus Engine

Describes the work rhythm rather than judging productivity.

Possible measures:

- uninterrupted work duration
- context-switch frequency
- active vs idle intervals
- communication-heavy periods
- focus blocks
- meeting blocks
- distraction sessions
- transitions

Do not create a single employee “productivity score.”

## 3.3 Schedule Engine

Understands:

- work hours
- lunch
- meetings
- protected focus periods
- break windows
- user pauses
- temporary overrides
- future desktop/calendar integrations

The scheduler should be capable of saying:

> “A break is due, but now is a poor interruption point.”

## 3.4 Memory Engine

Stores lightweight user-controlled context:

- parked tasks
- resume breadcrumbs
- optional notes
- previous work context
- local day summaries

This is not intended to become a full task manager.

## 3.5 Wellbeing Engine

Owns:

- break scheduling
- activity selection
- movement/eye/posture prompts
- lunch
- screen-away periods
- recovery after long focus or meeting blocks

No diagnosis. No medical claims.

## 3.6 Decision Engine

This is the most important new system.

It decides whether Unsit should:

- do nothing
- wait
- show a subtle indicator
- offer a break
- protect focus
- offer a transition action
- remind the user about parked context
- prepare an end-of-day reflection

Every interruptive action should pass through one common decision/suppression path.

---

# 4. Core product concept: interruptibility

Unsit should stop thinking only in terms of “is a reminder due?”

It should answer:

> **“Is a reminder due, and is this a good moment to interrupt?”**

## 4.1 Interruptibility levels

Internally model something like:

- `VERY_LOW`
- `LOW`
- `MEDIUM`
- `HIGH`
- `VERY_HIGH`

Example signals:

| Signal | Effect |
|---|---|
| active meeting | very low |
| presenting/screen sharing | very low |
| deep focus | low |
| rapid context switching | medium |
| natural tab/window transition | high |
| idle/return from idle | high |
| meeting ended | high |
| explicit user request | very high |

The model should never claim certainty from weak browser signals.

---

# 5. Product pillars

The user-facing product should eventually organize itself around four primary concepts.

## 5.1 Protect

Protect attention.

Examples:

- Focus Guard
- distraction protection
- focus sessions
- notification suppression where technically/legally appropriate
- protected work blocks

## 5.2 Guide

Guide the workday.

Examples:

- break timing
- meeting transitions
- work rhythm
- interruption-aware reminders
- natural-pause delivery

## 5.3 Remember

Remember context.

Examples:

- Park this
- Resume me
- resume breadcrumbs
- interrupted-task context
- lightweight local notes

## 5.4 Understand

Help the user understand their day.

Examples:

- workday timeline
- screen/computer activity breakdown
- interruption patterns
- meeting load
- context switching
- end-of-day reflection

---

# 6. Phase 1 — Workday Intelligence inside the existing extension

This is the first major implementation phase. Do not start with desktop native code or an LLM.

## Goal

Prove that Unsit can become a work-rhythm assistant using the browser extension alone.

## 6.1 Natural-pause delivery

### Description

Once a break is due, Unsit should hold the reminder for a bounded period when the user appears to be in continuous work, then offer it at a likely transition.

### Candidate transition signals

- tab activation change
- window focus change
- idle start/stop
- page/navigation changes where already available
- meeting end
- exiting a protected focus state

Signals should be coarse and treated as clues, not proof.

### Requirements

- bounded deferral so a break cannot disappear indefinitely
- meeting suppression is checked immediately before delivery
- user can explicitly request the break regardless of natural-pause logic
- avoid repeating the same reminder after a brief transition

### UX example

> **Break ready**
>
> You're at a natural stopping point.
>
> [ Take 30 sec ] [ Later ]

---

# 7. Phase 1 — Focus Protection Mode

## Goal

Turn Focus Guard into a broader “protect my next block” concept.

## UX

User chooses:

> **Protect my next 60 minutes**

Unsit can coordinate, where supported:

- Focus Guard
- break behavior
- interruption policy
- context memory
- future notification controls
- meeting exceptions

## Important

This should not become a rigid productivity prison.

User must always have an obvious way to exit or override it.

---

# 8. Phase 1 — Workday Timeline

## Goal

Replace raw screen-time-only reporting with a readable local timeline.

## Example

```text
TODAY

09:04–09:52  Focus — Development
09:52–09:53  Micro break
09:53–10:38  Focus — Development
10:38–11:12  Meeting
11:12–11:25  Transition
11:25–12:18  Focus — Planning
12:18–12:50  Lunch / away
13:00–13:40  Communication
13:40–14:51  Focus
14:51–14:53  Movement break
```

## Rules

- classify only from available signals
- labels can be user-adjustable
- never fabricate certainty
- show `Unknown` when uncertain
- do not create “productivity scores”

---

# 9. Phase 1 — Park This / Resume Me

## Goal

Help users stop worrying that a break or context switch will make them forget what they were doing.

## Park This

User can capture a short note:

> “Verify the Snowflake query after API fix.”

Store locally.

## Resume Me

On return:

> **Welcome back**
>
> You parked:
> `Verify the Snowflake query after API fix.`
>
> [ Continue ] [ Done ] [ Keep ]

## Requirements

- no remote storage
- optional retention setting
- easy delete
- no automatic reading of page text in phase 1

---

# 10. Phase 1 — Post-meeting transition

When a detected browser meeting ends:

1. cancel/merge accumulated break backlog
2. wait a short settling period
3. offer one appropriate transition
4. yield immediately if another meeting begins

Do not turn meeting gaps into an aggressive break queue.

Example:

> **Meeting finished**
>
> Take 60 seconds before jumping into the next thing.
>
> [ Reset ] [ Continue working ]

---

# 11. Phase 1 — Local adaptive behavior

Unsit should gradually learn locally which behavior works for the individual.

Potential inputs:

- activity accepted
- activity skipped
- activity repeatedly dismissed
- break accepted immediately
- break deferred
- time of day
- context state

Use simple weighted preference logic before considering ML.

Requirements:

- preserve variety
- never collapse to only favorites
- user can reset personalization
- never infer a medical condition
- never create shame/compliance scores

---

# 12. Phase 1 — Explain My Day

Generate a local, deterministic summary first.

Example:

> **Your workday**
>
> You had 3 strong focus blocks totaling 3h 47m.
>
> Meetings occupied 2h 04m.
>
> Your most fragmented period was 14:10–15:05.
>
> You took 7 breaks.
>
> Your longest uninterrupted work block was 82 minutes.

Then optionally add an observation:

> **Observation:** Your afternoon had substantially more context switching than your morning.

Avoid:

- productivity grades
- stress claims
- health claims
- manager-style judgment

---

# 13. Phase 2 — Desktop Awareness

This phase requires a native desktop companion or equivalent system-level integration. It should be a separate architecture layer, not woven into the browser extension.

## Goal

Understand the broader computer workday without requiring the browser to pretend it can see desktop applications.

## Possible desktop signals

- foreground application category/name
- app focus duration
- OS idle/lock/sleep
- notification state where technically permitted
- display topology
- system-level meetings where reliable

## Important privacy boundary

The desktop layer should default to metadata, not content.

Do not capture:

- screenshots
- keystrokes
- clipboard
- message bodies
- document contents
- audio
- webcam

unless a later explicitly approved feature requires a specific capability and the privacy model is redesigned accordingly.

## Example

```text
Chrome       2h 14m
VS Code      2h 58m
Teams        1h 41m
Outlook      0h 31m
Other        0h 44m
Away         0h 48m
```

Never silently upload any of this unless the future product explicitly changes its privacy policy.

---

# 14. Phase 2 — Computer-time model

The product should distinguish:

- browser foreground time
- other-app computer-active time
- idle/away time
- locked/sleeping time
- unknown/unavailable intervals

Never call computer-active time “screen attention.”

Use honest wording such as:

> “Computer active time”

not:

> “You were looking at the screen for 7h 42m.”

---

# 15. Phase 2 — Meeting intelligence

With explicit calendar integration later, Unsit can understand the shape of the day.

Example:

```text
09:00 Standup
09:30 Focus
10:30 Customer meeting
11:15 15-minute gap
11:30 Design review
12:30 Lunch
13:30 Focus
14:30 Back-to-back meetings
17:30 Wrap-up
```

Possible decision:

> “You have 4 meetings after lunch. Your 11:15 gap is the best available movement window.”

## Calendar options

### Privacy-first option

Allow local `.ics` import.

### More powerful option

Optional OAuth integration for Google/Microsoft calendars.

This should be an explicit product tradeoff, not assumed by default.

---

# 16. Phase 2 — Workday Autopilot

## Concept

A single user-level mode:

> **Start Workday**

Unsit then uses its context and schedule engines to coordinate the day.

High-level flow:

```text
Start
  |
  v
Understand schedule
  |
  v
Protect focus opportunities
  |
  v
Allow communication windows
  |
  v
Detect meetings
  |
  v
Find natural breaks
  |
  v
Remember interrupted work
  |
  v
Recover after meetings
  |
  v
Prepare wrap-up
  |
  v
End workday
```

This is not an automatic hard-blocking system. The user retains control.

---

# 17. Phase 2 — Notification orchestration

If native desktop APIs permit it, Unsit may eventually coordinate notification handling.

Concept:

During deep work:

> low-priority communication accumulates

At transition:

> “4 low-priority items are waiting.”

The feature must have:

- explicit user consent
- clear status
- emergency/priority bypasses
- easy disable control
- no message-content upload

Do not build this in the browser-only MVP.

---

# 18. Phase 2 — Work-tool context

Optionally support user-enabled work domains such as:

- Slack
- Teams web
- Gmail
- Jira
- GitHub
- Confluence
- Notion
- docs/sheets tools

## Important privacy model

Use only coarse signals such as:

- visits
- dwell time
- navigation frequency
- user-declared category

Do not read:

- message bodies
- emails
- document contents
- clipboard
- typed text

The product should explicitly say:

> “Unsit sees that you spent time on this work tool, not what you wrote there.”

---

# 19. Context classification

Before introducing AI, implement deterministic local context classification.

Possible classification signals:

- domain/app category
- duration
- switching rate
- meeting state
- Focus Guard state
- idle state
- known user labels

Example:

```json
{
  "state": "DEEP_WORK",
  "category": "DEVELOPMENT",
  "durationMinutes": 68,
  "interruptibility": "LOW",
  "meetingSoon": false,
  "breakDue": true,
  "recentContextSwitches": 1
}
```

These values are internal decision inputs, not a medical or employee-performance assessment.

---

# 20. AI layer — add later, not first

AI should enhance Unsit only after deterministic context infrastructure works.

## AI should be used for

- summarizing a work session
- summarizing the day
- generating resume context
- explaining interruption patterns
- summarizing parked context
- suggesting experiments for tomorrow
- answering user questions about their own local data

## AI should not be required for

- break timing
- meeting suppression
- basic Focus Guard
- basic classification
- scheduling
- privacy enforcement

Core safety behavior must remain deterministic.

---

# 21. Local AI architecture

Preferred long-term option:

```text
Local Unsit state
      |
      v
Structured context
      |
      v
Optional local model
      |
      v
Structured response
```

Avoid feeding raw browsing history to an LLM by default.

Prefer a reduced structured context representation.

Example input:

```json
{
  "workBlocks": [
    { "type": "focus", "duration": 78 },
    { "type": "meeting", "duration": 42 },
    { "type": "fragmented", "duration": 31 }
  ],
  "breaks": 6,
  "meetingMinutes": 142,
  "longestFocusMinutes": 78
}
```

The model can produce a human-readable summary without seeing private content.

---

# 22. Optional cloud AI architecture

If the product eventually offers cloud AI, it MUST be an explicit opt-in and clearly separate from the privacy-first local mode.

Possible model:

```text
Default:
Device-only

Optional:
User explicitly enables cloud intelligence
       |
       v
Minimal structured context
       |
       v
Cloud AI
```

Do not silently change the default privacy posture because an AI feature exists.

---

# 23. Resume context — future AI version

Eventually, the user could press:

> **Save my place**

Unsit may combine local context into:

> “You were comparing the API response handling between the payment service and checkout controller. The next step was to verify the backend response after the fix.”

The system should make clear when a sentence was AI-generated.

The user must be able to edit/delete it.

---

# 24. End-of-day intelligence

Long-term end-of-day output should answer:

- Where did my day go?
- What interrupted me?
- What were my strongest focus blocks?
- What did I leave unfinished?
- What should I carry forward?

Example:

```text
TODAY

Focused work       3h 47m
Meetings           2h 04m
Communication      1h 13m
Fragmented work    0h 38m
Breaks             0h 41m

Longest focus      82m
Most fragmented    14:10–15:05

Observation:
Your afternoon was more fragmented than your morning.

Parked context:
• Verify Snowflake query
• Reply to deployment review

Tomorrow:
Protect one focus block before lunch.
```

The recommendation should be framed as an experiment, not a command.

---

# 25. Enterprise product direction

Unsit may eventually have two distinct layers:

## Personal layer

Private by default.

Contains:

- detailed timeline
- site/app usage
- parked context
- personal preferences
- local work insights

## Organization layer

Only if the user/company explicitly opts into an enterprise product.

Should favor:

- managed defaults
- deployment
- policy configuration
- aggregate, privacy-preserving metrics

Avoid individual monitoring.

Bad enterprise model:

```text
Employee -> central server -> manager dashboard
```

Preferred model:

```text
Company policy
      |
      v
Employee device
      |
      +--> detailed personal state remains local
      |
      +--> optional aggregate-only telemetry
```

The product should never silently transform into surveillance software.

---

# 26. Enterprise managed defaults

A future desktop/browser deployment may use managed policy such as:

- default work hours
- whether Focus Guard starts enabled
- company-approved default activity sets
- default office/home mode
- policy banners
- allowed integrations

The policy must NOT automatically provide IT access to private personal statistics unless a future version explicitly redesigns the product around such access.

Where practical, use platform-managed configuration such as browser managed storage and OS deployment systems.

---

# 27. Permissions strategy

Permissions should be progressive.

## Level 0 — install

Use only the minimum extension permissions required for core operation.

## Level 1 — per-site

Request optional host permissions in context:

> “Enable Focus Guard on reddit.com?”

Never request broad `<all_urls>` access merely for convenience.

## Level 2 — advanced integrations

Examples:

- calendar access
- desktop companion permissions
- notification control
- additional app integrations

Each must:

- explain why it is needed
- offer an independent disable path
- work where possible without that integration

---

# 28. Privacy architecture

Even in the expanded product, use privacy as a competitive advantage.

## Default principles

- local storage first
- local computation first
- data minimization
- no hidden telemetry
- no silent remote AI
- no background network requests unless the user explicitly enabled a cloud feature
- no keylogging
- no clipboard monitoring
- no message-body collection
- no screenshot collection by default
- no webcam posture monitoring by default
- no manager-facing individual dashboards

## Privacy center

Add a visible UI showing:

```text
Network requests
Unsit policy: none by default

Optional site access
reddit.com      enabled
youtube.com     enabled

Stored locally
break history
focus settings
parked context
preferences

[ Manage permissions ]
[ Export my data ]
[ Delete all local data ]
```

Do not fake runtime network counters unless the implementation can genuinely verify them.

---

# 29. Data model principles

Keep data modular so features can be developed independently.

Suggested domains:

```text
settings
scheduler
activityHistory
workSegments
contextEvents
meetingSegments
focusSessions
focusGuardSessions
parkedItems
userPreferences
adaptationState
permissionsMetadata
```

Every record should have:

- schema/version
- timestamps
- source
- retention behavior where applicable

Avoid keeping raw event logs forever.

Prefer derived/local aggregates when detailed history is no longer needed.

---

# 30. Event model

A shared local event model can make the system easier to reason about.

Example:

```json
{
  "id": "evt-123",
  "type": "TAB_FOCUS_CHANGED",
  "timestamp": 1760000000000,
  "source": "browser",
  "metadata": {
    "category": "work"
  }
}
```

Potential event types:

- `USER_ACTIVE`
- `USER_IDLE`
- `TAB_FOCUS_CHANGED`
- `WINDOW_FOCUS_CHANGED`
- `MEETING_STARTED`
- `MEETING_ENDED`
- `FOCUS_STARTED`
- `FOCUS_ENDED`
- `BREAK_DUE`
- `BREAK_SHOWN`
- `BREAK_ACCEPTED`
- `BREAK_SKIPPED`
- `BREAK_COMPLETED`
- `FOCUS_GUARD_STARTED`
- `FOCUS_GUARD_ENDED`
- `PARKED_ITEM_CREATED`
- `PARKED_ITEM_COMPLETED`

Do not record unnecessary URLs/titles for every event.

---

# 31. Decision engine design

All interruption-capable features should use a common API, conceptually:

```js
shouldInterrupt({
  reason,
  urgency,
  requiredUserAction,
  context,
  interruptibility
})
```

The result should be something like:

```js
{
  decision: 'ALLOW', // WAIT | SUPPRESS | ALLOW
  reason: 'NATURAL_TRANSITION',
  retryAfterMs: 120000
}
```

This avoids scattered logic such as:

```text
meeting suppression in one place
flow suppression in another
presentation suppression in another
```

Every reminder surface should pass through the same suppression layer.

---

# 32. Interruption hierarchy

Not every user event should be equally interruptive.

Suggested hierarchy:

```text
LEVEL 0  Passive state
        badge / side panel

LEVEL 1  Subtle reminder
        notification / quiet card

LEVEL 2  User-facing card
        popup/panel

LEVEL 3  Modal interruption
        use rarely

LEVEL 4  External/system action
        only with explicit user configuration
```

Default Unsit behavior should live around Levels 0–2.

---

# 33. Focus Guard evolution

Current Focus Guard remains intact.

Future direction:

```text
Current:
Distracting site -> intent -> timer -> pause

Future:
Attention protection layer
        |
        +-- distracting sites
        +-- work-tool fragmentation
        +-- focus session
        +-- notification policy
        +-- transition handling
```

## Important

Do not automatically classify all work websites as “distractions.”

Slack, Gmail, Jira, YouTube, Reddit, etc. can all have legitimate and illegitimate uses.

Use explicit intent and user-defined configuration wherever possible.

---

# 34. Context-switching / fragmentation engine

One of the strongest possible future differentiators is detecting excessive context switching without reading content.

Example:

```text
Slack -> Jira -> Gmail -> Slack -> GitHub -> Gmail -> Slack
```

Potential response:

> “You've switched contexts quite a bit. Take 20 seconds before choosing what to do next.”

Never say:

> “You are stressed.”

Never infer mental health status.

Use gentle wording such as:

> “Busy stretch.”
>
> “Lots of context switching lately.”

---

# 35. Adaptive activity selection

The activity system should eventually consider:

- recent activity
- user preferences
- context type
- available time
- office/home mode
- sitting/standing state
- whether the user is on a call
- whether the break should take them away from the screen

Example:

```text
After 75m coding
-> eyes + wrists + posture

After 90m meetings
-> walk + water + shoulders

After Focus Guard session
-> screen-away movement
```

This is “varied with a reason,” not random rotation.

---

# 36. Product states and transitions

Create an explicit state machine rather than relying on independent timers.

Example:

```text
NORMAL
  |
  +--> FOCUS
  |
  +--> MEETING
  |
  +--> IDLE
  |
  +--> DISTRACTION

FOCUS
  |
  +--> NATURAL_TRANSITION
  |
  +--> BREAK_DUE
  |
  +--> MEETING

MEETING
  |
  +--> POST_MEETING
  |
  +--> MEETING

POST_MEETING
  |
  +--> BREAK_OFFER
  |
  +--> NORMAL
  |
  +--> MEETING
```

This state machine should be centralized enough that future desktop and calendar adapters can feed it without rewriting scheduler logic.

---

# 37. Desktop architecture

When the desktop companion is introduced, use an adapter architecture.

```text
             UNSIT CORE
                 |
        +--------+--------+
        |        |        |
     Browser  Desktop   Calendar
     Adapter  Adapter   Adapter
        |        |        |
      MV3      Native   OAuth/ICS
```

Adapters produce normalized events.

The core should not care whether a meeting came from:

- Meet tab detection
- desktop Teams
- calendar
- manual user toggle

It should simply receive:

```js
{
  type: 'MEETING_ACTIVE',
  confidence: 'HIGH',
  source: 'calendar'
}
```

---

# 38. Confidence model

Because computer-observation APIs are imperfect, Unsit should model confidence.

Example:

```text
MEETING_ACTIVE
confidence: HIGH
source: calendar + browser

DEEP_WORK
confidence: MEDIUM
source: stable app/site focus + low switching

USER_LEFT_DESK
confidence: HIGH
source: idle API
```

Do not present medium-confidence inferences as facts.

---

# 39. UX principles

## Calm

No frantic animations or repeated alerts.

## Respectful

No guilt.

## Transparent

Explain why an action happened when useful.

Example:

> “Break ready. We waited because you were in a continuous work block.”

## Reversible

Every strong behavior has an obvious override.

## Non-invasive

Never steal focus unless explicitly configured.

## Personal

Adapt to the user without becoming creepy.

---

# 40. What Unsit should never become

Do not implement these as core product direction:

- employee surveillance dashboard
- individual productivity ranking
- keystroke monitoring
- clipboard logging
- hidden screenshots
- hidden webcam monitoring
- “stress detection” presented as fact
- medical diagnosis
- guilt/shame streaks
- non-overridable wellness enforcement
- manager visibility into individual browsing history
- content inspection of messages just to infer productivity
- background telemetry disguised as diagnostics
- dark-pattern retention loops

The system can become more powerful without becoming more invasive.

---

# 41. What to build first

Recommended sequence:

## Phase 0 — Architecture foundation

1. Normalize the existing scheduler/state logic.
2. Introduce a shared local event model.
3. Introduce a centralized Decision/Interruptibility Engine.
4. Ensure every notification/overlay path uses the same suppression rules.
5. Add capability/uncertainty handling.

## Phase 1 — Workday Intelligence

1. Natural-pause delivery.
2. Explicit workday timeline.
3. Focus Protection mode.
4. Park This / Resume Me.
5. Post-meeting transition.
6. Local adaptive activity selection.
7. Explain My Day.
8. Privacy Center.

## Phase 2 — Broader computer awareness

1. Desktop companion.
2. Computer-time model.
3. Desktop meeting awareness.
4. Native notification coordination where appropriate.
5. Optional work-tool awareness.

## Phase 3 — Schedule intelligence

1. Local `.ics` import.
2. Optional calendar OAuth.
3. Meeting-gap optimization.
4. Workday Autopilot.

## Phase 4 — AI

1. Local structured-context summarization.
2. Resume-context generation.
3. End-of-day explanation.
4. User Q&A over local workday data.
5. Optional cloud AI as a clearly separate opt-in tier.

## Phase 5 — Enterprise

1. Managed browser/desktop deployment.
2. Managed defaults.
3. Enterprise documentation.
4. Privacy-preserving aggregate analytics, only if explicitly enabled.

---

# 42. MVP for the new product direction

If an engineering agent needs a concrete “build this first” target, implement this subset:

### Core

- centralized event model
- centralized context state
- interruptibility scoring
- natural-pause scheduler
- meeting suppression
- Focus Guard integration

### UX

- new Home/Dashboard
- Today timeline
- Focus Protection action
- Park This
- Resume Me
- Post-meeting transition card
- Explain My Day

### Storage

- versioned local schema
- migrations
- retention policy
- reset/export/delete

### Quality

- unit-test scheduler decisions
- deterministic simulated timelines
- meeting-start race tests
- idle/resume tests
- service-worker restart tests
- browser restart tests
- duplicate notification prevention
- suppression tests

Do not build desktop native integration or AI in this MVP.

---

# 43. Suggested folder architecture for the extension

Adapt to the existing repository rather than blindly renaming files.

Conceptual structure:

```text
src/
  core/
    event-bus.js
    state-store.js
    context-engine.js
    interruptibility-engine.js
    decision-engine.js
    scheduler.js
    time.js

  features/
    breaks/
    focus-guard/
    focus-protection/
    meetings/
    timeline/
    memory/
    wrap-up/

  adapters/
    browser/
    meetings/
    idle/

  storage/
    schema.js
    migrations.js
    repository.js

  ui/
    popup/
    settings/
    dashboard/
    break-card/

  utils/
```

If the existing repository has a different structure, preserve its conventions where they are sound.

---

# 44. Coding rules for agents

The implementation agent must follow these rules:

1. **Inspect the existing code before modifying it.**
2. **Do not rebuild features that already exist.**
3. **Prefer small, testable modules over one giant service worker.**
4. **Do not add dependencies unless explicitly approved.**
5. **Do not introduce a build step unless explicitly approved.**
6. **Preserve Manifest V3.**
7. **Preserve Chrome and Edge support.**
8. **Keep permissions minimal and explain every new permission.**
9. **Do not add network requests accidentally through libraries, fonts, CDN assets, or telemetry.**
10. **Never fetch remote JavaScript.**
11. **Never make an AI API call without an explicit product decision and permission model.**
12. **Do not collect raw browsing history unnecessarily.**
13. **Do not store page contents merely to improve classification.**
14. **Every interruptive feature must respect the central decision/suppression engine.**
15. **Every new stored datum needs a documented retention rationale.**
16. **Every feature must have a user override.**
17. **Do not make browser heuristics sound more reliable than they are.**
18. **Use feature flags during development where helpful, but keep them local.**

---

# 45. Testing strategy

The product becomes much harder as it becomes context-aware, so testing must evolve with it.

## Unit tests

Test:

- context transitions
- interruptibility scoring
- suppression rules
- scheduler calculations
- activity selection
- break deduplication
- Focus Guard state transitions
- parked-item lifecycle
- retention logic

## Simulation tests

Create deterministic timelines such as:

```text
09:00 active
09:50 break due
09:51 still deep work
10:02 tab switch
10:02 offer break
```

and:

```text
09:50 break due
09:51 meeting starts
09:52 reminder suppressed
10:20 meeting ends
10:21 one post-meeting reset offered
```

## Failure tests

Test:

- service worker restart
- laptop sleep
- browser restart
- system clock changes
- timezone changes
- extension reload
- permission revocation
- disabled optional host
- malformed stored data
- duplicated events
- overlapping meetings

---

# 46. Metrics without surveillance

Product development still needs feedback, but do not automatically create telemetry.

In local development/debug mode, allow explicit export of diagnostics.

Possible local metrics:

- reminder accepted rate
- reminder deferred rate
- natural-pause success rate
- time spent in each state
- Focus Protection usage
- parked/resumed items

A user may export these manually for support or product research.

No background analytics by default.

---

# 47. Product naming / vocabulary

Prefer:

- workday
- focus
- rhythm
- transition
- context
- protected time
- reset
- resume
- park
- recovery
- interruptibility
- observation

Avoid:

- productivity score
- employee score
- compliance
- failure
- missed break
- bad habit
- unhealthy behavior
- stress detected
- low performer

---

# 48. Example end-to-end user journey

## Morning

User opens the browser.

Unsit sees a new workday.

> **Good morning. Ready when you are.**

No forced interaction.

## Deep work

User enters a long coding session.

Break becomes due.

Unsit decides interruptibility is low.

Nothing happens.

## Natural transition

User switches from the IDE to Slack.

Unsit recognizes a transition.

> **30-second reset?**

User accepts.

## Meeting

Meeting begins.

All reminders are suppressed.

## Meeting end

One short transition is offered.

> **Meeting done. Take a minute before the next thing?**

## Focus

User clicks:

> **Protect next 60 min**

Focus protection starts.

## Interruption

User needs to stop and clicks:

> **Park this**

Types:

> “Verify deployment after pipeline completes.”

## Return

Unsit later says:

> **You parked this earlier.**

## End of day

Unsit generates:

> You had 3 strong focus blocks today. Afternoon was more fragmented than morning. You also had 2h 10m of meetings.

Then:

> **Tomorrow experiment:** Protect one uninterrupted block before lunch.

This is the experience we are building toward.

---

# 49. Product moat hypothesis

The long-term moat should not be the number of stretch exercises.

It should be the combination of:

```text
Context model
     +
Interruptibility model
     +
Personal workday history
     +
Transition/memory system
     +
Focus protection
     +
Privacy-first architecture
```

The more Unsit understands the user's work rhythm locally, the more useful it becomes without needing to become invasive.

---

# 50. Strategic questions to revisit later

Do not block phase 1 on these.

1. How much desktop integration is acceptable?
2. Should the product remain fully local forever, or offer explicit cloud intelligence?
3. Is the primary market individual professionals, companies, or both?
4. How should calendar integration be positioned against the privacy promise?
5. Should AI run locally, through an optional user-supplied provider, or through a paid cloud service?
6. What is the minimum useful desktop companion?
7. Which enterprise policies are genuinely valuable without becoming surveillance?
8. What should remain free versus paid?

---

# 51. Final product north star

The product should ultimately feel like this:

> **Unsit understands how your workday is unfolding and quietly helps you work with it.**

It should know when to stay out of the way.

It should know when a break is useful.

It should know when a meeting just ended.

It should help you protect a good focus block.

It should help you remember where you left off.

It should show you where the day went.

And it should do all of this without turning into software that watches you for someone else.

**Build toward the workday intelligence layer, not a bigger collection of reminders.**
