// Background worker (v2: workday companion).
// Every minute it checks whether you're at the computer, inside your work hours
// and not on a call, and shows micro-breaks and movement breaks at the right time.
// It also runs Focus Guard (the pause screen on distracting sites).

importScripts("activities.js");

const BUILT_IN_SITES = ["instagram.com", "facebook.com", "youtube.com", "x.com", "twitter.com", "reddit.com"];

const DEFAULT_SETTINGS = {
  // Workday
  workDays: [1, 2, 3, 4, 5],     // 0 = Sunday
  workStart: "09:30",
  workEnd: "18:30",
  lunchOn: true,
  lunchTime: "13:00",
  wrapUpOn: true,
  // Break rhythm (minutes of active screen time)
  microOn: true,
  microEvery: 20,
  moveOn: true,
  moveEvery: 50,
  workplace: "office",           // "office" or "home"
  breakMode: "window",           // "window" or "notify"
  meetingDetect: true,
  speakSteps: false,             // read steps aloud on the break page, using an on-device voice only
  activities: Object.fromEntries(ACTIVITIES.map((a) => [a.id, true])),
  // Focus Guard
  sessionMinutes: 5,
  dailyGoal: 30,
  sites: Object.fromEntries(BUILT_IN_SITES.map((s) => [s, true])),
  customSites: []
};

const IDLE_SECONDS = 120;        // no keyboard/mouse for 2 min = away
const AWAY_RESET_MINUTES = 5;    // 5 min away counts as a natural break
const SNOOZE_MINUTES = 10;
const WINDOW_SIZE = { width: 460, height: 660 };
const NATURAL_PAUSE_WAIT_MS = 3 * 60000; // hold a due break this long, hoping for a transition

// A tab/window switch is a weak signal that someone just finished one thing and
// is starting another — a better moment to offer a break than mid-keystroke.
// In-memory only (not worth persisting): if the service worker restarts, we
// simply fall back to the bounded wait below, never losing correctness.
let lastTransitionAt = 0;
chrome.tabs.onActivated.addListener(() => { lastTransitionAt = Date.now(); });
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) lastTransitionAt = Date.now();
});

const MEETING_URLS = [
  "*://meet.google.com/*",
  "*://*.zoom.us/*",
  "*://teams.microsoft.com/*",
  "*://teams.live.com/*"
];

const originsFor = (domain) => [`*://${domain}/*`, `*://*.${domain}/*`];

// ---------- small helpers ----------

function dateKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function minutesOfDay(hhmm) {
  const [h, m] = String(hhmm || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function nowMinutes(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

function isWorkTime(settings, d = new Date()) {
  if (!settings.workDays.includes(d.getDay())) return false;
  const n = nowMinutes(d);
  return n >= minutesOfDay(settings.workStart) && n < minutesOfDay(settings.workEnd);
}

async function getSettings() {
  const { settings } = await chrome.storage.local.get("settings");
  const s = settings || {};
  const merged = {
    ...DEFAULT_SETTINGS,
    ...s,
    sites: { ...DEFAULT_SETTINGS.sites, ...(s.sites || {}) },
    activities: { ...DEFAULT_SETTINGS.activities, ...(s.activities || {}) },
    customSites: Array.isArray(s.customSites) ? s.customSites : [],
    workDays: Array.isArray(s.workDays) ? s.workDays : DEFAULT_SETTINGS.workDays
  };
  // Carry over settings from version 1.x.
  if (s.moveEvery === undefined && typeof s.breakEvery === "number") {
    merged.moveOn = s.breakEvery > 0;
    merged.moveEvery = s.breakEvery > 0 ? s.breakEvery : DEFAULT_SETTINGS.moveEvery;
  }
  if (merged.breakMode === "open") merged.breakMode = "window";
  delete merged.breakEvery;
  delete merged.lastBreakEvery;
  return merged;
}

// ---------- install / startup ----------

async function setup() {
  const settings = await getSettings();
  const { installDate } = await chrome.storage.local.get("installDate");
  await chrome.storage.local.set({ settings, installDate: installDate || dateKey() });
  chrome.alarms.clear("break");                       // old v1 alarm
  chrome.alarms.create("tick", { periodInMinutes: 1 });
  await syncCustomSites(settings);
}

chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);

// ---------- Focus Guard: custom sites ----------

async function syncCustomSites(settings) {
  try {
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: ["sg-custom"] });
    if (existing.length) await chrome.scripting.unregisterContentScripts({ ids: ["sg-custom"] });

    const granted = [];
    for (const d of settings.customSites) {
      if (await chrome.permissions.contains({ origins: originsFor(d) })) granted.push(d);
    }
    if (!granted.length) return;

    await chrome.scripting.registerContentScripts([{
      id: "sg-custom",
      matches: granted.flatMap(originsFor),
      js: ["content.js"],
      runAt: "document_start"
    }]);
  } catch (err) {
    console.error("Custom sites error:", err);
  }
}

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local" || !changes.settings) return;
  const before = changes.settings.oldValue || {};
  const after = changes.settings.newValue || {};
  if (JSON.stringify(before.customSites || []) !== JSON.stringify(after.customSites || [])) {
    syncCustomSites(await getSettings());
  }
});

// ---------- stats ----------
// All writes go through one queue so nothing overwrites anything else.

let writeQueue = Promise.resolve();

function updateDay(fn) {
  writeQueue = writeQueue.then(async () => {
    const { stats = {} } = await chrome.storage.local.get("stats");
    const key = dateKey();
    const day = stats[key] || {};
    fn(day);
    stats[key] = day;
    const keys = Object.keys(stats).sort();
    while (keys.length > 60) delete stats[keys.shift()];
    await chrome.storage.local.set({ stats });
  }).catch((err) => console.error("Stats error:", err));
  return writeQueue;
}

const bump = (field, amount = 1) => updateDay((d) => { d[field] = (d[field] || 0) + amount; });

// Live state for today: minutes since last break, etc.
async function getLive() {
  const { live } = await chrome.storage.local.get("live");
  const today = dateKey();
  if (!live || live.date !== today) {
    return { date: today, stretch: 0, sinceMicro: 0, idleRun: 0, deferred: null,
             moveSnoozeUntil: 0, microSnoozeUntil: 0, lunchShown: false, wrapShown: false,
             moveWaitSince: null, microWaitSince: null };
  }
  return live;
}

const setLive = (live) => chrome.storage.local.set({ live });

// ---------- activity rotation ----------

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let pickQueue = Promise.resolve();

function nextActivity(kind) {
  const run = pickQueue.then(async () => {
    const settings = await getSettings();
    let ids = availableActivities(settings, kind).map((a) => a.id);
    if (!ids.length) ids = [kind === "micro" ? "eyes" : "breathe"];

    const bagKey = "bag:" + kind;
    const lastKey = "last:" + kind;
    const data = await chrome.storage.local.get([bagKey, lastKey]);
    let bag = (data[bagKey] || []).filter((id) => ids.includes(id));
    if (!bag.length) {
      bag = shuffle(ids);
      if (bag.length > 1 && bag[0] === data[lastKey]) bag.push(bag.shift());
    }
    const id = bag.shift();
    await chrome.storage.local.set({ [bagKey]: bag, [lastKey]: id });
    return id;
  });
  pickQueue = run.catch(() => {});
  return run;
}

// ---------- meetings and pauses ----------

async function inMeeting(settings) {
  if (!settings.meetingDetect) return false;
  try {
    const tabs = await chrome.tabs.query({ url: MEETING_URLS });
    return tabs.some((t) => {
      const url = t.url || "";
      // Meet/Zoom URLs here are specific enough (a meeting code, or /wc//j/) that we
      // trust the URL alone — including the pre-join lobby, which we'd rather treat as
      // "in a call" than risk a break popping up the moment someone joins. Teams tabs stay
      // open for chat too, so for those we also require audio as a stronger signal.
      if (/^https?:\/\/meet\.google\.com\/[a-z]{3,4}-[a-z]{4}-[a-z]{3,4}/.test(url)) return true; // in a Meet call
      if (/zoom\.us\/(wc|j)\//.test(url)) return true;                                      // Zoom web client
      if (/teams\.(microsoft|live)\.com/.test(url) && t.audible) return true;                // Teams call with sound
      return false;
    });
  } catch (e) {
    return false;
  }
}

async function isPaused() {
  const { pausedUntil = 0 } = await chrome.storage.local.get("pausedUntil");
  return Date.now() < pausedUntil;
}

// ---------- showing an activity ----------

function breakUrl(id, extra = {}) {
  const q = new URLSearchParams({ a: id, ...extra });
  return chrome.runtime.getURL("break.html?" + q.toString());
}

async function openWindow(url) {
  // Never let a window-creation hiccup bubble up and abort the caller
  // (the minute tick, in particular, must still save its live state).
  try {
    // Reuse the activity window if one is already open.
    const { activityWindow } = await chrome.storage.local.get("activityWindow");
    if (activityWindow) {
      const existing = await chrome.windows.get(activityWindow, { populate: true }).catch(() => null);
      if (existing && existing.tabs && existing.tabs.length) {
        await chrome.tabs.update(existing.tabs[0].id, { url });
        chrome.windows.update(activityWindow, { focused: true, drawAttention: true });
        return;
      }
    }

    const base = await chrome.windows.getLastFocused({ windowTypes: ["normal"] }).catch(() => null);
    const opts = { url, type: "popup", focused: true, ...WINDOW_SIZE };
    if (base && base.width && base.state !== "minimized") {
      opts.left = Math.max(0, Math.round(base.left + (base.width - WINDOW_SIZE.width) / 2));
      opts.top = Math.max(0, Math.round(base.top + (base.height - WINDOW_SIZE.height) / 2));
    }
    const win = await chrome.windows.create(opts);
    await chrome.storage.local.set({ activityWindow: win.id });
  } catch (err) {
    console.error("openWindow error:", err);
  }
}

chrome.windows.onRemoved.addListener(async (id) => {
  const { activityWindow } = await chrome.storage.local.get("activityWindow");
  if (activityWindow === id) chrome.storage.local.remove("activityWindow");
});

async function showActivity(kind, reason, forcedId) {
  const settings = await getSettings();
  const id = forcedId || (await nextActivity(kind));
  const activity = ACTIVITIES.find((a) => a.id === id) || ACTIVITIES[0];
  await chrome.storage.local.set({ pending: { id, kind, reason } });

  if (settings.breakMode === "window") {
    await openWindow(breakUrl(id, { kind, reason, auto: "1" }));
    return;
  }

  let title = `${activity.emoji} ${activity.title}`;
  if (reason === "meeting") title = `${activity.emoji} Meeting's over: ${activity.title.toLowerCase()}`;
  chrome.notifications.create("sg-activity", {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title,
    message: activity.nudge,
    buttons: [{ title: "Start" }, { title: `Remind me in ${SNOOZE_MINUTES} min` }],
    priority: 1
  });
}

// ---------- the minute tick ----------

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "tick") return;

  const settings = await getSettings();
  const live = await getLive();
  const state = await chrome.idle.queryState(IDLE_SECONDS);
  const now = new Date();
  const working = isWorkTime(settings, now);

  try {
    // 1. Count screen time and how long since the last break.
    if (state === "active") {
      live.idleRun = 0;
      live.stretch += 1;
      live.sinceMicro += 1;
      const stretch = live.stretch;
      updateDay((d) => {
        d.active = (d.active || 0) + 1;
        d.longest = Math.max(d.longest || 0, stretch);
      });
    } else {
      live.idleRun += 1;
      if (live.idleRun >= AWAY_RESET_MINUTES || state === "locked") {
        // Being away from the screen is a break in itself.
        live.stretch = 0;
        live.sinceMicro = 0;
        live.deferred = null;
      }
    }

    // 2. Lunch and end-of-day nudges. Checked on the clock alone, not on the idle
    // state: someone reading, on a desktop-app call, or just sitting still for a
    // few minutes would otherwise never be seen as "active" during the window, and
    // a one-time nudge would be silently lost for the day.
    const n = nowMinutes(now);
    const workday = settings.workDays.includes(now.getDay());
    if (workday && settings.lunchOn && !live.lunchShown) {
      const lunch = minutesOfDay(settings.lunchTime);
      if (n >= lunch && n < lunch + 60) {
        live.lunchShown = true;
        chrome.notifications.create("sg-lunch", {
          type: "basic",
          iconUrl: "icons/icon128.png",
          title: "🍱 Lunch time",
          message: "Step away from the screen for lunch. Eating at your desk doesn't count as a break.",
          priority: 1
        });
      }
    }
    if (workday && settings.wrapUpOn && !live.wrapShown) {
      const end = minutesOfDay(settings.workEnd);
      if (n >= end && n < end + 120) {
        live.wrapShown = true;
        const { stats = {} } = await chrome.storage.local.get("stats");
        if (((stats[dateKey()] || {}).active || 0) >= 60) {
          await openWindow(chrome.runtime.getURL("summary.html"));
        }
      }
    }

    // 3. Decide whether an activity is due.
    if (working && state === "active" && !(await isPaused())) {
      const t = Date.now();
      const moveDue = settings.moveOn && live.stretch >= settings.moveEvery && t >= live.moveSnoozeUntil;
      const microDue = settings.microOn && live.sinceMicro >= settings.microEvery && t >= live.microSnoozeUntil;

      if (await inMeeting(settings)) {
        // Never interrupt a call. Remember what was due and offer it afterwards.
        if (moveDue) live.deferred = "move";
        else if (microDue && !live.deferred) live.deferred = "micro";
        live.moveWaitSince = null;
        live.microWaitSince = null;
      } else if (live.deferred) {
        const kind = live.deferred;
        live.deferred = null;
        if (kind === "move") live.moveSnoozeUntil = t + SNOOZE_MINUTES * 60000;
        live.sinceMicro = 0;
        await showActivity(kind, "meeting");
      } else if (moveDue) {
        // Natural-pause delivery: hold it briefly, hoping for a tab/window switch
        // (a likely transition) — but never longer than NATURAL_PAUSE_WAIT_MS, so
        // it can't disappear indefinitely during one long continuous stretch.
        if (!live.moveWaitSince) live.moveWaitSince = t;
        const sawTransition = lastTransitionAt >= live.moveWaitSince;
        const waitedLongEnough = t - live.moveWaitSince >= NATURAL_PAUSE_WAIT_MS;
        if (sawTransition || waitedLongEnough) {
          // Ask again in 10 minutes if it's ignored; finishing it resets the clock.
          live.moveSnoozeUntil = t + SNOOZE_MINUTES * 60000;
          live.sinceMicro = 0;
          live.moveWaitSince = null;
          await showActivity("move", "timer");
        }
      } else if (microDue) {
        // Skip a micro-break when a movement break is only a few minutes away.
        const moveSoon = settings.moveOn && settings.moveEvery - live.stretch <= 5;
        if (moveSoon) {
          live.sinceMicro = 0;
          live.microWaitSince = null;
        } else {
          if (!live.microWaitSince) live.microWaitSince = t;
          const sawTransition = lastTransitionAt >= live.microWaitSince;
          const waitedLongEnough = t - live.microWaitSince >= NATURAL_PAUSE_WAIT_MS;
          if (sawTransition || waitedLongEnough) {
            live.sinceMicro = 0;
            live.microWaitSince = null;
            await showActivity("micro", "timer");
          }
        }
      } else {
        live.moveWaitSince = null;
        live.microWaitSince = null;
      }
    } else {
      live.moveWaitSince = null;
      live.microWaitSince = null;
    }
  } catch (err) {
    console.error("Tick error:", err);
  } finally {
    // Always persist live state, even if something above threw — otherwise a
    // transient failure (e.g. window creation) would leave snooze/reset state
    // unsaved and the same break could get stuck retrying every minute.
    await setLive(live);
  }
});

// ---------- notifications ----------

async function startPending() {
  const { pending } = await chrome.storage.local.get("pending");
  if (pending) {
    await openWindow(breakUrl(pending.id, { kind: pending.kind, reason: pending.reason || "timer", auto: "1" }));
  }
  chrome.notifications.clear("sg-activity");
}

async function snooze(kind) {
  const settings = await getSettings();
  const live = await getLive();
  const until = Date.now() + SNOOZE_MINUTES * 60000;
  if (kind === "move") {
    live.moveSnoozeUntil = until;
    live.stretch = Math.max(live.stretch, settings.moveEvery); // stays due, comes back after the snooze
  } else {
    live.microSnoozeUntil = until;
    live.sinceMicro = Math.max(live.sinceMicro, settings.microEvery);
  }
  await setLive(live);
}

chrome.notifications.onClicked.addListener((id) => {
  if (id === "sg-activity") startPending();
  else chrome.notifications.clear(id);
});

chrome.notifications.onButtonClicked.addListener(async (id, index) => {
  if (id !== "sg-activity") return;
  if (index === 0) startPending();
  else {
    const { pending } = await chrome.storage.local.get("pending");
    await snooze((pending && pending.kind) || "move");
    chrome.notifications.clear("sg-activity");
  }
});

// ---------- messages from pages ----------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case "closeTab":
        if (sender.tab) chrome.tabs.remove(sender.tab.id).catch(() => {});
        return {};

      case "openBreak": {
        // From Focus Guard's pause screen (replace that tab) or the popup (new window).
        const kind = msg.kind || "move";
        const id = await nextActivity(kind);
        if (sender.tab && !msg.newWindow) {
          await chrome.tabs.update(sender.tab.id, { url: breakUrl(id, { kind, reason: "focus" }) });
        } else {
          await openWindow(breakUrl(id, { kind, reason: "manual" }));
        }
        return { ok: true };
      }

      case "nextActivity":
        return { id: await nextActivity(msg.kind || "move") };

      case "snooze":
        await snooze(msg.kind || "move");
        return { ok: true };

      case "breakDone": {
        const kind = msg.kind || "move";
        await updateDay((d) => {
          d.breaks = (d.breaks || 0) + 1;
          d[kind] = (d[kind] || 0) + 1;
          d.activities = d.activities || {};
          d.activities[msg.activity] = (d.activities[msg.activity] || 0) + 1;
        });
        const live = await getLive();
        live.sinceMicro = 0;
        live.microSnoozeUntil = 0;
        if (kind === "move") {
          live.stretch = 0;
          live.moveSnoozeUntil = 0;
        }
        await setLive(live);
        return { ok: true };
      }

      case "pause": {
        // minutes: number, or "day" for the rest of today, or 0 to resume.
        let until = 0;
        if (msg.minutes === "day") {
          const d = new Date();
          d.setHours(23, 59, 0, 0);
          until = d.getTime();
        } else if (msg.minutes > 0) {
          until = Date.now() + msg.minutes * 60000;
        }
        await chrome.storage.local.set({ pausedUntil: until });
        return { ok: true, until };
      }

      case "status": {
        const settings = await getSettings();
        const live = await getLive();
        const { pausedUntil = 0 } = await chrome.storage.local.get("pausedUntil");
        return {
          live,
          pausedUntil,
          working: isWorkTime(settings),
          meeting: await inMeeting(settings)
        };
      }

      case "preview":
        // Settings page "Try it" buttons.
        await showActivity(msg.kind || "move", "preview");
        return { ok: true };

      case "bump":
        // Focus Guard minutes and pause-screen counts.
        await bump(msg.field, msg.amount);
        return { ok: true };
    }
    return {};
  })().then(sendResponse, () => sendResponse({}));
  return true;
});
