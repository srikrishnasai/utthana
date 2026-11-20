// Verifies the workday timeline: background.js logs state changes (not one
// entry per tick) and point marks from signals it already has, and
// summary.js's buildTimelineRows() turns that raw log into a readable,
// deduplicated list. Run: node tests/workday-timeline.js
const path = require("path");
const fs = require("fs");
const ROOT = path.join(__dirname, "..");
const bgSrc = fs.readFileSync(path.join(ROOT, "background.js"), "utf8");
const activitiesSrc = fs.readFileSync(path.join(ROOT, "activities.js"), "utf8");
const summarySrc = fs.readFileSync(path.join(ROOT, "summary.js"), "utf8");

// ---------- Part A: background.js instrumentation ----------

function setupEnv() {
  const store = {};
  const L = {};
  const ev = (n) => ({ addListener(f) { (L[n] = L[n] || []).push(f); } });
  let idle = "active";
  let meetingTabs = [];
  let fakeNow = new Date(2026, 9, 7, 10, 0, 0).getTime(); // a Wednesday, within default 09:30-18:30
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
    notifications: { onClicked: ev("nc"), onButtonClicked: ev("nb"), create() {} },
    idle: { queryState: async () => idle },
    tabs: { query: async () => meetingTabs, update: async () => {}, onActivated: ev("tabActivated") },
    permissions: { contains: async () => true },
    scripting: { getRegisteredContentScripts: async () => [], unregisterContentScripts: async () => {}, registerContentScripts: async () => {} },
    windows: {
      get: async () => null,
      getLastFocused: async () => ({ left: 0, top: 0, width: 1400, height: 900, state: "normal" }),
      update: async () => {},
      create: async () => ({ id: ++winId }),
      onRemoved: ev("wr"),
      onFocusChanged: ev("focusChanged"),
      WINDOW_ID_NONE: -1
    }
  };
  eval(bgSrc);

  async function ready(settingsOverride) {
    await L.inst[0]();
    const { settings } = await chrome.storage.local.get("settings");
    await chrome.storage.local.set({ settings: { ...settings, ...settingsOverride } });
  }
  async function tick() {
    fakeNow += 60000;
    await L.alarm[0]({ name: "tick" });
    await new Promise((r) => setTimeout(r, 5));
  }
  const msg = (m) => new Promise((r) => L.msg[0](m, {}, r));
  return {
    ready, tick, msg,
    setIdle: (v) => { idle = v; },
    startMeeting: () => { meetingTabs = [{ url: "https://meet.google.com/abc-defg-hij" }]; },
    endMeeting: () => { meetingTabs = []; },
    setFakeNow: (ms) => { fakeNow = ms; },
    getTimeline: async () => {
      const { stats = {} } = await chrome.storage.local.get("stats");
      const key = `${new Date(fakeNow).getFullYear()}-${String(new Date(fakeNow).getMonth() + 1).padStart(2, "0")}-${String(new Date(fakeNow).getDate()).padStart(2, "0")}`;
      return (stats[key] || {}).timeline || [];
    }
  };
}

async function runPartA() {
  const results = [];

  // A1: active -> meeting -> active logs exactly 3 state entries, no per-tick spam.
  {
    const env = setupEnv();
    await env.ready({ meetingDetect: true });
    await env.tick(); await env.tick(); await env.tick(); // active
    env.startMeeting();
    await env.tick(); await env.tick(); // meeting
    env.endMeeting();
    await env.tick(); await env.tick(); await env.tick(); // active again
    const tl = await env.getTimeline();
    const states = tl.filter((e) => e.type === "state").map((e) => e.state);
    const ok = states.length === 3 && states[0] === "active" && states[1] === "meeting" && states[2] === "active";
    results.push(["active->meeting->active logs exactly 3 state changes", ok, states.join(",")]);
  }

  // A2: idle (not locked, just no input) logs an "idle" state.
  {
    const env = setupEnv();
    await env.ready({});
    await env.tick();
    env.setIdle("idle");
    await env.tick(); await env.tick();
    env.setIdle("active");
    await env.tick();
    const tl = await env.getTimeline();
    const states = tl.filter((e) => e.type === "state").map((e) => e.state);
    const ok = states.includes("idle");
    results.push(["idle is logged as its own state", ok, states.join(",")]);
  }

  // A3: an active Focus Guard session is detected and logged as "focusguard",
  // using only the known built-in/custom site list (no wildcard storage scan).
  {
    const env = setupEnv();
    await env.ready({});
    await env.tick();
    await chrome.storage.local.set({ "session:instagram.com": { end: Date.now() + 5 * 60000, extended: false, intent: "test" } });
    await env.tick(); await env.tick();
    const tl = await env.getTimeline();
    const states = tl.filter((e) => e.type === "state").map((e) => e.state);
    results.push(["an active Focus Guard session logs \"focusguard\"", states.includes("focusguard"), states.join(",")]);
  }

  // A4: breakDone adds a mark with the activity id; lunch adds a "lunch" mark.
  {
    const env = setupEnv();
    await env.ready({ lunchTime: "10:05" });
    await env.tick();
    await env.msg({ type: "breakDone", activity: "water", kind: "move" });
    env.setFakeNow(new Date(2026, 9, 7, 10, 4, 0).getTime());
    await env.tick(); // crosses into the lunch window
    const tl = await env.getTimeline();
    const marks = tl.filter((e) => e.type === "mark");
    const hasBreak = marks.some((m) => m.label === "move" && m.extra === "water");
    const hasLunch = marks.some((m) => m.label === "lunch");
    results.push(["breakDone logs a move mark with the activity id", hasBreak, JSON.stringify(marks)]);
    results.push(["lunch window logs a lunch mark", hasLunch, JSON.stringify(marks)]);
  }

  // A5: outside work hours, nothing is logged at all.
  {
    const env = setupEnv();
    await env.ready({});
    env.setFakeNow(new Date(2026, 9, 7, 22, 0, 0).getTime()); // 10pm, outside 09:30-18:30
    await env.tick(); await env.tick(); await env.tick();
    const tl = await env.getTimeline();
    results.push(["nothing logged outside work hours", tl.length === 0, JSON.stringify(tl)]);
  }

  return results;
}

// ---------- Part B: summary.js's buildTimelineRows ----------

function runPartB() {
  // Just enough of a DOM/chrome stub that summary.js's top-level IIFE runs
  // harmlessly to completion — Part B only wants buildTimelineRows() itself.
  const stubEl = () => ({ addEventListener() {}, focus() {}, set textContent(_) {}, get textContent() { return ""; } });
  const sandbox = {
    document: { getElementById: stubEl },
    chrome: {
      storage: { local: { get: async () => ({}) } },
      tabs: { getCurrent: async () => null, remove: async () => {} }
    }
  };
  sandbox.window = sandbox;
  const vm = require("vm");
  vm.createContext(sandbox);
  vm.runInContext(summarySrc, sandbox);
  const { buildTimelineRows } = sandbox;

  const results = [];
  const base = new Date(2026, 9, 7, 9, 0, 0).getTime();
  const min = 60000;

  // B1: basic segments render with the right labels and time ranges.
  {
    const timeline = [
      { type: "state", state: "active", t: base },
      { type: "state", state: "meeting", t: base + 30 * min },
      { type: "state", state: "active", t: base + 60 * min }
    ];
    const rows = buildTimelineRows(timeline, base + 90 * min);
    const ok = rows.length === 3 && rows[0].label === "Active" && rows[1].label === "Meeting" && rows[2].label === "Active";
    results.push(["builds one row per state change", ok, JSON.stringify(rows)]);
  }

  // B2: a blip shorter than MIN_SEGMENT_MS merges into the previous segment
  // instead of showing as its own row.
  {
    const timeline = [
      { type: "state", state: "active", t: base },
      { type: "state", state: "idle", t: base + 20 * min },
      { type: "state", state: "active", t: base + 21 * min } // 1-minute blip
    ];
    const rows = buildTimelineRows(timeline, base + 40 * min);
    const ok = rows.length === 1 && rows[0].label === "Active";
    results.push(["a short blip merges into the surrounding segment", ok, JSON.stringify(rows)]);
  }

  // B3: marks are interleaved with state segments in chronological order.
  {
    const timeline = [
      { type: "state", state: "active", t: base },
      { type: "mark", label: "micro", t: base + 10 * min },
      { type: "state", state: "active", t: base + 11 * min }
    ];
    const rows = buildTimelineRows(timeline, base + 20 * min);
    const markIdx = rows.findIndex((r) => r.isMark);
    const ok = markIdx > 0 && rows[markIdx].label === "Micro break";
    results.push(["marks interleave chronologically with segments", ok, JSON.stringify(rows)]);
  }

  // B4: empty timeline -> no rows.
  {
    const rows = buildTimelineRows([], base);
    results.push(["empty timeline produces no rows", rows.length === 0, JSON.stringify(rows)]);
  }

  return results;
}

(async () => {
  const resultsA = await runPartA();
  const resultsB = runPartB();
  const all = [...resultsA, ...resultsB];
  all.forEach(([name, ok, detail]) => console.log(`${ok ? "yes" : "NO"}: ${name}${ok ? "" : `  (${detail})`}`));
  const pass = all.every(([, ok]) => ok);
  console.log(pass ? "\nPASS" : "\nFAIL");
  process.exitCode = pass ? 0 : 1;
})();
