const $ = (id) => document.getElementById(id);

function hm(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function closeThisTab() {
  chrome.tabs.getCurrent()
    .then((tab) => (tab ? chrome.tabs.remove(tab.id) : window.close()))
    .catch(() => window.close());
}

// ---------- workday timeline ----------
// Turns background.js's raw per-day event log into a readable list. Only
// ever labels what Utthana actually observed (idle, meeting, an active Focus
// Guard session) — never a site/app category, since that signal doesn't
// exist here and shouldn't be guessed at.

const STATE_LABELS = { active: "Active", idle: "Away", meeting: "Meeting", focusguard: "On a guarded site" };
const MARK_LABELS = { micro: "Micro break", move: "Movement break", lunch: "Lunch" };
const MIN_SEGMENT_MS = 2 * 60 * 1000; // blips shorter than this fold into whatever came before, for readability

function timeOfDay(ts) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

// Exported as a plain function (not wrapped in an IIFE) so it can be
// exercised directly by tests/workday-timeline.js without a DOM.
function buildTimelineRows(timeline, nowTs) {
  const states = (timeline || []).filter((e) => e.type === "state").sort((a, b) => a.t - b.t);
  const marks = (timeline || []).filter((e) => e.type === "mark");

  const segments = [];
  for (let i = 0; i < states.length; i++) {
    const start = states[i].t;
    const end = i + 1 < states.length ? states[i + 1].t : nowTs;
    segments.push({ state: states[i].state, start, end });
  }

  // Merge blips shorter than MIN_SEGMENT_MS into the previous segment, and
  // merge consecutive segments that ended up with the same state.
  const merged = [];
  for (const seg of segments) {
    const prev = merged[merged.length - 1];
    if (prev && (seg.end - seg.start < MIN_SEGMENT_MS || prev.state === seg.state)) {
      prev.end = seg.end;
    } else {
      merged.push({ ...seg });
    }
  }

  const rows = merged.map((seg) => ({
    sortKey: seg.start,
    time: `${timeOfDay(seg.start)}–${timeOfDay(seg.end)}`,
    label: STATE_LABELS[seg.state] || seg.state,
    isMark: false
  }));
  marks.forEach((m) => {
    rows.push({ sortKey: m.t, time: timeOfDay(m.t), label: MARK_LABELS[m.label] || m.label, isMark: true });
  });
  rows.sort((a, b) => a.sortKey - b.sortKey);
  return rows;
}

function renderTimeline(timeline) {
  const box = $("timeline");
  const rows = buildTimelineRows(timeline, Date.now());
  if (!rows.length) {
    box.innerHTML = `<p class="tempty">Nothing logged yet today.</p>`;
    return;
  }
  box.innerHTML = rows.map((r) =>
    `<div class="trow${r.isMark ? " mark" : ""}"><span class="ttime">${r.time}</span><span class="tlabel">${r.label}</span></div>`
  ).join("");
}

(async () => {
  const { stats = {}, settings = {} } = await chrome.storage.local.get(["stats", "settings"]);
  const d = new Date();
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const day = stats[key] || {};
  const active = day.active || 0;
  const longest = day.longest || 0;
  const breaks = day.breaks || 0;
  const micro = day.micro || 0;
  const move = day.move || 0;
  const water = (day.activities && day.activities.water) || 0;
  const resisted = day.resisted || 0;

  $("kicker").textContent = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  $("screen").textContent = hm(active);
  $("breaks").textContent = breaks;
  $("longest").textContent = hm(longest);
  $("water").textContent = water;

  // A short, deterministic "explain my day" — only from stats already tracked,
  // no new data collection. Never a grade, a streak, or a health claim.
  const notes = [];
  if (breaks === 0) {
    notes.push("No breaks today. Tomorrow, try saying yes to just the first one. It only takes a minute.");
  } else {
    const mix = [];
    if (micro) mix.push(`${micro} quick reset${micro === 1 ? "" : "s"}`);
    if (move) mix.push(`${move} movement break${move === 1 ? "" : "s"}`);
    const mixText = mix.length ? `You took ${mix.join(" and ")} today. ` : "";

    const moveEvery = settings.moveEvery || 50;
    if (longest > moveEvery * 1.6) {
      notes.push(`${mixText}Your longest stretch was ${hm(longest)} — tomorrow, try to stand up before you hit that point.`);
    } else {
      notes.push(`${mixText}Good rhythm today. You kept moving through the day. Now close the laptop and properly switch off.`);
    }
  }
  if (resisted > 0) {
    notes.push(`You also caught yourself ${resisted} time${resisted === 1 ? "" : "s"} on a distracting site and chose to close the tab instead — that counts.`);
  }
  $("note").textContent = notes.join(" ");

  renderTimeline(day.timeline);
})();

$("done").addEventListener("click", closeThisTab);
$("keep").addEventListener("click", closeThisTab);
$("done").focus();
