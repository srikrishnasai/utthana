// Verifies "natural-pause delivery": once a break is due, background.js holds
// it briefly hoping for a tab/window-switch signal (a likely transition), but
// never withholds it past NATURAL_PAUSE_WAIT_MS — it must always show
// eventually even if no transition ever happens.
// Run: node tests/natural-pause.js
const path = require("path");
const fs = require("fs");
const ROOT = path.join(__dirname, "..");
const bgSrc = fs.readFileSync(path.join(ROOT, "background.js"), "utf8");
const activitiesSrc = fs.readFileSync(path.join(ROOT, "activities.js"), "utf8");

// Builds one fresh mocked-Chrome environment and evals background.js into it.
// Returns helpers to drive fake time and read how many break windows have
// been shown so far. Each call is its own isolated background.js instance.
function setupEnv() {
  const log = [];
  const store = {};
  const L = {};
  const ev = (n) => ({ addListener(f) { (L[n] = L[n] || []).push(f); } });
  let idle = "active";
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
    tabs: { query: async () => [], update: async () => {}, onActivated: ev("tabActivated") },
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
    // Short, deterministic micro-break interval; movement/meetings disabled so
    // only the mechanism under test (micro-break natural-pause wait) is exercised.
    await chrome.storage.local.set({
      settings: { ...settings, microOn: true, microEvery: 3, moveOn: false, meetingDetect: false }
    });
  }
  async function tick() {
    fakeNow += 60000;
    await L.alarm[0]({ name: "tick" });
    await new Promise((r) => setTimeout(r, 5));
  }
  return { ready, tick, fireTransition: () => L.tabActivated[0](), shownCount: () => log.length };
}

(async () => {
  // Scenario A: a transition fires right after the break becomes due -> shows
  // almost immediately, well inside the 3-minute bound.
  const a = setupEnv();
  await a.ready();
  await a.tick(); await a.tick(); await a.tick(); // minute 3: sinceMicro hits 3, due, starts waiting
  a.fireTransition();
  await a.tick(); // minute 4
  const fastPathShown = a.shownCount() > 0;
  console.log(`transition right after due -> shown within 1 tick: ${fastPathShown ? "yes" : "NO"}`);

  // Scenario B: no transition ever fires -> must still show once the bound
  // (NATURAL_PAUSE_WAIT_MS = 3 minutes) elapses, never indefinitely.
  const b = setupEnv();
  await b.ready();
  const snapshots = [];
  for (let i = 0; i < 7; i++) {
    await b.tick();
    snapshots.push(b.shownCount());
  }
  // Due at tick 3. No transition ever fires, so it must stay unshown through
  // the wait (ticks 4-5) and be shown by tick 6 (3 + bound of 3 more minutes).
  const heldDuringWait = snapshots[3] === 0 && snapshots[4] === 0;
  const shownByBound = snapshots[5] >= 1 || snapshots[6] >= 1;
  console.log(`held while waiting (no transition), ticks 4-5: ${heldDuringWait ? "yes" : "NO"}`);
  console.log(`shown once the bound elapses: ${shownByBound ? "yes" : "NO"}`);
  console.log(`tick-by-tick shown-count: ${snapshots.join(",")}`);

  const ok = fastPathShown && heldDuringWait && shownByBound;
  console.log(ok ? "\nPASS" : "\nFAIL");
  process.exitCode = ok ? 0 : 1;
})();
