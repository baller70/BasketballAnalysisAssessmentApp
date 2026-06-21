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

## Optional: enable social login (Google / GitHub)

Email/password works out of the box. To also offer "Continue with Google/GitHub":

1. **Google**: create an OAuth client at
   https://console.cloud.google.com/apis/credentials → "OAuth client ID" → Web
   application. Add the redirect URI:
   `https://YOUR-DOMAIN/api/auth/oauth/google/callback`
2. **GitHub**: create an OAuth app at
   https://github.com/settings/developers → "New OAuth App". Set the callback URL:
   `https://YOUR-DOMAIN/api/auth/oauth/github/callback`
3. Add the resulting IDs/secrets to your env: `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

If you skip a provider, its button simply shows a friendly "not configured"
message — nothing breaks.

> **Database note:** social login added new columns to the `users` table. Make
> sure you run the migration (Step 1's `prisma migrate deploy`) so production has
> them. A fresh DB picks this up automatically.

## Known follow-ups (not blockers, but worth doing soon)

These are tracked so nothing is hidden from you:

1. **Rate limiting is in-memory** (per server instance). It protects against
   basic abuse but resets on redeploy and isn't shared across multiple
   instances. For scale, move to a Redis-backed limiter.
2. **Account linking by email**: if someone signs up with a password and later
   uses Google with the same email, the accounts are merged by email. That's
   usually desired, but review it against your security expectations.

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
