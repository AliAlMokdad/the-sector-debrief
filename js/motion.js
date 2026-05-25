// ═══════════════════════════════════════════════════
// MOTION LAYER · cursor, tilt, scroll, transitions, waveform
// ═══════════════════════════════════════════════════

(() => {
  const isTouch = matchMedia('(hover: none)').matches;
  // Track prefers-reduced-motion live: if the user toggles the OS setting while
  // the page is open, in-flight rAF loops (cursor, waveform) check this value on
  // each tick and bail out. Note: re-enabling motion after toggle-off requires a
  // page reload to re-arm the disabled effects.
  const _rmQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = _rmQuery.matches;
  const _rmListener = e => { reducedMotion = e.matches; };
  if (typeof _rmQuery.addEventListener === 'function') _rmQuery.addEventListener('change', _rmListener);
  else if (typeof _rmQuery.addListener === 'function') _rmQuery.addListener(_rmListener);  // Safari < 14

  // ─── INTRO LOADER ───
  function startIntro() {
    if (reducedMotion) {
      document.querySelector('.intro')?.remove();
      return Promise.resolve();
    }
    return new Promise((res) => {
      const intro = document.querySelector('.intro');
      if (!intro) return res();
      let resolved = false;
      function finish() {
        if (resolved) return;
        resolved = true;
        intro.classList.add('exit');
        setTimeout(() => { intro.remove(); res(); }, 1400);
      }
      // Click anywhere on the intro to skip
      intro.addEventListener('click', finish, { once: true });
      // Esc to skip
      const onKey = (e) => { if (e.key === 'Escape') finish(); };
      document.addEventListener('keydown', onKey);
      // Default automatic dismiss
      setTimeout(finish, 50);
      setTimeout(() => document.removeEventListener('keydown', onKey), 2000);
    });
  }

  // ─── CUSTOM CURSOR (disabled 2026-05-25) ───
  // The custom cursor was the actual source of "bad mouse movement" complaints.
  // Spring physics on the ring intentionally trails the OS pointer — that lag
  // IS what users feel as "heavy." The OS-rendered native cursor is by definition
  // the smoothest possible cursor experience: it runs in the compositor process,
  // not on the main JS thread, and has zero coupling to page rendering work.
  //
  // Replacing the JS cursor with the native one also removes:
  //   - 1500+ elements with `cursor: none !important` cascade
  //   - Per-frame --cur-x / --cur-y CSS variable writes
  //   - body class swaps (cursor-hover / cursor-play / cursor-text) that
  //     triggered style recalc against the whole document
  //   - Cursor mousemove + mouseover delegation
  //
  // Standard `cursor: pointer` on links and buttons (browser default) plus
  // `cursor: text` on inputs (browser default) handles the hover-state signaling
  // the custom cursor was conveying. No visual regression that matters.
  function initCursor() {
    return;  // intentionally a no-op
    // The legacy implementation is kept below as dead code so the previous
    // behaviour is recoverable if Ali ever wants it back. The early return
    // means none of this runs.
    /* eslint-disable */
    if (isTouch || reducedMotion) return;
    document.body.classList.add('has-cursor');
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.append(dot, ring);

    let mx = innerWidth/2, my = innerHeight/2;
    let dx = mx, dy = my;     // dot position (lightly eased)
    let rx = mx, ry = my;     // ring position (more eased)
    let vx = 0, vy = 0;       // ring velocity for spring smoothing
    let cursorReady = false;   // prevent (0,0) flash before first mousemove

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (!cursorReady) {
        cursorReady = true;
        dot.style.opacity = 1;
        ring.style.opacity = 1;
      }
    });
    document.addEventListener('mouseleave', () => { dot.style.opacity = 0; ring.style.opacity = 0; });
    document.addEventListener('mouseenter', () => {
      if (cursorReady) { dot.style.opacity = 1; ring.style.opacity = 1; }
    });

    // Spring-smoothed ring + lightly eased dot for buttery motion.
    // Idles the rAF loop when the spring has converged (mouse held still) so the
    // browser isn't doing 60fps style-recalc on a stationary cursor. Re-arms on
    // the next mousemove.
    const STIFFNESS = 0.18;
    const DAMPING   = 0.84;
    const DOT_EASE  = 0.35;
    const IDLE_EPS  = 0.05;
    let rafId = null;
    function loop() {
      // Bail out if reduced-motion was toggled on mid-session — snap to pointer.
      if (reducedMotion) {
        dot.style.setProperty('--cur-x', mx + 'px');
        dot.style.setProperty('--cur-y', my + 'px');
        ring.style.setProperty('--cur-x', mx + 'px');
        ring.style.setProperty('--cur-y', my + 'px');
        rafId = null;
        return;
      }
      dx += (mx - dx) * DOT_EASE;
      dy += (my - dy) * DOT_EASE;
      vx = (vx + (mx - rx) * STIFFNESS) * DAMPING;
      vy = (vy + (my - ry) * STIFFNESS) * DAMPING;
      rx += vx; ry += vy;
      dot.style.setProperty('--cur-x', dx + 'px');
      dot.style.setProperty('--cur-y', dy + 'px');
      ring.style.setProperty('--cur-x', rx + 'px');
      ring.style.setProperty('--cur-y', ry + 'px');
      const settled = Math.abs(mx - dx) + Math.abs(my - dy)
                    + Math.abs(mx - rx) + Math.abs(my - ry)
                    + Math.abs(vx) + Math.abs(vy) < IDLE_EPS;
      if (settled) { rafId = null; return; }
      rafId = requestAnimationFrame(loop);
    }
    function wake() { if (rafId == null) rafId = requestAnimationFrame(loop); }
    document.addEventListener('mousemove', wake, { passive: true });
    wake();

    // hover states (rAF-throttled · `mouseover` fires on every element boundary)
    let currentState = null;
    const setState = (s) => {
      if (s === currentState) return;
      currentState = s;
      document.body.classList.remove('cursor-hover','cursor-play','cursor-text');
      if (s) document.body.classList.add('cursor-' + s);
    };
    let hoverPending = false;
    let hoverTarget = null;
    document.addEventListener('mouseover', e => {
      hoverTarget = e.target;
      if (hoverPending) return;
      hoverPending = true;
      requestAnimationFrame(() => {
        hoverPending = false;
        const t = hoverTarget;
        if (!t || !t.closest) return;
        if (t.closest('.ep-thumb, .hero-cover-img, [data-cursor="play"]')) setState('play');
        else if (t.closest('a, button, [data-cursor="hover"], .ep-card, .blog-card, .quote-card, .host')) setState('hover');
        else if (t.closest('input, textarea')) setState('text');
        else setState(null);
      });
    });
  }

  // ─── SCROLL PROGRESS (transform: scaleX, rAF-throttled) ───
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-prog';
    document.body.appendChild(bar);
    let pending = false;
    const tick = () => {
      pending = false;
      const h = document.documentElement;
      const pct = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      bar.style.transform = `scaleX(${isFinite(pct) ? pct : 0})`;
    };
    addEventListener('scroll', () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(tick);
    }, { passive: true });
    tick();
  }

  // ─── NAV scroll-shrink ───
  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const tick = () => nav.classList.toggle('scrolled', scrollY > 40);
    addEventListener('scroll', tick, { passive: true });
    tick();
  }

  // ─── SPLIT TEXT (preserves all attributes on inner elements) ───
  function splitText(el) {
    if (!el || el.dataset.split) return;
    el.dataset.split = '1';
    el.classList.add('split');
    const tmp = document.createElement('div');
    tmp.innerHTML = el.innerHTML;
    const escAttrVal = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const out = [];
    function walk(node) {
      if (node.nodeType === 3) {
        const words = node.textContent.split(/(\s+)/);
        words.forEach(w => {
          if (/^\s+$/.test(w)) out.push(' ');
          else if (w) out.push(`<span class="word"><span>${escText(w)}</span></span>`);
        });
      } else if (node.nodeType === 1) {
        const tag = node.tagName.toLowerCase();
        const attrs = [...node.attributes].map(a => `${a.name}="${escAttrVal(a.value)}"`).join(' ');
        out.push(`<${tag}${attrs ? ' ' + attrs : ''}>`);
        node.childNodes.forEach(walk);
        out.push(`</${tag}>`);
      }
    }
    tmp.childNodes.forEach(walk);
    el.innerHTML = out.join('');
  }
  // Expose for app.js to re-split dynamic headings if needed
  window.splitText = splitText;

  // ─── SCROLL REVEAL ───
  // app.js calls window.refreshReveal() on every SPA navigation, which calls this
  // function. We must disconnect the previous observer before creating a new one,
  // otherwise observers accumulate across navigations (memory + perf leak).
  let revealObs = null;
  function initReveal() {
    if (revealObs) { revealObs.disconnect(); revealObs = null; }
    revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

    document.querySelectorAll('.reveal, .reveal-stagger, .split, .blog-card').forEach(el => {
      if (el.classList.contains('in')) return;
      revealObs.observe(el);
    });
  }

  window.refreshReveal = function() {
    initReveal();
  };

  // ─── 3D TILT + CURSOR-AWARE GLOW (rAF-throttled, hover-gated) ───
  // Only listens to mousemove while the pointer is actually inside a .tilt card.
  // Previously this attached a global mousemove that ran closest('.tilt') on
  // every event, queuing rAF + a getBoundingClientRect even when the pointer
  // was nowhere near a card.
  function initTilt() {
    if (isTouch || reducedMotion) return;
    let activeCard = null;
    let lastEvent = null;
    let pending = false;
    function flush() {
      pending = false;
      if (!activeCard || !lastEvent) return;
      if (!activeCard.isConnected) { activeCard = null; return; }
      const r = activeCard.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const px = (lastEvent.clientX - r.left) / r.width  - 0.5;
      const py = (lastEvent.clientY - r.top)  / r.height - 0.5;
      activeCard.style.transform = `perspective(1100px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg) translateY(-6px)`;
      activeCard.style.setProperty('--mx', ((lastEvent.clientX - r.left) / r.width)  * 100 + '%');
      activeCard.style.setProperty('--my', ((lastEvent.clientY - r.top)  / r.height) * 100 + '%');
    }
    function onCardMove(e) {
      lastEvent = e;
      if (pending) return;
      pending = true;
      requestAnimationFrame(flush);
    }
    function reset(card) {
      card.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg) translateY(0)';
      setTimeout(() => { if (card.matches(':hover')) return; card.style.transform = ''; }, 450);
    }
    // Delegate via mouseover/mouseout (bubble) so this works for dynamically added cards.
    document.addEventListener('mouseover', e => {
      const card = e.target.closest && e.target.closest('.tilt');
      if (!card || card === activeCard) return;
      activeCard = card;
      card.addEventListener('mousemove', onCardMove);
    });
    document.addEventListener('mouseout', e => {
      const card = e.target.closest && e.target.closest('.tilt');
      if (card && !card.contains(e.relatedTarget)) {
        card.removeEventListener('mousemove', onCardMove);
        if (activeCard === card) activeCard = null;
        reset(card);
      }
    }, true);
  }
  // Attach tilt to dynamically created cards (episode + blog + host only · not round cover image)
  window.applyTilt = function(scope = document) {
    if (isTouch || reducedMotion) return;
    scope.querySelectorAll('.ep-card, .blog-card, .host').forEach(c => {
      if (c.classList.contains('tilt')) return;
      c.classList.add('tilt');
    });
  };

  // ─── MAGNETIC BUTTONS (disabled 2026-05-25) ───
  // 16 magnetic buttons on the page, each with its own mousemove listener.
  // Even rAF-throttled, hovering ANY button triggered a per-frame translate3d
  // update that re-promoted the button to its own composite layer and contributed
  // to the "mouse feels weird" experience. Standard CSS :hover effects already
  // signal interactivity; the magnetic pull was decorative noise.
  function initMagnetic() {
    return;  // intentionally a no-op
    /* eslint-disable */
    if (isTouch || reducedMotion) return;
    document.querySelectorAll('.platform-btn, .nav-cta, .form-submit, .ep-link.primary, .section-link').forEach(btn => {
      if (btn.dataset.magnetic) return;
      btn.dataset.magnetic = '1';
      btn.classList.add('magnetic');
      let pending = false, lastE = null;
      btn.addEventListener('mousemove', e => {
        lastE = e;
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          if (!lastE) return;
          const r = btn.getBoundingClientRect();
          const x = lastE.clientX - r.left - r.width / 2;
          const y = lastE.clientY - r.top  - r.height / 2;
          btn.style.transform = `translate3d(${x * 0.22}px, ${y * 0.3}px, 0)`;
        });
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate3d(0,0,0)';
        setTimeout(() => { if (!btn.matches(':hover')) btn.style.transform = ''; }, 350);
      });
    });
  }
  window.applyMagnetic = function() { initMagnetic(); };

  // ─── PARALLAX BRUSHES (rAF-throttled, skip hidden) ───
  function initParallax() {
    // Skip parallax on touch devices · saves battery, prevents jank, and the
    // brushes are already hidden via @media (max-width: 640px) anyway.
    if (reducedMotion || isTouch) return;
    const els = document.querySelectorAll('.brush');
    if (!els.length) return;
    let pending = false;
    addEventListener('scroll', () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const y = scrollY;
        els.forEach((el, i) => {
          if (el.offsetParent === null) return;
          el.style.translate = `0 ${y * (i + 1) * 0.08}px`;
        });
      });
    }, { passive: true });
  }

  // ─── AUDIO WAVEFORM CANVAS ───
  function initWaveform() {
    const c = document.getElementById('waveform');
    if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = devicePixelRatio || 1;
    function resize() {
      c.width = c.offsetWidth * dpr;
      c.height = c.offsetHeight * dpr;
    }
    resize();
    addEventListener('resize', resize);

    const bars = 64;
    const phases = Array.from({length: bars}, () => Math.random() * Math.PI * 2);
    const speeds = Array.from({length: bars}, () => 0.04 + Math.random() * 0.06);

    let t = 0;
    let visible = true;
    let rafId = null;
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !rafId) rafId = requestAnimationFrame(draw);
    }).observe(c);
    function draw() {
      rafId = null;
      if (!visible || reducedMotion) return;
      t += 0.04;
      ctx.clearRect(0, 0, c.width, c.height);
      const w = c.width, h = c.height;
      const bw = w / bars;
      const baseColor1 = '#1E3D7A';
      const baseColor2 = '#B83A2A';
      const baseColor3 = '#E8B82C';

      for (let i = 0; i < bars; i++) {
        phases[i] += speeds[i];
        const a = Math.sin(phases[i]) * 0.5
                + Math.sin(t * 0.6 + i * 0.2) * 0.3
                + Math.sin(t * 1.4 + i * 0.5) * 0.2;
        const amp = (Math.abs(a) * 0.6 + 0.2) * h * 0.85;
        const y = (h - amp) / 2;

        let color = baseColor1;
        if (i % 7 === 0) color = baseColor2;
        else if (i % 5 === 0) color = baseColor3;

        ctx.fillStyle = color;
        const x = i * bw + bw * 0.2;
        const barW = bw * 0.6;
        const radius = barW / 2;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barW - radius, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
        ctx.lineTo(x + barW, y + amp - radius);
        ctx.quadraticCurveTo(x + barW, y + amp, x + barW - radius, y + amp);
        ctx.lineTo(x + radius, y + amp);
        ctx.quadraticCurveTo(x, y + amp, x, y + amp - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();
      }
      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);
  }

  // ─── PAGE TRANSITION CURTAIN ───
  function makeCurtain() {
    let c = document.querySelector('.curtain');
    if (c) return c;
    c = document.createElement('div');
    c.className = 'curtain';
    c.innerHTML = '<span></span><span></span><span></span><span></span><span></span><span></span>';
    document.body.appendChild(c);
    return c;
  }
  window.navigateWithCurtain = function(page, navigateFn) {
    if (reducedMotion) { navigateFn(page); return; }
    const c = makeCurtain();
    c.classList.remove('exit');
    c.classList.add('enter');
    setTimeout(() => {
      navigateFn(page);
      c.classList.remove('enter');
      c.classList.add('exit');
      setTimeout(() => { c.classList.remove('exit'); }, 700);
    }, 750);
  };

  // ─── SHARE SPARKLE ───
  window.sparkBurst = function(x, y) {
    const colors = ['#E8B82C','#B83A2A','#1E3D7A','#C26830'];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('div');
      s.className = 'spark';
      const angle = (Math.PI * 2 * i) / 14;
      const dist = 60 + Math.random() * 50;
      s.style.left = x + 'px';
      s.style.top  = y + 'px';
      s.style.background = colors[i % colors.length];
      s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
  };

  // ─── INIT ───
  document.addEventListener('DOMContentLoaded', async () => {
    startIntro();
    initCursor();
    initScrollProgress();
    initNavScroll();
    initParallax();

    document.querySelectorAll('[data-split]').forEach(splitText);

    setTimeout(() => {
      initReveal();
      initTilt();
      window.applyTilt(document);
      initMagnetic();
      initWaveform();
    }, 50);
  });
})();
