// Unsit content script.
// Shows a pause screen on guarded sites, runs a short session timer,
// and counts the minutes you actually spend there.

(() => {
  const SITES = {
    "instagram.com": "Instagram",
    "facebook.com": "Facebook",
    "youtube.com": "YouTube",
    "x.com": "X",
    "twitter.com": "X",
    "reddit.com": "Reddit"
  };

  if (window.top !== window) return;          // ignore embedded frames
  if (window.__unsitLoaded) return;     // never run twice on one page
  window.__unsitLoaded = true;

  const host = location.hostname;
  const matches = (d) => host === d || host.endsWith("." + d);

  // Filled in by init() once we know the user's custom sites.
  let site = null;
  let label = "";
  let SESSION_KEY = "";
  const EXTRA_MINUTES = 2;

  let settings = { sessionMinutes: 5, sites: {} };
  let protectUntil = 0;   // Focus Protection end time, if any (set from the popup)
  let session = null;      // { end, extended, intent }
  let overlayHost = null;  // full-screen pause/time-up layer
  let timerHost = null;    // small countdown pill
  let tickHandle = null;
  let pendingSeconds = 0;
  let savedOverflow = "";
  let alive = true;

  // ---------- helpers ----------

  function safe(fn) {
    // After the extension is reloaded, old scripts lose access to chrome.*
    try { return fn(); } catch (e) { alive = false; stopTicking(); return undefined; }
  }

  function send(msg) {
    return safe(() => chrome.runtime.sendMessage(msg).catch(() => {}));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function todayKey() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function formatClock(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function formatClockTime(ts) {
    return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  async function todayStats() {
    const res = await safe(() => chrome.storage.local.get("stats"));
    const day = (res && res.stats && res.stats[todayKey()]) || {};
    return {
      minutes: Math.round((day.seconds || 0) / 60),
      resisted: day.resisted || 0
    };
  }

  // ---------- page locking ----------

  function pauseVideos() {
    document.querySelectorAll("video").forEach((v) => { try { v.pause(); } catch (e) {} });
  }

  document.addEventListener("play", (e) => {
    if (overlayHost && e.target && e.target.tagName === "VIDEO") e.target.pause();
  }, true);

  function lockPage() {
    savedOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    pauseVideos();
  }

  function unlockPage() {
    document.documentElement.style.overflow = savedOverflow;
  }

  // ---------- styles ----------

  const OVERLAY_CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .backdrop {
      position: fixed; inset: 0;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      background: rgba(23, 34, 48, 0.82);
      backdrop-filter: blur(14px) saturate(0.6);
      -webkit-backdrop-filter: blur(14px) saturate(0.6);
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      color: #1E2B33;
    }
    .card {
      position: relative;
      width: 100%; max-width: 440px;
      background: #EEF2F0;
      border-radius: 22px;
      padding: 40px 36px 28px;
      box-shadow: 0 30px 80px rgba(8, 14, 22, 0.45);
      text-align: left;
    }
    .breath {
      width: 56px; height: 56px; border-radius: 50%;
      background: radial-gradient(circle, #2F7D6D 0%, #2F7D6D 40%, rgba(47,125,109,0.18) 41%);
      margin-bottom: 26px;
      animation: breathe 8s ease-in-out infinite;
    }
    @keyframes breathe {
      0%, 100% { transform: scale(0.72); opacity: 0.75; }
      50% { transform: scale(1); opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) { .breath { animation: none; } }
    h1 {
      font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
      font-weight: 600;
      font-size: 32px; line-height: 1.15;
      letter-spacing: -0.01em;
      margin: 0 0 10px;
      color: #1E2B33;
    }
    p { margin: 0; font-size: 15px; line-height: 1.5; color: #4A5A63; }
    .intent-echo {
      margin-top: 14px; padding: 12px 14px;
      border-left: 3px solid #2F7D6D;
      background: #E2E9E6; border-radius: 0 10px 10px 0;
      font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
      font-size: 17px; color: #1E2B33;
    }
    .protect-note {
      margin-top: 14px; padding: 12px 14px;
      border-left: 3px solid #C9892B;
      background: #F1E6D2; border-radius: 0 10px 10px 0;
      font-size: 14px; color: #1E2B33;
    }
    input {
      width: 100%; margin-top: 22px;
      font: inherit; font-size: 16px; color: #1E2B33;
      padding: 14px 16px;
      border: 1.5px solid #BFCCC6; border-radius: 12px;
      background: #FFFFFF; outline: none;
    }
    input:focus { border-color: #2F7D6D; box-shadow: 0 0 0 3px rgba(47,125,109,0.2); }
    .actions { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
    button {
      font: inherit; font-size: 15px; font-weight: 600;
      padding: 13px 16px; border-radius: 12px; cursor: pointer;
      border: 1.5px solid transparent; transition: background 0.15s ease;
    }
    button:focus-visible { outline: 3px solid #C9892B; outline-offset: 2px; }
    .primary { background: #2F7D6D; color: #FFFFFF; }
    .primary:hover:not(:disabled) { background: #276A5C; }
    .primary:disabled { background: #A9BDB6; cursor: not-allowed; }
    .secondary { background: transparent; color: #2F7D6D; border-color: #2F7D6D; }
    .secondary:hover { background: #E2E9E6; }
    .quiet { background: transparent; color: #4A5A63; }
    .quiet:hover { background: #E2E9E6; }
    .today {
      margin-top: 22px; padding-top: 16px;
      border-top: 1px solid #D3DDD8;
      font-size: 13px; color: #6B7A82;
    }
  `;

  const TIMER_CSS = `
    :host { all: initial; }
    .pill {
      position: fixed; right: 18px; bottom: 18px;
      display: flex; align-items: center; gap: 10px;
      max-width: 300px;
      padding: 9px 14px 9px 10px;
      background: #172230; color: #EEF2F0;
      border-radius: 999px;
      box-shadow: 0 8px 24px rgba(8, 14, 22, 0.35);
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      font-size: 13px; line-height: 1.2;
      pointer-events: none;
    }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #2F7D6D; flex: none; }
    .pill.low .dot { background: #C9892B; }
    .clock { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 15px; }
    .why { opacity: 0.75; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `;

  // ---------- overlay ----------

  function mountOverlay(html) {
    removeOverlay();
    overlayHost = document.createElement("div");
    overlayHost.style.cssText = "position:fixed;inset:0;z-index:2147483647;";
    // Keep the site's keyboard shortcuts from firing while typing in our box.
    ["keydown", "keyup", "keypress"].forEach((t) =>
      overlayHost.addEventListener(t, (e) => e.stopPropagation())
    );
    const root = overlayHost.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${OVERLAY_CSS}</style>${html}`;
    document.documentElement.appendChild(overlayHost);
    lockPage();
    return root;
  }

  function removeOverlay() {
    if (overlayHost) {
      overlayHost.remove();
      overlayHost = null;
      unlockPage();
    }
  }

  async function showGate() {
    const t = await todayStats();
    const mins = settings.sessionMinutes;
    const minsText = `${mins} minute${mins === 1 ? "" : "s"}`;
    const protecting = protectUntil && protectUntil > Date.now();
    const protectNote = protecting
      ? `<div class="protect-note">You're protecting your focus until ${formatClockTime(protectUntil)}.</div>`
      : "";
    const root = mountOverlay(`
      <div class="backdrop" role="dialog" aria-modal="true" aria-labelledby="sg-title">
        <div class="card">
          <div class="breath" aria-hidden="true"></div>
          <h1 id="sg-title">What are you here for?</h1>
          <p>You're about to open ${escapeHtml(label)}. Name one reason, then go in for ${minsText}.</p>
          ${protectNote}
          <input id="intent" maxlength="80" autocomplete="off"
            placeholder="For example: reply to a message" aria-label="Your reason for opening ${escapeHtml(label)}">
          <div class="actions">
            <button id="go" class="primary" disabled>Go in for ${minsText}</button>
            <button id="breathe" class="secondary">Take a quick break instead</button>
            <button id="leave" class="quiet">Close this tab</button>
          </div>
          <div class="today">Today you've spent ${t.minutes} min on guarded sites and closed ${t.resisted} tab${t.resisted === 1 ? "" : "s"} at this screen.</div>
        </div>
      </div>
    `);

    const input = root.getElementById("intent");
    const go = root.getElementById("go");
    const leave = root.getElementById("leave");

    input.addEventListener("input", () => {
      go.disabled = input.value.trim().length < 3;
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !go.disabled) go.click();
    });

    go.addEventListener("click", () => {
      const s = {
        end: Date.now() + mins * 60 * 1000,
        extended: false,
        intent: input.value.trim()
      };
      startSession(s);
      safe(() => chrome.storage.local.set({ [SESSION_KEY]: s }));
      send({ type: "bump", field: "sessions", amount: 1 });
    });

    leave.addEventListener("click", async () => {
      leave.disabled = true;
      await send({ type: "bump", field: "resisted", amount: 1 });
      send({ type: "closeTab" });
    });

    const breathe = root.getElementById("breathe");
    breathe.addEventListener("click", async () => {
      breathe.disabled = true;
      await send({ type: "bump", field: "resisted", amount: 1 });
      send({ type: "openBreak" });
    });

    setTimeout(() => input.focus(), 50);
  }

  function showTimeUp() {
    const s = session || {};
    const canExtend = !s.extended;
    const root = mountOverlay(`
      <div class="backdrop" role="dialog" aria-modal="true" aria-labelledby="sg-title">
        <div class="card">
          <div class="breath" aria-hidden="true"></div>
          <h1 id="sg-title">Time's up.</h1>
          <p>You came here to:</p>
          <div class="intent-echo">${escapeHtml(s.intent || "do one thing")}</div>
          <div class="actions">
            <button id="close" class="primary">Done, close this tab</button>
            <button id="breathe" class="secondary">Take a quick break</button>
            ${canExtend
              ? `<button id="extend" class="quiet">Give me ${EXTRA_MINUTES} more minutes</button>`
              : `<button id="restart" class="quiet">Start over with a new reason</button>`}
          </div>
          <div class="today">${canExtend
            ? `You can add time once per session.`
            : `You've used your extra time for this session.`}</div>
        </div>
      </div>
    `);

    const closeBtn = root.getElementById("close");
    closeBtn.addEventListener("click", () => {
      closeBtn.disabled = true;
      safe(() => chrome.storage.local.remove(SESSION_KEY));
      send({ type: "closeTab" });
    });

    const breatheBtn = root.getElementById("breathe");
    breatheBtn.addEventListener("click", () => {
      breatheBtn.disabled = true;
      safe(() => chrome.storage.local.remove(SESSION_KEY));
      send({ type: "openBreak" });
    });

    const extend = root.getElementById("extend");
    if (extend) {
      extend.addEventListener("click", () => {
        const next = { ...s, end: Date.now() + EXTRA_MINUTES * 60 * 1000, extended: true };
        startSession(next);
        safe(() => chrome.storage.local.set({ [SESSION_KEY]: next }));
      });
    }

    const restart = root.getElementById("restart");
    if (restart) {
      restart.addEventListener("click", () => {
        session = null;
        safe(() => chrome.storage.local.remove(SESSION_KEY));
        showGate();
      });
    }

    root.getElementById("close").focus();
  }

  // ---------- timer pill ----------

  function showTimer() {
    removeTimer();
    timerHost = document.createElement("div");
    timerHost.style.cssText = "position:fixed;z-index:2147483646;";
    const root = timerHost.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>${TIMER_CSS}</style>
      <div class="pill" role="status">
        <span class="dot"></span>
        <span class="clock">--:--</span>
        <span class="why"></span>
      </div>`;
    root.querySelector(".why").textContent = session.intent || "";
    document.documentElement.appendChild(timerHost);
    updateTimer();
  }

  function updateTimer() {
    if (!timerHost || !session) return;
    const root = timerHost.shadowRoot;
    const left = session.end - Date.now();
    root.querySelector(".clock").textContent = formatClock(left);
    root.querySelector(".pill").classList.toggle("low", left <= 60 * 1000);
  }

  function removeTimer() {
    if (timerHost) { timerHost.remove(); timerHost = null; }
  }

  // ---------- session loop ----------

  function flushSeconds() {
    if (pendingSeconds > 0 && alive) {
      send({ type: "bump", field: "seconds", amount: pendingSeconds });
      pendingSeconds = 0;
    }
  }

  function stopTicking() {
    if (tickHandle) { clearInterval(tickHandle); tickHandle = null; }
  }

  function startSession(s) {
    session = s;
    removeOverlay();
    showTimer();
    stopTicking();
    tickHandle = setInterval(() => {
      if (!session) return;
      if (Date.now() >= session.end) {
        endSession();
        return;
      }
      if (document.visibilityState === "visible") {
        pendingSeconds++;
        if (pendingSeconds >= 15) flushSeconds();
      }
      updateTimer();
    }, 1000);
  }

  function endSession() {
    flushSeconds();
    stopTicking();
    removeTimer();
    showTimeUp();
  }

  function shutDown() {
    flushSeconds();
    stopTicking();
    removeTimer();
    removeOverlay();
    session = null;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushSeconds();
  });
  window.addEventListener("pagehide", flushSeconds);

  // ---------- sync across tabs and settings ----------

  safe(() => chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !site) return;

    if (changes.settings) {
      settings = { ...settings, ...changes.settings.newValue };
      const stillGuarded = SITES[site]
        ? settings.sites && settings.sites[site] !== false
        : (settings.customSites || []).includes(site);
      if (!stillGuarded) shutDown();
    }

    if (changes[SESSION_KEY]) {
      const next = changes[SESSION_KEY].newValue;
      // Another tab started or extended a session for this site.
      if (next && next.end > Date.now() && (!session || next.end !== session.end)) {
        startSession(next);
      }
    }
  }));

  // ---------- start ----------

  async function init() {
    const data = await safe(() => chrome.storage.local.get(["settings", "protectUntil"]));
    if (!data) return;
    settings = { ...settings, ...(data.settings || {}) };
    protectUntil = data.protectUntil || 0;

    const builtIn = Object.keys(SITES).find(matches);
    if (builtIn) {
      if (settings.sites && settings.sites[builtIn] === false) return;
      site = builtIn;
      label = SITES[builtIn];
    } else {
      const custom = (settings.customSites || []).find(matches);
      if (!custom) return;
      site = custom;
      label = custom;
    }
    SESSION_KEY = "session:" + site;

    const saved = await safe(() => chrome.storage.local.get(SESSION_KEY));
    const s = saved && saved[SESSION_KEY];
    if (s && s.end > Date.now()) {
      startSession(s);
    } else {
      showGate();
    }
  }

  init();
})();
