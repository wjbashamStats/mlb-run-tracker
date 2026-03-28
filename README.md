# ⚾ MLB Run Total Tracker

A public web app that auto-updates every morning tracking which MLB teams have scored each run total (0–13) across the 2025 season. First team to complete all 14 wins the pot.

## How It Works

- **Vercel Cron** runs `/api/cron` every day at 8 AM CT
- Cron fetches all 2025 regular season final scores from MLB's free stats API
- Results are stored in **Vercel KV** (free Redis)
- The public page reads from KV and renders the 30×14 grid

---

## Deploy in ~10 Minutes

### 1. Push to GitHub

```bash
cd mlb-run-tracker
git init
git add .
git commit -m "init"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/mlb-run-tracker.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Click **Deploy** — first deploy will work (no KV data yet, that's fine)

### 3. Add Vercel KV (free Redis)

1. In your Vercel project dashboard → **Storage** tab
2. Click **Create Database** → choose **KV**
3. Name it anything (e.g. `mlb-tracker-kv`), pick a region
4. Click **Connect** — Vercel auto-adds the env vars (`KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`) to your project

### 4. Add a Cron Secret (optional but recommended)

In Vercel project → **Settings** → **Environment Variables**, add:
```
CRON_SECRET = any-random-string-you-make-up
```

### 5. Redeploy

After adding KV + the env var, go to **Deployments** → click the latest → **Redeploy**.

### 6. Trigger the first sync

Visit:
```
https://your-app.vercel.app/api/cron
```
This runs the first sync manually — loads the full 2025 season so far. After that, Vercel runs it automatically every morning at 8 AM CT.

---

## Local Development

```bash
npm install
# Create .env.local with your KV creds from Vercel dashboard (Storage → KV → .env.local tab)
npm run dev
```

---

## File Structure

```
app/
  page.tsx          ← the public tracker UI
  layout.tsx        ← root layout
  api/
    cron/route.ts   ← daily cron: fetches MLB API → saves to KV
    state/route.ts  ← GET endpoint: reads from KV for the frontend
lib/
  mlb.ts            ← team data + MLB API fetch logic
vercel.json         ← cron schedule (8 AM CT = 13:00 UTC)
```

---

## Customizing the Cron Schedule

In `vercel.json`, the cron is set to `"0 13 * * *"` (8 AM CT / 1 PM UTC).
Adjust as needed — [crontab.guru](https://crontab.guru) is helpful.

Note: Vercel free tier allows 2 cron jobs and they run at most once daily.
