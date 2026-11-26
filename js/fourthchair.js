/* The Fourth Chair - the companion on The Sector Debrief.
   Self-injecting widget (laptops only). It reflects with the visitor and knows every episode: answers
   about the episodes come back with sources that open YouTube at the moment. The conversation stays in
   this browser; replies are signed by the server so a stored conversation cannot be tampered with.
   No tracking. All text goes into the page with textContent, never as HTML. */
(function () {
  "use strict";

  var WORKER_URL = "https://fourth-chair.ankommer.workers.dev";
  var STORE_KEY = "fourthchair_v2";
  var OLD_KEY = "fourthchair_v1";
  var MAX_TURNS = 20;     // kept on this device
  var SEND_TURNS = 8;     // sent with each message
  var SEND_CAP = 2000;    // input characters
  var MIN_PAUSE = 900;    // the chair never answers instantly
  var TIMEOUT = 30000;

  var AV = {
    kim: "/assets/fourthchair-kim.jpg",
    thomas: "/assets/fourthchair-thomas.jpg",
    ali: "/assets/fourthchair-ali.jpg",
    robot: "/assets/fourthchair-robot.jpg"
  };

  var OPENERS = [
    "Pull up the fourth chair. Ask me about any episode, or tell me what is on your mind.",
    "I know every conversation on the show, and I am a good listener. What would you like to sit with?",
    "Sit down a second. Is it something from an episode, or something from your own week?"
  ];
  var CHIPS = [
    "Which episode should I start with?",
    "A question from this week",
    "Something I keep avoiding"
  ];
  var QUIET = "Something went quiet for a moment. Take one breath, and try me again when you are ready.";

  var history = [];       // [{role, content, sig?, sources?}]
  var focus = null;       // {slug, label, guest}
  var processing = false;
  var noteShown = false;
  var lastFocus = null;
  var gen = 0;            // bumped on forget or a new episode: replies from an older conversation are dropped
  var active = null;      // the AbortController of the reply on its way, if any
  var focusTimer = null;
  var els = {};

  // ---------- storage ----------
  function load() {
    try { localStorage.removeItem(OLD_KEY); } catch (e) {}
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s && Array.isArray(s.history)) history = s.history.filter(validTurn).map(cleanTurn).slice(-MAX_TURNS);
      if (s && s.focus && typeof s.focus.slug === "string" && /^[a-z0-9-]{1,80}$/.test(s.focus.slug)) {
        focus = { slug: s.focus.slug, label: String(s.focus.label || "").slice(0, 120), guest: String(s.focus.guest || "").slice(0, 80) };
      }
    } catch (e) { history = []; focus = null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ history: history.slice(-MAX_TURNS), focus: focus })); } catch (e) {}
  }
  function validTurn(m) {
    return m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.length <= 4000;
  }
  // Stored data is untrusted: keep only well-formed fields, as plain strings and numbers.
  function cleanSources(list) {
    if (!Array.isArray(list)) return [];
    var out = [];
    list.slice(0, 6).forEach(function (s) {
      if (!s || typeof s !== "object") return;
      var url = typeof s.url === "string" ? s.url.slice(0, 200) : "";
      var ts = typeof s.ts === "string" ? s.ts.slice(0, 10) : "";
      var sp = Array.isArray(s.speakers) ? s.speakers.filter(function (x) { return typeof x === "string"; }).map(function (x) { return x.slice(0, 60); }).slice(0, 3) : [];
      var n = typeof s.n === "number" && isFinite(s.n) ? s.n : 0;
      var ep = typeof s.episode === "number" && isFinite(s.episode) ? s.episode : 0;
      out.push({ n: n, episode: ep, ts: ts, speakers: sp, url: url });
    });
    return out;
  }
  function cleanTurn(m) {
    var t = { role: m.role, content: m.content };
    if (m.role === "assistant") {
      t.sig = typeof m.sig === "string" ? m.sig.slice(0, 120) : "";
      t.sources = cleanSources(m.sources);
    }
    return t;
  }

  // ---------- helpers ----------
  function avatarRow(cls) {
    return '<span class="' + cls + '">' +
      '<img src="' + AV.kim + '" alt="" width="34" height="34">' +
      '<img src="' + AV.thomas + '" alt="" width="34" height="34">' +
      '<img src="' + AV.ali + '" alt="" width="34" height="34">' +
      '<img src="' + AV.robot + '" alt="" width="34" height="34">' +
      '</span>';
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function scrollLog() { if (els.log) els.log.scrollTop = els.log.scrollHeight; }
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function safeYouTube(u) {
    try {
      var x = new URL(u);
      return x.protocol === "https:" && (x.hostname === "www.youtube.com" || x.hostname === "youtube.com") && x.pathname === "/watch" ? x.href : null;
    } catch (e) { return null; }
  }

  // ---------- rendering ----------
  function addMsg(role, text, sources) {
    var wrap = document.createElement("div");
    wrap.className = "fc-msg " + (role === "user" ? "fc-user" : "fc-bot");
    var b = document.createElement("div");
    b.className = "fc-bubble";
    b.textContent = text;
    wrap.appendChild(b);
    if (role === "assistant" && Array.isArray(sources) && sources.length) wrap.appendChild(renderSources(sources));
    els.log.appendChild(wrap);
    scrollLog();
    return wrap;
  }
  function renderSources(sources) {
    var box = document.createElement("div");
    box.className = "fc-sources";
    var lbl = document.createElement("span");
    lbl.className = "fc-sources-lbl";
    lbl.textContent = "From the episodes";
    box.appendChild(lbl);
    cleanSources(sources).forEach(function (s) {
      var url = safeYouTube(s.url);
      var who = s.speakers.slice(0, 2).join(", ");
      var parts = ["[" + s.n + "]", "Ep " + (s.episode || ""), s.ts ? s.ts : "episode description"];
      if (who) parts.push(who);
      var label = parts.join(" · ");
      var el;
      if (url) {
        el = document.createElement("a");
        el.href = url;
        el.target = "_blank";
        el.rel = "noopener noreferrer";
        el.title = "Open Episode " + (s.episode || "") + (s.ts ? " at " + s.ts : "") + " on YouTube";
      } else {
        el = document.createElement("span");
      }
      el.className = "fc-src";
      el.textContent = label;
      box.appendChild(el);
    });
    return box;
  }
  function addNote(text) {
    var n = document.createElement("div");
    n.className = "fc-note";
    n.textContent = text;
    els.log.appendChild(n);
    scrollLog();
  }
  function showSitting() {
    var s = document.createElement("div");
    s.className = "fc-sitting";
    s.setAttribute("role", "status");
    s.innerHTML = 'Sitting with that <span class="fc-dots" aria-hidden="true"><i></i><i></i><i></i></span>';
    els.log.appendChild(s);
    scrollLog();
    return s;
  }
  function opener() {
    if (focus) return "We are on " + focus.label + ". Ask me who said what, or tell me what stayed with you.";
    return pick(OPENERS);
  }
  function chipsFor() {
    if (!focus) return CHIPS;
    var who = focus.guest ? focus.guest.split(/\s+/)[0] : "the hosts";
    return ["What was this episode really about?", "What did " + who + " argue?", "What should I sit with from it?"];
  }
  function renderHistory() {
    els.log.innerHTML = "";
    renderFocusBar();
    if (!history.length) {
      addMsg("assistant", opener());
      renderChips();
    } else {
      history.forEach(function (m) { addMsg(m.role, m.content, m.sources); });
    }
  }
  function renderChips() {
    var c = document.createElement("div");
    c.className = "fc-chips";
    chipsFor().forEach(function (t) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "fc-chip";
      chip.textContent = t;
      chip.addEventListener("click", function () { send(t); });
      c.appendChild(chip);
    });
    els.log.appendChild(c);
    scrollLog();
  }
  function clearChips() {
    var c = els.log.querySelector(".fc-chips");
    if (c) c.remove();
  }
  function renderFocusBar() {
    if (!els.focusBar) return;
    if (focus) {
      els.focusText.textContent = "On " + focus.label;
      els.focusBar.hidden = false;
    } else {
      els.focusBar.hidden = true;
    }
  }

  // ---------- send ----------
  async function send(text) {
    text = (text || "").replace(/\s+$/, "").replace(/^\s+/, "");
    if (!text || processing) return;
    if (text.length > SEND_CAP) text = text.slice(0, SEND_CAP);
    processing = true;
    els.send.disabled = true;
    clearChips();

    addMsg("user", text);
    history.push({ role: "user", content: text });
    history = history.slice(-MAX_TURNS);
    save();
    els.input.value = "";
    autoGrow();

    var myGen = gen;
    var sitting = showSitting();
    var ctrl = new AbortController();
    active = ctrl;
    var timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT);
    var data = null;
    try {
      var outgoing = history.slice(-SEND_TURNS).map(function (m) {
        return m.role === "assistant" ? { role: m.role, content: m.content, sig: m.sig || "" } : { role: m.role, content: m.content };
      });
      var body = { messages: outgoing };
      if (focus) body.episode = focus.slug;
      var results = await Promise.all([
        fetch(WORKER_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: ctrl.signal
        }).then(function (r) { return r.json(); }).catch(function () { return null; }),
        delay(MIN_PAUSE)
      ]);
      data = results[0];
    } catch (e) {
      data = null;
    } finally {
      clearTimeout(timer);
      if (sitting && sitting.remove) sitting.remove();
      // A reset (Forget, Leave, another episode) already released the chair for the new conversation.
      if (myGen === gen) {
        processing = false;
        els.send.disabled = false;
        active = null;
      }
    }

    // The conversation was cleared or moved to another episode while this was in flight.
    if (myGen !== gen) return;

    var reply = data && typeof data.reply === "string" && data.reply.trim() ? data.reply.trim() : QUIET;
    var sources = data ? cleanSources(data.sources) : [];
    var sig = data && typeof data.sig === "string" ? data.sig.slice(0, 120) : "";

    addMsg("assistant", reply, sources);
    history.push({ role: "assistant", content: reply, sig: sig, sources: sources });
    history = history.slice(-MAX_TURNS);
    save();

    if (!noteShown) {
      noteShown = true;
      addNote("No rush. You do not have to answer right away.");
    }
    if (els.panel.classList.contains("fc-open")) els.input.focus();
  }

  // ---------- panel ----------
  function openPanel() {
    lastFocus = document.activeElement;
    els.panel.classList.add("fc-open");
    els.fab.style.display = "none";
    els.panel.setAttribute("aria-hidden", "false");
    if (!els.log.childNodes.length) renderHistory();
    clearTimeout(focusTimer);
    focusTimer = setTimeout(function () {
      if (els.panel.classList.contains("fc-open")) els.input.focus();
    }, 60);
  }
  function closePanel() {
    clearTimeout(focusTimer);
    els.panel.classList.remove("fc-open");
    els.panel.setAttribute("aria-hidden", "true");
    els.fab.style.display = "inline-flex";
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus(); else els.fab.focus();
  }
  // Start a new conversation: cancel any reply still on its way and free the input at once.
  function reset() {
    gen++;
    if (active) { try { active.abort(); } catch (e) {} active = null; }
    processing = false;
    if (els.send) els.send.disabled = false;
  }
  function forget() {
    reset();
    history = [];
    focus = null;
    save();
    noteShown = false;
    renderHistory();
  }
  // A new episode starts a new conversation: replies are signed for the episode they were written in.
  function openEpisode(slug, label, guest) {
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) return;
    if (!focus || focus.slug !== slug) {
      reset();
      history = [];
      noteShown = false;
      focus = { slug: slug, label: String(label || "this episode").slice(0, 120), guest: String(guest || "").slice(0, 80) };
      save();
      renderHistory();
    }
    openPanel();
  }
  function autoGrow() {
    els.input.style.height = "auto";
    els.input.style.height = Math.min(els.input.scrollHeight, 120) + "px";
  }

  // ---------- build ----------
  function build() {
    var root = document.createElement("div");
    root.id = "fc-root";

    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "fc-fab";
    fab.setAttribute("aria-label", "Open The Fourth Chair, a companion that knows every episode");
    fab.innerHTML = avatarRow("fc-fab-avatars") +
      '<span class="fc-fab-label">Pull up a chair<small>The Fourth Chair</small></span>';

    var panel = document.createElement("div");
    panel.className = "fc-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-label", "The Fourth Chair");
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML =
      '<div class="fc-head">' +
        avatarRow("fc-head-avatars") +
        '<div class="fc-head-title"><b>The Fourth Chair</b><span>Ask about any episode, or pause and reflect.</span></div>' +
        '<button type="button" class="fc-close" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="fc-focus" hidden><span class="fc-focus-text"></span><button type="button" class="fc-focus-x" aria-label="Leave this episode and start over">Leave</button></div>' +
      '<div class="fc-log" role="log" aria-live="polite"></div>' +
      '<div class="fc-input-wrap">' +
        '<div class="fc-input-row">' +
          '<textarea class="fc-input" rows="1" maxlength="' + SEND_CAP + '" placeholder="Ask about an episode, or say what is on your mind" aria-label="Your message"></textarea>' +
          '<button type="button" class="fc-send" aria-label="Send" title="Send">&#8593;</button>' +
        '</div>' +
        '<div class="fc-foot"><span>An AI companion, not a person</span><button type="button" class="fc-forget">Forget this conversation</button></div>' +
      '</div>';

    root.appendChild(fab);
    root.appendChild(panel);
    document.body.appendChild(root);

    els.root = root; els.fab = fab; els.panel = panel;
    els.log = panel.querySelector(".fc-log");
    els.input = panel.querySelector(".fc-input");
    els.send = panel.querySelector(".fc-send");
    els.focusBar = panel.querySelector(".fc-focus");
    els.focusText = panel.querySelector(".fc-focus-text");

    fab.addEventListener("click", openPanel);
    panel.querySelector(".fc-close").addEventListener("click", closePanel);
    panel.querySelector(".fc-forget").addEventListener("click", forget);
    panel.querySelector(".fc-focus-x").addEventListener("click", forget);
    els.send.addEventListener("click", function () { send(els.input.value); });
    els.input.addEventListener("input", autoGrow);
    els.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(els.input.value); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("fc-open")) closePanel();
    });

    load();
  }

  // Laptop only, by decision. On a phone nothing is built, stored or called (see the note in the
  // stylesheet). The test is width AND pointer, and it is live, so a window resized across the line
  // gains or loses the chair without a reload.
  var LAPTOP = "(min-width: 900px) and (hover: hover) and (pointer: fine)";
  var mq = null;
  try { mq = window.matchMedia(LAPTOP); } catch (e) {}
  function laptop() { return mq ? mq.matches : true; }

  function boot() {
    if (els.root) return;
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", boot, { once: true });
      return;
    }
    if (!laptop()) return;                 // re-checked when the deferred boot actually runs
    build();
  }
  function collapse() {
    if (!els.root) return;
    var hadFocus = els.root.contains(document.activeElement);
    clearTimeout(focusTimer);
    els.panel.classList.remove("fc-open");
    els.panel.setAttribute("aria-hidden", "true");
    els.fab.style.display = "inline-flex";
    if (hadFocus && lastFocus && lastFocus.focus &&
        document.contains(lastFocus) && !els.root.contains(lastFocus)) {
      lastFocus.focus();
    }
  }
  function sync() {
    var on = laptop();
    if (on) boot(); else collapse();
    // The "Talk about this episode" buttons are shown only while the chair exists and the device qualifies.
    document.documentElement.classList.toggle("fc-ready", !!(on && els.root));
  }

  // Episode buttons anywhere on the page: <button data-fc-episode="slug" data-fc-title="..." data-fc-guest="...">
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-fc-episode]") : null;
    if (!t) return;
    if (!laptop() || !els.root) return;
    e.preventDefault();
    openEpisode(t.getAttribute("data-fc-episode") || "", t.getAttribute("data-fc-title") || "", t.getAttribute("data-fc-guest") || "");
  });

  if (mq) {
    if (mq.addEventListener) mq.addEventListener("change", sync);
    else if (mq.addListener) mq.addListener(sync);   // Safari below 14
  }
  if (document.body) sync();
  else document.addEventListener("DOMContentLoaded", sync, { once: true });
})();
