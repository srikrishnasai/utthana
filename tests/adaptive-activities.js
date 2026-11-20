// Verifies adaptive activity selection (vision doc §11): accept/skip history
// nudges which activities tend to come up earlier in the shuffle bag, but
// can never remove one from rotation or let a favorite dominate — variety is
// a structural guarantee, not a hope. Run: node tests/adaptive-activities.js
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const ROOT = path.join(__dirname, "..");
const bgSrc = fs.readFileSync(path.join(ROOT, "background.js"), "utf8");
const activitiesSrc = fs.readFileSync(path.join(ROOT, "activities.js"), "utf8");

const results = [];
const check = (name, ok, detail) => results.push([name, ok, detail]);

// ---------- Part A: pure functions, via a vm sandbox ----------
// background.js's top level registers chrome.* listeners immediately, so it
// needs a minimal stub to evaluate at all — Part A only wants the two pure
// functions it defines along the way.

function loadPureFunctions() {
  const sandbox = {
    importScripts: () => {
      vm.runInContext(
        activitiesSrc.replace("const ACTIVITIES", "global.ACTIVITIES").replace("function availableActivities", "global.availableActivities = function"),
        sandbox
      );
    },
    chrome: {
      runtime: { onInstalled: { addListener() {} }, onStartup: { addListener() {} }, onMessage: { addListener() {} } },
      storage: { local: { get: async () => ({}) }, onChanged: { addListener() {} } },
      alarms: { onAlarm: { addListener() {} } },
      notifications: { onClicked: { addListener() {} }, onButtonClicked: { addListener() {} } },
      tabs: { onActivated: { addListener() {} } },
      windows: { onRemoved: { addListener() {} }, onFocusChanged: { addListener() {}, }, WINDOW_ID_NONE: -1 }
    }
  };
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(bgSrc, sandbox);
  return sandbox;
}

{
  const { activityWeight, weightedShuffle } = loadPureFunctions();

  // A1: weight is bounded to [0.4, 1.6] and moves the right direction.
  const wNone = activityWeight(undefined);
  const wGoodHistory = activityWeight({ accepted: 10, skipped: 0 });
  const wBadHistory = activityWeight({ accepted: 0, skipped: 10 });
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  check("no history -> neutral weight (1)", near(wNone, 1), wNone);
  check("heavily accepted -> higher weight, capped at 1.6", near(wGoodHistory, 1.6), wGoodHistory);
  check("heavily skipped -> lower weight, floored at 0.4", near(wBadHistory, 0.4), wBadHistory);

  // A2: weightedShuffle is a true permutation — every id appears exactly
  // once, regardless of how extreme the weights are.
  const ids = ["a", "b", "c", "d", "e"];
  const extremeWeights = { a: 50, b: 0.4, c: 1, d: 1, e: 1 };
  let allPermutations = true;
  for (let i = 0; i < 50; i++) {
    const order = weightedShuffle(ids, extremeWeights);
    const sorted = [...order].sort().join(",");
    if (sorted !== "a,b,c,d,e" || order.length !== 5) allPermutations = false;
  }
  check("weightedShuffle always returns every id exactly once", allPermutations);

  // A3: statistical bias — a heavily-favored id should come up first
  // noticeably more than uniform chance (20% with 5 ids), but this must
  // never be read as a guarantee, only a lean.
  let firstCount = 0;
  const trials = 1000;
  for (let i = 0; i < trials; i++) {
    if (weightedShuffle(ids, extremeWeights)[0] === "a") firstCount++;
  }
  const rate = firstCount / trials;
  check(`a heavily-favored activity is picked first well above uniform chance (${(rate * 100).toFixed(0)}% vs 20% uniform)`, rate > 0.45);
}

// ---------- Part B: end-to-end via background.js's message handlers ----------

function setupEnv() {
  const store = {};
  const L = {};
  const ev = (n) => ({ addListener(f) { (L[n] = L[n] || []).push(f); } });
  let fakeNow = new Date(2026, 9, 7, 10, 0, 0).getTime();
  const RealDate = Date;
  global.Date = class extends RealDate {
    constructor(...a) { super(...(a.length ? a : [fakeNow])); }
    static now() { return fakeNow; }
  };
  global.importScripts = (f) => {
    eval(fs.readFileSync(path.join(ROOT, f), "utf8").replace("const ACTIVITIES", "global.ACTIVITIES").replace("function availableActivities", "global.availableActivities = function"));
  };
  global.chrome = {
    runtime: { getURL: (p) => p, onInstalled: ev("inst"), onStartup: ev("start"), onMessage: ev("msg") },
    storage: {
      local: {
        get: async (k) => { const o = {}; [].concat(k).forEach((x) => { if (x in store) o[x] = JSON.parse(JSON.stringify(store[x])); }); return o; },
        set: async (o) => Object.assign(store, JSON.parse(JSON.stringify(o))),
        remove: async (k) => { [].concat(k).forEach((x) => delete store[x]); }
      },
      onChanged: ev("chg")
    },
    alarms: { onAlarm: ev("alarm"), clear() {}, create() {} },
    notifications: { onClicked: ev("nc"), onButtonClicked: ev("nb"), create() {} },
    idle: { queryState: async () => "active" },
    tabs: { query: async () => [], update: async () => {}, onActivated: ev("tabActivated") },
    permissions: { contains: async () => true },
    scripting: { getRegisteredContentScripts: async () => [], unregisterContentScripts: async () => {}, registerContentScripts: async () => {} },
    windows: {
      get: async () => null, getLastFocused: async () => null, update: async () => {},
      create: async () => ({ id: 1 }), onRemoved: ev("wr"), onFocusChanged: ev("focusChanged"), WINDOW_ID_NONE: -1
    }
  };
  eval(bgSrc);
  const msg = (m) => new Promise((r) => L.msg[0](m, {}, r));
  return { ready: () => L.inst[0](), msg, store };
}

(async () => {
  // B1: breakDone records an "accepted" tally for that activity.
  {
    const env = await setupEnv();
    await env.ready();
    await env.msg({ type: "breakDone", activity: "water", kind: "move" });
    await env.msg({ type: "breakDone", activity: "water", kind: "move" });
    const stat = env.store.activityStats && env.store.activityStats.water;
    check("breakDone increments accepted count", !!stat && stat.accepted === 2, JSON.stringify(stat));
  }

  // B2: "Not now" (activitySkipped) and swapping away from an activity (the
  // `skipped` field on nextActivity) both record a "skipped" tally.
  {
    const env = await setupEnv();
    await env.ready();
    await env.msg({ type: "activitySkipped", activity: "stretch", kind: "move" });
    await env.msg({ type: "nextActivity", kind: "move", skipped: "stretch" });
    const stat = env.store.activityStats && env.store.activityStats.stretch;
    check("activitySkipped + nextActivity's skipped field both record skips", !!stat && stat.skipped === 2, JSON.stringify(stat));
  }

  // B3: resetActivityPrefs clears the whole tally.
  {
    const env = await setupEnv();
    await env.ready();
    await env.msg({ type: "breakDone", activity: "water", kind: "move" });
    await env.msg({ type: "resetActivityPrefs" });
    check("resetActivityPrefs clears activityStats", !("activityStats" in env.store));
  }

  // B4: variety is preserved even after heavily skipping one activity many
  // times — every enabled movement activity must still show up within a
  // bounded number of picks (never permanently excluded).
  {
    const env = await setupEnv();
    await env.ready();
    for (let i = 0; i < 20; i++) {
      await env.msg({ type: "activitySkipped", activity: "water", kind: "move" });
    }
    const seen = new Set();
    for (let i = 0; i < 60; i++) {
      const res = await env.msg({ type: "nextActivity", kind: "move" });
      seen.add(res.id);
    }
    check("a heavily-skipped activity still appears in rotation (variety preserved)", seen.has("water"), [...seen].join(","));
  }

  const all = [];
  results.forEach(([name, ok, detail]) => {
    console.log(`${ok ? "yes" : "NO"}: ${name}${ok || detail === undefined ? "" : `  (${detail})`}`);
    all.push(ok);
  });
  const pass = all.every(Boolean);
  console.log(pass ? "\nPASS" : "\nFAIL");
  process.exitCode = pass ? 0 : 1;
})();
