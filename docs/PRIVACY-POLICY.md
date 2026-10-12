# Unsit — Privacy Policy

*Last updated: [DATE — fill in before publishing]*

## The short version

Unsit does not collect, transmit, sell, or share any of your data. Everything
Unsit does happens entirely on your device, inside your own browser. There is
no server, no account, no analytics, and no network request of any kind.

## What Unsit stores, and where

Unsit stores a small amount of information using Chrome's built-in
`chrome.storage.local` API — the same private, on-device storage every
extension uses for its own settings. This data:

- **Never leaves your device.** Unsit has no backend server to send it to,
  and makes no network requests at all — not for analytics, not for updates,
  not for anything.
- **Is never shared, sold, or used for advertising.**
- **Is visible only to you**, through Unsit's own popup, settings and summary
  pages.

What's stored:

| What | Why |
|---|---|
| Your settings (work hours, break rhythm, which activities you enable, which sites to guard) | So Unsit can apply your preferences |
| How many minutes you were active today, how many breaks you took, which activities you completed | So Unsit can show you your own daily/weekly stats |
| How long you've spent today on sites you've asked Unsit to guard (like Instagram), and how many times you closed a tab instead of continuing | So Focus Guard can show you your own usage of those sites |
| A short note you optionally type into "Quick note" before stepping away | So Unsit can show it back to you later — this is written entirely by you, never read or generated automatically |
| The date you installed Unsit | Used only to decide when to show certain one-time prompts |

Unsit does **not** collect your browsing history, the content of pages you
visit, your keystrokes, your clipboard, your location, or any health or
biometric data — even though Unsit is a wellness extension, it only ever
counts minutes and break counts, never anything about your physical
condition. Unsit makes no medical claims and does not diagnose anything.

## Permissions Unsit uses, and why

- **storage** — to save your settings and stats locally, as described above.
- **alarms** — to check, once a minute, whether a break is due.
- **notifications** — to show you a break reminder or a lunch/wrap-up nudge,
  if you've chosen notification-style breaks instead of a window.
- **idle** — to tell whether you're actively at your computer, so Unsit can
  count real active time and avoid nagging you while you're away.
- **scripting** — to show the Focus Guard pause screen on sites you've
  specifically asked it to guard (built-in ones, or ones you add yourself).
- **Host permissions for Google Meet, Zoom, and Microsoft Teams** — used only
  to check whether one of those tabs looks like it's in an active call, so
  Unsit can avoid interrupting you. Unsit never reads the content of those
  pages, only whether a tab matching those sites is open and (for Teams)
  producing audio.
- **Optional host permission, requested per site** — when you add a custom
  site to Focus Guard (for example, a site not in the built-in list), Chrome
  asks your explicit permission for that specific site before Unsit can show
  the pause screen there. Unsit never requests broad access up front.

Unsit cannot see anything happening in the Teams/Zoom/Meet **desktop apps**
(as opposed to a browser tab) — if you're on a call through a desktop app,
use the "Pause" option in Unsit's toolbar popup.

## Your control over this data

- Everything above can be reviewed and changed from Unsit's Settings page.
- Removing a guarded site also removes Unsit's permission for it.
- Uninstalling Unsit deletes all of its locally stored data — there's nothing
  left behind on a server, because there never was a server.

## Changes to this policy

If Unsit's data practices ever change, this policy will be updated and the
extension's Chrome Web Store listing will reflect the update. As of this
writing, that has never happened — Unsit has never sent data anywhere.

## Contact

Questions about this policy or Unsit's privacy practices: [YOUR CONTACT EMAIL — fill in before publishing]
