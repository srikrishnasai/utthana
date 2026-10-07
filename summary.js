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
})();

$("done").addEventListener("click", closeThisTab);
$("keep").addEventListener("click", closeThisTab);
$("done").focus();
