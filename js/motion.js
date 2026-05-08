// ═══════════════════════════════════════════════════
// MOTION LAYER — cursor, tilt, scroll, transitions, waveform
// ═══════════════════════════════════════════════════

(() => {
  const isTouch = matchMedia('(hover: none)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── INTRO LOADER ───
  function startIntro() {
    if (reducedMotion) {
      document.querySelector('.intro')?.remove();
      return Promise.resolve();
    }
    return new Promise((res) => {
      const intro = document.querySelector('.intro');
      if (!intro) return res();
      // exit after 2.6s (matches CSS exit delay)
      setTimeout(() => {
        intro.classList.add('exit');
        setTimeout(() => { intro.remove(); res(); }, 1400);
      }, 50);
    });
  }

  // ─── CUSTOM CURSOR ───
  function initCursor() {
    if (isTouch) return;
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

    // Reduced motion: just pin the cursor to the pointer with no easing/rAF loop
    if (reducedMotion) {
      document.addEventListener('mousemove', e => {
        dot.style.setProperty('--cur-x', e.clientX + 'px');
        dot.style.setProperty('--cur-y', e.clientY + 'px');
        ring.style.setProperty('--cur-x', e.clientX + 'px');
        ring.style.setProperty('--cur-y', e.clientY + 'px');
      });
      return;
    }

    // Spring-smoothed ring + lightly eased dot for buttery motion
    const STIFFNESS = 0.18;
    const DAMPING   = 0.84;
    const DOT_EASE  = 0.35;
    function loop() {
      dx += (mx - dx) * DOT_EASE;
      dy += (my - dy) * DOT_EASE;
      vx = (vx + (mx - rx) * STIFFNESS) * DAMPING;
      vy = (vy + (my - ry) * STIFFNESS) * DAMPING;
      rx += vx; ry += vy;
      dot.style.setProperty('--cur-x', dx + 'px');
      dot.style.setProperty('--cur-y', dy + 'px');
      ring.style.setProperty('--cur-x', rx + 'px');
      ring.style.setProperty('--cur-y', ry + 'px');
      requestAnimationFrame(loop);
    }
    loop();

    // hover states
    const setState = (s) => {
      document.body.classList.remove('cursor-hover','cursor-play','cursor-text');
      if (s) document.body.classList.add('cursor-' + s);
    };
    document.addEventListener('mouseover', e => {
      const t = e.target;
      if (t.closest('.ep-thumb, .hero-cover-img, [data-cursor="play"]')) setState('play');
      else if (t.closest('a, button, [data-cursor="hover"], .ep-card, .blog-card, .quote-card, .host')) setState('hover');
      else if (t.closest('input, textarea')) setState('text');
      else setState(null);
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
    const tick = () => nav.classList.toggle('scrolled', scrollY > 40);
    addEventListener('scroll', tick, { passive: true });
    tick();
  }

  // ─── SPLIT TEXT ───
  function splitText(el) {
    if (!el || el.dataset.split) return;
    el.dataset.split = '1';
    el.classList.add('split');
    const html = el.innerHTML;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const out = [];
    function walk(node) {
      if (node.nodeType === 3) {
        const words = node.textContent.split(/(\s+)/);
        words.forEach(w => {
          if (/^\s+$/.test(w)) out.push(' ');
          else if (w) out.push(`<span class="word"><span>${w}</span></span>`);
        });
      } else if (node.nodeType === 1) {
        const tag = node.tagName.toLowerCase();
        const cls = node.className ? ` class="${node.className}"` : '';
        out.push(`<${tag}${cls}>`);
        node.childNodes.forEach(walk);
        out.push(`</${tag}>`);
      }
    }
    tmp.childNodes.forEach(walk);
    el.innerHTML = out.join('');
  }

  // ─── SCROLL REVEAL ───
  function initReveal() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

    document.querySelectorAll('.reveal, .reveal-stagger, .split, .blog-card').forEach(el => {
      if (el.classList.contains('in')) return;
      obs.observe(el);
    });
  }

  window.refreshReveal = function() {
    initReveal();
  };

  // ─── 3D TILT + CURSOR-AWARE GLOW (rAF-throttled) ───
  function initTilt() {
    if (isTouch || reducedMotion) return;
    let lastEvent = null;
    let pending = false;
    function flush() {
      pending = false;
      if (!lastEvent) return;
      const card = lastEvent.target.closest('.tilt');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (lastEvent.clientX - r.left) / r.width  - 0.5;
      const py = (lastEvent.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(1100px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg) translateY(-6px)`;
      card.style.setProperty('--mx', ((lastEvent.clientX - r.left) / r.width)  * 100 + '%');
      card.style.setProperty('--my', ((lastEvent.clientY - r.top)  / r.height) * 100 + '%');
    }
    document.addEventListener('mousemove', e => {
      lastEvent = e;
      if (pending) return;
      pending = true;
      requestAnimationFrame(flush);
    });
    function reset(card) {
      card.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg) translateY(0)';
      setTimeout(() => { if (card.matches(':hover')) return; card.style.transform = ''; }, 450);
    }
    document.addEventListener('mouseout', e => {
      const card = e.target.closest && e.target.closest('.tilt');
      if (card && !card.contains(e.relatedTarget)) reset(card);
    }, true);
  }
  // Attach tilt to dynamically created cards (episode + blog + host only — not round cover image)
  window.applyTilt = function(scope = document) {
    if (isTouch || reducedMotion) return;
    scope.querySelectorAll('.ep-card, .blog-card, .host').forEach(c => {
      if (c.classList.contains('tilt')) return;
      c.classList.add('tilt');
    });
  };

  // ─── MAGNETIC BUTTONS (rAF-throttled) ───
  function initMagnetic() {
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
    if (reducedMotion) return;
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
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(c);
    function draw() {
      if (!visible) { requestAnimationFrame(draw); return; }
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
      requestAnimationFrame(draw);
    }
    draw();
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
    }, 600);
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
