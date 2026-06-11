// ═══════════════════════════════════════════════════
// THE SECTOR DEBRIEF · Application
// ═══════════════════════════════════════════════════

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
// Safari 13 and earlier return Invalid Date for date-only ISO strings ('YYYY-MM-DD').
// Append a time component so all engines parse as local midnight.
const _parseDate = (d) => {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d + 'T00:00:00');
  return new Date(d);
};
const fmtDate = (d) => _parseDate(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const fmtMonthYear = (d) => _parseDate(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

// Escape user-facing strings before interpolating into HTML attributes (alt, title, etc.)
// Also safe for text-content positions — overcautious but harmless there.
const escAttr = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

// Try to copy text to the system clipboard. Resolves true on success, false otherwise.
// Never throws — clipboard.writeText rejects on non-HTTPS, no focus, permission-denied.
async function safeCopy(text) {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.warn('Clipboard copy failed:', e);
    return false;
  }
}

// Only let http(s) / mailto / internal links through. Prevents javascript: in href.
function safeUrl(u) {
  const s = String(u == null ? '' : u).trim();
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(s)) return s;
  return '#';
}

const state = {
  page: 'home',
  search: '',
  theme: null,
  player: { active: false, ep: null },
  lastTrigger: null  // element to restore focus to when a modal closes
};

// ─── ROUTER ───
// Force every reveal-animated element inside a scope to be visible immediately.
// This is critical for SPA hash navigation: when a `.page` is `display:none` and
// then becomes `.active`, IntersectionObserver doesn't reliably fire for already-
// in-viewport elements, leaving content stuck at opacity 0.
function _showRevealsIn(scope) {
  if (!scope) return;
  scope.querySelectorAll('.reveal, .reveal-stagger, .split, .blog-card').forEach(el => {
    el.classList.add('in');
  });
}
// Per-route document.title so each SPA "page" is distinct in browser tabs, bookmarks,
// and screen-reader page-load announcements.
const PAGE_TITLES = {
  home:     'The Sector Debrief · Honest Humanitarian & Development Podcast',
  episodes: 'Episodes · The Sector Debrief',
  blog:     'Essays · The Sector Debrief',
  about:    'About · The Sector Debrief',
  contact:  'Contact · The Sector Debrief',
};
// Search debounce handle · module-level so _doNavigate can cancel a pending
// renderEpisodes when the user navigates away mid-debounce (otherwise the
// stale timer re-renders the now-hidden grid 120ms after leaving the page).
let searchDebounce = null;
function _doNavigate(page, opts) {
  opts = opts || {};
  // Reset the episode search when leaving the Episodes page so the input value
  // and `state.search` don't desync — returning to Episodes would otherwise show
  // a blank input but a filtered grid.
  if (state.page === 'episodes' && page !== 'episodes' && state.search) {
    state.search = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    if (searchDebounce) { clearTimeout(searchDebounce); searchDebounce = null; }
  }
  state.page = page;
  document.title = PAGE_TITLES[page] || PAGE_TITLES.home;
  // Toggle both .active AND aria-hidden so screen readers don't expose the
  // hidden pages' h1s + landmarks. Without aria-hidden on inactive pages,
  // SR users would hear the Home hero h1 announced even when on #episodes.
  $$('.page').forEach(p => {
    const isActive = p.dataset.page === page;
    p.classList.toggle('active', isActive);
    p.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    // inert (modern browsers) takes the entire subtree out of the tab order,
    // focus, and accessibility tree. Defense-in-depth alongside aria-hidden:
    // even if CSS or JS accidentally exposes the inactive page, inert prevents
    // its focusable elements from being reached.
    p.toggleAttribute('inert', !isActive);
  });
  $$('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.page === page));
  if (!opts.preserveScroll) {
    window.scrollTo(0, 0);
  }
  if (!opts.fromHashChange && location.hash !== '#' + page) {
    const method = history.state?.page ? 'pushState' : 'replaceState';
    history[method]({ page }, '', '#' + page);
  }
  // Update skip-link target so "Skip to content" jumps to the active page landmark
  const skipLink = document.getElementById('skip-link');
  if (skipLink) skipLink.setAttribute('href', '#main-' + page);
  // Force-show all reveal content inside the now-active page so SPA navigation
  // doesn't leave content stuck at opacity 0.
  const activePage = document.querySelector(`.page[data-page="${page}"]`);
  _showRevealsIn(activePage);
  // Also keep the footer always visible; it doesn't need an entrance animation.
  document.querySelectorAll('.footer').forEach(f => f.classList.add('in'));
  closeMobileNav();
  setTimeout(() => {
    if (window.refreshReveal) window.refreshReveal();
    if (window.applyTilt) window.applyTilt();
    if (window.applyMagnetic) window.applyMagnetic();
  }, 60);
}
function navigate(page) {
  closeMobileNav();
  // If a modal is closing as part of this navigation, suppress closeModal's
  // focus-restoration: it would otherwise put focus back on the trigger that
  // sits inside the OLD page, which _doNavigate is about to mark
  // aria-hidden="true". Focus on an aria-hidden element is invalid for SR.
  state.lastTrigger = null;
  // Bounded close to prevent any pathological infinite loop
  for (let i = 0; i < 5 && $$('.modal-backdrop.active').length; i++) closeModal();
  if (window.navigateWithCurtain && state.page !== page) {
    window.navigateWithCurtain(page, _doNavigate);
  } else {
    _doNavigate(page);
  }
}

// ─── HERO / HOME ───
function renderHome() {
  const latest = $('#home-episodes');
  if (!latest) return;
  latest.innerHTML = EPISODES.slice(0, 3).map(epCard).join('');
  bindEpCards(latest);

  const setStat = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  setStat('#stat-episodes', STATS.episodes);
  setStat('#stat-views',    STATS.views);
}

// ─── EPISODE CARD ───
function epCard(ep) {
  const altTitle = escAttr(ep.title);
  return `
    <article class="ep-card" data-ep="${ep.id}">
      <div class="ep-thumb" data-ep="${ep.id}" role="button" tabindex="0" aria-label="Open episode: ${altTitle}">
        <img src="https://i.ytimg.com/vi/${ep.id}/hqdefault.jpg" alt="The Sector Debrief Episode ${ep.n}: ${altTitle}" loading="lazy"/>
        <div class="ep-thumb-overlay">
          <span class="ep-thumb-num">Ep ${String(ep.n).padStart(2,'0')}</span>
        </div>
        <div class="ep-thumb-play"></div>
      </div>
      <div class="ep-body">
        <div class="ep-meta">
          <span>${fmtMonthYear(ep.date)}</span>
          ${ep.duration ? `<span>·</span><span>${escAttr(ep.duration)}</span>` : ''}
          ${ep.guest ? `<span class="ep-meta-tag">w/ ${escAttr(ep.guest.split(' ')[0])}</span>` : ''}
        </div>
        <h3 class="ep-title" data-ep="${ep.id}">${escAttr(ep.title)}</h3>
        <p class="ep-desc">${escAttr(ep.description)}</p>
        <div class="ep-actions">
          <a class="ep-link primary" href="https://www.youtube.com/watch?v=${ep.id}" target="_blank" rel="noopener noreferrer">▶ YouTube</a>
          <a class="ep-link" href="${PLATFORMS.spotify}" target="_blank" rel="noopener noreferrer">Spotify</a>
          <a class="ep-link" href="${PLATFORMS.apple}" target="_blank" rel="noopener noreferrer">Apple</a>
        </div>
      </div>
    </article>
  `;
}
// Event delegation: attach ONCE per scope container, even if children re-render.
// Mouse: click on .ep-thumb/.ep-title (or featured equivalents) opens modal.
// Keyboard: only .ep-thumb / .ep-feat-thumb carry role=button + tabindex (one
// tab stop per card; the h3 titles stay semantic headings). Enter/Space on the
// focused thumb fires the same openEpisode handler.
function bindEpCards(scope) {
  if (!scope || scope.dataset.epDelegated) return;
  scope.dataset.epDelegated = '1';
  scope.addEventListener('click', e => {
    const trigger = e.target.closest('.ep-thumb, .ep-title, .ep-feat-thumb, .ep-feat-title');
    if (!trigger || !scope.contains(trigger)) return;
    // Don't intercept clicks on inner buttons/links inside the action row
    if (e.target.closest('.ep-actions, .ep-link')) return;
    const ep = EPISODES.find(x => x.id === trigger.dataset.ep);
    if (ep) openEpisode(ep);
  });
  scope.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const trigger = e.target.closest('.ep-thumb, .ep-feat-thumb');
    if (!trigger || !scope.contains(trigger)) return;
    if (e.target.closest('.ep-actions, .ep-link')) return;
    e.preventDefault();
    const ep = EPISODES.find(x => x.id === trigger.dataset.ep);
    if (ep) openEpisode(ep);
  });
}

// ─── EPISODES PAGE ───
function renderEpisodes() {
  const featured = $('#ep-featured');
  const grid = $('#episodes-grid');
  if (!grid) return;

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
    const safeQuery = escAttr(state.search);
    grid.innerHTML = `
      <div class="ep-empty" style="grid-column:1/-1;">
        <div class="ep-empty-icon" aria-hidden="true">⌕</div>
        <h3 class="ep-empty-title">No episodes match &ldquo;${safeQuery}&rdquo;</h3>
        <p class="ep-empty-sub">Try a different word, or browse them all.</p>
        <button type="button" class="ep-empty-btn" id="ep-empty-clear">Clear search</button>
      </div>`;
    const clearBtn = document.getElementById('ep-empty-clear');
    clearBtn?.addEventListener('click', () => {
      const input = document.getElementById('search-input');
      if (input) input.value = '';
      state.search = '';
      renderEpisodes();
      input?.focus();
    });
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
  const themeChips = ep.themes.map(t => `<span class="theme-chip">${escAttr(t)}</span>`).join('');
  const altTitle = escAttr(ep.title);
  return `
    <div class="ep-feat-thumb" data-ep="${ep.id}" role="button" tabindex="0" aria-label="Open featured episode: ${altTitle}">
      <img src="https://i.ytimg.com/vi/${ep.id}/maxresdefault.jpg" alt="The Sector Debrief Episode ${ep.n}: ${altTitle}" loading="lazy" onerror="this.src='https://i.ytimg.com/vi/${ep.id}/hqdefault.jpg'"/>
      <div class="ep-feat-overlay">
        <div class="ep-feat-num">E${String(ep.n).padStart(2,'0')}</div>
        <div class="ep-feat-play"></div>
      </div>
    </div>
    <div class="ep-feat-body">
      <div class="ep-feat-tag">★ Latest Episode</div>
      <h3 class="ep-feat-title" data-ep="${ep.id}">${escAttr(ep.title)}</h3>
      <div class="ep-feat-meta">
        <span>${fmtDate(ep.date)}</span>
        ${ep.duration ? `<span>·</span><span>${escAttr(ep.duration)}</span>` : ''}
        ${ep.guest ? `<span>·</span><span>w/ ${escAttr(ep.guest)}</span>` : ''}
      </div>
      <div class="ep-feat-themes">${themeChips}</div>
      <p class="ep-feat-desc">${escAttr(ep.description)}</p>
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
  9: { bg: '#FAF6EA', fg: '#1A1614', accent: '#2C5BAA', word: 'PAUSE',     shape: 'lines' },
  7: { bg: '#1A1614', fg: '#FAF6EA', accent: '#E8B82C', word: 'CONTRACT',  shape: 'circle' },
  6: { bg: '#2A4530', fg: '#F5F0E2', accent: '#E8B82C', word: 'CHANGING',  shape: 'arc'    },
  5: { bg: '#0D1B2A', fg: '#E8B82C', accent: '#B83A2A', word: 'IDENTITY',  shape: 'circle' },
  4: { bg: '#FAF6EA', fg: '#1E3D7A', accent: '#C9963F', word: 'PATIENCE',  shape: 'arc'    },
  3: { bg: '#1A1614', fg: '#B83A2A', accent: '#E8B82C', word: 'PRESSURE',  shape: 'lines'  },
  2: { bg: '#E5DCC3', fg: '#2A4530', accent: '#B83A2A', word: 'SECTOR',    shape: 'split'  },
  1: { bg: '#1E3D7A', fg: '#FAF6EA', accent: '#E8B82C', word: 'ORIGINS',   shape: 'sun'    },
};

// Accepts either a post object or a bare epN (backward compatible).
// Any post with epId === null OR pinned === true gets the "EDITORIAL" label
// regardless of its epN, so we can have multiple editorials with distinct cover
// themes (e.g. epN 0 for the original NOTES editorial, epN 9 for the PAUSE one).
function blogCoverSVG(post) {
  const epN = (post && typeof post === 'object') ? post.epN : post;
  const isEditorial = (post && typeof post === 'object')
    && (post.pinned === true || post.epId === null);
  const n = Number.isFinite(Number(epN)) ? Number(epN) : 1;
  const t = BLOG_COVER_THEMES[n] || BLOG_COVER_THEMES[1];
  const W = 800, H = 500;
  const labelText = isEditorial || n === 0
    ? 'EDITORIAL  ·  THE SECTOR DEBRIEF'
    : `EPISODE ${String(n).padStart(2,'0')}  ·  THE SECTOR DEBRIEF`;
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
    <text x='42' y='${H - 25}' font-family='Inter, sans-serif' font-size='12' font-weight='600' letter-spacing='3' fill='${labelColor}' opacity='0.7'>${labelText}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ─── PAUSE & REFLECT (Blog page hero) ───
function renderPauseHero() {
  const root = document.getElementById('pause-hero');
  if (!root || root.dataset.pauseBound) return;
  root.dataset.pauseBound = '1';
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
    // Editorial attribution uses the part of the title BEFORE the colon
    // ("Notes from the Editing Room" / "Notes on the Pause Button") so the
    // source line stays compact. The "→" button still navigates by slug,
    // so the full title surfaces on the essay page.
    const titleShort = (item.post.title || '').split(':')[0].trim();
    const label = item.post.pinned
      ? `From: ${titleShort}`
      : `From: Episode ${item.post.epN} · ${item.post.title}`;
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
  copyBtn?.addEventListener('click', async () => {
    const text = pool[idx].q;
    const ok = await safeCopy(`"${text}" · The Sector Debrief`);
    const original = copyBtn.innerHTML;
    if (ok) {
      const r = copyBtn.getBoundingClientRect();
      if (window.sparkBurst) window.sparkBurst(r.left + r.width/2, r.top + r.height/2);
      copyBtn.innerHTML = '<span aria-hidden="true">✓</span>';
    } else {
      copyBtn.innerHTML = '<span aria-hidden="true">!</span>';
      copyBtn.title = 'Copy not available in this browser';
    }
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
  if (!grid) return;
  grid.innerHTML = BLOG_POSTS.map(post => {
    const cover = blogCoverSVG(post);
    const tag = post.pinned
      ? `<span class="blog-tag blog-tag-pinned">★ Editorial</span>`
      : `<span>Episode ${post.epN}</span>`;
    return `
      <article class="blog-card${post.pinned ? ' is-pinned' : ''}" data-slug="${escAttr(post.slug)}">
        <div class="blog-card-img" style="background:#000;">
          <img src="${cover}" alt="${escAttr(post.title)}"/>
        </div>
        <div class="blog-card-body">
          <div class="blog-card-meta">
            ${tag}
            <span>·</span>
            <span>${escAttr(post.readTime)} read</span>
          </div>
          <h3 class="blog-card-title">${escAttr(post.title)}</h3>
          <p class="blog-card-excerpt">${escAttr(post.excerpt)}</p>
          <div class="blog-card-foot">
            <span class="blog-read">Read essay →</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
  // Bind-once delegation pattern (matches bindEpCards). renderBlog() only runs
  // at init today, but if a future filter / re-render calls it again, we'd
  // otherwise stack click handlers and open the modal twice per click.
  if (!grid.dataset.blogDelegated) {
    grid.dataset.blogDelegated = '1';
    grid.addEventListener('click', e => {
      const card = e.target.closest('.blog-card');
      if (card && grid.contains(card)) openBlog(card.dataset.slug);
    });
  }
}

// ─── QUOTES ───
function renderQuotes() {
  const track = $('#quotes-track');
  if (track) {
    const originals = QUOTES.map(q => quoteCard(q, false)).join('');
    const clones    = QUOTES.map(q => quoteCard(q, true)).join('');
    track.innerHTML = originals + clones;
    bindQuoteShare(track);
  }
  const grid = $('#quotes-grid');
  if (grid) {
    grid.innerHTML = QUOTES.map(q => quoteCard(q, false)).join('');
    bindQuoteShare(grid);
  }
}
function quoteCard(q, isClone = false) {
  const hidden = isClone ? ' aria-hidden="true"' : '';
  const tab    = isClone ? ' tabindex="-1"' : '';
  return `
    <div class="quote-card ${q.color}"${hidden}>
      <div class="quote-mark-big">"</div>
      <p class="quote-text">${escAttr(q.text)}</p>
      <div class="quote-source">${escAttr(q.source)}</div>
      <div class="quote-share">
        <button${tab} type="button" data-net="x"    data-text="${encodeURIComponent(q.text)}"           aria-label="Share quote on X"        title="Share on X"><span aria-hidden="true">𝕏</span></button>
        <button${tab} type="button" data-net="li"   data-text="${encodeURIComponent(q.text)}"           aria-label="Share quote on LinkedIn" title="LinkedIn"><span aria-hidden="true">in</span></button>
        <button${tab} type="button" data-net="wa"   data-text="${encodeURIComponent(q.text)}"           aria-label="Share quote on WhatsApp" title="WhatsApp"><span aria-hidden="true">💬</span></button>
        <button${tab} type="button" data-net="copy" data-text="${escAttr(q.text)}" aria-label="Copy quote to clipboard"  title="Copy"><span aria-hidden="true">⧉</span></button>
      </div>
    </div>
  `;
}
function bindQuoteShare(scope) {
  $$('.quote-share button', scope).forEach(b => {
    b.addEventListener('click', async e => {
      e.stopPropagation();
      const text = b.dataset.text;
      const url  = encodeURIComponent('https://thesectordebrief.com');
      const n = b.dataset.net;
      const r = b.getBoundingClientRect();
      if (n === 'copy') {
        // dataset.text for copy button is plain text (HTML-entity-decoded by browser).
        const ok = await safeCopy(b.dataset.text);
        if (ok) {
          if (window.sparkBurst) window.sparkBurst(r.left + r.width/2, r.top + r.height/2);
          flash(b, '✓');
        } else {
          flash(b, '!');
          b.title = 'Copy not available';
        }
        return;
      }
      if (window.sparkBurst) window.sparkBurst(r.left + r.width/2, r.top + r.height/2);
      // Build the web-intent URL up front so we can fall back to it from any share failure.
      const decoded = decodeURIComponent(text);
      let target = '';
      if (n === 'x')  target = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      if (n === 'li') target = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      if (n === 'wa') target = `https://wa.me/?text=${text}%20${url}`;
      // On mobile devices that support the native share sheet, prefer it.
      // Fall through to the web intent if anything other than user-dismiss happens.
      const isCoarse = matchMedia('(hover: none) and (pointer: coarse)').matches;
      if (isCoarse && navigator.share) {
        try {
          await navigator.share({
            title: 'The Sector Debrief',
            text: `"${decoded}" · The Sector Debrief`,
            url: 'https://thesectordebrief.com'
          });
          return;
        } catch (err) {
          if (err && err.name === 'AbortError') return;  // user dismissed the sheet
          // fall through to web intent
        }
      }
      window.open(target, '_blank', 'width=600,height=500');
    });
  });
}
function flash(el, text) {
  const original = el.innerHTML;
  // textContent, not innerHTML: callers only pass glyph literals today, but
  // this keeps the helper safe if any future caller passes dynamic text.
  el.textContent = text;
  setTimeout(() => { el.innerHTML = original; }, 1100);
}

// ─── ABOUT ───
function renderAbout() {
  const grid = $('#hosts-grid');
  if (!grid) return;
  grid.innerHTML = HOSTS.map(h => `
    <article class="host" id="${escAttr(h.slug)}" data-accent="${escAttr(h.accent)}">
      <div class="host-avatar host-avatar-photo">
        <img src="${escAttr(h.photo)}" alt="${escAttr(h.name)}" width="${h.photoW || 600}" height="${h.photoH || 600}" decoding="async"/>
      </div>
      <h3 class="host-name">${escAttr(h.name)}</h3>
      <div class="host-role">${escAttr(h.role)}</div>
      <p class="host-bio">${escAttr(h.bio)}</p>
      <a class="host-linkedin" href="${escAttr(safeUrl(h.linkedin))}" target="_blank" rel="noopener noreferrer">
        <span class="li-mark">in</span>
        <span>Connect on LinkedIn</span>
        <span class="li-arrow">→</span>
      </a>
    </article>
  `).join('');
}

// Host anchor: when the URL hash matches a host slug (e.g. #ali-al-mokdad),
// switch to the About page and smoothly scroll to that host card. Briefly
// highlight the card so the visitor knows where they landed. Used by the
// hash-route handler and the initial-load logic.
function openHostAnchor(slug, opts) {
  opts = opts || {};
  if (state.page !== 'about') {
    // fromHashChange:true preserves the host slug in the URL (otherwise
    // _doNavigate would rewrite the hash to #about). Also pass through
    // preserveScroll so back/forward (popstate) doesn't jolt the scroll
    // to 0 just before our smooth scrollIntoView fires.
    _doNavigate('about', { fromHashChange: true, preserveScroll: !!opts.preserveScroll });
  }
  setTimeout(() => {
    const el = document.getElementById(slug);
    if (!el) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    el.classList.add('host-anchor-highlight');
    setTimeout(() => el.classList.remove('host-anchor-highlight'), 2400);
  }, opts.coldLoad ? 600 : 120);
}

// ─── EPISODE MODAL ───
function openEpisode(ep) {
  const m = $('#modal-episode');
  // The modal carries the `hidden` attribute by default for a11y (keeps it
  // out of the SR tree until populated). Remove it now that we're injecting
  // content; without this the .modal-backdrop.active CSS can't override the
  // display:none !important that browsers apply to [hidden].
  m.removeAttribute('hidden');
  m.innerHTML = `
    <button class="modal-close" type="button" aria-label="Close" onclick="closeModal()">×</button>
    <div class="modal-video">
      <iframe src="https://www.youtube.com/embed/${ep.id}?rel=0" loading="lazy" title="Episode ${ep.n}: ${escAttr(ep.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
    <div class="modal-body">
      <div class="modal-meta">
        <span>Episode ${ep.n}</span>
        <span>·</span>
        <span>${fmtDate(ep.date)}</span>
        ${ep.duration ? `<span>·</span><span>${escAttr(ep.duration)}</span>` : ''}
        ${ep.guest ? `<span>· w/ ${escAttr(ep.guest)}</span>` : ''}
      </div>
      <h2 class="modal-title" id="modal-episode-title">${escAttr(ep.title)}</h2>
      <p class="modal-desc">${escAttr(ep.description)}</p>
      <div class="modal-actions">
        <a class="ep-link primary" href="https://www.youtube.com/watch?v=${ep.id}" target="_blank" rel="noopener noreferrer">▶ Open in YouTube</a>
        <a class="ep-link" href="${PLATFORMS.spotify}" target="_blank" rel="noopener noreferrer">🎵 Spotify</a>
        <a class="ep-link" href="${PLATFORMS.apple}" target="_blank" rel="noopener noreferrer">🎧 Apple Podcasts</a>
      </div>
    </div>
  `;
  // De-mark any existing top modal, then mark this one as topmost
  $$('.modal-backdrop.active').forEach(b => b.classList.remove('is-top'));
  const backdrop = $('#modal-backdrop');
  backdrop.classList.add('active', 'is-top');
  lockBodyScroll();
  // Only capture the trigger if no modal is already open — nested modals must NOT
  // overwrite the outer modal's trigger, or focus restoration ends up on a
  // detached node (the inner modal's button) when both close.
  rememberTrigger();
  setTimeout(() => $('#modal-episode .modal-close')?.focus(), 50);
  attachTrap(m);
  showMini(ep);
}

// ─── BLOG MODAL ───
function openBlog(slug) {
  const post = BLOG_POSTS.find(p => p.slug === slug);
  if (!post) return;
  const ep = post.epId ? EPISODES.find(e => e.id === post.epId) : null;
  const m = $('#modal-blog');
  // See openEpisode comment; modal needs `hidden` removed when populating.
  m.removeAttribute('hidden');
  const cover = blogCoverSVG(post);
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
        <p class="pause-question" id="pause-q-${post.slug}" aria-live="polite" aria-atomic="true">${escAttr(reflections[initialIdx])}</p>
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
      <img src="${cover}" alt="${escAttr(post.title)}"/>
    </div>
    <div class="blog-modal-body">
      <div class="blog-card-meta">
        ${metaTag}
        <span>·</span>
        <span>${escAttr(post.readTime)} read</span>
        ${dateLine}
      </div>
      <h2 id="modal-blog-title" class="blog-modal-h1">${escAttr(post.title)}</h2>
      ${post.body}
      ${pauseSection}
      ${footer}
    </div>
  `;
  $$('.modal-backdrop.active').forEach(b => b.classList.remove('is-top'));
  const blogBack = $('#modal-blog-backdrop');
  blogBack.classList.add('active', 'is-top');
  lockBodyScroll();
  rememberTrigger();
  setTimeout(() => $('#modal-blog .modal-close')?.focus(), 50);
  attachTrap(m);
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
        const t   = encodeURIComponent(`"${text}"\n\n· The Sector Debrief`);
        const r   = btn.getBoundingClientRect();
        if (window.sparkBurst) window.sparkBurst(r.left + r.width/2, r.top + r.height/2);
        if (action === 'share-x')  window.open(`https://twitter.com/intent/tweet?text=${t}&url=${url}`, '_blank', 'width=600,height=500');
        if (action === 'share-li') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=500');
        if (action === 'share-wa') window.open(`https://wa.me/?text=${t}%20${url}`, '_blank', 'width=600,height=500');
        if (action === 'copy') {
          const original = btn.innerHTML;
          safeCopy(`"${text}" · The Sector Debrief`).then(ok => {
            btn.innerHTML = ok ? '✓' : '!';
            if (!ok) btn.title = 'Copy not available';
            setTimeout(() => { btn.innerHTML = original; }, 1100);
          });
        }
      }
    });
  });
}

// Close only the topmost open modal; only release scroll-lock when none remain.
// Remove iframes outright (rather than setting src=blank) · Firefox sometimes
// keeps audio playing on src swap. Removal guarantees teardown.
window.closeModal = function() {
  const open = $$('.modal-backdrop.active');
  if (!open.length) return;
  const top = open[open.length - 1];
  // Tear down the Tab-trap on the inner .modal so we don't leak keydown listeners
  // across repeated open/close cycles.
  top.querySelectorAll('.modal').forEach(m => {
    if (m._trapCleanup) { m._trapCleanup(); m._trapCleanup = null; }
  });
  top.classList.remove('active', 'is-top');
  top.querySelectorAll('iframe').forEach(f => f.remove());
  // Restore `hidden` on the inner modal so it leaves the a11y tree until next open.
  top.querySelectorAll('.modal').forEach(m => m.setAttribute('hidden', ''));
  if (!$$('.modal-backdrop.active').length) {
    document.body.classList.remove('scroll-lock');
    // Release iOS scroll-lock and restore scroll position
    const lockedY = parseInt(document.body.dataset.scrollLockY || '0', 10);
    if (document.body.dataset.scrollLockY) {
      document.body.style.top = '';
      document.body.style.position = '';
      document.body.style.width = '';
      delete document.body.dataset.scrollLockY;
      window.scrollTo(0, lockedY);
    }
    if (state.lastTrigger && typeof state.lastTrigger.focus === 'function') {
      try { state.lastTrigger.focus({ preventScroll: true }); } catch (_) {}
      state.lastTrigger = null;
    }
  } else {
    // Re-mark the new top modal so it sits above the one below
    const stillOpen = $$('.modal-backdrop.active');
    stillOpen[stillOpen.length - 1].classList.add('is-top');
  }
};

// Lock scroll on iOS (which ignores body { overflow: hidden }) by pinning the body.
function lockBodyScroll() {
  if (document.body.classList.contains('scroll-lock')) return;
  const y = window.scrollY || window.pageYOffset || 0;
  document.body.dataset.scrollLockY = String(y);
  document.body.style.top = `-${y}px`;
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
  document.body.classList.add('scroll-lock');
}

// Capture the element that opened the modal — but only if we don't already have one
// tracked. Nested modal-opens must NOT clobber the outermost trigger, or restoration
// focuses a now-detached element when both close.
function rememberTrigger() {
  if (state.lastTrigger && document.body.contains(state.lastTrigger)) return;
  const active = document.activeElement;
  if (!active || active === document.body) { state.lastTrigger = null; return; }
  // Skip if the currently-focused element is itself inside an open modal (we want
  // to track the page-level trigger, not an inner modal button).
  if (active.closest && active.closest('.modal-backdrop.active')) return;
  state.lastTrigger = active;
}

// Attach a Tab-trap to the modal. Stores the cleanup on the modal node so closeModal
// can remove the listener and prevent leaks across repeated open/close cycles.
function attachTrap(modal) {
  if (!modal) return;
  // Detach a previous trap on this same modal element if one is still attached.
  if (modal._trapCleanup) { modal._trapCleanup(); modal._trapCleanup = null; }
  const sel = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
  function onKey(e) {
    if (e.key !== 'Tab') return;
    const nodes = [...modal.querySelectorAll(sel)].filter(el => el.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last  = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }
  modal.addEventListener('keydown', onKey);
  modal._trapCleanup = () => modal.removeEventListener('keydown', onKey);
}

// ─── MINI PLAYER ───
function showMini(ep) {
  const mp = $('#mini-player');
  $('#mini-title').textContent = ep.title;
  $('#mini-sub').textContent   = `Episode ${ep.n} · The Sector Debrief`;
  const miniImg = $('#mini-thumb-img');
  miniImg.src = `https://i.ytimg.com/vi/${ep.id}/hqdefault.jpg`;
  miniImg.alt = `Episode ${ep.n} thumbnail: ${ep.title}`;
  miniImg.removeAttribute('aria-hidden');
  mp.classList.add('active');
  state.player = { active: true, ep };
}
function bindMini() {
  const mp = $('#mini-player');
  if (!mp || mp.dataset.bound) return;
  mp.dataset.bound = '1';
  $('#mini-close')?.addEventListener('click', () => {
    mp.classList.remove('active');
    state.player = { active: false, ep: null };
  });
  $('#mini-toggle')?.addEventListener('click', () => {
    if (state.player.ep) openEpisode(state.player.ep);
  });
  // EPISODES is stored newest-first. Older episode = index + 1, newer = index - 1.
  const indexOfCurrent = () => EPISODES.findIndex(e => e.id === state.player.ep?.id);
  $('#mini-prev')?.addEventListener('click', () => {
    const i = indexOfCurrent();
    if (i < 0) return;
    // "Previous episode" should go to the older one (higher index in newest-first array)
    const prev = EPISODES[(i + 1) % EPISODES.length];
    showMini(prev);
  });
  $('#mini-next')?.addEventListener('click', () => {
    const i = indexOfCurrent();
    if (i < 0) return;
    // "Next episode" should go to the newer one (lower index)
    const next = EPISODES[(i - 1 + EPISODES.length) % EPISODES.length];
    showMini(next);
  });
}

// ─── CONTACT FORM ───
function bindContactForm() {
  const form = $('#contact-form');
  if (!form || form.dataset.bound) return;
  form.dataset.bound = '1';

  // Make _next dynamic so staging / preview environments don't bounce users to production.
  const nextInput = form.querySelector('input[name="_next"]');
  if (nextInput) nextInput.value = location.origin + '/?sent=1#contact';

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
    // Strip ?sent=1 from URL while keeping #contact route
    history.replaceState(null, '', location.origin + '/#contact');
  }

  // Robot check interaction
  const robotInput = $('#not-robot');
  const robotBox   = document.querySelector('.robot-check');
  robotInput?.addEventListener('change', () => {
    robotBox?.classList.remove('robot-check-error');
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Honeypot: if a bot filled the hidden _honey field, silently pretend success.
    const honey = form.querySelector('input[name="_honey"]');
    if (honey && honey.value) {
      form.reset();
      const success = $('#form-success');
      if (success) {
        success.style.display = 'block';
        success.textContent = '✓ Message sent.';
        setTimeout(() => { success.style.display = 'none'; }, 7000);
      }
      return;
    }

    // Native field validation. The form carries novalidate (so the no-JS POST
    // path isn't blocked), which also suppresses the browser's auto-check on
    // JS submits — fire it manually so empty required fields get the native
    // per-field bubble instead of a doomed POST and a misleading retry error.
    if (!form.reportValidity()) return;

    // Resolve these up-front so the robot-check error path can announce through
    // the same live region used for AJAX success / error.
    const btn     = form.querySelector('.form-submit');
    const success = $('#form-success');

    // Must tick the robot check first
    if (robotInput && !robotInput.checked) {
      robotBox?.classList.add('robot-check-error');
      robotInput.setAttribute('aria-invalid', 'true');
      if (success) {
        success.style.display = 'block';
        success.classList.add('is-error');
        success.textContent = '✗ Please confirm you\'re not a robot before sending.';
        setTimeout(() => {
          success.style.display = 'none';
          success.classList.remove('is-error');
        }, 5000);
      }
      robotInput.focus();
      return;
    }
    // Clear any prior validation state once the user submits with the box ticked.
    robotInput?.removeAttribute('aria-invalid');

    const original = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;

    try {
      // Submit to our own PHP receiver on alialmokdadleadership.com (cPanel
      // hosting, same Namecheap mail path as the Fluent Forms on the other
      // sites — proven reliable delivery). FormSubmit's per-origin activation
      // gymnastics were unreliable for our Gmail target; switched off.
      const fd = new FormData(form);
      const payload = {};
      for (const [k, v] of fd.entries()) payload[k] = v;
      const res = await fetch('https://alialmokdadleadership.com/sd-contact-receiver.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok !== true) {
        console.warn('PHP receiver returned non-success:', { status: res.status, json });
        throw new Error('PHP receiver: ' + (json.error || res.status));
      }

      success.style.display = 'block';
      success.classList.remove('is-error');
      success.textContent = '✓ Message sent. We\'ll get back to you within a few days.';
      form.reset();
      if (robotInput) robotInput.checked = false;
      btn.textContent = original;
      btn.disabled = false;
      setTimeout(() => { success.style.display = 'none'; }, 7000);
    } catch (err) {
      console.warn('Contact form submission failed:', err);
      btn.textContent = original;
      btn.disabled = false;
      if (success) {
        success.style.display = 'block';
        success.classList.add('is-error');
        success.textContent = '✗ Couldn\'t send the message right now. Please try again in a moment, or leave us a comment on YouTube.';
        setTimeout(() => {
          success.style.display = 'none';
          success.classList.remove('is-error');
        }, 9000);
      }
    }
  });
}

// ─── SEARCH (120ms debounce so we don't re-render on every keystroke) ───
function bindSearch() {
  const input = $('#search-input');
  if (!input || input.dataset.bound) return;
  input.dataset.bound = '1';
  input.addEventListener('input', () => {
    state.search = input.value;
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(renderEpisodes, 120);
  });
}

// ─── MOBILE NAV ───
function bindMobileNav() {
  const toggle = $('#nav-toggle');
  const links  = $('.nav-links');
  if (!toggle || !links || toggle.dataset.bound) return;
  toggle.dataset.bound = '1';
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('mobile-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    // Lock body scroll behind the open drawer (mirror of modal behavior)
    if (open) {
      document.body.classList.add('nav-open');
    } else {
      document.body.classList.remove('nav-open');
    }
  });
  // Tap anywhere outside the drawer to close it
  document.addEventListener('click', (e) => {
    if (!links.classList.contains('mobile-open')) return;
    if (toggle.contains(e.target) || links.contains(e.target)) return;
    closeMobileNav();
  });
  // Esc closes the drawer too
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && links.classList.contains('mobile-open')) {
      closeMobileNav();
      toggle.focus();
    }
  });
}
function closeMobileNav() {
  const toggle = $('#nav-toggle');
  const links = $('.nav-links');
  const wasOpen = links?.classList.contains('mobile-open');
  links?.classList.remove('mobile-open');
  document.body.classList.remove('nav-open');
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.setAttribute('aria-label', 'Open menu');
  // If menu was open and focus is somewhere inside it, return focus to the toggle button
  if (wasOpen && links && links.contains(document.activeElement)) {
    toggle?.focus();
  }
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

      // Animate the LAST 15% only · starting at 0 made intermediate values
      // like "8,469" briefly visible for the 76,766 total-views stat, which
      // reads as "wrong number" to a glancing visitor. Start at 85% of the
      // target so the worst-case mid-flight value is still close to truth,
      // and shorten the duration so the wrong-number window is minimised.
      const duration = 900;
      const start = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const v = num * (0.85 + 0.15 * easeOut(t));
        target.textContent = formatNum(v) + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else target.textContent = formatNum(num) + suffix;
      }
      requestAnimationFrame(tick);
      obs.unobserve(target);
    });
  }, { threshold: 0.55 });
  els.forEach(el => obs.observe(el));
}

// ─── SEO: inject PodcastEpisode JSON-LD from EPISODES data ───
function injectEpisodeSchema() {
  const slot = document.getElementById('ld-episodes');
  if (!slot || typeof EPISODES === 'undefined') return;
  const series = 'https://thesectordebrief.com/#series';
  const items = EPISODES.map((ep, i) => ({
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    'name': ep.title,
    'description': (ep.description || '').slice(0, 280),
    'datePublished': ep.date,
    'episodeNumber': ep.n,
    'url': `https://www.youtube.com/watch?v=${ep.id}`,
    'partOfSeries': { '@type': 'PodcastSeries', 'name': 'The Sector Debrief', '@id': series },
    'associatedMedia': {
      '@type': 'MediaObject',
      'contentUrl': `https://www.youtube.com/watch?v=${ep.id}`
    }
  }));
  try {
    slot.textContent = JSON.stringify(items);
  } catch (e) {
    console.warn('Episode schema injection failed (PodcastEpisode JSON-LD will be missing for crawlers):', e);
  }
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  injectEpisodeSchema();
  renderHome();
  renderEpisodes();
  renderBlog();
  renderPauseHero();
  renderQuotes();
  renderAbout();

  const initial = (location.hash || '#home').slice(1);
  const hostSlugs = HOSTS.map(h => h.slug);
  if (hostSlugs.includes(initial)) {
    // Cold-load on a host anchor URL. openHostAnchor handles both the page
    // switch (with fromHashChange:true so the URL stays as #ali-al-mokdad)
    // and the scroll-to + highlight. Do NOT also call navigate('about'),
    // that path doesn't pass fromHashChange and would rewrite the hash.
    openHostAnchor(initial, { coldLoad: true });
  } else {
    navigate(['home','episodes','blog','about','contact'].includes(initial) ? initial : 'home');
  }

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

  // Browsers fire BOTH popstate + hashchange on hash navigation.
  // We handle popstate (richer event) and skip hashchange when popstate just ran.
  let lastHashHandled = location.hash;
  function handleHashRoute(opts) {
    // Browser back/forward should also close any open modal. Otherwise a
    // visitor who opens an episode modal then hits Back keeps the modal
    // up, only the underlying page changes. Mirrors navigate()'s pattern.
    state.lastTrigger = null;
    for (let i = 0; i < 5 && $$('.modal-backdrop.active').length; i++) closeModal();
    const valid = ['home','episodes','blog','about','contact'];
    const hostSlugs = HOSTS.map(h => h.slug);
    const raw = (location.hash || '#home').slice(1);
    if (hostSlugs.includes(raw)) {
      // Pass opts through so popstate-driven host-anchor navigations preserve
      // the browser's restored scroll position (no jolt-to-top before scroll).
      openHostAnchor(raw, opts);
      lastHashHandled = location.hash;
      return;
    }
    if (valid.includes(raw)) {
      if (raw !== state.page) _doNavigate(raw, opts);
    } else {
      history.replaceState({ page: 'home' }, '', '#home');
      if (state.page !== 'home') _doNavigate('home', opts);
    }
    lastHashHandled = location.hash;
  }
  addEventListener('popstate', () => handleHashRoute({ preserveScroll: true, fromHashChange: true }));
  addEventListener('hashchange', () => {
    if (lastHashHandled === location.hash) return; // already handled by popstate
    handleHashRoute({ fromHashChange: true });
  });

  bindContactForm();
  bindSearch();
  bindMobileNav();
  bindMini();
  animateCounters();

  // Deep-link search: the PodcastSeries SearchAction in the head advertises
  // /?search={term}#episodes — honour it so the markup stays truthful and
  // agents following it land on a working, pre-filtered episode list.
  const deepSearch = new URLSearchParams(location.search).get('search');
  if (deepSearch) {
    state.search = deepSearch;
    const dsInput = $('#search-input');
    if (dsInput) dsInput.value = deepSearch;
    if (state.page === 'episodes') renderEpisodes();
  }

  setTimeout(() => {
    if (window.applyTilt)     window.applyTilt(document);
    if (window.applyMagnetic) window.applyMagnetic();
    if (window.refreshReveal) window.refreshReveal();
  }, 80);
});
