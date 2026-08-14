#!/usr/bin/env node
/*  build-pages.js  ─────────────────────────────────────────────
 *  Static per-URL page generator for The Sector Debrief.
 *
 *  The site itself is a hash-router SPA, which means Google only ever
 *  saw ONE indexable URL (the homepage). Every episode and every essay
 *  lived behind a "#fragment" that search engines collapse into "/".
 *
 *  This script reads js/data.js (the single source of truth) and emits
 *  real, crawlable HTML pages with the content rendered in the markup,
 *  full structured data, and a complete sitemap, so every episode and
 *  essay becomes its own indexable landing page.
 *
 *  Output (all additive · never touches index.html or the SPA):
 *    /episodes/index.html            episodes hub
 *    /episodes/<slug>/index.html     one per episode  (9)
 *    /blog/index.html                essays hub
 *    /blog/<slug>/index.html         one per essay    (11)
 *    /about/index.html               hosts
 *    /sitemap.xml                    every URL above + home
 *
 *  Run:  node scripts/build-pages.js      (from the repo root)
 * ───────────────────────────────────────────────────────────── */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const { EPISODES, BLOG_POSTS, HOSTS, PLATFORMS, STATS } = require(path.join(ROOT, 'js', 'data.js'));

const SITE = 'https://thesectordebrief.com';
const ASSET_V = '2026-07-13a';                 // cache-bust for /css and shared assets
const TODAY = '2026-07-13';
const TRANSCRIPT_DATE = '2026-08-14';          // when transcripts were published
                     // build date (Date.now is avoided for reproducibility)
const OG_DEFAULT = SITE + '/assets/cover.jpg';

// ─── helpers ───────────────────────────────────────────────────
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const stripTags = (html) => String(html || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&rarr;/g, '')
  .replace(/&ldquo;|&rdquo;/g, '"').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();

// clamp to ~n chars at a word boundary, no dangling punctuation
const clip = (s, n = 158) => {
  s = String(s || '').trim();
  if (s.length <= n) return s;
  let cut = s.slice(0, n);
  cut = cut.slice(0, Math.min(cut.length, cut.lastIndexOf(' ')));
  return cut.replace(/[\s,;:.\-]+$/, '') + '…';
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmtDate = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const isoDuration = (dur) => {
  const n = (String(dur || '').match(/\d+/) || [])[0];
  return n ? `PT${n}M` : undefined;
};
const wordCount = (html) => stripTags(html).split(/\s+/).filter(Boolean).length;

// Safe serialiser for anything placed inside <script type="application/ld+json">.
// JSON.stringify escapes quotes and newlines but does NOT neutralise the sequence
// </script>. Any string value containing it would close the tag early and corrupt the rest
// of the page. That was harmless while every value was a short hand-written summary. It
// stops being harmless the moment full episode transcripts are added.
//
// The last two patterns are written as \u2028 / \u2029 ESCAPES on purpose. Pasting the
// literal characters here is itself a syntax error, because those codepoints terminate the
// line and therefore terminate the regex literal.
const ldJson = (o) => JSON.stringify(o)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

// ---- transcripts -------------------------------------------------------------
// Source of truth is transcripts/<slug>.json, produced from the episode's YouTube caption
// track. Kept OUT of js/data.js: that file is loaded by the SPA on every route, and the
// transcripts total about 80,000 words.
function loadTranscript(slug) {
  try {
    const p = path.join(ROOT, 'transcripts', slug + '.json');
    if (!fs.existsSync(p)) return null;
    const t = JSON.parse(fs.readFileSync(p, 'utf8'));
    return (t && Array.isArray(t.turns) && t.turns.length) ? t : null;
  } catch (e) { return null; }
}

// The three hosts have profiles on the about page, so their names link there. Guests do not
// have a profile on this site, so a guest's name is plain text rather than a link that would
// go nowhere useful.
const HOST_ANCHOR = {
  'Ali Al Mokdad': 'ali-al-mokdad',
  'Kim Kucinskas': 'kim-kucinskas',
  'Thomas Jepson-Lay': 'thomas-jepson-lay',
};

// One accent per person, reused down the page. This is the reason the transcript is scannable:
// with three voices alternating over fifty minutes, a reader tracking who said what should not
// have to read each name, and a consistent colour lets the eye follow one speaker down the
// page. Only tokens that hold their contrast on cream are used.
const SPEAKER_TINT = {
  'Ali Al Mokdad': 'var(--crimson)',
  'Kim Kucinskas': 'var(--cobalt)',
  'Thomas Jepson-Lay': '#2A4530',
};

// Visible transcript section. Escaped with esc(); deliberately NOT routed through the blog
// body path, which injects raw HTML.
//
// Every name here was read off the episode video, where the platform burns the active
// speaker's name into the frame, so the attribution is a reading of the record rather than an
// inference from the words. Where that reading could not be settled, and it could not on a
// handful of fast three-way exchanges, the turn carries no name at all. Nothing is guessed.
//
// The name is also the layout. It groups each turn, which is what lets the spacing open up:
// air between speakers, less between paragraphs of one speaker, so the shape of the
// conversation is visible before a word is read.
function transcriptHtml(ep, tr) {
  // Four episodes carry no burned-in speaker label, so their transcripts ship with no names at
  // all rather than "Speaker not established" repeated eighty times, which is noise, or a guess,
  // which is worse. The words are the same words; only the attribution is unavailable.
  const named = tr.speakers !== false;
  const turns = tr.turns.map((tn) => {
    const who = tn.speaker || '';
    const anchor = HOST_ANCHOR[who];
    const tint = SPEAKER_TINT[who] || 'var(--ink-soft)';
    const label = who
      ? (anchor
          ? `<a class="tr-name" href="/about/#${anchor}">${esc(who)}</a>`
          : `<span class="tr-name">${esc(who)}</span>`)
      : '';   // no label at all rather than a placeholder, per Ali: do not print it
              // A turn whose speaker is not established now shows only its timestamp. That is
              // the honest rendering: it asserts nothing, invents nobody, and does not repeat a
              // phrase that told a reader nothing they could use.
    // The seek offset is coerced to a non-negative integer rather than interpolated as it
    // arrives. It comes from a file this pipeline writes, so it is trusted today, but an
    // unvalidated value reaching an href is the kind of thing that stays wrong once the data
    // source changes hands.
    const at = Math.max(0, Math.floor(Number(tn.t) || 0));
    const stamp = `<a class="tr-ts" href="https://www.youtube.com/watch?v=${ep.id}&amp;t=${at}s"`
      + ` target="_blank" rel="noopener noreferrer"`
      + ` aria-label="Play from ${esc(tn.ts)} on YouTube">${esc(tn.ts)}</a>`;
    const body = (tn.paras && tn.paras.length ? tn.paras : [tn.text])
      .map((p) => `<p>${esc(p)}</p>`).join('\n        ');
    return `<article class="tr-turn" style="--sp:${tint}">
        <header class="tr-who">${named ? label : ''}${stamp}</header>
        ${body}
      </article>`;
  });
  // The episodes open on a trailer of clips lifted from later in the conversation, so those
  // first turns are fragments that each reappear further down the page. They are real speech
  // and stay, but unlabelled they read as a broken transcript, so they are fenced off under a
  // heading that explains them. The count comes from the build step, which detects the montage
  // by that duplication rather than by assuming a fixed length.
  const cold = Number(tr.coldOpen) || 0;
  const body = cold > 0
    ? `<div class="tr-cold">
        <p class="tr-cold-h">Cold open, clips from later in the conversation</p>
        ${turns.slice(0, cold).join('\n        ')}
      </div>
      ${turns.slice(cold).join('\n      ')}`
    : turns.join('\n      ');
  const words = tr.turns.reduce((n, tn) => n
    + (tn.paras && tn.paras.length ? tn.paras.join(' ') : (tn.text || ''))
      .split(/\s+/).filter(Boolean).length, 0);
  return `
  <section class="doc-transcript" id="transcript" aria-labelledby="transcript-h">
    <h2 id="transcript-h">Transcript</h2>
    <p class="tr-note">Every timestamp opens that moment in the video, which is the record.
      Spotted an error? <a href="/#contact">Tell us</a> and we will fix it.</p>
    <div class="tr-body">
      ${body}
    </div>
  </section>`;
}


const episodeUrl = (ep) => `${SITE}/episodes/${ep.slug}/`;
const blogUrl = (p) => `${SITE}/blog/${p.slug}/`;
const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// stable author @id map (matches the @ids already declared in index.html <head>)
const HOST_ID = {
  'Ali Al Mokdad': SITE + '/#ali-al-mokdad',
  'Kim Kucinskas': SITE + '/#kim-kucinskas',
  'Thomas Jepson-Lay': SITE + '/#thomas-jepson-lay',
};
const hostRefs = () => HOSTS.map(h => ({ '@type': 'Person', '@id': HOST_ID[h.name] || undefined, name: h.name }));

// Rich, accurate identity data so Google can resolve each host as a real person
// and tie them to the show. Ali carries his full senior leadership title, his
// authority-site url, and a leadership-focused knowsAbout so a search for the
// show surfaces him as a senior humanitarian-leadership voice behind it. This is
// his REAL title and profile, not inflated copy, and it lives in the structured
// data layer (invisible to readers, authoritative to search engines).
const HOST_PROFILES = {
  'Ali Al Mokdad': {
    id: SITE + '/#ali-al-mokdad',
    jobTitle: 'Senior Strategic Leader in Global Impact Operations, Governance Reform, and Humanitarian Diplomacy',
    url: 'https://alialmokdadleadership.com',
    sameAs: [
      'https://www.linkedin.com/in/ali-al-mokdad/',
      'https://alialmokdadleadership.com',
      'https://alialmokdad.com',
      'https://alialmokdadinarabic.com',
    ],
    knowsAbout: [
      'Humanitarian Leadership', 'Humanitarian Diplomacy', 'Executive Leadership',
      'Next-Generation Leadership', 'Leadership Development', 'Governance Reform',
      'Humanitarian Reform', 'United Nations Reform', 'International Development',
      'Localization of Aid', 'Locally Led Development', 'Crisis Response',
      'NGO Leadership', 'Civil Society', 'Sector Reform',
    ],
  },
  'Kim Kucinskas': {
    id: SITE + '/#kim-kucinskas',
    jobTitle: 'Operational change and systems practitioner in international development',
    url: 'https://www.linkedin.com/in/kim-kucinskas/',
    sameAs: ['https://www.linkedin.com/in/kim-kucinskas/'],
    knowsAbout: ['International Development', 'Organisational Change', 'Localization of Aid', 'Systems Thinking', 'Humanitarian Leadership'],
  },
  'Thomas Jepson-Lay': {
    id: SITE + '/#thomas-jepson-lay',
    jobTitle: 'Independent leadership coach for the humanitarian sector',
    url: 'https://www.linkedin.com/in/thomas-jepson-lay-1588211b4/',
    sameAs: ['https://www.linkedin.com/in/thomas-jepson-lay-1588211b4/'],
    knowsAbout: ['Humanitarian Leadership', 'Leadership Coaching', 'Leadership Development', 'Crisis Response'],
  },
};

// ─── blog cover art (ported verbatim in spirit from js/app.js blogCoverSVG) ──
const BLOG_COVER_THEMES = {
  0:  { bg: '#FAF6EA', fg: '#1A1614', accent: '#EA4335', word: 'NOTES',    shape: 'editorial' },
  90: { bg: '#FAF6EA', fg: '#1A1614', accent: '#2C5BAA', word: 'PAUSE',    shape: 'editorial' },
  9:  { bg: '#0D1B2A', fg: '#F5F0E2', accent: '#E8B82C', word: 'PURPOSE',  shape: 'arc'    },
  8:  { bg: '#2A4530', fg: '#F5F0E2', accent: '#B83A2A', word: 'RISK',     shape: 'split'  },
  7:  { bg: '#1A1614', fg: '#FAF6EA', accent: '#E8B82C', word: 'CONTRACT', shape: 'circle' },
  6:  { bg: '#2A4530', fg: '#F5F0E2', accent: '#E8B82C', word: 'CHANGING', shape: 'arc'    },
  5:  { bg: '#0D1B2A', fg: '#E8B82C', accent: '#B83A2A', word: 'IDENTITY', shape: 'circle' },
  4:  { bg: '#FAF6EA', fg: '#1E3D7A', accent: '#C9963F', word: 'PATIENCE', shape: 'arc'    },
  3:  { bg: '#1A1614', fg: '#B83A2A', accent: '#E8B82C', word: 'PRESSURE', shape: 'lines'  },
  2:  { bg: '#E5DCC3', fg: '#2A4530', accent: '#B83A2A', word: 'SECTOR',   shape: 'split'  },
  1:  { bg: '#1E3D7A', fg: '#FAF6EA', accent: '#E8B82C', word: 'ORIGINS',  shape: 'sun'    },
};
function blogCoverSVG(post) {
  const isEditorial = post.pinned === true || post.epId === null;
  const n = Number.isFinite(Number(post.epN)) ? Number(post.epN) : 1;
  const t = BLOG_COVER_THEMES[n] || BLOG_COVER_THEMES[1];
  const W = 800, H = 500;
  const labelText = isEditorial || n === 0
    ? 'EDITORIAL  ·  THE SECTOR DEBRIEF'
    : `EPISODE ${String(n).padStart(2, '0')}  ·  THE SECTOR DEBRIEF`;
  let motif = '';
  if (t.shape === 'circle') {
    motif = `<circle cx="640" cy="160" r="120" fill="${t.accent}" opacity="0.85"/><circle cx="540" cy="370" r="70" fill="${t.fg}" opacity="0.9"/><path d="M60 420 Q200 360 360 420 T700 420" stroke="${t.fg}" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.6"/>`;
  } else if (t.shape === 'arc') {
    motif = `<path d="M40 380 Q200 100 400 250 T780 200" stroke="${t.fg}" stroke-width="22" fill="none" stroke-linecap="round" opacity="0.85"/><path d="M60 180 Q260 120 460 260" stroke="${t.accent}" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.7"/><circle cx="700" cy="380" r="40" fill="${t.accent}" opacity="0.9"/>`;
  } else if (t.shape === 'lines') {
    motif = `<path d="M40 110 L760 110" stroke="${t.fg}" stroke-width="9" stroke-linecap="round" opacity="0.7"/><path d="M40 200 L600 200" stroke="${t.accent}" stroke-width="14" stroke-linecap="round" opacity="0.85"/><path d="M180 290 L760 290" stroke="${t.fg}" stroke-width="11" stroke-linecap="round" opacity="0.6"/><path d="M40 380 L420 380" stroke="${t.accent}" stroke-width="9" stroke-linecap="round" opacity="0.7"/>`;
  } else if (t.shape === 'split') {
    motif = `<rect x="0" y="0" width="400" height="${H}" fill="${t.fg}" opacity="0.18"/><rect x="500" y="0" width="60" height="${H}" fill="${t.accent}" opacity="0.7"/><circle cx="700" cy="250" r="100" fill="${t.fg}" opacity="0.65"/><path d="M40 440 Q300 380 600 440" stroke="${t.accent}" stroke-width="11" fill="none" stroke-linecap="round"/>`;
  } else if (t.shape === 'sun') {
    motif = `<circle cx="600" cy="200" r="140" fill="${t.accent}" opacity="0.9"/><path d="M40 380 Q200 260 400 380 T780 360" stroke="${t.fg}" stroke-width="16" fill="none" stroke-linecap="round" opacity="0.55"/><path d="M40 250 Q160 220 280 260" stroke="${t.fg}" stroke-width="9" fill="none" stroke-linecap="round" opacity="0.7"/>`;
  } else if (t.shape === 'editorial') {
    motif = `<circle cx="160" cy="160" r="14" fill="#4285F4"/><circle cx="200" cy="160" r="14" fill="#EA4335"/><circle cx="240" cy="160" r="14" fill="#FBBC05"/><circle cx="280" cy="160" r="14" fill="#34A853"/><path d="M40 230 L760 230" stroke="${t.fg}" stroke-width="3" stroke-linecap="round" opacity="0.18"/><path d="M40 260 L520 260" stroke="${t.fg}" stroke-width="3" stroke-linecap="round" opacity="0.18"/><path d="M40 290 L640 290" stroke="${t.fg}" stroke-width="3" stroke-linecap="round" opacity="0.18"/><rect x="40" y="115" width="80" height="6" rx="3" fill="${t.accent}"/>`;
  }
  const wordSize = Math.max(60, 100 - t.word.length * 4);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(post.title)}"><rect width="${W}" height="${H}" fill="${t.bg}"/>${motif}<text x="40" y="${H - 60}" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="${wordSize}" fill="${t.fg}" letter-spacing="-2">${t.word}</text><text x="42" y="${H - 25}" font-family="Inter, sans-serif" font-size="12" font-weight="600" letter-spacing="3" fill="${t.fg}" opacity="0.7">${labelText}</text></svg>`;
}

// ─── shared chrome ─────────────────────────────────────────────
const MIC = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 10.5v1.5a6.5 6.5 0 0 0 13 0v-1.5"/><line x1="12" y1="18.5" x2="12" y2="21.5"/><line x1="8.5" y1="21.5" x2="15.5" y2="21.5"/></svg>`;

function navHtml(active) {
  const link = (href, label, key) =>
    `<a href="${href}"${key === active ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<header class="doc-nav"><div class="doc-nav-in">
    <a class="doc-brand" href="/"><span class="doc-brand-mark" aria-hidden="true">${MIC}</span><span>The Sector Debrief<sup>&trade;</sup></span></a>
    <nav class="doc-links" aria-label="Primary">
      ${link('/', 'Home', 'home')}
      ${link('/episodes/', 'Episodes', 'episodes')}
      ${link('/blog/', 'Blog', 'blog')}
      ${link('/about/', 'About', 'about')}
    </nav>
    <a class="doc-cta" href="${PLATFORMS.playlist}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="11" height="11"><path d="M5 3.5v17l15-8.5z"/></svg> Listen</a>
  </div></header>`;
}

function footerHtml() {
  const orb = (cls, href, label, svg) =>
    `<a class="doc-orb ${cls}" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${label}">${svg}</a>`;
  const yt = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>`;
  const sp = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.7 0 12 0zm5.5 17.3a.75.75 0 0 1-1 .25c-2.8-1.7-6.4-2.1-10.6-1.1a.75.75 0 1 1-.4-1.4c4.6-1 8.5-.6 11.7 1.3a.75.75 0 0 1 .3 1zm1.5-3.3a1 1 0 0 1-1.3.3c-3.3-2-8.3-2.6-12.2-1.4a1 1 0 0 1-.6-2c4.4-1.3 9.9-.7 13.7 1.7.5.3.6 1 .4 1.4zm.1-3.4C15.2 8.3 8.4 8 4.5 9.2a1.2 1.2 0 1 1-.7-2.3c4.5-1.4 12-1 16.7 1.8a1.2 1.2 0 0 1-1.4 2z"/></svg>`;
  const ap = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.7 0 12 0zm0 4.7a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2zm-2.2 13c0-.7.6-1.3 1.3-1.3h1.7c.8 0 1.4.6 1.4 1.3l-.7 4.5c-.1.6-.6 1-1.2 1h-.6c-.6 0-1.1-.4-1.2-1l-.7-4.5z"/></svg>`;
  const ih = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.6s-7.5-4.5-9.5-9.4C1 8.4 3.4 4.4 7 4.4c2.2 0 3.7 1.3 5 3 1.3-1.7 2.8-3 5-3 3.6 0 6 4 4.5 7.8C19.5 17 12 21.6 12 21.6z"/></svg>`;
  return `<footer class="doc-foot"><div class="doc-foot-in">
    <div class="doc-foot-grid">
      <div>
        <div class="doc-foot-brand"><span class="doc-brand-mark" aria-hidden="true">${MIC}</span><span>The Sector Debrief<sup>&trade;</sup></span></div>
        <p class="doc-foot-tag">&ldquo;The conversations that happen when the microphones are off.&rdquo;</p>
      </div>
      <div>
        <h2>Navigate</h2>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/episodes/">Episodes</a></li>
          <li><a href="/blog/">Blog</a></li>
          <li><a href="/about/">About</a></li>
          <li><a href="/#contact">Contact</a></li>
        </ul>
      </div>
      <div>
        <h2>The Hosts</h2>
        <ul>
          <li><a href="/about/#ali-al-mokdad">Ali Al Mokdad</a></li>
          <li><a href="/about/#kim-kucinskas">Kim Kucinskas</a></li>
          <li><a href="/about/#thomas-jepson-lay">Thomas Jepson-Lay</a></li>
        </ul>
      </div>
      <div>
        <h2>Listen on</h2>
        <div class="doc-orbs">
          ${orb('yt', PLATFORMS.youtube, 'YouTube', yt)}
          ${orb('sp', PLATFORMS.spotify, 'Spotify', sp)}
          ${orb('ap', PLATFORMS.apple, 'Apple Podcasts', ap)}
          ${orb('ih', 'https://iheart.com/podcast/1333-the-sector-debrief-313409566', 'iHeart', ih)}
        </div>
      </div>
    </div>
    <div class="doc-foot-copy">
      <span>&copy; 2026 The Sector Debrief<sup>&trade;</sup>. All rights reserved.</span>
      <span>Conversations that shape the future</span>
    </div>
  </div></footer>`;
}

// ─── page shell ────────────────────────────────────────────────
function shell({ title, desc, canonical, ogType, ogImage, jsonld, body, active }) {
  const blocks = (jsonld || []).map(o =>
    `<script type="application/ld+json">${ldJson(o)}</script>`).join('\n  ');
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}"/>
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
  <link rel="canonical" href="${canonical}"/>
  <meta name="theme-color" content="#EFE8D6" media="(prefers-color-scheme: light)"/>
  <meta name="theme-color" content="#1A1614" media="(prefers-color-scheme: dark)"/>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"/>
  <link rel="manifest" href="/site.webmanifest"/>
  <link rel="alternate" type="application/rss+xml" title="The Sector Debrief" href="https://anchor.fm/s/10c257648/podcast/rss"/>
  <meta property="og:title" content="${esc(title)}"/>
  <meta property="og:description" content="${esc(desc)}"/>
  <meta property="og:type" content="${ogType || 'website'}"/>
  <meta property="og:url" content="${canonical}"/>
  <meta property="og:site_name" content="The Sector Debrief"/>
  <meta property="og:image" content="${ogImage || OG_DEFAULT}"/>
  <meta property="og:image:alt" content="${esc(title)}"/>
  <meta property="og:locale" content="en_GB"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${esc(title)}"/>
  <meta name="twitter:description" content="${esc(desc)}"/>
  <meta name="twitter:image" content="${ogImage || OG_DEFAULT}"/>
  <meta name="twitter:image:alt" content="${esc(title)}"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'"/>
  <noscript><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/></noscript>
  <link rel="stylesheet" href="/css/style.css?v=${ASSET_V}"/>
  <style>${DOC_CSS}</style>
  ${blocks}
</head>
<body class="doc-body">
<a class="doc-skip" href="#doc-main">Skip to content</a>
${navHtml(active)}
<main id="doc-main">
${body}
</main>
${footerHtml()}
</body>
</html>`;
}

// ─── scoped stylesheet (self-sufficient · re-declares tokens) ───
const DOC_CSS = `
:root{--cream:#EFE8D6;--cream-soft:#F5F0E2;--cream-deep:#E5DCC3;--paper:#FAF6EA;--ink:#1A1614;--ink-soft:#2C2622;--ink-mute:#524A42;--cobalt:#2C5BAA;--cobalt-deep:#1A3866;--crimson:#B83A2A;--crimson-deep:#8B2818;--mustard:#E8B82C;--forest:#2A4530;--rust:#A0531F;--fd:'Fraunces',Georgia,serif;--fb:'Inter',-apple-system,BlinkMacSystemFont,sans-serif}
.doc-body{visibility:visible!important;opacity:1!important;margin:0;background:var(--cream);color:var(--ink);font-family:var(--fb);font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.doc-body *{box-sizing:border-box}
.doc-body img{max-width:100%;height:auto;display:block}
.doc-body a{color:var(--cobalt-deep);text-decoration-thickness:1px;text-underline-offset:2px}
.doc-skip{position:absolute;left:-999px;top:0;background:var(--ink);color:var(--cream);padding:10px 16px;border-radius:4px;z-index:100}
.doc-skip:focus{left:12px;top:12px}
/* nav */
.doc-nav{position:sticky;top:0;z-index:40;background:rgba(239,232,214,.96);backdrop-filter:saturate(1.1);border-bottom:1px solid var(--cream-deep)}
.doc-nav-in{max-width:1160px;margin:0 auto;display:flex;align-items:center;gap:20px;padding:14px 24px}
.doc-brand{display:flex;align-items:center;gap:9px;font-family:var(--fd);font-weight:700;font-size:19px;color:var(--ink);text-decoration:none;letter-spacing:-.01em}
.doc-brand sup{font-size:.5em;opacity:.6}
.doc-brand-mark{width:26px;height:26px;display:grid;place-items:center;background:var(--crimson);border-radius:6px;color:var(--cream);flex:0 0 auto}
.doc-brand-mark svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round}
.doc-links{display:flex;flex-wrap:wrap;gap:4px;margin-left:auto}
.doc-links a{font-size:14px;font-weight:500;color:var(--ink-soft);text-decoration:none;padding:7px 12px;border-radius:6px;transition:background .15s,color .15s}
.doc-links a:hover{background:var(--cream-deep)}
.doc-links a[aria-current=page]{color:var(--crimson);font-weight:600}
.doc-cta{display:inline-flex;align-items:center;gap:6px;background:var(--crimson);color:var(--cream);font-weight:600;font-size:13.5px;padding:8px 15px;border-radius:7px;text-decoration:none;flex:0 0 auto}
.doc-cta:hover{background:var(--crimson-deep)}
/* layout */
.doc-wrap{max-width:760px;margin:0 auto;padding:0 24px}
.doc-wide{max-width:1080px;margin:0 auto;padding:0 24px}
.doc-crumbs{max-width:1080px;margin:0 auto;padding:20px 24px 0;font-size:13px;color:var(--ink-mute)}
.doc-crumbs a{color:var(--ink-mute)}
.doc-crumbs span{margin:0 7px;opacity:.5}
/* article */
.doc-article{padding:16px 0 72px}
.doc-eyebrow{font-family:var(--fb);font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--crimson);margin:14px 0 14px}
.doc-h1{font-family:var(--fd);font-weight:700;font-size:clamp(30px,5.4vw,52px);line-height:1.08;letter-spacing:-.02em;margin:0 0 18px;color:var(--ink)}
.doc-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:13.5px;color:var(--ink-mute);margin-bottom:26px}
.doc-meta .dot{opacity:.4}
.doc-byline{font-size:14.5px;color:var(--ink-mute);margin:-12px 0 26px}
.doc-byline a{color:var(--cobalt-deep);font-weight:500;text-decoration:none}
.doc-byline a:hover{text-decoration:underline}
.doc-lede{font-size:20px;line-height:1.55;color:var(--ink-soft);margin:0 0 30px}
/* video */
.doc-video{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:12px;overflow:hidden;margin:0 0 26px;box-shadow:0 20px 50px -24px rgba(26,22,20,.5)}
.doc-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
/* prose */
.doc-prose{font-size:18px;line-height:1.72;color:var(--ink-soft)}
.doc-prose p{margin:0 0 20px}
.doc-prose h2{font-family:var(--fd);font-weight:600;font-size:26px;line-height:1.2;letter-spacing:-.01em;color:var(--ink);margin:40px 0 14px}
.doc-prose blockquote{margin:28px 0;padding:4px 0 4px 22px;border-left:3px solid var(--crimson);font-family:var(--fd);font-style:italic;font-size:22px;line-height:1.4;color:var(--ink)}
.doc-prose em{font-style:italic}
.doc-prose strong{font-weight:600;color:var(--ink)}
.doc-prose a{color:var(--cobalt-deep)}
.doc-cover{width:100%;aspect-ratio:8/5;border-radius:12px;overflow:hidden;margin:0 0 30px;background:#000;box-shadow:0 20px 50px -24px rgba(26,22,20,.5)}
.doc-cover svg{width:100%;height:100%;display:block}
/* chips + buttons */
.doc-chips{display:flex;flex-wrap:wrap;gap:8px;margin:26px 0}
.doc-chip{font-size:12.5px;font-weight:600;letter-spacing:.02em;color:var(--ink-soft);background:var(--cream-deep);border-radius:20px;padding:6px 13px}
.doc-actions{display:flex;flex-wrap:wrap;gap:10px;margin:30px 0}
.doc-btn{display:inline-flex;align-items:center;gap:7px;font-weight:600;font-size:14px;padding:11px 18px;border-radius:8px;text-decoration:none;border:1.5px solid var(--ink);color:var(--ink);background:transparent;transition:transform .12s,background .15s,color .15s}
.doc-btn:hover{transform:translateY(-1px)}
.doc-btn.primary{background:var(--crimson);border-color:var(--crimson);color:var(--cream)}
.doc-btn.primary:hover{background:var(--crimson-deep);border-color:var(--crimson-deep)}
.doc-btn.yt:hover{background:var(--ink);color:var(--cream)}
/* callout / next steps */
.doc-rule{height:2px;background:var(--ink);opacity:.12;margin:44px 0}
.doc-next{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;padding:26px;background:var(--paper);border:1px solid var(--cream-deep);border-radius:12px;margin:34px 0}
.doc-next .lbl{font-size:13px;letter-spacing:.03em;color:var(--ink-mute)}
.doc-next .ttl{font-family:var(--fd);font-weight:600;font-size:19px;color:var(--ink);margin-top:3px;max-width:46ch}
/* reflections */
.doc-reflect{margin:40px 0 0;padding:28px;background:var(--ink);color:var(--cream-soft);border-radius:14px}
.doc-reflect h2{font-family:var(--fd);font-size:22px;color:var(--cream-soft);margin:0 0 4px}
.doc-reflect .sub{font-size:13px;color:rgba(245,240,226,.6);margin:0 0 18px}
.doc-reflect ol{margin:0;padding-left:22px;display:grid;gap:14px}
.doc-reflect li{font-size:16.5px;line-height:1.55;padding-left:4px}
.doc-reflect li::marker{color:var(--mustard);font-weight:700}
/* transcript. reads as an interview in a magazine, not a chat log.
   The speaker's name is the structure, which is what earns the spacing: a wide gap between
   speakers and a small one between paragraphs of the same speaker, so the shape of the
   conversation is legible before a word is read. An earlier version set every paragraph the
   same distance apart behind a hairline, and with nothing grouping them it read as one
   undifferentiated column.
   The measure is capped near 68 characters. The doc column is wide enough to run past 90,
   which is well beyond comfortable reading and was the real reason the block felt heavy.
   scroll-margin-top clears the fixed header: without it a jump to #transcript hides the
   heading behind the nav, which a real mobile render made obvious. */
.doc-transcript{margin:56px 0 0;padding:38px 0 0;border-top:2px solid rgba(26,22,20,.12);
  scroll-margin-top:83px}
.doc-transcript h2{font-family:var(--fd);font-weight:600;font-size:26px;letter-spacing:-.01em;color:var(--ink);margin:0 0 12px}
.tr-note{font-size:13.5px;line-height:1.7;color:var(--ink-mute);margin:0;max-width:44rem}
.tr-note a{color:var(--crimson)}
.tr-body{font-size:17px;line-height:1.72;color:var(--ink-soft);max-width:44rem;padding-top:36px}
.tr-cold{margin:0 0 10px;padding:2px 0 6px 26px;border-left:2px solid var(--cream-deep)}
.tr-cold-h{font-family:var(--fb);font-size:11.5px;font-weight:600;
  letter-spacing:.09em;text-transform:uppercase;color:var(--ink-mute);margin:0}
.tr-cold .tr-turn{margin-top:20px}
.tr-turn{margin:38px 0 0}
.tr-turn:first-child{margin-top:0}
.tr-turn p{margin:0 0 13px}
.tr-turn p:last-child{margin-bottom:0}
/* the name line: an editorial credit, quiet in size but carrying the speaker's accent so a
   reader can follow one voice down a fifty-minute page without reading every name */
.tr-who{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:0 0 9px}
/* Scoped as .tr-who .tr-name rather than .tr-name alone: the transcript sits inside
   .doc-body, and that shell's link rule (class plus element) outranks a lone class, so the
   first version lost every speaker tint to the generic link navy and all three names rendered
   in the same colour. Reading the COMPUTED colour is what exposed it, since both the markup
   and the rule looked correct. Note also: no backticks in comments inside this template
   literal, because a backtick ends the string. */
.tr-who .tr-name{font-family:var(--fb);font-weight:600;font-size:12.5px;
  letter-spacing:.075em;text-transform:uppercase;color:var(--sp);text-decoration:none;
  border-bottom:1px solid transparent}
.tr-who a.tr-name:hover,.tr-who a.tr-name:focus-visible{border-bottom-color:currentColor}
.tr-who .tr-name.tr-anon{color:var(--ink-mute);font-style:italic;text-transform:none;letter-spacing:.01em;font-weight:500;font-size:13px}
.tr-ts{font-family:var(--fm,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:11.5px;
  letter-spacing:.02em;color:var(--ink-mute);text-decoration:none;
  border-bottom:1px dotted rgba(26,22,20,.28)}
.tr-ts:hover,.tr-ts:focus-visible{color:var(--crimson);border-bottom-color:var(--crimson)}
@media(max-width:640px){
  .tr-body{font-size:16.5px}
  .tr-turn{margin-top:32px}
  .doc-transcript{scroll-margin-top:205px}
}
/* prev / next episode */
.doc-pager{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:36px 0 0}
.doc-pager a{display:block;padding:18px 20px;background:var(--paper);border:1px solid var(--cream-deep);border-radius:12px;text-decoration:none;color:var(--ink)}
.doc-pager a:hover{border-color:var(--crimson)}
.doc-pager .k{font-size:12px;letter-spacing:.04em;color:var(--ink-mute);text-transform:uppercase}
.doc-pager .t{font-family:var(--fd);font-weight:600;font-size:16px;margin-top:6px;line-height:1.25}
.doc-pager .nx{text-align:right}
/* hub */
.doc-hub-head{max-width:1080px;margin:0 auto;padding:34px 24px 8px}
.doc-hub-head h1{font-family:var(--fd);font-weight:700;font-size:clamp(32px,5vw,50px);letter-spacing:-.02em;margin:8px 0 10px}
.doc-hub-head p{font-size:18px;color:var(--ink-soft);max-width:60ch;margin:0}
.doc-grid{max-width:1080px;margin:0 auto;padding:28px 24px 72px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:22px}
.doc-card{display:flex;flex-direction:column;background:var(--paper);border:1px solid var(--cream-deep);border-radius:14px;overflow:hidden;text-decoration:none;color:var(--ink);transition:transform .14s,box-shadow .18s,border-color .15s}
.doc-card:hover{transform:translateY(-3px);box-shadow:0 18px 40px -26px rgba(26,22,20,.55);border-color:var(--cream-deep)}
.doc-card-thumb{aspect-ratio:16/9;background:#000;position:relative;overflow:hidden}
.doc-card-thumb img,.doc-card-thumb svg{width:100%;height:100%;object-fit:cover;display:block}
.doc-card-body{padding:18px 20px 22px;display:flex;flex-direction:column;flex:1}
.doc-card-k{font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--crimson);margin-bottom:9px}
.doc-card-t{font-family:var(--fd);font-weight:600;font-size:20px;line-height:1.2;margin:0 0 10px;color:var(--ink)}
.doc-card-d{font-size:14.5px;line-height:1.55;color:var(--ink-mute);margin:0;flex:1}
.doc-card-m{font-size:12.5px;color:var(--ink-mute);margin-top:14px;letter-spacing:.02em}
/* about */
.doc-hosts{max-width:900px;margin:0 auto;padding:20px 24px 72px;display:grid;gap:26px}
.doc-host{display:grid;grid-template-columns:120px 1fr;gap:22px;align-items:start;padding:24px;background:var(--paper);border:1px solid var(--cream-deep);border-radius:14px}
.doc-host img{width:120px;height:120px;object-fit:cover;border-radius:10px}
.doc-host h2{font-family:var(--fd);font-size:23px;margin:0 0 3px}
.doc-host .role{font-size:12.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--crimson);margin-bottom:11px}
.doc-host p{font-size:15.5px;line-height:1.62;color:var(--ink-soft);margin:0 0 14px}
.doc-host a{font-weight:600;font-size:14px;color:var(--cobalt-deep);text-decoration:none}
.doc-host a:hover{text-decoration:underline}
:target{scroll-margin-top:83px}
/* The sticky .doc-nav MEASURES 67px at 1440 and 768 but 189px at 390, where the brand and
   the links stack, so one flat offset cannot clear it at both. The old single 90px value
   left any anchored heading buried behind the nav on a phone. This is not only a
   transcript problem: it applies to every in-page anchor on these generated pages,
   including the host profiles on the about page that the transcript speaker names now
   link to, so a reader tapping a name would have landed under the nav. The :target rule is
   what actually governs an anchor jump, and it sits later in this sheet than the section rule,
   which is why setting scroll-margin-top on .doc-transcript alone did nothing.
   (Second time a backtick in a comment inside this template literal broke the build.
   Plain prose only in here: a backtick ends the string.) */
@media(max-width:640px){:target{scroll-margin-top:205px}}
/* footer */
.doc-foot{background:var(--ink);color:var(--cream-soft);margin-top:20px}
.doc-foot-in{max-width:1080px;margin:0 auto;padding:52px 24px 30px}
.doc-foot-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:32px}
.doc-foot-brand{display:flex;align-items:center;gap:9px;font-family:var(--fd);font-weight:700;font-size:19px}
.doc-foot-brand sup{font-size:.5em;opacity:.6}
.doc-foot-tag{font-family:var(--fd);font-style:italic;font-size:15px;color:rgba(245,240,226,.72);margin:14px 0 0;max-width:34ch}
.doc-foot h2{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,240,226,.55);margin:0 0 14px;font-weight:600}
.doc-foot ul{list-style:none;margin:0;padding:0;display:grid;gap:9px}
.doc-foot ul a{color:var(--cream-soft);text-decoration:none;font-size:14.5px}
.doc-foot ul a:hover{color:var(--mustard)}
.doc-orbs{display:flex;gap:10px}
.doc-orb{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:rgba(245,240,226,.1);color:var(--cream-soft);transition:background .15s,transform .12s}
.doc-orb:hover{transform:translateY(-2px)}
.doc-orb svg{width:18px;height:18px}
.doc-orb.yt:hover{background:#FF0000;color:#fff}.doc-orb.sp:hover{background:#1DB954;color:#fff}.doc-orb.ap:hover{background:#A855C9;color:#fff}.doc-orb.ih:hover{background:#C6002B;color:#fff}
.doc-foot-copy{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:40px;padding-top:22px;border-top:1px solid rgba(245,240,226,.14);font-size:12.5px;color:rgba(245,240,226,.55)}
.doc-foot-copy sup{font-size:.6em}
@media(max-width:720px){
  .doc-foot-grid{grid-template-columns:1fr 1fr;gap:26px}
  .doc-pager{grid-template-columns:1fr}
  .doc-host{grid-template-columns:1fr;gap:14px}
  .doc-host img{width:96px;height:96px}
  .doc-body{font-size:16px}
}
@media(prefers-reduced-motion:reduce){.doc-body *{transition:none!important;animation:none!important}}
`;

// ─── breadcrumb helper ─────────────────────────────────────────
const crumbLD = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem', position: i + 1, name: it.name,
    item: it.url ? it.url : undefined,
  })),
});
const crumbHtml = (items) => `<nav class="doc-crumbs" aria-label="Breadcrumb">${
  items.map((it, i) => i < items.length - 1
    ? `<a href="${it.path}">${esc(it.name)}</a><span aria-hidden="true">&rsaquo;</span>`
    : `<span style="color:var(--ink-soft)">${esc(it.name)}</span>`).join('')
}</nav>`;

// ─── episode page ──────────────────────────────────────────────
function buildEpisodePage(ep) {
  const url = episodeUrl(ep);
  const essay = BLOG_POSTS.find(p => p.epId === ep.id);
  const idx = EPISODES.findIndex(e => e.n === ep.n);
  const newer = EPISODES[idx - 1];      // EPISODES is newest-first
  const older = EPISODES[idx + 1];
  const title = `Episode ${ep.n}: ${ep.title} | The Sector Debrief`;
  const desc = clip(ep.description, 158);
  const themes = (ep.themes || []).map(t => `<span class="doc-chip">${esc(t)}</span>`).join('');
  const guestLine = ep.guest ? `<span class="dot">&middot;</span><span>with ${esc(ep.guest)}</span>` : '';

  const crumbs = [
    { name: 'Home', path: '/', url: SITE + '/' },
    { name: 'Episodes', path: '/episodes/', url: SITE + '/episodes/' },
    { name: `Episode ${ep.n}`, path: url, url },
  ];

  const tr = loadTranscript(ep.slug);

  const podcastLD = {
    '@context': 'https://schema.org', '@type': 'PodcastEpisode',
    url, name: ep.title, episodeNumber: ep.n, datePublished: ep.date,
    inLanguage: 'en-GB',
    // adding a transcript is a material content change, so the page reports when it changed
    ...(tr ? { dateModified: TRANSCRIPT_DATE } : {}),
    duration: isoDuration(ep.duration), description: stripTags(ep.description),
    image: ytThumb(ep.id),
    partOfSeries: { '@type': 'PodcastSeries', name: 'The Sector Debrief', '@id': SITE + '/#series' },
    associatedMedia: { '@type': 'VideoObject', name: ep.title, thumbnailUrl: ytThumb(ep.id),
      uploadDate: ep.date, duration: isoDuration(ep.duration), inLanguage: 'en-GB',
      embedUrl: `https://www.youtube.com/embed/${ep.id}`, description: stripTags(ep.description),
      // schema.org allows transcript on a media object. Google's video docs do not
      // list it, so this is secondary: the transcript's real home is the visible
      // section below, which is what structured data is supposed to describe.
      // Names are included here too. The machine-readable transcript is what an assistant or
      // a search engine quotes from, so leaving the attribution out of it would strip exactly
      // the part that makes a quote citable to a person.
      ...(tr ? { transcript: tr.turns.map(t => (t.speaker ? t.speaker + ': ' : '')
        + (t.paras && t.paras.length ? t.paras.join(' ') : (t.text || ''))).join('\n\n') } : {}) },
    actor: [
      ...(ep.guest ? [{ '@type': 'Person', name: ep.guest }] : []),
      ...hostRefs(),
    ],
  };

  const pagerLink = (e, dir) => e
    ? `<a class="${dir === 'next' ? 'nx' : ''}" href="/episodes/${e.slug}/"><div class="k">${dir === 'next' ? 'Newer episode' : 'Older episode'}</div><div class="t">Ep ${e.n}: ${esc(e.title)}</div></a>`
    : `<span></span>`;

  const body = `${crumbHtml(crumbs)}
<article class="doc-wrap doc-article">
  <div class="doc-eyebrow">Episode ${ep.n}${ep.guest ? ' &middot; Guest conversation' : ''}</div>
  <h1 class="doc-h1">${esc(ep.title)}</h1>
  <div class="doc-meta"><span>${fmtDate(ep.date)}</span><span class="dot">&middot;</span><span>${esc(ep.duration)}</span>${guestLine}</div>
  <div class="doc-video"><iframe src="https://www.youtube-nocookie.com/embed/${ep.id}?rel=0" loading="lazy" title="Episode ${ep.n}: ${esc(ep.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
  <div class="doc-prose"><p class="doc-lede">${esc(ep.description)}</p></div>
  ${themes ? `<div class="doc-chips">${themes}</div>` : ''}
  <div class="doc-actions">
    <a class="doc-btn primary yt" href="https://www.youtube.com/watch?v=${ep.id}" target="_blank" rel="noopener noreferrer">&#9654; Watch on YouTube</a>
    <a class="doc-btn" href="${PLATFORMS.spotify}" target="_blank" rel="noopener noreferrer">Listen on Spotify</a>
    <a class="doc-btn" href="${PLATFORMS.apple}" target="_blank" rel="noopener noreferrer">Apple Podcasts</a>
  </div>
  ${tr ? transcriptHtml(ep, tr) : ''}
  ${essay ? `<div class="doc-next"><div><div class="lbl">Read the companion essay</div><div class="ttl">${esc(essay.title)}</div></div><a class="doc-btn primary" href="/blog/${essay.slug}/">Read the essay</a></div>` : ''}
  <div class="doc-rule"></div>
  <div class="doc-pager">${pagerLink(older, 'prev')}${pagerLink(newer, 'next')}</div>
  <p style="text-align:center;margin:34px 0 0"><a class="doc-btn" href="/episodes/">&larr; All episodes</a></p>
</article>`;

  return shell({
    title, desc, canonical: url, ogType: 'video.episode', ogImage: ytThumb(ep.id),
    active: 'episodes', jsonld: [podcastLD, crumbLD(crumbs)], body,
  });
}

// ─── essay page ────────────────────────────────────────────────
function buildBlogPage(post) {
  const url = blogUrl(post);
  const ep = post.epId ? EPISODES.find(e => e.id === post.epId) : null;
  const isEditorial = post.pinned === true || post.epId === null;
  const title = `${post.title} | The Sector Debrief`;
  const desc = clip(post.excerpt || stripTags(post.body), 158);
  const cover = blogCoverSVG(post);
  const ogImage = ep ? ytThumb(ep.id) : OG_DEFAULT;

  const crumbs = [
    { name: 'Home', path: '/', url: SITE + '/' },
    { name: 'Blog', path: '/blog/', url: SITE + '/blog/' },
    { name: post.title, path: url, url },
  ];

  const blogLD = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: post.title, description: post.excerpt ? stripTags(post.excerpt) : desc,
    url, mainEntityOfPage: url, image: ogImage,
    datePublished: ep ? ep.date : '2026-01-01',
    dateModified: ep ? ep.date : '2026-01-01',
    wordCount: wordCount(post.body),
    author: hostRefs(),
    publisher: { '@type': 'Organization', name: 'The Sector Debrief', '@id': SITE + '/#organization',
      logo: { '@type': 'ImageObject', url: SITE + '/assets/apple-touch-icon.png' } },
    isPartOf: { '@type': 'Blog', '@id': SITE + '/blog/#blog', name: 'The Sector Debrief Blog' },
    ...(ep ? { about: { '@type': 'PodcastEpisode', name: ep.title, url: episodeUrl(ep) } } : {}),
  };

  // related essays: three others, prefer same kind (episode essays)
  const related = BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 3);
  const relatedHtml = related.map(p => {
    const rc = blogCoverSVG(p);
    const rl = (p.pinned || p.epId === null) ? 'Editorial' : `Episode ${p.epN}`;
    return `<a class="doc-card" href="/blog/${p.slug}/"><div class="doc-card-thumb">${rc}</div><div class="doc-card-body"><div class="doc-card-k">${rl}</div><div class="doc-card-t">${esc(p.title)}</div><div class="doc-card-d">${esc(clip(p.excerpt, 100))}</div></div></a>`;
  }).join('');

  const reflections = (post.reflections || []).length
    ? `<section class="doc-reflect" aria-label="Reflection prompts">
        <h2>Pause &amp; reflect</h2>
        <p class="sub">Prompts drawn from this essay. Take them slow.</p>
        <ol>${post.reflections.map(r => `<li>${esc(r)}</li>`).join('')}</ol>
      </section>` : '';

  const body = `${crumbHtml(crumbs)}
<article class="doc-wrap doc-article">
  <div class="doc-cover">${cover}</div>
  <div class="doc-eyebrow">${isEditorial ? 'Editorial' : `Episode ${post.epN} &middot; Essay`}</div>
  <h1 class="doc-h1">${esc(post.title)}</h1>
  <div class="doc-meta"><span>${esc(post.readTime)} read</span>${ep ? `<span class="dot">&middot;</span><span>${fmtDate(ep.date)}</span>` : ''}<span class="dot">&middot;</span><span>The Sector Debrief</span></div>
  <div class="doc-byline">By <a href="/about/#ali-al-mokdad">Ali Al Mokdad</a>, <a href="/about/#kim-kucinskas">Kim Kucinskas</a> and <a href="/about/#thomas-jepson-lay">Thomas Jepson-Lay</a></div>
  <div class="doc-prose">${post.body}</div>
  ${reflections}
  ${ep ? `<div class="doc-next"><div><div class="lbl">Listen to the full episode</div><div class="ttl">Episode ${ep.n}: ${esc(ep.title)}</div></div><a class="doc-btn primary" href="/episodes/${ep.slug}/">Go to the episode</a></div>`
        : `<div class="doc-next"><div><div class="lbl">Subscribe and join the conversation</div><div class="ttl">New essays land with new episodes.</div></div><a class="doc-btn primary yt" href="https://www.youtube.com/channel/UCUrZ0l2uqp2zgJ5WrjcRXDg?sub_confirmation=1" target="_blank" rel="noopener noreferrer">Subscribe</a></div>`}
  <div class="doc-rule"></div>
  <h2 style="font-family:var(--fd);font-weight:600;font-size:22px;margin:0 0 6px">More from the blog</h2>
</article>
<div class="doc-grid" style="padding-top:8px">${relatedHtml}</div>`;

  return shell({
    title, desc, canonical: url, ogType: 'article', ogImage,
    active: 'blog', jsonld: [blogLD, crumbLD(crumbs)], body,
  });
}

// ─── episodes hub ──────────────────────────────────────────────
function buildEpisodesHub() {
  const url = SITE + '/episodes/';
  const crumbs = [{ name: 'Home', path: '/', url: SITE + '/' }, { name: 'Episodes', path: '/episodes/', url }];
  const cards = EPISODES.map(ep => {
    const essay = BLOG_POSTS.find(p => p.epId === ep.id);
    return `<a class="doc-card" href="/episodes/${ep.slug}/">
      <div class="doc-card-thumb"><img src="${ytThumb(ep.id)}" alt="${esc(ep.title)}" loading="lazy" width="480" height="360"/></div>
      <div class="doc-card-body">
        <div class="doc-card-k">Episode ${ep.n}${ep.guest ? ' &middot; ' + esc(ep.guest) : ''}</div>
        <div class="doc-card-t">${esc(ep.title)}</div>
        <div class="doc-card-d">${esc(clip(ep.description, 130))}</div>
        <div class="doc-card-m">${fmtDate(ep.date)} &middot; ${esc(ep.duration)}${essay ? ' &middot; essay available' : ''}</div>
      </div></a>`;
  }).join('');
  const itemList = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: 'Episodes | The Sector Debrief', url,
    mainEntity: { '@type': 'ItemList', itemListElement: EPISODES.map((ep, i) => ({
      '@type': 'ListItem', position: i + 1, url: episodeUrl(ep), name: ep.title })) },
  };
  const body = `${crumbHtml(crumbs)}
<div class="doc-hub-head"><div class="doc-eyebrow">All episodes</div><h1>Every conversation, in one place</h1>
<p>Honest talk about humanitarian and development work, hosted by Ali Al Mokdad, Kim Kucinskas, and Thomas Jepson-Lay. ${EPISODES.length} episodes and counting.</p></div>
<div class="doc-grid">${cards}</div>`;
  return shell({
    title: 'Episodes | The Sector Debrief',
    desc: `All ${EPISODES.length} episodes of The Sector Debrief, the honest humanitarian and development podcast hosted by Ali Al Mokdad, Kim Kucinskas, and Thomas Jepson-Lay.`,
    canonical: url, ogType: 'website', active: 'episodes', jsonld: [itemList, crumbLD(crumbs)], body,
  });
}

// ─── blog hub ──────────────────────────────────────────────────
function buildBlogHub() {
  const url = SITE + '/blog/';
  const crumbs = [{ name: 'Home', path: '/', url: SITE + '/' }, { name: 'Blog', path: '/blog/', url }];
  const ordered = BLOG_POSTS.slice().sort((a, b) => (b.epN === 90 || b.epN === 0 ? -1 : 0) - (a.epN === 90 || a.epN === 0 ? -1 : 0));
  const cards = BLOG_POSTS.map(p => {
    const rl = (p.pinned || p.epId === null) ? 'Editorial' : `Episode ${p.epN}`;
    return `<a class="doc-card" href="/blog/${p.slug}/">
      <div class="doc-card-thumb">${blogCoverSVG(p)}</div>
      <div class="doc-card-body">
        <div class="doc-card-k">${rl}</div>
        <div class="doc-card-t">${esc(p.title)}</div>
        <div class="doc-card-d">${esc(clip(p.excerpt, 130))}</div>
        <div class="doc-card-m">${esc(p.readTime)} read</div>
      </div></a>`;
  }).join('');
  const blogLD = {
    '@context': 'https://schema.org', '@type': 'Blog', '@id': url + '#blog',
    name: 'The Sector Debrief Blog', url,
    description: 'Long-form essays from each conversation, plus the occasional editorial from the hosts or an AI interpretation of the episode transcript.',
    blogPost: BLOG_POSTS.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: blogUrl(p) })),
  };
  const body = `${crumbHtml(crumbs)}
<div class="doc-hub-head"><div class="doc-eyebrow">The blog</div><h1>Essays from the conversations</h1>
<p>Long-form notes from each episode, plus the occasional editorial from the hosts or an AI interpretation of the episode transcript.</p></div>
<div class="doc-grid">${cards}</div>`;
  return shell({
    title: 'Blog | The Sector Debrief',
    desc: 'Long-form essays on humanitarian leadership, reform, localization, and the future of aid, drawn from every episode of The Sector Debrief.',
    canonical: url, ogType: 'website', active: 'blog', jsonld: [blogLD, crumbLD(crumbs)], body,
  });
}

// ─── about page ────────────────────────────────────────────────
function buildAboutPage() {
  const url = SITE + '/about/';
  const crumbs = [{ name: 'Home', path: '/', url: SITE + '/' }, { name: 'About', path: '/about/', url }];
  const hosts = HOSTS.map(h => `
    <article class="doc-host" id="${esc(h.slug)}">
      <img src="/${esc(h.photo)}" alt="${esc(h.name)}" width="${h.photoW || 600}" height="${h.photoH || 600}" loading="lazy"/>
      <div>
        <h2>${esc(h.name)}</h2>
        <div class="role">${esc(h.role)}</div>
        <p>${esc(h.bio)}</p>
        <a href="${esc(h.linkedin)}" target="_blank" rel="noopener noreferrer">Connect on LinkedIn &rarr;</a>
      </div>
    </article>`).join('');
  // Full Person records (senior, accurate) so the About page is the canonical
  // entity page Google uses to understand who is behind the show.
  const persons = HOSTS.map(h => {
    const p = HOST_PROFILES[h.name] || {};
    return {
      '@context': 'https://schema.org', '@type': 'Person',
      '@id': p.id || HOST_ID[h.name], name: h.name,
      jobTitle: p.jobTitle || h.role, description: h.bio,
      image: SITE + '/' + h.photo, url: p.url || h.linkedin,
      sameAs: p.sameAs || [h.linkedin], knowsAbout: p.knowsAbout,
      mainEntityOfPage: SITE + '/about/',
    };
  });
  const aboutLD = {
    '@context': 'https://schema.org', '@type': 'AboutPage', url,
    name: 'About | The Sector Debrief',
    about: { '@type': 'PodcastSeries', name: 'The Sector Debrief', '@id': SITE + '/#series' },
    mainEntity: persons.map(p => ({ '@type': 'Person', '@id': p['@id'], name: p.name })),
  };
  const body = `${crumbHtml(crumbs)}
<div class="doc-hub-head"><div class="doc-eyebrow">About</div><h1>Three people who ran out of patience with the official version</h1>
<p>The Sector Debrief is a conversation between three people who have spent a long time inside humanitarian and development work. No polished lines. No scripted answers. The conversations that happen when the microphones are off.</p></div>
<div class="doc-hosts">${hosts}</div>`;
  return shell({
    title: 'About the hosts | The Sector Debrief',
    desc: 'Meet the hosts of The Sector Debrief: Ali Al Mokdad, Kim Kucinskas, and Thomas Jepson-Lay. Honest conversations on humanitarian and development leadership.',
    canonical: url, ogType: 'website', active: 'about', jsonld: [aboutLD, ...persons, crumbLD(crumbs)], body,
  });
}

// ─── sitemap ───────────────────────────────────────────────────
function buildSitemap() {
  const rows = [];
  const add = (loc, lastmod, priority, changefreq) =>
    rows.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`);
  add(SITE + '/', TODAY, '1.0', 'weekly');
  add(SITE + '/episodes/', TODAY, '0.9', 'weekly');
  add(SITE + '/blog/', TODAY, '0.9', 'weekly');
  add(SITE + '/about/', TODAY, '0.6', 'monthly');
  // an episode carrying a transcript was modified on the transcript date, not on the
  // day the episode aired, so lastmod must reflect that or crawlers see it as stale
  EPISODES.forEach(ep => add(episodeUrl(ep),
    loadTranscript(ep.slug) ? TRANSCRIPT_DATE : ep.date, '0.8', 'monthly'));
  BLOG_POSTS.forEach(p => {
    const ep = p.epId ? EPISODES.find(e => e.id === p.epId) : null;
    add(blogUrl(p), ep ? ep.date : TODAY, '0.7', 'monthly');
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

// The SPA's episode modal promises "transcript, essay, links" only for episodes whose data.js
// entry carries `transcript: true`, because four episodes have no on-screen speaker label and so
// no transcript at all. That flag lives in hand-maintained data while the transcripts live on
// disk, which is exactly the pair that drifts. So the build refuses to run if they disagree: a
// flag claiming a transcript that is not there would advertise a link to nothing, and a missing
// flag would hide a transcript that exists.
(function validateTranscriptFlags() {
  const wrong = [];
  EPISODES.forEach((ep) => {
    const onDisk = !!loadTranscript(ep.slug);
    const claimed = !!ep.transcript;
    if (onDisk !== claimed) {
      wrong.push(`${ep.slug}: data.js says ${claimed}, on disk ${onDisk}`);
    }
  });
  if (wrong.length) {
    throw new Error('transcript flags out of sync with transcripts/: ' + wrong.join(' | '));
  }
  console.log(`transcript flags agree with disk for all ${EPISODES.length} episodes`);
})();

// ─── write everything ──────────────────────────────────────────
function writeFile(rel, content) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  // Trailing whitespace is stripped here, at the one place everything is written, rather than
  // hunted through the template literals that produce it. Nested templates indent their blank
  // lines, so the generated HTML carried trailing spaces on many lines and every regenerated
  // page failed `git diff --check`. Fixing it at the exit point means new templates cannot
  // reintroduce it. Only whitespace at end of line is touched, never content, and <pre> is not
  // used in these pages so no rendering depends on it.
  const clean = content.replace(/[ \t]+$/gm, '');
  fs.writeFileSync(full, clean, 'utf8');
  return rel;
}

// ─── validate before writing (fail fast on bad or unsafe data) ──
(function validate() {
  const seen = new Set();
  const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const check = (kind, slug, dir) => {
    if (!slug || !slugRe.test(slug)) throw new Error(`Invalid ${kind} slug: ${JSON.stringify(slug)}`);
    const key = `${dir}/${slug}`;
    if (seen.has(key)) throw new Error(`Duplicate output path: ${key}`);
    seen.add(key);
  };
  EPISODES.forEach(ep => check('episode', ep.slug, 'episodes'));
  BLOG_POSTS.forEach(p => {
    check('blog', p.slug, 'blog');
    if (/<script/i.test(p.body || '')) throw new Error(`Unsafe <script> in blog body: ${p.slug}`);
    if (p.epId && !EPISODES.find(e => e.id === p.epId))
      throw new Error(`Blog ${p.slug} references missing epId ${p.epId}`);
  });
  console.log('validation passed: ' + seen.size + ' unique page paths');
})();

const written = [];
EPISODES.forEach(ep => written.push(writeFile(`episodes/${ep.slug}/index.html`, buildEpisodePage(ep))));
BLOG_POSTS.forEach(p => written.push(writeFile(`blog/${p.slug}/index.html`, buildBlogPage(p))));
written.push(writeFile('episodes/index.html', buildEpisodesHub()));
written.push(writeFile('blog/index.html', buildBlogHub()));
written.push(writeFile('about/index.html', buildAboutPage()));
written.push(writeFile('sitemap.xml', buildSitemap()));

console.log(`Built ${written.length} files:`);
written.forEach(f => console.log('  ' + f));
console.log(`\nEpisodes: ${EPISODES.length} · Essays: ${BLOG_POSTS.length} · Sitemap URLs: ${4 + EPISODES.length + BLOG_POSTS.length}`);
