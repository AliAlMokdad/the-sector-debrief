# YouTube auto-sync setup

This repo has a GitHub Action that pulls fresh data from YouTube once a day
and updates `js/data.js` automatically. Episode list, dates, durations, and
the live total view count all stay current with zero manual work.

The Action lives at `.github/workflows/sync-youtube.yml`.
The script it runs is `scripts/sync-youtube.js`.

---

## What gets updated

- `EPISODES` array — title, date, duration, and (for new episodes) the
  description pulled from YouTube. Existing episodes keep their `themes`,
  `guest`, and any custom description you wrote.
- `STATS.views` — refreshed from the channel's total view count.
- `STATS.episodes` — recounted from the synced playlist.
- A timestamp comment above `STATS` so you can see when it last ran.

## What is **never** touched

- `BLOG_POSTS` — your essays + reflection prompts stay exactly as you wrote them
- `QUOTES` — your hand-picked pulls
- `HOSTS` — bios, photos, LinkedIn URLs
- Any field on an existing episode that you've manually customised

The merge function compares by `id` (the YouTube video ID), so as long as
you don't change those, your edits are safe.

---

## One-time setup (3 minutes)

### 1. Get a YouTube Data API key (free)

1. Go to <https://console.cloud.google.com/>
2. Create a project (any name — e.g. `sector-debrief`)
3. Open **APIs & Services → Library**, search **YouTube Data API v3**, and click **Enable**
4. Open **APIs & Services → Credentials → Create Credentials → API key**
5. Copy the key
6. (Recommended) Click **Restrict key**, and limit to **YouTube Data API v3** only

The free quota is **10,000 units/day**. Each sync run uses ~3 units, so this
will never come close to the limit.

### 2. Add the key to GitHub Secrets

1. In your repo on GitHub: **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `YOUTUBE_API_KEY`
4. Value: paste the key
5. Save

### 3. (Optional) Adjust the schedule

Edit `.github/workflows/sync-youtube.yml`:

```yaml
on:
  schedule:
    - cron: '0 6 * * *'   # daily at 06:00 UTC
```

Common alternatives:
- `'0 */6 * * *'` — every 6 hours
- `'0 6,18 * * *'` — twice a day at 06:00 and 18:00 UTC
- `'0 6 * * 1'` — once a week, Monday morning

### 4. Try it

You can run the workflow manually right after setup:

1. **Actions** tab → **Sync YouTube → data.js** → **Run workflow**
2. Watch it run (~30 seconds)
3. If a change is detected, the bot pushes a commit; otherwise the run
   exits clean with "Already up to date."

---

## Running it locally (optional)

```bash
# In the repo root:
export YOUTUBE_API_KEY="your_key_here"

# Dry run — print what would change without writing:
DRY_RUN=1 node scripts/sync-youtube.js

# Real run:
node scripts/sync-youtube.js
```

Exit codes:
- `0` — wrote changes (or printed dry-run summary)
- `2` — already up to date, nothing to do
- `1` — error

---

## What if a new episode appears?

When the bot runs and finds a video on the playlist that's not yet in
`data.js`, it adds it with sensible defaults:

```js
{
  n: <next number>,
  id: '<youtube id>',
  title: '<from youtube>',
  guest: null,
  date: '<from youtube>',
  duration: '<minutes>',
  description: '<from youtube>',
  themes: []
}
```

The new episode shows up on the **Episodes** page immediately. The blog
post + Pause-and-Reflect prompts for that episode stay empty until you
write them — they live in `BLOG_POSTS` in the same file, and the sync
script never touches that array.

**Workflow when a new episode drops:**
1. Bot syncs overnight → episode appears on the site automatically
2. Whenever you have time, open `js/data.js`, scroll to `BLOG_POSTS`,
   add a new entry with `epId`, `epN`, blog body, and 5 reflections
3. Push the commit. The site updates.

---

## Troubleshooting

**"Playlist returned 0 items — refusing to overwrite"**
The YouTube API returned empty. Could be a quota issue, key restriction
problem, or wrong playlist ID. The script bails on purpose so it never
nukes your real data.

**"HTTP 403 from YouTube"**
The API key is missing, restricted to the wrong API, or the project's
YouTube Data API isn't enabled. See setup step 1.

**"Sync failed: ..."** (other errors)
Check the Action's run log. The script logs every step.
