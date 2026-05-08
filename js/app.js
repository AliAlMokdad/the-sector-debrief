// ═══════════════════════════════════════════════════
// THE SECTOR DEBRIEF — Application
// ═══════════════════════════════════════════════════

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const fmtMonthYear = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

const state = {
  page: 'home',
  search: '',
  theme: null,
  player: { active: false, ep: null },
  lastTrigger: null  // element to restore focus to when a modal closes
};

// ─── ROUTER ───
function _doNavigate(page, opts) {
  opts = opts || {};
  state.page = page;
  $$('.page').forEach(p => p.classList.toggle('active', p.dataset.page === page));
  $$('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.page === page));
  if (!opts.preserveScroll) {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  if (location.hash !== '#' + page) {
    const method = history.state?.page ? 'pushState' : 'replaceState';
    history[method]({ page }, '', '#' + page);
  }
  closeMobileNav();
  setTimeout(() => {
    if (window.refreshReveal) window.refreshReveal();
    if (window.applyTilt) window.applyTilt();
    if (window.applyMagnetic) window.applyMagnetic();
  }, 60);
}
function navigate(page) {
  closeMobileNav();
  while ($$('.modal-backdrop.active').length) closeModal();
  if (window.navigateWithCurtain && state.page !== page) {
    window.navigateWithCurtain(page, _doNavigate);
  } else {
    _doNavigate(page);
  }
}

// ─── HERO / HOME ───
function renderHome() {
  const latest = $('#home-episodes');
  latest.innerHTML = EPISODES.slice(0, 3).map(epCard).join('');
  bindEpCards(latest);

  const setStat = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  setStat('#stat-episodes', STATS.episodes);
  setStat('#stat-views',    STATS.views);
}

// ─── EPISODE CARD ───
function epCard(ep) {
  return `
    <article class="ep-card" data-ep-id="${ep.id}">
      <div class="ep-thumb" data-ep="${ep.id}">
        <img src="https://i.ytimg.com/vi/${ep.id}/hqdefault.jpg" alt="${ep.title}"/>
        <div class="ep-thumb-overlay">
          <span class="ep-thumb-num">Ep ${String(ep.n).padStart(2,'0')}</span>
        </div>
        <div class="ep-thumb-play"></div>
      </div>
      <div class="ep-body">
        <div class="ep-meta">
          <span>${fmtMonthYear(ep.date)}</span>
          ${ep.duration ? `<span>·</span><span>${ep.duration}</span>` : ''}
          ${ep.guest ? `<span class="ep-meta-tag">w/ ${ep.guest.split(' ')[0]}</span>` : ''}
        </div>
        <h3 class="ep-title" data-ep="${ep.id}">${ep.title}</h3>
        <p class="ep-desc">${ep.description}</p>
        <div class="ep-actions">
          <a class="ep-link primary" href="https://www.youtube.com/watch?v=${ep.id}" target="_blank" rel="noopener noreferrer">▶ YouTube</a>
          <a class="ep-link" href="${PLATFORMS.spotify}" target="_blank" rel="noopener noreferrer">Spotify</a>
          <a class="ep-link" href="${PLATFORMS.apple}" target="_blank" rel="noopener noreferrer">Apple</a>
        </div>
      </div>
    </article>
  `;
}
function bindEpCards(scope) {
  $$('.ep-thumb, .ep-title', scope).forEach(t => {
    t.addEventListener('click', () => {
      const ep = EPISODES.find(e => e.id === t.dataset.ep);
      if (ep) openEpisode(ep);
    });
  });
  $$('.ep-feat-thumb, .ep-feat-title', scope).forEach(t => {
    t.addEventListener('click', () => {
      const ep = EPISODES.find(e => e.id === t.dataset.ep);
      if (ep) openEpisode(ep);
    });
  });
}

// ─── EPISODES PAGE ───
function renderEpisodes() {
  const featured = $('#ep-featured');
  const grid = $('#episodes-grid');

  const filtered = EPISODES.filter(ep => {
    if (!state.search) return true;
    const q = state.search.toLowerCase();
    return ep.title.toLowerCase().includes(q)
        || ep.description.toLowerCase().includes(q)
        || (ep.guest || '').toLowerCase().includes(q)
        || ep.themes.some(t => t.toLowerCase().includes(q));
  });

  const isFiltering = !!state.search;
  if (featured) featured.style.display = isFiltering ? 'none' : '';

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="ep-empty" style="grid-column:1/-1;">
        <div class="ep-empty-icon" aria-hidden="true">⌕</div>
        <h3 class="ep-empty-title">No episodes match "${state.search}"</h3>
        <p class="ep-empty-sub">Try a different word, or browse them all.</p>
        <button type="button" class="ep-empty-btn" onclick="document.getElementById('search-input').value=''; state.search=''; renderEpisodes();">Clear search</button>
      </div>`;
    return;
  }

  if (isFiltering) {
    grid.innerHTML = filtered.map(epCard).join('');
  } else {
    if (featured) {
      featured.innerHTML = renderFeaturedEpisode(filtered[0]);
      bindEpCards(featured);
    }
    grid.innerHTML = filtered.slice(1).map(epCard).join('');
  }
  bindEpCards(grid);
  if (window.applyTilt) {
    window.applyTilt(grid);
    if (featured) window.applyTilt(featured);
  }
}

function renderFeaturedEpisode(ep) {
  const themeChips = ep.themes.map(t => `<span class="theme-chip">${t}</span>`).join('');
  return `
    <div class="ep-feat-thumb" data-ep="${ep.id}">
      <img src="https://i.ytimg.com/vi/${ep.id}/maxresdefault.jpg" alt="${ep.title}" onerror="this.src='https://i.ytimg.com/vi/${ep.id}/hqdefault.jpg'"/>
      <div class="ep-feat-overlay">
        <div class="ep-feat-num">E${String(ep.n).padStart(2,'0')}</div>
        <div class="ep-feat-play"></div>
      </div>
    </div>
    <div class="ep-feat-body">
      <div class="ep-feat-tag">★ Latest Episode</div>
      <h3 class="ep-feat-title" data-ep="${ep.id}">${ep.title}</h3>
      <div class="ep-feat-meta">
        <span>${fmtDate(ep.date)}</span>
        ${ep.duration ? `<span>·</span><span>${ep.duration}</span>` : ''}
        ${ep.guest ? `<span>·</span><span>w/ ${ep.guest}</span>` : ''}
      </div>
      <div class="ep-feat-themes">${themeChips}</div>
      <p class="ep-feat-desc">${ep.description}</p>
      <div class="ep-actions">
        <a class="ep-link primary" href="https://www.youtube.com/watch?v=${ep.id}" target="_blank" rel="noopener noreferrer">▶ Watch on YouTube</a>
        <a class="ep-link" href="${PLATFORMS.spotify}" target="_blank" rel="noopener noreferrer">Spotify</a>
        <a class="ep-link" href="${PLATFORMS.apple}" target="_blank" rel="noopener noreferrer">Apple</a>
      </div>
    </div>
  `;
}

// ─── BLOG COVER GENERATOR ─────────────────────────────────
const BLOG_COVER_THEMES = {
  0: { bg: '#FAF6EA', fg: '#1A1614', accent: '#EA4335', word: 'NOTES',     shape: 'editorial' },
  6: { bg: '#2A4530', fg: '#F5F0E2', accent: '#E8B82C', word: 'CHANGING',  shape: 'arc'    },
  5: { bg: '#0D1B2A', fg: '#E8B82C', accent: '#B83A2A', word: 'IDENTITY',  shape: 'circle' },
  4: { bg: '#FAF6EA', fg: '#1E3D7A', accent: '#C9963F', word: 'PATIENCE',  shape: 'arc'    },
  3: { bg: '#1A1614', fg: '#B83A2A', accent: '#E8B82C', word: 'PRESSURE',  shape: 'lines'  },
  2: { bg: '#E5DCC3', fg: '#2A4530', accent: '#B83A2A', word: 'SECTOR',    shape: 'split'  },
  1: { bg: '#1E3D7A', fg: '#FAF6EA', accent: '#E8B82C', word: 'ORIGINS',   shape: 'sun'    },
};

function blogCoverSVG(epN) {
  const t = BLOG_COVER_THEMES[epN] || BLOG_COVER_THEMES[1];
  const W = 800, H = 500;
  let motif = '';
  if (t.shape === 'circle') {
    motif = `
      <circle cx="640" cy="160" r="120" fill="${t.accent}" opacity="0.85"/>
      <circle cx="540" cy="370" r="70"  fill="${t.fg}" opacity="0.9"/>
      <path d="M60 420 Q200 360 360 420 T700 420" stroke="${t.fg}" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.6"/>
    `;
  } else if (t.shape === 'arc') {
    motif = `
      <path d="M40 380 Q200 100 400 250 T780 200" stroke="${t.fg}" stroke-width="22" fill="none" stroke-linecap="round" opacity="0.85"/>
      <path d="M60 180 Q260 120 460 260" stroke="${t.accent}" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.7"/>
      <circle cx="700" cy="380" r="40" fill="${t.accent}" opacity="0.9"/>
    `;
  } else if (t.shape === 'lines') {
    motif = `
      <path d="M40 110 L760 110" stroke="${t.fg}" stroke-width="9" stroke-linecap="round" opacity="0.7"/>
      <path d="M40 200 L600 200" stroke="${t.accent}" stroke-width="14" stroke-linecap="round" opacity="0.85"/>
      <path d="M180 290 L760 290" stroke="${t.fg}" stroke-width="11" stroke-linecap="round" opacity="0.6"/>
      <path d="M40 380 L420 380" stroke="${t.accent}" stroke-width="9" stroke-linecap="round" opacity="0.7"/>
    `;
  } else if (t.shape === 'split') {
    motif = `
      <rect x="0" y="0" width="400" height="${H}" fill="${t.fg}" opacity="0.18"/>
      <rect x="500" y="0" width="60" height="${H}" fill="${t.accent}" opacity="0.7"/>
      <circle cx="700" cy="250" r="100" fill="${t.fg}" opacity="0.65"/>
      <path d="M40 440 Q300 380 600 440" stroke="${t.accent}" stroke-width="11" fill="none" stroke-linecap="round"/>
    `;
  } else if (t.shape === 'sun') {
    motif = `
      <circle cx="600" cy="200" r="140" fill="${t.accent}" opacity="0.9"/>
      <path d="M40 380 Q200 260 400 380 T780 360" stroke="${t.fg}" stroke-width="16" fill="none" stroke-linecap="round" opacity="0.55"/>
      <path d="M40 250 Q160 220 280 260" stroke="${t.fg}" stroke-width="9" fill="none" stroke-linecap="round" opacity="0.7"/>
    `;
  } else if (t.shape === 'editorial') {
    motif = `
      <circle cx="160" cy="160" r="14" fill="#4285F4"/>
      <circle cx="200" cy="160" r="14" fill="#EA4335"/>
      <circle cx="240" cy="160" r="14" fill="#FBBC05"/>
      <circle cx="280" cy="160" r="14" fill="#34A853"/>
      <path d="M40 230 L760 230" stroke="${t.fg}" stroke-width="3" stroke-linecap="round" opacity="0.18"/>
      <path d="M40 260 L520 260" stroke="${t.fg}" stroke-width="3" stroke-linecap="round" opacity="0.18"/>
      <path d="M40 290 L640 290" stroke="${t.fg}" stroke-width="3" stroke-linecap="round" opacity="0.18"/>
      <rect x="40" y="115" width="80" height="6" rx="3" fill="${t.accent}"/>
    `;
  }
  const labelColor  = t.fg;
  const wordSize    = Math.max(60, 100 - t.word.length * 4);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='xMidYMid slice'>
    <rect width='${W}' height='${H}' fill='${t.bg}'/>
    ${motif}
    <text x='40' y='${H - 60}' font-family='Fraunces, Playfair Display, serif' font-weight='700' font-size='${wordSize}' fill='${labelColor}' letter-spacing='-2'>${t.word}</text>
    <text x='42' y='${H - 25}' font-family='Inter, sans-serif' font-size='12' font-weight='600' letter-spacing='3' fill='${labelColor}' opacity='0.7'>EPISODE ${String(epN).padStart(2,'0')}  ·  THE SECTOR DEBRIEF</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ─── PAUSE & REFLECT (Blog page hero) ───
function renderPauseHero() {
  const root = document.getElementById('pause-hero');
  if (!root) return;
  const qEl   = document.getElementById('pause-hero-q');
  const srcEl = document.getElementById('pause-hero-source');
  const nextBtn = document.getElementById('pause-hero-next');
  const readBtn = document.getElementById('pause-hero-read');
  const copyBtn = document.getElementById('pause-hero-copy');

  const pool = BLOG_POSTS.flatMap(p =>
    (p.reflections || []).map(q => ({ q, post: p }))
  );
  if (!pool.length) return;

  let idx = Math.floor(Math.random() * pool.length);
  let timer = null;
  let inFlight = false;

  function paint() {
    const item = pool[idx];
    qEl.textContent = item.q;
    const label = item.post.pinned
      ? 'From: Notes from the Editing Room'
      : `From: Episode ${item.post.epN} · ${item.post.title.split(':')[0]}`;
    srcEl.textContent = label;
    root.dataset.activeSlug = item.post.slug;
  }

  function show(nextIdx) {
    if (inFlight) return;
    inFlight = true;
    idx = ((nextIdx % pool.length) + pool.length) % pool.length;
    qEl.classList.add('pause-out');
    srcEl.classList.add('pause-out');
    setTimeout(() => {
      paint();
      qEl.classList.remove('pause-out');
      srcEl.classList.remove('pause-out');
      qEl.classList.add('pause-in');
      srcEl.classList.add('pause-in');
      setTimeout(() => {
        qEl.classList.remove('pause-in');
        srcEl.classList.remove('pause-in');
        inFlight = false;
      }, 480);
    }, 240);
  }

  function startTimer() {
    stopTimer();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (document.hidden) return;
    timer = setInterval(() => show(idx + 1), 8500);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stopTimer() : startTimer();
  });

  nextBtn?.addEventListener('click', () => {
    qEl.setAttribute('aria-live', 'polite');
    show(idx + 1);
    setTimeout(() => qEl.setAttribute('aria-live', 'off'), 1200);
    startTimer();
  });
  readBtn?.addEventListener('click', () => {
    const slug = root.dataset.activeSlug;
    if (slug) openBlog(slug);
  });
  copyBtn?.addEventListener('click', () => {
    const text = pool[idx].q;
    navigator.clipboard?.writeText(`"${text}" — The Sector Debrief`);
    const r = copyBtn.getBoundingClientRect();
    if (window.sparkBurst) window.sparkBurst(r.left + r.width/2, r.top + r.height/2);
    const original = copyBtn.innerHTML;
    copyBtn.innerHTML = '<span aria-hidden="true">✓</span>';
    setTimeout(() => { copyBtn.innerHTML = original; }, 1100);
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting ? startTimer() : stopTimer());
  }, { threshold: 0.4 });
  obs.observe(root);

  root.addEventListener('mouseenter', stopTimer);
  root.addEventListener('mouseleave', startTimer);

  paint();
}

// ─── BLOG ───
function renderBlog() {
  const grid = $('#blog-grid');
  grid.innerHTML = BLOG_POSTS.map(post => {
    const cover = blogCoverSVG(post.epN);
    const tag = post.pinned
      ? `<span class="blog-tag blog-tag-pinned">★ Editorial</span>`
      : `<span>Episode ${post.epN}</span>`;
    return `
      <article class="blog-card${post.pinned ? ' is-pinned' : ''}" data-slug="${post.slug}">
        <div class="blog-card-img" style="background:#000;">
          <img src="${cover}" alt="${post.title}"/>
        </div>
        <div class="blog-card-body">
          <div class="blog-card-meta">
            ${tag}
            <span>·</span>
            <span>${post.readTime} read</span>
          </div>
          <h3 class="blog-card-title">${post.title}</h3>
          <p class="blog-card-excerpt">${post.excerpt}</p>
          <div class="blog-card-foot">
            <span class="blog-read">Read essay →</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
  $$('.blog-card', grid).forEach(card => {
    card.addEventListener('click', () => openBlog(card.dataset.slug));
  });
}

// ─── QUOTES ───
function renderQuotes() {
  const track = $('#quotes-track');
  if (track) {
    const dup = [...QUOTES, ...QUOTES];
    track.innerHTML = dup.map(quoteCard).join('');
    bindQuoteShare(track);
  }
  const grid = $('#quotes-grid');
  if (grid) {
    grid.innerHTML = QUOTES.map(quoteCard).join('');
    bindQuoteShare(grid);
  }
}
function quoteCard(q) {
  return `
    <div class="quote-card ${q.color}">
      <div class="quote-mark-big">"</div>
      <p class="quote-text">${q.text}</p>
      <div class="quote-source">${q.source}</div>
      <div class="quote-share">
        <button data-net="x" data-text="${encodeURIComponent(q.text)}" title="Share on X">𝕏</button>
        <button data-net="li" data-text="${encodeURIComponent(q.text)}" title="LinkedIn">in</button>
        <button data-net="wa" data-text="${encodeURIComponent(q.text)}" title="WhatsApp">💬</button>
        <button data-net="copy" data-text="${q.text.replace(/"/g,'&quot;')}" title="Copy">⧉</button>
      </div>
    </div>
  `;
}
function bindQuoteShare(scope) {
  $$('.quote-share button', scope).forEach(b => {
    b.addEventListener('click', e => {
      e.stopPropagation();
      const text = b.dataset.text;
      const url  = encodeURIComponent('https://thesectordebrief.com');
      const n = b.dataset.net;
      let target = '';
      if (n === 'x')  target = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      if (n === 'li') target = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      if (n === 'wa') target = `https://wa.me/?text=${text}%20${url}`;
      const r = b.getBoundingClientRect();
      if (window.sparkBurst) window.sparkBurst(r.left + r.width/2, r.top + r.height/2);
      if (n === 'copy') {
        // dataset.text for copy button is plain text (HTML-entity-decoded by browser); write it directly
        navigator.clipboard.writeText(b.dataset.text);
        flash(b, '✓');
        return;
      }
      window.open(target, '_blank', 'width=600,height=500');
    });
  });
}
function flash(el, text) {
  const original = el.innerHTML;
  el.innerHTML = text;
  setTimeout(() => { el.innerHTML = original; }, 1100);
}

// ─── ABOUT ───
function renderAbout() {
  const grid = $('#hosts-grid');
  grid.innerHTML = HOSTS.map(h => `
    <article class="host" data-accent="${h.accent}">
      <div class="host-avatar host-avatar-photo">
        <img src="${h.photo}" alt="${h.name}" decoding="async"/>
      </div>
      <h3 class="host-name">${h.name}</h3>
      <div class="host-role">${h.role}</div>
      <p class="host-bio">${h.bio}</p>
      <a class="host-linkedin" href="${h.linkedin}" target="_blank" rel="noopener noreferrer">
        <span class="li-mark">in</span>
        <span>Connect on LinkedIn</span>
        <span class="li-arrow">→</span>
      </a>
    </article>
  `).join('');
}

// ─── EPISODE MODAL ───
function openEpisode(ep) {
  const m = $('#modal-episode');
  m.innerHTML = `
    <button class="modal-close" type="button" aria-label="Close" onclick="closeModal()">×</button>
    <div class="modal-video">
      <iframe src="https://www.youtube.com/embed/${ep.id}?rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
    <div class="modal-body">
      <div class="modal-meta">
        <span>Episode ${ep.n}</span>
        <span>·</span>
        <span>${fmtDate(ep.date)}</span>
        ${ep.duration ? `<span>·</span><span>${ep.duration}</span>` : ''}
        ${ep.guest ? `<span>· w/ ${ep.guest}</span>` : ''}
      </div>
      <h2 class="modal-title" id="modal-episode-title">${ep.title}</h2>
      <p class="modal-desc">${ep.description}</p>
      <div class="modal-actions">
        <a class="ep-link primary" href="https://www.youtube.com/watch?v=${ep.id}" target="_blank" rel="noopener noreferrer">▶ Open in YouTube</a>
        <a class="ep-link" href="${PLATFORMS.spotify}" target="_blank" rel="noopener noreferrer">🎵 Spotify</a>
        <a class="ep-link" href="${PLATFORMS.apple}" target="_blank" rel="noopener noreferrer">🎧 Apple Podcasts</a>
      </div>
    </div>
  `;
  $('#modal-backdrop').classList.add('active');
  document.body.classList.add('scroll-lock');
  state.lastTrigger = document.activeElement;
  setTimeout(() => $('#modal-episode .modal-close')?.focus(), 50);
  showMini(ep);
}

// ─── BLOG MODAL ───
function openBlog(slug) {
  const post = BLOG_POSTS.find(p => p.slug === slug);
  if (!post) return;
  const ep = post.epId ? EPISODES.find(e => e.id === post.epId) : null;
  const m = $('#modal-blog');
  const cover = blogCoverSVG(post.epN);
  const metaTag = post.pinned
    ? `<span style="color:var(--crimson);font-weight:700">★ EDITORIAL</span>`
    : `<span>Episode ${post.epN}</span>`;
  const dateLine = ep ? `<span>·</span><span>${fmtDate(ep.date)}</span>` : '';
  const reflections = post.reflections || [];
  const initialIdx = reflections.length ? Math.floor(Math.random() * reflections.length) : 0;
  const pauseSection = reflections.length ? `
    <section class="pause" data-pause-slug="${post.slug}" data-pause-idx="${initialIdx}" aria-labelledby="pause-h-${post.slug}">
      <div class="pause-eyebrow">
        <span class="pause-pulse" aria-hidden="true"></span>
        <h3 id="pause-h-${post.slug}">Pause &amp; reflect</h3>
      </div>
      <div class="pause-card">
        <div class="pause-mark" aria-hidden="true">"</div>
        <p class="pause-question" id="pause-q-${post.slug}" aria-live="polite" aria-atomic="true">${reflections[initialIdx]}</p>
        <div class="pause-actions">
          <button class="pause-btn pause-next" type="button" data-action="next" aria-label="Show another question">
            <span class="pause-icon" aria-hidden="true">↻</span>
            <span>Ask me another</span>
          </button>
          <button class="pause-btn pause-share" type="button" data-action="share-x"  aria-label="Share on X / Twitter"><span aria-hidden="true">𝕏</span></button>
          <button class="pause-btn pause-share" type="button" data-action="share-li" aria-label="Share on LinkedIn"><span aria-hidden="true">in</span></button>
          <button class="pause-btn pause-share" type="button" data-action="share-wa" aria-label="Share on WhatsApp"><span aria-hidden="true">💬</span></button>
          <button class="pause-btn pause-share" type="button" data-action="copy"     aria-label="Copy question"><span aria-hidden="true">⧉</span></button>
        </div>
        <div class="pause-foot">A reflection prompt drawn from this essay. Take it slow.</div>
      </div>
    </section>
  ` : '';
  const footer = ep ? `
      <div style="margin-top: 40px; padding-top: 28px; border-top: 2px solid var(--ink); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="font-size: 13px; color: var(--ink-mute); letter-spacing: 0.5px;">Listen to the full episode &rarr;</div>
        <a class="ep-link primary" href="https://www.youtube.com/watch?v=${post.epId}" target="_blank" rel="noopener noreferrer">▶ Watch Episode ${post.epN}</a>
      </div>` : `
      <div style="margin-top: 40px; padding-top: 28px; border-top: 2px solid var(--ink); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="font-size: 13px; color: var(--ink-mute); letter-spacing: 0.5px;">Subscribe and join the conversation &rarr;</div>
        <a class="ep-link primary" href="https://www.youtube.com/channel/UCUrZ0l2uqp2zgJ5WrjcRXDg?sub_confirmation=1" target="_blank" rel="noopener noreferrer">▶ Subscribe on YouTube</a>
      </div>`;
  m.innerHTML = `
    <button class="modal-close" type="button" aria-label="Close" onclick="closeModal()">×</button>
    <div class="blog-hero" style="background:#000;">
      <img src="${cover}" alt="${post.title}"/>
    </div>
    <div class="blog-modal-body">
      <div class="blog-card-meta">
        ${metaTag}
        <span>·</span>
        <span>${post.readTime} read</span>
        ${dateLine}
      </div>
      <h1 id="modal-blog-title">${post.title}</h1>
      ${post.body}
      ${pauseSection}
      ${footer}
    </div>
  `;
  $('#modal-blog-backdrop').classList.add('active');
  document.body.classList.add('scroll-lock');
  state.lastTrigger = document.activeElement;
  setTimeout(() => $('#modal-blog .modal-close')?.focus(), 50);
  bindPause(m, post);
}

// ─── PAUSE + REFLECT (per-blog) ───
function bindPause(scope, post) {
  const root = scope.querySelector('.pause');
  if (!root) return;
  const qEl = root.querySelector('.pause-question');
  const list = post.reflections;
  let idx = parseInt(root.dataset.pauseIdx, 10) || 0;

  let inFlight = false;
  function show(nextIdx) {
    if (inFlight) return;
    inFlight = true;
    idx = ((nextIdx % list.length) + list.length) % list.length;
    root.dataset.pauseIdx = idx;
    qEl.classList.add('pause-out');
    setTimeout(() => {
      qEl.textContent = list[idx];
      qEl.classList.remove('pause-out');
      qEl.classList.add('pause-in');
      setTimeout(() => {
        qEl.classList.remove('pause-in');
        inFlight = false;
      }, 500);
    }, 220);
  }

  root.querySelectorAll('.pause-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action === 'next') {
        show(idx + 1);
      } else {
        const text = list[idx];
        const url = encodeURIComponent('https://thesectordebrief.com');
        const t   = encodeURIComponent(`"${text}"\n\n— The Sector Debrief`);
        const r   = btn.getBoundingClientRect();
        if (window.sparkBurst) window.sparkBurst(r.left + r.width/2, r.top + r.height/2);
        if (action === 'share-x')  window.open(`https://twitter.com/intent/tweet?text=${t}&url=${url}`, '_blank', 'width=600,height=500');
        if (action === 'share-li') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=500');
        if (action === 'share-wa') window.open(`https://wa.me/?text=${t}%20${url}`, '_blank', 'width=600,height=500');
        if (action === 'copy') {
          navigator.clipboard.writeText(`"${text}" — The Sector Debrief`);
          const original = btn.innerHTML;
          btn.innerHTML = '✓';
          setTimeout(() => { btn.innerHTML = original; }, 1100);
        }
      }
    });
  });
}

// Close only the topmost open modal; only release scroll-lock when none remain
window.closeModal = function() {
  const open = $$('.modal-backdrop.active');
  if (!open.length) return;
  const top = open[open.length - 1];
  top.classList.remove('active');
  top.querySelectorAll('iframe').forEach(f => { f.src = 'about:blank'; });
  if (!$$('.modal-backdrop.active').length) {
    document.body.classList.remove('scroll-lock');
    if (state.lastTrigger && typeof state.lastTrigger.focus === 'function') {
      try { state.lastTrigger.focus({ preventScroll: true }); } catch (_) {}
      state.lastTrigger = null;
    }
  }
};

// ─── MINI PLAYER ───
function showMini(ep) {
  const mp = $('#mini-player');
  $('#mini-title').textContent = ep.title;
  $('#mini-sub').textContent   = `Episode ${ep.n} · The Sector Debrief`;
  $('#mini-thumb-img').src     = `https://i.ytimg.com/vi/${ep.id}/hqdefault.jpg`;
  mp.classList.add('active');
  state.player = { active: true, ep };
}
function bindMini() {
  const mp = $('#mini-player');
  if (!mp) return;
  $('#mini-close')?.addEventListener('click', () => {
    mp.classList.remove('active');
    state.player = { active: false, ep: null };
  });
  $('#mini-toggle')?.addEventListener('click', () => {
    if (state.player.ep) openEpisode(state.player.ep);
  });
  const indexOfCurrent = () => EPISODES.findIndex(e => e.id === state.player.ep?.id);
  $('#mini-prev')?.addEventListener('click', () => {
    const i = indexOfCurrent();
    if (i < 0) return;
    const next = EPISODES[(i + 1) % EPISODES.length];
    showMini(next);
  });
  $('#mini-next')?.addEventListener('click', () => {
    const i = indexOfCurrent();
    if (i < 0) return;
    const next = EPISODES[(i - 1 + EPISODES.length) % EPISODES.length];
    showMini(next);
  });
}

// ─── CONTACT FORM ───
function bindContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  // Show success banner when returning from a native FormSubmit redirect (?sent=1)
  const params = new URLSearchParams(location.search);
  if (params.get('sent') === '1') {
    const success = $('#form-success');
    if (success) {
      success.style.display = 'block';
      success.classList.remove('is-error');
      success.textContent = '✓ Message sent. We\'ll get back to you within a few days.';
      setTimeout(() => { success.style.display = 'none'; }, 7000);
    }
    history.replaceState(null, '', location.pathname + '#contact');
  }

  // Robot check interaction
  const robotInput = $('#not-robot');
  const robotBox   = document.querySelector('.robot-check');
  robotInput?.addEventListener('change', () => {
    robotBox?.classList.remove('robot-check-error');
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Must tick the robot check first
    if (robotInput && !robotInput.checked) {
      robotBox?.classList.add('robot-check-error');
      robotInput.focus();
      return;
    }

    const btn     = form.querySelector('.form-submit');
    const success = $('#form-success');
    const original = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;

    try {
      const data = new FormData(form);
      const res = await fetch('https://formsubmit.co/ajax/ali_moukdad@hotmail.com', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === 'false') throw new Error('failed');

      success.style.display = 'block';
      success.classList.remove('is-error');
      success.textContent = '✓ Message sent. We\'ll get back to you within a few days.';
      form.reset();
      if (robotInput) robotInput.checked = false;
      btn.textContent = original;
      btn.disabled = false;
      setTimeout(() => { success.style.display = 'none'; }, 7000);
    } catch {
      // AJAX failed — fall back to native form POST (triggers FormSubmit activation email
      // on first use, then redirects back to the site via _next)
      btn.textContent = original;
      btn.disabled = false;
      form.submit();
    }
  });
}

// ─── SEARCH ───
function bindSearch() {
  const input = $('#search-input');
  if (!input) return;
  input.addEventListener('input', () => {
    state.search = input.value;
    renderEpisodes();
  });
}

// ─── MOBILE NAV ───
function bindMobileNav() {
  const toggle = $('#nav-toggle');
  const links  = $('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('mobile-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}
function closeMobileNav() {
  const toggle = $('#nav-toggle');
  $('.nav-links')?.classList.remove('mobile-open');
  toggle?.setAttribute('aria-expanded', 'false');
}

// ─── COUNTER ANIMATION ───
function animateCounters() {
  const els = $$('.stat-num');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const target = e.target;
      if (target.dataset.counted) return;
      target.dataset.counted = '1';
      const final = target.textContent.trim();
      if (reducedMotion) {
        obs.unobserve(target);
        return;
      }
      const cleaned = final.replace(/,/g, '');
      const m = cleaned.match(/(-?\d+(?:\.\d+)?)/);
      if (!m) return;
      const num = parseFloat(m[1]);
      if (isNaN(num)) return;
      const afterIdx = cleaned.indexOf(m[1]) + m[1].length;
      const suffix = cleaned.slice(afterIdx);
      const usedComma = final.includes(',');
      const decimals = (m[1].split('.')[1] || '').length;

      const formatNum = (v) => {
        const out = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString();
        if (!usedComma) return out;
        const [intPart, dec] = out.split('.');
        const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return dec ? `${withCommas}.${dec}` : withCommas;
      };

      const duration = 1400;
      const start = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const v = num * easeOut(t);
        target.textContent = formatNum(v) + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else target.textContent = formatNum(num) + suffix;
      }
      requestAnimationFrame(tick);
      obs.unobserve(target);
    });
  }, { threshold: 0.4 });
  els.forEach(el => obs.observe(el));
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  renderEpisodes();
  renderBlog();
  renderPauseHero();
  renderQuotes();
  renderAbout();

  const initial = (location.hash || '#home').slice(1);
  navigate(['home','episodes','blog','about','contact'].includes(initial) ? initial : 'home');

  $$('[data-nav]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate(el.dataset.nav);
    });
  });

  $$('.modal-backdrop').forEach(b => {
    b.addEventListener('click', e => {
      if (e.target === b) closeModal();
    });
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  addEventListener('popstate', e => {
    const page = (location.hash || '#home').slice(1);
    if (['home','episodes','blog','about','contact'].includes(page) && page !== state.page) {
      _doNavigate(page, { preserveScroll: true });
    }
  });

  addEventListener('hashchange', () => {
    const page = (location.hash || '#home').slice(1);
    const valid = ['home','episodes','blog','about','contact'];
    if (valid.includes(page)) {
      if (page !== state.page) _doNavigate(page);
    } else {
      history.replaceState({ page: 'home' }, '', '#home');
      if (state.page !== 'home') _doNavigate('home');
    }
  });

  bindContactForm();
  bindSearch();
  bindMobileNav();
  bindMini();
  animateCounters();

  setTimeout(() => {
    if (window.applyTilt)     window.applyTilt(document);
    if (window.applyMagnetic) window.applyMagnetic();
    if (window.refreshReveal) window.refreshReveal();
  }, 80);
});
