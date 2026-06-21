# 🚀 Going Live — Production Deployment Guide (SHOTIQ AI)

This guide is written for a **non-developer**. It walks you through putting the
web app online so beta testers can use it. The recommended host is **Vercel**
(it's the company behind Next.js, free tier available, and this repo is already
configured for it via `vercel.json`).

---

## What you need before you start

You'll need accounts/keys for the services the app uses. The **required** ones
are listed first — the app won't fully work without them. See `.env.example`
for the complete annotated list.

| Service | What it's for | Required? |
|---------|---------------|-----------|
| **PostgreSQL database** (Neon is easiest/free) | Stores users, profiles, analyses | ✅ Required |
| **Google AI Studio (Gemini)** | The AI that analyzes shots | ✅ Required |
| **AWS S3 bucket** | Stores uploaded photos/videos | ✅ Required |
| `NEXTAUTH_SECRET` (a random password you generate) | Secures user logins | ✅ Required |
| Roboflow | Basketball detection | Recommended |
| Shotstack | Annotated visualization videos | Recommended |
| Pose-detection backend (HuggingFace) | Body-position tracking | Recommended |

---

## Step 1 — Set up the database

1. Create a free PostgreSQL database at **https://neon.tech** (or Supabase/AWS RDS).
2. Copy its connection string (looks like `postgresql://...`). This is your `DATABASE_URL`.
3. Apply the app's database structure by running this once (locally, with
   `DATABASE_URL` set in your `.env`):
   ```bash
   npx prisma migrate deploy
   ```
   *(If there are no migration files yet, use `npx prisma db push` instead.)*

## Step 2 — Deploy to Vercel

1. Go to **https://vercel.com** and sign in with your GitHub account.
2. Click **Add New → Project** and import the
   `baller70/BasketballAnalysisAssessmentApp` repository.
3. **Important:** set the **Root Directory** to `basketball-analysis`
   (the app lives in that subfolder, not the repo root).
4. Vercel auto-detects Next.js. Leave the build settings as-is
   (they match the included `vercel.json`).

## Step 3 — Add your environment variables

In the Vercel project: **Settings → Environment Variables**. Add every
**Required** key from `.env.example` (and any Recommended ones you have):

- `DATABASE_URL`
- `GOOGLE_AI_API_KEY`
- `NEXTAUTH_SECRET`  ← generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`  ← set this to your live Vercel URL (e.g. `https://shotiq.vercel.app`)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`

Then click **Deploy**. After ~2 minutes you'll get a live URL to share with testers.

## Step 4 — Smoke-test the live site

Once deployed, check the critical path yourself before inviting testers:

- [ ] Sign up for a new account, then log out and log back in
- [ ] Upload a photo of a shot → confirm you get an AI analysis back
- [ ] Check the results page shows real numbers (no obviously fake data)
- [ ] Create a goal / custom drill → confirm it saves

---

## Known follow-ups (not blockers, but worth doing soon)

These are tracked so nothing is hidden from you:

1. **Two `next.config` files** (`next.config.js` and `next.config.mjs`) exist in
   the app folder. The build works today, but having both is confusing and they
   should be merged into one. Low risk, do when convenient.
2. **CSRF enforcement**: the server now issues CSRF tokens, but the frontend
   doesn't yet echo them back on form submissions. Fine for a closed beta;
   wire up before a fully public launch.
3. **OAuth login** (Google/GitHub sign-in) is not implemented — only
   email/password. Add later if testers want social login.
4. **Rate limiting is in-memory** (per server instance). It protects against
   basic abuse but resets on redeploy and isn't shared across multiple
   instances. For scale, move to a Redis-backed limiter.

---

## Quick reference

```bash
# Local development
npm install
npm run dev            # http://localhost:3000

# Run the test suite
npm test

# Production build (what Vercel runs)
npm run build
```
