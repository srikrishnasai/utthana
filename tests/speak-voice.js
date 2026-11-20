// Verifies break.js's "read steps aloud" feature only ever speaks through an
// on-device ("local") voice, and stays completely silent if none is
// installed — it must never fall back to a voice Chrome fetches from the
// network, which would break Utthana's "nothing leaves your device" promise.
// Run: node tests/speak-voice.js
const path = require("path");
const fs = require("fs");
const ROOT = path.join(__dirname, "..");

function makeEl() {
  return {
    hidden: false, textContent: "", title: "", className: "",
    classList: { toggle() {}, add() {}, remove() {} },
    style: {},
    addEventListener() {}, focus() {}, click() {}, onclick: null,
    appendChild() {}, querySelector() { return makeEl(); }
  };
}

const activitiesSrc = fs.readFileSync(path.join(ROOT, "activities.js"), "utf8");
const breakSrc = fs.readFileSync(path.join(ROOT, "break.js"), "utf8");

function run(name, speakSteps, voices) {
  const log = [];
  global.__record = (entry) => log.push(entry);
  global.location = { search: "?a=water&kind=move&reason=manual" };
  global.document = { title: "", getElementById: () => makeEl() };
  global.window = global;
  global.URLSearchParams = URLSearchParams;
  global.SpeechSynthesisUtterance = function (text) { this.text = text; this.voice = null; };
  global.speechSynthesis = {
    getVoices: () => voices,
    onvoiceschanged: null,
    cancel: () => global.__record("cancel"),
    speak: (u) => global.__record({ text: u.text, voice: u.voice && u.voice.name })
  };
  global.chrome = {
    storage: { local: { get: async () => ({ settings: { speakSteps }, stats: {} }) } },
    runtime: { sendMessage: async () => ({ ok: true, id: "eyes" }) },
    tabs: { getCurrent: async () => null, remove: async () => {} }
  };

  // The driver runs inside the same eval as break.js, so it can call `speak`
  // directly rather than relying on it leaking out into this scope.
  const driver = `
    (async () => {
      await new Promise((r) => setTimeout(r, 0)); // let the settings fetch resolve
      speak("Testing one two three");
    })();
  `;
  eval(activitiesSrc + "\n" + breakSrc + "\n" + driver);

  return new Promise((resolve) => setTimeout(() => {
    const spoke = log.find((e) => typeof e === "object");
    console.log(`${name}: ${spoke ? `spoke via "${spoke.voice}"` : "silent"}`);
    resolve(spoke || null);
  }, 10));
}

(async () => {
  const off = await run("speakSteps off, local voice available", false, [
    { name: "Microsoft Zira", lang: "en-US", localService: true }
  ]);
  const networkOnly = await run("speakSteps on, only a network voice available", true, [
    { name: "Google US English", lang: "en-US", localService: false }
  ]);
  const mixed = await run("speakSteps on, local + network voices available", true, [
    { name: "Google 日本語", lang: "ja-JP", localService: false },
    { name: "Microsoft Zira", lang: "en-US", localService: true }
  ]);
  const none = await run("speakSteps on, no voices installed at all", true, []);

  const ok = !off && !networkOnly && mixed && mixed.voice === "Microsoft Zira" && !none;
  console.log(ok ? "\nPASS" : "\nFAIL");
  process.exitCode = ok ? 0 : 1;
})();
