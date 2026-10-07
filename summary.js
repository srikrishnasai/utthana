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
  const { stats = {} } = await chrome.storage.local.get("stats");
  const d = new Date();
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const day = stats[key] || {};
  const active = day.active || 0;
  const longest = day.longest || 0;
  const breaks = day.breaks || 0;
  const water = (day.activities && day.activities.water) || 0;

  $("kicker").textContent = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  $("screen").textContent = hm(active);
  $("breaks").textContent = breaks;
  $("longest").textContent = hm(longest);
  $("water").textContent = water;

  let note;
  if (breaks === 0) {
    note = "No breaks today. Tomorrow, try saying yes to just the first one. It only takes a minute.";
  } else if (longest > 90) {
    note = `Your longest stretch was ${hm(longest)}. Tomorrow, try to stand up before you hit the hour.`;
  } else {
    note = "Good rhythm today. You kept moving through the day. Now close the laptop and properly switch off.";
  }
  $("note").textContent = note;
})();

$("done").addEventListener("click", closeThisTab);
$("keep").addEventListener("click", closeThisTab);
$("done").focus();
