/* The Fourth Chair - reflective companion widget for The Sector Debrief.
   Self-injecting. Calls the Cloudflare Worker (soul + free gpt-oss). No tracking. */
(function () {
  "use strict";

  var WORKER_URL = "https://fourth-chair.ankommer.workers.dev";
  var STORE_KEY = "fourthchair_v1";
  var MAX_TURNS = 20;     // keep the last N messages on device
  var SEND_CAP = 2000;    // input char cap
  var MIN_PAUSE = 1200;   // the bot never answers instantly

  var AV = {
    kim: "assets/fourthchair-kim.jpg",
    thomas: "assets/fourthchair-thomas.jpg",
    ali: "assets/fourthchair-ali.jpg",
    robot: "assets/fourthchair-robot.jpg"
  };

  var OPENERS = [
    "Pull up the fourth chair. What is the question this piece left sitting with you?",
    "Before we talk about the sector, what is the one thing from this week you have not said out loud yet?",
    "Sit down a second. What is actually on your mind about the work right now?"
  ];
  var CHIPS = [
    "A question from this week",
    "Something I keep avoiding",
    "I do not know where to start"
  ];

  var history = [];       // [{role:'user'|'assistant', content}]
  var processing = false;
  var noteShown = false;
  var lastFocus = null;
  var gen = 0;            // bumped on forget; discards in-flight replies from a cleared conversation
  var focusTimer = null;
  var els = {};

  // ---------- helpers ----------
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) { var a = JSON.parse(raw); if (Array.isArray(a)) history = a.slice(-MAX_TURNS); }
    } catch (e) {}
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-MAX_TURNS))); } catch (e) {}
  }
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

  // ---------- rendering ----------
  function addMsg(role, text) {
    var wrap = document.createElement("div");
    wrap.className = "fc-msg " + (role === "user" ? "fc-user" : "fc-bot");
    var b = document.createElement("div");
    b.className = "fc-bubble";
    b.textContent = text;            // textContent = no HTML injection
    wrap.appendChild(b);
    els.log.appendChild(wrap);
    scrollLog();
    return wrap;
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
    s.setAttribute("aria-live", "polite");
    s.innerHTML = 'Sitting with that <span class="fc-dots"><i></i><i></i><i></i></span>';
    els.log.appendChild(s);
    scrollLog();
    return s;
  }
  function renderHistory() {
    els.log.innerHTML = "";
    if (!history.length) {
      addMsg("assistant", pick(OPENERS));
      renderChips();
    } else {
      history.forEach(function (m) { addMsg(m.role, m.content); });
    }
  }
  function renderChips() {
    var c = document.createElement("div");
    c.className = "fc-chips";
    CHIPS.forEach(function (t) {
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

  // ---------- send ----------
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function send(text) {
    text = (text || "").trim();
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
    var timer = setTimeout(function () { ctrl.abort(); }, 25000);
    var reply = "";
    try {
      var results = await Promise.all([
        fetch(WORKER_URL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: history.slice(-8) }),
          signal: ctrl.signal
        }).then(function (r) { return r.json(); }).catch(function () { return null; }),
        delay(MIN_PAUSE)
      ]);
      var data = results[0];
      reply = (data && typeof data.reply === "string" && data.reply.trim())
        ? data.reply.trim()
        : "Something went quiet for a moment. Take one breath, and try me again when you are ready.";
    } catch (e) {
      reply = "Something went quiet for a moment. Take one breath, and try me again when you are ready.";
    } finally {
      clearTimeout(timer);
      if (sitting && sitting.remove) sitting.remove();
      processing = false;
      els.send.disabled = false;
    }

    // Conversation was cleared (Forget) while this was in flight: drop the stale reply.
    if (myGen !== gen) return;

    addMsg("assistant", reply);
    history.push({ role: "assistant", content: reply });
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
    if (lastFocus && lastFocus.focus) lastFocus.focus(); else els.fab.focus();
  }
  function forget() {
    gen++;              // any in-flight reply from the old conversation is now discarded
    history = [];
    save();
    noteShown = false;
    renderHistory();
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
    fab.setAttribute("aria-label", "Open The Fourth Chair, a reflective companion");
    fab.innerHTML = avatarRow("fc-fab-avatars") +
      '<span class="fc-fab-label">Pull up a chair<small>The Fourth Chair</small></span>';

    var panel = document.createElement("div");
    panel.className = "fc-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-label", "The Fourth Chair, a reflective companion");
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML =
      '<div class="fc-head">' +
        avatarRow("fc-head-avatars") +
        '<div class="fc-head-title"><b>The Fourth Chair</b><span>Pause and reflect. One question at a time.</span></div>' +
        '<button type="button" class="fc-close" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="fc-log" role="log" aria-live="polite"></div>' +
      '<div class="fc-input-wrap">' +
        '<div class="fc-input-row">' +
          '<textarea class="fc-input" rows="1" maxlength="' + SEND_CAP + '" placeholder="Say what is on your mind"></textarea>' +
          '<button type="button" class="fc-send" aria-label="Send" title="Send">&#8593;</button>' +
        '</div>' +
        '<div class="fc-foot"><span>A reflective companion, not a person</span><button type="button" class="fc-forget">Forget this conversation</button></div>' +
      '</div>';

    root.appendChild(fab);
    root.appendChild(panel);
    document.body.appendChild(root);

    els.root = root; els.fab = fab; els.panel = panel;
    els.log = panel.querySelector(".fc-log");
    els.input = panel.querySelector(".fc-input");
    els.send = panel.querySelector(".fc-send");

    fab.addEventListener("click", openPanel);
    panel.querySelector(".fc-close").addEventListener("click", closePanel);
    panel.querySelector(".fc-forget").addEventListener("click", forget);
    els.send.addEventListener("click", function () { send(els.input.value); });
    els.input.addEventListener("input", autoGrow);
    els.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(els.input.value); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("fc-open")) closePanel();
    });

    load();
  }

  // The Fourth Chair is a laptop feature by decision, not by accident. It asks one considered
  // question at a time and expects a typed reflection, which is a keyboard interaction; on a phone
  // the launcher alone measured 235px, sixty percent of a 390px screen, sat permanently over the
  // content and could not be dismissed, and the panel would then compete with the on-screen
  // keyboard for what little was left.
  //
  // So on a phone it does not merely hide: it never builds. No element is created, no conversation
  // is read from or written to storage, and the Worker is never called. A phone visitor downloads
  // the file and runs none of it.
  //
  // The test is width AND pointer, not width alone. A phone in landscape can clear a width
  // threshold while still being a touch device with no keyboard, and `pointer: fine` is what
  // actually separates a trackpad or mouse from a fingertip. 900px keeps it off phones and
  // portrait tablets while every laptop clears it comfortably.
  //
  // It is a LIVE test, not a single reading taken at load. Two things depend on that. A laptop
  // window that starts narrow and is maximised afterwards has to receive the widget without a
  // reload. And one that starts wide and is dragged narrow has to stop BEHAVING as though its
  // panel were open, because the stylesheet only hides it: the panel's Escape handler sits on the
  // document alongside the site's own modal handler, and a stale open panel would keep answering
  // that key and pull focus away from whatever the modal had just restored it to.
  var LAPTOP = "(min-width: 900px) and (hover: hover) and (pointer: fine)";
  var mq = null;
  try { mq = window.matchMedia(LAPTOP); } catch (e) {}

  function laptop() { return mq ? mq.matches : true; }  // no matchMedia: the widget, not nothing

  function boot() {
    if (els.root) return;                 // built once, never twice
    if (!document.body) {                 // script reached before the body it appends to
      document.addEventListener("DOMContentLoaded", boot, { once: true });
      return;
    }
    build();
  }

  // Leaving the laptop range. The stylesheet takes care of the pixels; this puts the state back in
  // step, and moves focus only if focus was actually inside the widget being hidden.
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

  function sync() { if (laptop()) boot(); else collapse(); }

  if (mq) {
    if (mq.addEventListener) mq.addEventListener("change", sync);
    else if (mq.addListener) mq.addListener(sync);   // Safari below 14
  }
  sync();
})();
