const $ = (id) => document.getElementById(id);

function dateKey(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function hm(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

const timeText = (ms) => new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

async function render() {
  const { stats = {}, settings = {} } = await chrome.storage.local.get(["stats", "settings"]);
  const status = (await chrome.runtime.sendMessage({ type: "status" }).catch(() => null)) || {};
  const live = status.live || { stretch: 0 };
  const moveEvery = settings.moveEvery || 50;
  const today = stats[dateKey(new Date())] || {};
  const paused = status.pausedUntil > Date.now();

  // Header
  let headline, subline;
  if (paused) {
    headline = "Breaks paused";
    subline = `Back on at ${timeText(status.pausedUntil)}.`;
  } else if (!status.working) {
    headline = "Outside work hours";
    subline = `Breaks run ${settings.workStart || "09:30"} to ${settings.workEnd || "18:30"} on your workdays.`;
  } else {
    headline = live.stretch === 0
      ? "Fresh start"
      : `${hm(live.stretch)} since your last break`;
    if (status.meeting) subline = "You're on a call. Breaks will wait until it ends.";
    else if (settings.moveOn === false) subline = "Movement breaks are off.";
    else {
      const left = Math.max(0, moveEvery - live.stretch);
      subline = left === 0 ? "A movement break is due." : `Next movement break in about ${left} min.`;
    }
  }
  $("headline").textContent = headline;
  $("subline").textContent = subline;
  const pct = Math.min(100, (live.stretch / moveEvery) * 100);
  $("barFill").style.width = `${paused || !status.working ? 0 : pct}%`;
  $("bar").classList.toggle("due", pct >= 100);

  // Today
  $("screen").textContent = hm(today.active || 0);
  $("breaks").textContent = today.breaks || 0;
  $("longest").textContent = hm(today.longest || 0);
  $("water").textContent = (today.activities && today.activities.water) || 0;
  $("emojis").textContent = Object.keys(today.activities || {})
    .map((id) => (ACTIVITIES.find((a) => a.id === id) || {}).emoji)
    .filter(Boolean).join(" ");

  // Pause buttons
  $("pause60").hidden = paused;
  $("pauseDay").hidden = paused;
  $("resume").hidden = !paused;

  // Chart: breaks per day
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: i === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" }),
      n: (stats[dateKey(d)] || {}).breaks || 0,
      today: i === 0
    });
  }
  const max = Math.max(5, ...days.map((d) => d.n));
  const chart = $("chart");
  chart.innerHTML = "";
  days.forEach((d) => {
    const col = document.createElement("div");
    col.className = "col" + (d.today ? " today" : "");
    col.innerHTML = `<span class="val">${d.n}</span><div class="b" style="height:${Math.round((d.n / max) * 46)}px"></div><span class="day">${d.label}</span>`;
    chart.appendChild(col);
  });

  // Focus Guard
  const fgMins = Math.round((today.seconds || 0) / 60);
  const limit = settings.dailyGoal || 30;
  const closed = today.resisted || 0;
  $("focus").textContent =
    `${fgMins} of your ${limit}-minute limit used on distracting sites today. ` +
    `${closed} ${closed === 1 ? "tab" : "tabs"} closed at the pause screen.`;

  $("hours").textContent = `Work hours ${settings.workStart || "09:30"}–${settings.workEnd || "18:30"}`;
}

$("breakNow").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "openBreak", kind: "move", newWindow: true });
  window.close();
});
$("pause60").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "pause", minutes: 60 });
  render();
});
$("pauseDay").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "pause", minutes: "day" });
  render();
});
$("resume").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "pause", minutes: 0 });
  render();
});
$("openSettings").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

render();
