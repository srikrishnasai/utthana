# Utthana — Privacy Policy

*Last updated: 2026-11-20*

## The short version

Utthana does not collect, transmit, sell, or share any of your data. Everything
Utthana does happens entirely on your device, inside your own browser. There is
no server, no account, no analytics, and no network request of any kind.

## What Utthana stores, and where

Utthana stores a small amount of information using Chrome's built-in
`chrome.storage.local` API — the same private, on-device storage every
extension uses for its own settings. This data:

- **Never leaves your device.** Utthana has no backend server to send it to,
  and makes no network requests at all — not for analytics, not for updates,
  not for anything.
- **Is never shared, sold, or used for advertising.**
- **Is visible only to you**, through Utthana's own popup, settings and summary
  pages.

What's stored:

| What | Why |
|---|---|
| Your settings (work hours, break rhythm, which activities you enable, which sites to guard) | So Utthana can apply your preferences |
| How many minutes you were active today, how many breaks you took, which activities you completed | So Utthana can show you your own daily/weekly stats |
| How long you've spent today on sites you've asked Utthana to guard (like Instagram), and how many times you closed a tab instead of continuing | So Focus Guard can show you your own usage of those sites |
| A short note you optionally type into "Quick note" before stepping away | So Utthana can show it back to you later — this is written entirely by you, never read or generated automatically |
| The date you installed Utthana | Used only to decide when to show certain one-time prompts |

Utthana does **not** collect your browsing history, the content of pages you
visit, your keystrokes, your clipboard, your location, or any health or
biometric data — even though Utthana is a wellness extension, it only ever
counts minutes and break counts, never anything about your physical
condition. Utthana makes no medical claims and does not diagnose anything.

## Permissions Utthana uses, and why

- **storage** — to save your settings and stats locally, as described above.
- **alarms** — to check, once a minute, whether a break is due.
- **notifications** — to show you a break reminder or a lunch/wrap-up nudge,
  if you've chosen notification-style breaks instead of a window.
- **idle** — to tell whether you're actively at your computer, so Utthana can
  count real active time and avoid nagging you while you're away.
- **scripting** — to show the Focus Guard pause screen on sites you've
  specifically asked it to guard (built-in ones, or ones you add yourself).
- **Host permissions for Google Meet, Zoom, and Microsoft Teams** — used only
  to check whether one of those tabs looks like it's in an active call, so
  Utthana can avoid interrupting you. Utthana never reads the content of those
  pages, only whether a tab matching those sites is open and (for Teams)
  producing audio.
- **Optional host permission, requested per site** — when you add a custom
  site to Focus Guard (for example, a site not in the built-in list), Chrome
  asks your explicit permission for that specific site before Utthana can show
  the pause screen there. Utthana never requests broad access up front.

Utthana cannot see anything happening in the Teams/Zoom/Meet **desktop apps**
(as opposed to a browser tab) — if you're on a call through a desktop app,
use the "Pause" option in Utthana's toolbar popup.

## Your control over this data

- Everything above can be reviewed and changed from Utthana's Settings page.
- Removing a guarded site also removes Utthana's permission for it.
- Uninstalling Utthana deletes all of its locally stored data — there's nothing
  left behind on a server, because there never was a server.

## Changes to this policy

If Utthana's data practices ever change, this policy will be updated and the
extension's Chrome Web Store listing will reflect the update. As of this
writing, that has never happened — Utthana has never sent data anywhere.

## Contact

Questions about this policy or Utthana's privacy practices: [YOUR CONTACT EMAIL — fill in before publishing]
