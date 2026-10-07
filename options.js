const BUILT_IN = {
  "instagram.com": "Instagram",
  "facebook.com": "Facebook",
  "youtube.com": "YouTube",
  "x.com": "X",
  "twitter.com": "Twitter (old address)",
  "reddit.com": "Reddit"
};

const DEFAULTS = {
  workDays: [1, 2, 3, 4, 5],
  workStart: "09:30",
  workEnd: "18:30",
  lunchOn: true,
  lunchTime: "13:00",
  wrapUpOn: true,
  microOn: true,
  microEvery: 20,
  moveOn: true,
  moveEvery: 50,
  workplace: "office",
  breakMode: "window",
  meetingDetect: true,
  speakSteps: false,
  activities: Object.fromEntries(ACTIVITIES.map((a) => [a.id, true])),
  sessionMinutes: 5,
  dailyGoal: 30,
  sites: Object.fromEntries(Object.keys(BUILT_IN).map((s) => [s, true])),
  customSites: []
};

const $ = (id) => document.getElementById(id);
const originsFor = (d) => [`*://${d}/*`, `*://*.${d}/*`];
let settings;
let toastTimer;

function save() {
  chrome.storage.local.set({ settings });
  const t = $("toast");
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1200);
}

// ---------- generic bindings ----------

function bindNumber(id, min, max) {
  const el = $(id);
  el.value = settings[id];
  el.addEventListener("change", () => {
    let n = Math.round(Number(el.value));
    if (!Number.isFinite(n)) n = DEFAULTS[id];
    n = Math.min(max, Math.max(min, n));
    el.value = n;
    settings[id] = n;
    save();
  });
}

function bindCheck(id, after) {
  const el = $(id);
  el.checked = !!settings[id];
  el.addEventListener("change", () => {
    settings[id] = el.checked;
    save();
    if (after) after();
  });
}

function bindTime(id, after) {
  const el = $(id);
  el.value = settings[id];
  el.addEventListener("change", () => {
    if (!/^\d{2}:\d{2}$/.test(el.value)) { el.value = settings[id]; return; }
    settings[id] = el.value;
    save();
    if (after) after();
  });
}

function bindRadio(name, field, after) {
  document.querySelectorAll(`input[name="${name}"]`).forEach((r) => {
    r.checked = r.value === settings[field];
    r.addEventListener("change", () => {
      settings[field] = r.value;
      save();
      if (after) after();
    });
  });
}

// ---------- workday ----------

function renderDays() {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const order = [1, 2, 3, 4, 5, 6, 0];
  const box = $("days");
  box.innerHTML = "";
  order.forEach((d) => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox"><span>${names[d]}</span>`;
    const cb = label.querySelector("input");
    cb.checked = settings.workDays.includes(d);
    cb.addEventListener("change", () => {
      const set = new Set(settings.workDays);
      if (cb.checked) set.add(d); else set.delete(d);
      if (!set.size) { cb.checked = true; return; } // keep at least one day
      settings.workDays = [...set].sort();
      save();
    });
    box.appendChild(label);
  });
}

function checkHours() {
  $("hoursMsg").textContent = settings.workEnd <= settings.workStart
    ? "Your finish time should be after your start time."
    : "";
}

function syncDisabled() {
  $("lunchTime").disabled = !settings.lunchOn;
  $("microEvery").disabled = !settings.microOn;
  $("microEvery").closest(".row").classList.toggle("off", !settings.microOn);
  $("moveEvery").disabled = !settings.moveOn;
  $("moveEvery").closest(".row").classList.toggle("off", !settings.moveOn);
}

// ---------- activities ----------

function renderActivities() {
  const place = settings.workplace === "home" ? "home" : "office";
  ["micro", "move"].forEach((kind) => {
    const box = $(kind + "List");
    box.innerHTML = "";
    ACTIVITIES.filter((a) => a.kind === kind).forEach((a) => {
      const row = document.createElement("div");
      const suitable = a[place];
      row.className = "row act" + (suitable ? "" : " unsuitable");
      const id = "act-" + a.id;
      row.innerHTML = `<label for="${id}"></label><input type="checkbox" id="${id}">`;
      const label = row.querySelector("label");
      label.textContent = `${a.emoji}  ${a.title}`;
      if (!suitable) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = place === "office" ? "home only" : "office only";
        label.appendChild(tag);
      }
      const cb = row.querySelector("input");
      cb.checked = settings.activities[a.id] !== false;
      cb.disabled = !suitable;
      cb.addEventListener("change", () => {
        const othersOn = ACTIVITIES.some((x) =>
          x.kind === kind && x.id !== a.id && x[place] && settings.activities[x.id] !== false);
        if (!cb.checked && !othersOn) { cb.checked = true; return; } // keep at least one
        settings.activities[a.id] = cb.checked;
        save();
      });
      box.appendChild(row);
    });
  });
}

// ---------- Focus Guard sites ----------

function renderBuiltIn() {
  const box = $("builtIn");
  box.innerHTML = "";
  Object.entries(BUILT_IN).forEach(([site, name]) => {
    const row = document.createElement("div");
    row.className = "row";
    const id = "site-" + site.replace(/\W/g, "");
    row.innerHTML = `<label for="${id}"></label><input type="checkbox" id="${id}">`;
    row.querySelector("label").textContent = name;
    const cb = row.querySelector("input");
    cb.checked = settings.sites[site] !== false;
    cb.addEventListener("change", () => { settings.sites[site] = cb.checked; save(); });
    box.appendChild(row);
  });
}

function renderCustom() {
  const box = $("custom");
  box.innerHTML = "";
  if (!settings.customSites.length) {
    box.innerHTML = `<div class="empty">No sites added yet.</div>`;
    return;
  }
  settings.customSites.forEach((d) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<span></span><button class="remove">Remove</button>`;
    row.querySelector("span").textContent = d;
    row.querySelector("button").addEventListener("click", () => {
      settings.customSites = settings.customSites.filter((x) => x !== d);
      save();
      renderCustom();
      chrome.permissions.remove({ origins: originsFor(d) }).catch(() => {});
      message(`${d} removed.`, "ok");
    });
    box.appendChild(row);
  });
}

function normalize(input) {
  let s = input.trim().toLowerCase();
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  s = s.split(/[\/?#]/)[0];
  s = s.split(":")[0];
  s = s.replace(/^www\./, "");
  return s;
}

function message(text, kind) {
  const el = $("siteMsg");
  el.textContent = text;
  el.className = "msg " + (kind || "");
}

async function addSite() {
  const domain = normalize($("newSite").value);
  if (!domain) { message("Type a website address, like netflix.com.", "error"); return; }
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) {
    message(`"${domain}" doesn't look like a website address. Try something like netflix.com.`, "error");
    return;
  }
  const builtIn = Object.keys(BUILT_IN).find((b) => domain === b || domain.endsWith("." + b));
  if (builtIn) { message(`${BUILT_IN[builtIn]} is already in the list above.`, "error"); return; }
  if (settings.customSites.includes(domain)) { message(`${domain} is already on your list.`, "error"); return; }

  let granted = false;
  try {
    granted = await chrome.permissions.request({ origins: originsFor(domain) });
  } catch (e) {
    message("Chrome couldn't ask for permission. Try again.", "error");
    return;
  }
  if (!granted) {
    message(`Unsit needs permission to show the pause screen on ${domain}.`, "error");
    return;
  }
  settings.customSites = [...settings.customSites, domain];
  save();
  renderCustom();
  $("newSite").value = "";
  message(`${domain} added. Reload any open ${domain} tab to start guarding it.`, "ok");
}

$("addSite").addEventListener("click", addSite);
$("newSite").addEventListener("keydown", (e) => { if (e.key === "Enter") addSite(); });

$("tryMicro").addEventListener("click", () => chrome.runtime.sendMessage({ type: "preview", kind: "micro" }));
$("tryMove").addEventListener("click", () => chrome.runtime.sendMessage({ type: "preview", kind: "move" }));

// ---------- start ----------

(async () => {
  const { settings: stored } = await chrome.storage.local.get("settings");
  const s = stored || {};
  settings = {
    ...DEFAULTS,
    ...s,
    sites: { ...DEFAULTS.sites, ...(s.sites || {}) },
    activities: { ...DEFAULTS.activities, ...(s.activities || {}) },
    customSites: Array.isArray(s.customSites) ? s.customSites : [],
    workDays: Array.isArray(s.workDays) ? s.workDays : DEFAULTS.workDays
  };
  // Carry over settings from version 1.x, same migration as background.js's
  // getSettings() — kept in sync here too, so Settings works even if it's
  // somehow opened before background.js has had a chance to migrate storage.
  if (s.moveEvery === undefined && typeof s.breakEvery === "number") {
    settings.moveOn = s.breakEvery > 0;
    settings.moveEvery = s.breakEvery > 0 ? s.breakEvery : DEFAULTS.moveEvery;
  }
  if (settings.breakMode === "open") settings.breakMode = "window";
  delete settings.breakEvery;
  delete settings.lastBreakEvery;

  renderDays();
  bindTime("workStart", checkHours);
  bindTime("workEnd", checkHours);
  bindTime("lunchTime");
  bindCheck("lunchOn", syncDisabled);
  bindCheck("wrapUpOn");
  bindCheck("microOn", syncDisabled);
  bindNumber("microEvery", 5, 90);
  bindCheck("moveOn", syncDisabled);
  bindNumber("moveEvery", 10, 180);
  bindRadio("workplace", "workplace", renderActivities);
  bindRadio("mode", "breakMode");
  bindCheck("meetingDetect");
  bindCheck("speakSteps");
  bindNumber("sessionMinutes", 1, 120);
  bindNumber("dailyGoal", 5, 720);
  syncDisabled();
  renderActivities();
  renderBuiltIn();
  renderCustom();
})();
