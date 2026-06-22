# 🚀 Going Live — Production Deployment Guide (SHOTIQ AI)

This guide is written for a **non-developer**. It walks you through putting the
web app online so beta testers can use it.

SHOTIQ AI is a standard **Next.js (Node.js)** app, so it runs on any host that
can run a Node web app — e.g. **Railway, Render, Fly.io, DigitalOcean App
Platform**, or your own server. The steps below are written generically; your
host's dashboard will have the same concepts (connect repo, set root directory,
add environment variables, deploy) even if the buttons are named slightly
differently.

> The app lives in the **`basketball-analysis`** subfolder of the repo, not the
> repo root. Wherever a host asks for a "Root Directory" or "Working Directory",
> set it to `basketball-analysis`.

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

## Step 2 — Connect the repo to your host

1. In your host's dashboard, create a **new project / web service** from a Git repo
   and pick `baller70/BasketballAnalysisAssessmentApp`.
2. **Important:** set the **Root Directory** to `basketball-analysis`
   (the app lives in that subfolder, not the repo root).
3. Most hosts auto-detect Next.js. If asked for commands, use:
   - **Install:** `npm install`
   - **Build:** `npm run build`
   - **Start:** `npm start`

## Step 3 — Add your environment variables

In your host's **Environment Variables / Secrets** section, add every
**Required** key from `.env.example` (and any Recommended ones you have):

- `DATABASE_URL`
- `GOOGLE_AI_API_KEY`
- `NEXTAUTH_SECRET`  ← generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`  ← set this to your live site URL (e.g. `https://your-app.com`)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`

Then deploy. After a couple of minutes you'll get a live URL to share with testers.

## Step 4 — Smoke-test the live site

Once deployed, check the critical path yourself before inviting testers:

- [ ] Sign up for a new account, then log out and log back in
- [ ] Upload a photo of a shot → confirm you get an AI analysis back
- [ ] Check the results page shows real numbers (no obviously fake data)
- [ ] Create a goal / custom drill → confirm it saves

---

## Known follow-ups (not blockers, but worth doing soon)

These are tracked so nothing is hidden from you:

1. **Rate limiting is in-memory** (per server instance). It protects against
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

# Production build + start (what your host runs)
npm run build
npm start
```
