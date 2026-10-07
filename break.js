const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const activity = ACTIVITIES.find((a) => a.id === params.get("a")) || ACTIVITIES[0];
const kind = params.get("kind") || activity.kind;
const reason = params.get("reason") || "manual";   // timer | meeting | focus | manual | preview
const auto = params.get("auto") === "1";           // opened by the timer, so offer snooze
const steps = activity.steps;

let timer = null;
let audioCtx = null;

const KICKERS = {
  timer: kind === "micro" ? "Quick micro-break" : "You've been at the screen a while",
  meeting: "Meeting's over. A quick reset?",
  focus: "Instead of scrolling",
  manual: "Break time",
  preview: "Preview"
};

// ---------- helpers ----------

function show(section) {
  ["intro", "running", "done"].forEach((s) => ($(s).hidden = s !== section));
}

function setOrb(state) {
  const orb = $("orb");
  orb.classList.toggle("big", state === "big");
  orb.classList.toggle("small", state === "small");
}

function setCenter(text, isEmoji) {
  $("center").textContent = text;
  $("center").classList.toggle("emoji", !!isEmoji);
}

// A soft chime, so people know when to open their eyes or come back.
function chime() {
  try {
    audioCtx = audioCtx || new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.3);
  } catch (e) {}
}

function closeThisTab() {
  chrome.tabs.getCurrent()
    .then((tab) => (tab ? chrome.tabs.remove(tab.id) : window.close()))
    .catch(() => window.close());
}

async function goToNextActivity() {
  try {
    const res = await chrome.runtime.sendMessage({ type: "nextActivity", kind });
    const q = new URLSearchParams(params);
    q.set("a", res.id);
    location.search = q.toString();
  } catch (e) {
    location.reload();
  }
}

function renderStepDots(current) {
  const box = $("steps");
  const isBreath = steps.every((s) => !s.confirm) && /^Breathe|^Hold/.test(steps[0].text);
  const perGroup = isBreath ? steps.length / Math.max(1, steps.filter((s) => s.text === "Breathe in").length) : 1;
  const groups = Math.round(steps.length / perGroup);
  const currentGroup = Math.floor(current / perGroup);
  box.innerHTML = "";
  for (let i = 0; i < groups; i++) {
    const s = document.createElement("span");
    if (i < currentGroup) s.className = "done";
    else if (i === currentGroup) s.className = "now";
    box.appendChild(s);
  }
}

// ---------- flow ----------

function runStep(index) {
  clearInterval(timer);
  if (index >= steps.length) {
    finish();
    return;
  }
  const step = steps[index];
  $("phase").textContent = step.text;
  $("hint").textContent = step.hint;
  renderStepDots(index);

  if (step.confirm) {
    setOrb("mid");
    setCenter(activity.emoji, true);
    $("confirm").textContent = step.confirm;
    $("confirmWrap").hidden = false;
    $("confirm").onclick = () => {
      $("confirmWrap").hidden = true;
      runStep(index + 1);
    };
    $("confirm").focus();
    return;
  }

  $("confirmWrap").hidden = true;
  setOrb(step.orb || "mid");
  let left = step.seconds;
  setCenter(left, false);
  timer = setInterval(() => {
    left--;
    if (left <= 0) {
      // Chime at the end of longer steps, so people can look away or close their eyes.
      if (step.seconds >= 15 && !/^Breathe|^Hold/.test(step.text)) chime();
      runStep(index + 1);
    } else {
      setCenter(left, false);
    }
  }, 1000);
}

async function finish() {
  setOrb("mid");
  setCenter(activity.emoji, true);
  $("doneText").textContent = activity.done;
  show("done");
  $("back").focus();
  try {
    await chrome.runtime.sendMessage({ type: "breakDone", activity: activity.id, kind });
    const { stats = {} } = await chrome.storage.local.get("stats");
    const d = new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const n = (stats[key] && stats[key].breaks) || 1;
    $("doneKicker").textContent = n === 1 ? "First break today" : `Break ${n} today`;
  } catch (e) {}
}

// ---------- start ----------

document.title = `${activity.emoji} ${activity.title}`;
$("introKicker").textContent = KICKERS[reason] || KICKERS.manual;
$("title").textContent = activity.title;
$("introText").textContent = activity.intro;
setCenter(activity.emoji, true);

$("start").addEventListener("click", () => { show("running"); runStep(0); });
$("swap").addEventListener("click", goToNextActivity);
$("another").addEventListener("click", goToNextActivity);
$("skip").addEventListener("click", closeThisTab);
$("back").addEventListener("click", closeThisTab);

if (auto) {
  $("snooze").hidden = false;
  $("snooze").addEventListener("click", async () => {
    $("snooze").disabled = true;
    try { await chrome.runtime.sendMessage({ type: "snooze", kind }); } catch (e) {}
    closeThisTab();
  });
}
$("start").focus();
