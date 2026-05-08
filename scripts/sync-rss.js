#!/usr/bin/env node
/**
 * sync-rss.js
 * ─────────────────────────────────────────────────────────────
 * Syncs The Sector Debrief episodes from YouTube's public RSS
 * feed — NO API key required. Updates video IDs, titles, dates,
 * and descriptions in js/data.js. Preserves all writer-edited
 * fields (guest, themes, reflections, etc.).
 *
 * Runs daily via GitHub Actions (see .github/workflows/sync-youtube.yml).
 *
 * Optional env:
 *   CHANNEL_ID  — defaults to The Sector Debrief's channel
 *   DATA_FILE   — defaults to ../js/data.js
 *   DRY_RUN=1   — print proposed changes without writing
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const CHANNEL_ID = process.env.CHANNEL_ID || 'UCUrZ0l2uqp2zgJ5WrjcRXDg';
const DATA_FILE  = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : path.resolve(__dirname, '..', 'js', 'data.js');
const DRY_RUN    = !!process.env.DRY_RUN;
const RSS_URL    = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

// ── fetch ──
function getText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return getText(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        if (res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString().slice(0, 200)}`));
        }
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
    }).on('error', reject);
  });
}

// ── XML helpers (no external deps) ──
function extractAll(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\s\S]*?)</${tag}>`, 'g');
  const results = [];
  let m;
  while ((m = re.exec(xml)) !== null) results.push(m[1]);
  return results;
}
function extract(xml, tag) { return extractAll(xml, tag)[0] || ''; }
function unescape(s) {
  return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1');
}
function firstParagraph(s) {
  const t = (s || '').trim().split('\n').find(l => l.trim().length) || '';
  return t.length <= 380 ? t : t.slice(0, 380).replace(/[\s,;:.!?-]+$/, '') + '…';
}
function serializeEpisodes(eps) {
  const lines = ['['];
  eps.forEach((ep, i) => {
    lines.push('  {');
    lines.push(`    n: ${ep.n},`);
    lines.push(`    id: ${JSON.stringify(ep.id)},`);
    lines.push(`    title: ${JSON.stringify(ep.title)},`);
    lines.push(`    guest: ${ep.guest == null ? 'null' : JSON.stringify(ep.guest)},`);
    lines.push(`    date: ${JSON.stringify(ep.date)},`);
    lines.push(`    duration: ${JSON.stringify(ep.duration || '')},`);
    lines.push(`    description: ${JSON.stringify(ep.description)},`);
    lines.push(`    themes: ${JSON.stringify(ep.themes || [])}`);
    lines.push(i === eps.length - 1 ? '  }' : '  },');
  });
  lines.push(']');
  return lines.join('\n');
}

// ── parse RSS ──
function parseRSS(xml) {
  const entries = xml.split(/<entry[\s>]/);
  entries.shift(); // remove the preamble before first entry
  return entries.map(entry => {
    const id      = (extract(entry, 'yt:videoId') || extract(entry, 'videoId')).trim();
    const title   = unescape(extract(entry, 'title').trim());
    const rawDate = extract(entry, 'published').trim();
    const date    = rawDate ? rawDate.split('T')[0] : '';
    // description lives in media:description or content
    const desc    = unescape(
      extract(entry, 'media:description') ||
      extract(entry, 'content') ||
      ''
    ).trim();
    return { id, title, date, description: firstParagraph(desc) };
  }).filter(e => e.id && e.title);
}

// ── merge ──
function mergeEpisodes(existing, fromRSS) {
  const byId = new Map(existing.map(e => [e.id, e]));
  const sorted = [...fromRSS].sort((a, b) => a.date < b.date ? 1 : -1); // newest first
  return sorted.map((rss, i) => {
    const n     = sorted.length - i;
    const prior = byId.get(rss.id);
    if (prior) {
      return {
        ...prior,
        n,
        title: prior._titleLocked ? prior.title : rss.title,
        date:  rss.date || prior.date,
        description: (prior.description && prior.description.length > 80)
          ? prior.description
          : (rss.description || prior.description || ''),
      };
    }
    return { n, id: rss.id, title: rss.title, guest: null, date: rss.date, duration: '', description: rss.description, themes: [] };
  });
}

// ── rewrite data.js ──
function rewriteDataFile(text, newEpisodesJS, episodeCount) {
  let next = text.replace(
    /(const\s+EPISODES\s*=\s*)\[[\s\S]*?\n\];/,
    `$1${newEpisodesJS};`
  );
  next = next.replace(
    /(episodes\s*:\s*)[^,\n]+/,
    `$1${episodeCount}`
  );
  const stamp = new Date().toISOString().split('T')[0];
  next = next.replace(
    /\/\/\s*Total Views as of latest sync:.*$/m,
    `// Total Views as of latest sync (${stamp}): [RSS sync — views unchanged]`
  );
  return next;
}

// ── main ──
async function main() {
  console.log(`▸ RSS sync starting — ${new Date().toISOString()}`);
  console.log(`  channel: ${CHANNEL_ID}`);
  console.log(`  feed:    ${RSS_URL}`);

  const xml      = await getText(RSS_URL);
  const fromRSS  = parseRSS(xml);
  if (!fromRSS.length) {
    console.error('✗ RSS returned 0 entries — refusing to overwrite.');
    process.exit(1);
  }
  console.log(`  found ${fromRSS.length} entries in RSS feed`);

  const fileText = fs.readFileSync(DATA_FILE, 'utf8');
  const data     = require(DATA_FILE);
  const current  = data.EPISODES;

  const merged   = mergeEpisodes(current, fromRSS);
  const changed  = JSON.stringify(merged) !== JSON.stringify(current);

  if (!changed) {
    console.log('✓ Nothing to sync. Already up to date.');
    process.exit(2);
  }

  const added   = merged.filter(e => !current.find(c => c.id === e.id)).map(e => e.id);
  const nextText = rewriteDataFile(fileText, serializeEpisodes(merged), merged.length);

  if (nextText === fileText) {
    console.log('✓ No textual change after rewrite.');
    process.exit(2);
  }

  if (DRY_RUN) {
    console.log('▸ DRY_RUN — would sync:');
    merged.forEach(e => console.log(`   E${e.n} ${e.id}: ${e.title}`));
    if (added.length) console.log('  NEW:', added.join(', '));
    process.exit(0);
  }

  fs.writeFileSync(DATA_FILE, nextText, 'utf8');
  console.log(`✓ Wrote ${path.relative(process.cwd(), DATA_FILE)}`);
  if (added.length) console.log(`  new episodes: ${added.join(', ')}`);
  console.log(`  total: ${merged.length} episodes`);
  process.exit(0);
}

main().catch(err => {
  console.error('✗ RSS sync failed:', err.message || err);
  process.exit(1);
});
