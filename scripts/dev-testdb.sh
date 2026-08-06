#!/usr/bin/env bash
#
# Stand up a local Postgres for functional testing, migrate it, seed it, and
# create a sign-in-able account.
#
# WHY THIS EXISTS. There was no database in the dev container, so every
# "functional" check silently degraded: /api/auth/signin answered
# `{"error":"Database connection failed. 503"}`, Playwright could not get past
# the sign-in page, and /upload rendered its signed-out shell with no file
# input at all. A test that cannot log in cannot tell you the upload button
# does nothing — it reports the same "no file input" whether the feature works
# or not. Several audits were run against that state before anyone noticed.
#
# And the environment is NOT durable: this container has reclaimed both
# `/var/lib/postgresql/*` and `basketball-analysis/.next` mid-session. So the
# fix is not to set the database up once, it is to make setting it up again
# cost one command. Re-running this is safe — it recreates from scratch.
#
#   ./scripts/dev-testdb.sh
#
# Then, from basketball-analysis/:
#   NODE_ENV=production npx next build && NODE_ENV=production npx next start --port 3181
#
set -Eeuo pipefail

PGPORT="${PGPORT:-5433}"
PGDATA="${PGDATA:-/var/lib/postgresql/shotiq}"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
DBNAME="${DBNAME:-shotiq}"
TEST_EMAIL="${TEST_EMAIL:-khouston721@gmail.com}"
TEST_PASSWORD="${TEST_PASSWORD:-hunterrr}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$HERE/basketball-analysis"

step() { printf '\n==> %s\n' "$*"; }
die() { printf 'dev-testdb: %s\n' "$*" >&2; exit 1; }

[ -d "$PGBIN" ] || die "no Postgres at $PGBIN — set PGBIN"
[ -d "$APP" ] || die "cannot find basketball-analysis at $APP"

# initdb refuses to run as root, which is what this container gives you. Run the
# server as the unprivileged `postgres` user that the distro package creates.
id postgres >/dev/null 2>&1 || die "no 'postgres' system user to run the server as"

step "Recreating the cluster at $PGDATA"
if [ -d "$PGDATA" ]; then
  su postgres -c "$PGBIN/pg_ctl -D $PGDATA stop -m immediate" >/dev/null 2>&1 || true
fi
rm -rf "$PGDATA"
mkdir -p "$PGDATA"
chown postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"
su postgres -c "$PGBIN/initdb -D $PGDATA -U postgres --auth=trust" >/tmp/dev-testdb-initdb.log 2>&1 \
  || { tail -20 /tmp/dev-testdb-initdb.log; die "initdb failed"; }

# TCP only, on 127.0.0.1. A unix socket in /tmp fails here: the server cannot
# create its lock file as `postgres` in a root-owned /tmp
# ("could not open lock file /tmp/.s.PGSQL.5433.lock: Permission denied"), and
# the only symptom is a connection refused that looks like the port is wrong.
step "Starting Postgres on 127.0.0.1:$PGPORT"
su postgres -c "$PGBIN/pg_ctl -D $PGDATA -o '-p $PGPORT -h 127.0.0.1' -l /tmp/dev-testdb-pg.log start" >/dev/null
for _ in $(seq 1 20); do
  psql -h 127.0.0.1 -p "$PGPORT" -U postgres -tAc 'SELECT 1' >/dev/null 2>&1 && break
  sleep 1
done
psql -h 127.0.0.1 -p "$PGPORT" -U postgres -tAc 'SELECT 1' >/dev/null 2>&1 \
  || { tail -20 /tmp/dev-testdb-pg.log; die "server did not come up"; }

step "Creating database $DBNAME"
psql -h 127.0.0.1 -p "$PGPORT" -U postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname='$DBNAME'" | grep -q 1 \
  || psql -h 127.0.0.1 -p "$PGPORT" -U postgres -c "CREATE DATABASE $DBNAME" >/dev/null

cd "$APP"
export DATABASE_URL="postgresql://postgres@127.0.0.1:$PGPORT/$DBNAME"

step "Applying migrations"
npx prisma migrate deploy

step "Seeding reference data"
npx prisma db seed

# The seed populates shooters and drills but no account, and the app's only
# auth path is email + bcrypt password. Without this the sign-in page is a wall.
step "Creating the test account ($TEST_EMAIL)"
TEST_EMAIL="$TEST_EMAIL" TEST_PASSWORD="$TEST_PASSWORD" node -e '
const bcrypt = require("bcryptjs")
const { PrismaClient } = require("@prisma/client")
const p = new PrismaClient()
;(async () => {
  const hash = await bcrypt.hash(process.env.TEST_PASSWORD, 10)
  const u = await p.user.upsert({
    where: { email: process.env.TEST_EMAIL },
    update: { password: hash },
    create: { email: process.env.TEST_EMAIL, password: hash },
  })
  console.log("   user:", u.email, u.id)
  await p.$disconnect()
})().catch((e) => { console.error(e.message); process.exit(1) })
'

step "Ready"
cat <<EOF
   DATABASE_URL=$DATABASE_URL
   shooters seeded: $(psql -h 127.0.0.1 -p "$PGPORT" -U postgres -d "$DBNAME" -tAc 'SELECT count(*) FROM shooters')
   sign in as:      $TEST_EMAIL / $TEST_PASSWORD

   The app reads DATABASE_URL from basketball-analysis/.env — make sure it says:
     DATABASE_URL="postgresql://postgres@localhost:$PGPORT/$DBNAME"
EOF
