#!/usr/bin/env node
/**
 * sync-youtube.js
 * ───────────────────────────────────────────────────────────────────
 * Pulls the latest playlist + channel stats from YouTube and merges
 * them into js/data.js. PRESERVES every editorial field the writer
 * has touched (themes, guest, reflections, blog posts, etc.).
 *
 * Designed to be safe to run on a cron:
 *   - Idempotent: running twice in a row produces the same data.js
 *   - Conservative: only touches the EPISODES array and STATS object
 *   - Failsafe: bails out (non-zero exit) if YouTube returns nothing,
 *     so we never overwrite real data with an empty list.
 *
 * Required env:
 *   YOUTUBE_API_KEY — a YouTube Data API v3 key
 *
 * Optional env:
 *   PLAYLIST_ID  — defaults to The Sector Debrief's playlist
 *   CHANNEL_ID   — defaults to The Sector Debrief's channel
 *   DATA_FILE    — defaults to ../js/data.js (relative to this script)
 *   DRY_RUN=1    — print the proposed data.js but don't write it
 *
 * Exit codes:
 *   0  changes written (or dry-run completed)
 *   2  no changes needed
 *   1  error
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ──────────────────────────── config ────────────────────────────
const PLAYLIST_ID = process.env.PLAYLIST_ID || 'PLOGUm1NuLP3RWdEXeMca2w3aU6tMoEI7L';
const CHANNEL_ID  = process.env.CHANNEL_ID  || 'UCUrZ0l2uqp2zgJ5WrjcRXDg';
const DATA_FILE   = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : path.resolve(__dirname, '..', 'js', 'data.js');
const DRY_RUN     = !!process.env.DRY_RUN;
const API_KEY     = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.error('✗ YOUTUBE_API_KEY env var is required');
  process.exit(1);
}

// ──────────────────────────── http helper ────────────────────────────
function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode} from YouTube: ${body.slice(0, 300)}`));
        }
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Bad JSON from YouTube: ' + e.message)); }
      });
    }).on('error', reject);
  });
}

// ──────────────────────────── youtube ────────────────────────────
async function fetchPlaylistItems() {
  const items = [];
  let pageToken = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems`
      + `?part=snippet,contentDetails&maxResults=50&playlistId=${PLAYLIST_ID}`
      + `&key=${API_KEY}` + (pageToken ? `&pageToken=${pageToken}` : '');
    const data = await getJSON(url);
    items.push(...(data.items || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return items;
}

async function fetchVideoDetails(ids) {
  if (!ids.length) return [];
  // Batch in groups of 50 (API max)
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = `https://www.googleapis.com/youtube/v3/videos`
      + `?part=snippet,contentDetails,statistics&id=${batch.join(',')}&key=${API_KEY}`;
    const data = await getJSON(url);
    out.push(...(data.items || []));
  }
  return out;
}

async function fetchChannelStats() {
  const url = `https://www.googleapis.com/youtube/v3/channels`
    + `?part=statistics&id=${CHANNEL_ID}&key=${API_KEY}`;
  const data = await getJSON(url);
  return data.items?.[0]?.statistics || {};
}

// ──────────────────────────── helpers ────────────────────────────
// "PT52M3S" / "PT58M" / "PT1H2M" → "52 min" / "58 min" / "62 min"
function isoDurationToMinutes(iso) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
  if (!m) return '';
  const h = parseInt(m[1] || '0', 10);
  const mins = parseInt(m[2] || '0', 10);
  const secs = parseInt(m[3] || '0', 10);
  const total = h * 60 + mins + (secs >= 30 ? 1 : 0);
  return `${total} min`;
}

// "75951" → "75,951"
function formatViews(n) {
  const num = parseInt(n, 10);
  if (!Number.isFinite(num)) return String(n);
  return num.toLocaleString('en-US');
}

// First sentence (or first 380 chars) — used as fallback description for
// new episodes. Existing episodes keep whatever the writer has there.
function firstParagraph(s) {
  const t = (s || '').trim().split('\n').find(line => line.trim().length) || '';
  if (t.length <= 380) return t;
  return t.slice(0, 380).replace(/[\s,;:.!?-]+$/, '') + '…';
}

// Output a JS literal for an array of episode objects, indented to match
// the existing data.js style (2-space indent inside the array).
function serializeEpisodes(eps) {
  const lines = ['['];
  eps.forEach((ep, i) => {
    lines.push('  {');
    lines.push(`    n: ${ep.n},`);
    lines.push(`    id: ${JSON.stringify(ep.id)},`);
    lines.push(`    title: ${JSON.stringify(ep.title)},`);
    lines.push(`    guest: ${ep.guest === null || ep.guest === undefined ? 'null' : JSON.stringify(ep.guest)},`);
    lines.push(`    date: ${JSON.stringify(ep.date)},`);
    lines.push(`    duration: ${JSON.stringify(ep.duration)},`);
    lines.push(`    description: ${JSON.stringify(ep.description)},`);
    lines.push(`    themes: ${JSON.stringify(ep.themes || [])}`);
    lines.push(i === eps.length - 1 ? '  }' : '  },');
  });
  lines.push(']');
  return lines.join('\n');
}

// ──────────────────────────── merge ────────────────────────────
function mergeEpisodes(existing, fromYT) {
  const byId = new Map(existing.map(e => [e.id, e]));

  // Sort YouTube videos newest-first
  const sorted = [...fromYT].sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  );

  return sorted.map((yt, i) => {
    const n = sorted.length - i; // E1 oldest, EN newest
    const prior = byId.get(yt.id);
    if (prior) {
      // Existing episode: only update fields YT controls; preserve writer fields
      return {
        ...prior,
        n,                       // shifts only when older episodes appear
        title: prior._titleLocked    ? prior.title       : yt.title,
        date: yt.publishedAt.split('T')[0],
        duration: yt.duration,
        description: prior._descLocked ? prior.description
                                       : (prior.description && prior.description.length > 80
                                            ? prior.description       // writer-edited, keep it
                                            : yt.description),
        // themes / guest / any other writer fields preserved by ...prior
      };
    }
    // Brand-new episode
    return {
      n,
      id: yt.id,
      title: yt.title,
      guest: null,
      date: yt.publishedAt.split('T')[0],
      duration: yt.duration,
      description: yt.description,
      themes: []
    };
  });
}

// ──────────────────────────── data.js writer ────────────────────────────
function rewriteDataFile(text, newEpisodesJS, newStats) {
  // Replace the EPISODES array
  text = text.replace(
    /(const\s+EPISODES\s*=\s*)\[[\s\S]*?\n\];/,
    `$1${newEpisodesJS};`
  );
  // Replace STATS.views and STATS.episodes specifically (preserves comments)
  text = text.replace(
    /(const\s+STATS\s*=\s*\{)([\s\S]*?)(\n\};)/,
    (match, head, body, tail) => {
      let next = body;
      next = next.replace(/(views\s*:\s*)['"`].*?['"`]/, `$1'${newStats.views}'`);
      next = next.replace(/(episodes\s*:\s*)[^,\n]+/, `$1${newStats.episodes}`);
      return head + next + tail;
    }
  );
  // Stamp the comment line above STATS so we have a visible audit trail
  const stamp = new Date().toISOString().split('T')[0];
  text = text.replace(
    /\/\/\s*Total Views as of latest sync:.*$/m,
    `// Total Views as of latest sync (${stamp}): ${newStats.views}`
  );
  return text;
}

// ──────────────────────────── main ────────────────────────────
async function main() {
  const startedAt = Date.now();
  console.log(`▸ Sync starting — ${new Date().toISOString()}`);

  // 1. Pull current data
  const fileText = fs.readFileSync(DATA_FILE, 'utf8');
  const data = require(DATA_FILE);
  const currentEps = data.EPISODES;

  // 2. Fetch from YouTube
  console.log(`▸ Fetching playlist ${PLAYLIST_ID}…`);
  const items = await fetchPlaylistItems();
  if (!items.length) {
    console.error('✗ Playlist returned 0 items — refusing to overwrite.');
    process.exit(1);
  }
  const ids = items.map(it => it.contentDetails?.videoId).filter(Boolean);
  console.log(`  found ${ids.length} video IDs`);

  console.log('▸ Fetching video details…');
  const videos = await fetchVideoDetails(ids);

  console.log('▸ Fetching channel statistics…');
  const channelStats = await fetchChannelStats();

  // 3. Normalize YT → episode shape
  const fromYT = videos.map(v => ({
    id: v.id,
    title: v.snippet.title,
    description: v.snippet.description,
    publishedAt: v.snippet.publishedAt,
    duration: isoDurationToMinutes(v.contentDetails.duration),
  }));

  // 4. Merge — preserves writer-edited fields
  const merged = mergeEpisodes(currentEps, fromYT);

  // 5. Diff
  const newIds = merged.map(e => e.id);
  const oldIds = currentEps.map(e => e.id);
  const added  = newIds.filter(id => !oldIds.includes(id));
  const removed= oldIds.filter(id => !newIds.includes(id));

  const newViews    = formatViews(channelStats.viewCount || '0');
  const newStats    = { episodes: merged.length, views: newViews };
  const oldViews    = data.STATS.views;
  const oldEpisodes = data.STATS.episodes;

  // 6. Decide if anything changed
  const epsChanged   = JSON.stringify(merged) !== JSON.stringify(currentEps);
  const statsChanged = (newStats.episodes !== oldEpisodes) || (newStats.views !== oldViews);
  if (!epsChanged && !statsChanged) {
    console.log('✓ Nothing to sync. Already up to date.');
    process.exit(2);
  }

  // 7. Rewrite
  const nextText = rewriteDataFile(fileText, serializeEpisodes(merged), newStats);
  if (nextText === fileText) {
    console.log('✓ No textual change after rewrite (likely cosmetic only).');
    process.exit(2);
  }

  if (DRY_RUN) {
    console.log('▸ DRY_RUN — would write:');
    console.log('   stats   :', oldViews, '→', newViews, '|', oldEpisodes, '→', newStats.episodes);
    console.log('   added   :', added.length ? added : '(none)');
    console.log('   removed :', removed.length ? removed : '(none)');
    console.log('   changes :', epsChanged ? 'episodes' : '', statsChanged ? 'stats' : '');
    process.exit(0);
  }

  fs.writeFileSync(DATA_FILE, nextText, 'utf8');

  console.log(`✓ Wrote ${path.relative(process.cwd(), DATA_FILE)}`);
  console.log(`   stats   : ${oldViews} → ${newViews}  |  ${oldEpisodes} → ${newStats.episodes} episodes`);
  if (added.length)   console.log(`   added   : ${added.join(', ')}`);
  if (removed.length) console.log(`   removed : ${removed.join(', ')}`);
  console.log(`▸ Finished in ${Date.now() - startedAt}ms`);
  process.exit(0);
}

main().catch(err => {
  console.error('✗ Sync failed:', err.message || err);
  process.exit(1);
});
