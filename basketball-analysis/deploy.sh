#!/usr/bin/env bash
#
# SHOTIQ AI — Contabo deploy script.
# Pulls latest, installs deps, runs migrations, builds, and (re)starts PM2.
# Idempotent and safe to re-run: migrations are forward-only (`migrate deploy`),
# seeding only runs when the DB is empty, and PM2 falls back to start->restart.
#
# Usage (on the box):  cd /opt/shotiq && ./deploy.sh
set -euo pipefail

REPO_DIR="/opt/shotiq"                          # git repo root
APP_DIR="/opt/shotiq/basketball-analysis"        # the Next.js app lives here
APP_NAME="shotiq"
# Cap build memory so `next build` (+ TF.js) doesn't OOM a small VPS.
export NODE_OPTIONS="--max-old-space-size=2048"

echo "==> [1/6] Pulling latest code"
cd "$REPO_DIR"
git pull --ff-only

cd "$APP_DIR"
# Load production env so prisma/build/seed see DATABASE_URL etc.
if [ -f .env.production ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.production
  set +a
fi

echo "==> [2/6] Installing dependencies (npm ci, incl. dev for the build)"
# --include=dev is REQUIRED: .env.production sets NODE_ENV=production, under which
# npm omits devDependencies — but tailwindcss/postcss/typescript are needed by
# `next build`. Without this the build fails with "Cannot find module 'tailwindcss'".
npm ci --include=dev

echo "==> [3/6] Applying database migrations"
npx prisma migrate deploy

echo "==> [4/6] Seeding reference data (only if DB is empty)"
# Seed is upsert-based, but we still guard so re-deploys are cheap. The check
# returns "EMPTY" when the Shooter table has no rows (fresh DB), else "SEEDED".
SEED_STATE="$(node -e '
  const { PrismaClient } = require("@prisma/client");
  const p = new PrismaClient();
  p.shooter.count()
    .then((n) => { console.log(n > 0 ? "SEEDED" : "EMPTY"); })
    .catch(() => { console.log("UNKNOWN"); })
    .finally(() => p.$disconnect());
' 2>/dev/null || echo "UNKNOWN")"

if [ "$SEED_STATE" = "EMPTY" ]; then
  echo "    Database empty — running seed"
  npx prisma db seed
else
  echo "    Skipping seed (state: $SEED_STATE)"
fi

echo "==> [5/6] Building production bundle"
npm run build

echo "==> [6/6] (Re)starting PM2 process '$APP_NAME'"
# restart if it already exists, otherwise start it from the ecosystem file.
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
else
  pm2 start ecosystem.config.js --env production
fi
pm2 save

echo "✅ Deploy complete — $APP_NAME is live on :3060"
