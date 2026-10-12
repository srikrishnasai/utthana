// Verifies the post-meeting settling period: once a call ends, a deferred
// break is held briefly (POST_MEETING_SETTLE_MS) rather than firing the
// instant the call ends, but still shows quickly on a transition signal, and
// never waits past the bound either way.
// Run: node tests/post-meeting-settle.js
const path = require("path");
const fs = require("fs");
const ROOT = path.join(__dirname, "..");
const bgSrc = fs.readFileSync(path.join(ROOT, "background.js"), "utf8");
const activitiesSrc = fs.readFileSync(path.join(ROOT, "activities.js"), "utf8");

// Builds one fresh mocked-Chrome environment and evals background.js into it.
function setupEnv() {
  const log = [];
  const store = {};
  const L = {};
  const ev = (n) => ({ addListener(f) { (L[n] = L[n] || []).push(f); } });
  let idle = "active";
  let meetingTabs = [];
  let fakeNow = new Date(2026, 9, 7, 10, 0, 0).getTime();
  const RealDate = Date;
  global.Date = class extends RealDate {
    constructor(...a) { super(...(a.length ? a : [fakeNow])); }
    static now() { return fakeNow; }
  };
  let winId = 0;
  global.importScripts = () => {
    eval(activitiesSrc.replace("const ACTIVITIES", "global.ACTIVITIES").replace("function availableActivities", "global.availableActivities = function"));
  };
  global.chrome = {
    runtime: { getURL: (p) => p, onInstalled: ev("inst"), onStartup: ev("start"), onMessage: ev("msg") },
    storage: {
      local: {
        get: async (k) => { const o = {}; [].concat(k).forEach((x) => { if (x in store) o[x] = JSON.parse(JSON.stringify(store[x])); }); return o; },
        set: async (o) => Object.assign(store, JSON.parse(JSON.stringify(o))),
        remove: async (k) => { delete store[k]; }
      },
      onChanged: ev("chg")
    },
    alarms: { onAlarm: ev("alarm"), clear() {}, create() {} },
    notifications: { onClicked: ev("nc"), onButtonClicked: ev("nb"), create: (id, o) => log.push(o.title) },
    idle: { queryState: async () => idle },
    tabs: { query: async () => meetingTabs, update: async () => {}, onActivated: ev("tabActivated") },
    permissions: { contains: async () => true },
    scripting: { getRegisteredContentScripts: async () => [], unregisterContentScripts: async () => {}, registerContentScripts: async () => {} },
    windows: {
      get: async () => null,
      getLastFocused: async () => ({ left: 0, top: 0, width: 1400, height: 900, state: "normal" }),
      update: async () => {},
      create: async (o) => { log.push("WINDOW"); return { id: ++winId }; },
      onRemoved: ev("wr"),
      onFocusChanged: ev("focusChanged"),
      WINDOW_ID_NONE: -1
    }
  };
  eval(bgSrc);

  async function ready() {
    await L.inst[0]();
    const { settings } = await chrome.storage.local.get("settings");
    // Movement due almost immediately; meeting detection on, so a move break
    // reliably lands in the meeting-deferred queue for these scenarios.
    await chrome.storage.local.set({
      settings: { ...settings, moveOn: true, moveEvery: 2, microOn: false, meetingDetect: true }
    });
  }
  async function tick() {
    fakeNow += 60000;
    await L.alarm[0]({ name: "tick" });
    await new Promise((r) => setTimeout(r, 5));
  }
  return {
    ready, tick,
    startMeeting: () => { meetingTabs = [{ url: "https://meet.google.com/abc-defg-hij" }]; },
    endMeeting: () => { meetingTabs = []; },
    fireTransition: () => L.tabActivated[0](),
    shownCount: () => log.length
  };
}

(async () => {
  // Scenario A: meeting ends, no transition signal at all -> held during the
  // settle window, then shown once POST_MEETING_SETTLE_MS (90s) elapses.
  const a = setupEnv();
  await a.ready();
  await a.tick(); await a.tick();     // minute 2: move becomes due
  a.startMeeting();
  await a.tick();                     // due while in a meeting -> deferred
  a.endMeeting();
  const snapshots = [];
  for (let i = 0; i < 3; i++) {
    await a.tick();
    snapshots.push(a.shownCount());
  }
  const heldRightAfterMeeting = snapshots[0] === 0;
  const shownByBound = snapshots[1] >= 1 || snapshots[2] >= 1;
  console.log(`no transition: held immediately after meeting ends: ${heldRightAfterMeeting ? "yes" : "NO"}`);
  console.log(`no transition: shown once settle bound elapses: ${shownByBound ? "yes" : "NO"} (counts: ${snapshots.join(",")})`);

  // Scenario B: meeting ends, a transition fires right after -> shows fast,
  // without waiting for the full settle bound. (The transition must land
  // after the tick where the settle window actually starts — firing it in
  // the same breath as endMeeting() would predate that start timestamp.)
  const b = setupEnv();
  await b.ready();
  await b.tick(); await b.tick();
  b.startMeeting();
  await b.tick();
  b.endMeeting();
  await b.tick();     // settle window starts (postMeetingSince set this tick)
  b.fireTransition();
  await b.tick();
  const fastPathShown = b.shownCount() > 0;
  console.log(`transition right after meeting ends -> shown within 1 tick: ${fastPathShown ? "yes" : "NO"}`);

  // Scenario C: a new meeting starts during the settle window -> yields
  // immediately (stays deferred, nothing shown) rather than firing mid-call.
  const c = setupEnv();
  await c.ready();
  await c.tick(); await c.tick();
  c.startMeeting();
  await c.tick();
  c.endMeeting();
  await c.tick();      // 1 tick into the settle window, not yet shown
  c.startMeeting();    // a new call starts before it was shown
  await c.tick(); await c.tick(); await c.tick();
  const yieldedToNewMeeting = c.shownCount() === 0;
  console.log(`new meeting during settle window -> nothing shown: ${yieldedToNewMeeting ? "yes" : "NO"}`);

  const ok = heldRightAfterMeeting && shownByBound && fastPathShown && yieldedToNewMeeting;
  console.log(ok ? "\nPASS" : "\nFAIL");
  process.exitCode = ok ? 0 : 1;
})();
