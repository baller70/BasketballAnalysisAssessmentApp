# Deploying SHOTIQ AI to Contabo (PM2 + Caddy + sslip.io)

This is the self-hosted deploy for the Contabo box at **194.146.12.139**. SHOTIQ
runs as a standalone Next.js app under **PM2** on port **3060**, behind **Caddy**
(automatic HTTPS) on **`shotiq.194-146-12-139.sslip.io`**, with its own
**PostgreSQL** in a Docker container. This mirrors the pattern used by the other
standalone apps on this box (each app: own `/opt/<app>`, own `ecosystem.config.js`
+ `deploy.sh`, own Caddy route, own DB container).

> The Next.js app lives in the **`basketball-analysis/`** subfolder of the repo.
> Throughout, `/opt/shotiq` is that app folder (the one containing `package.json`).

---

## 0. Prerequisites (already on the box)

- Node 20 + npm, PM2 (`npm i -g pm2`), Docker, and Caddy installed and running.
- SSH access: `ssh contabo` (or `ssh root@194.146.12.139`).

---

## 1. Get the code into `/opt/shotiq`

```bash
ssh contabo
sudo mkdir -p /opt/shotiq && sudo chown "$USER" /opt/shotiq

# The app is a subfolder of the repo. Clone to a temp path, then point
# /opt/shotiq at the basketball-analysis subfolder (simplest: clone the repo
# and symlink, OR clone with the subfolder as the working dir).
git clone https://github.com/baller70/BasketballAnalysisAssessmentApp.git /opt/shotiq-repo
cd /opt/shotiq-repo && git checkout production-push

# Make /opt/shotiq BE the app folder:
ln -sfn /opt/shotiq-repo/basketball-analysis /opt/shotiq
cd /opt/shotiq
```

> If you prefer a flat checkout, you can instead move
> `basketball-analysis/` contents into `/opt/shotiq` directly — but the symlink
> keeps `git pull` in `deploy.sh` working against the real repo.

---

## 2. Start the PostgreSQL container `shotiq-db`

Pick a **free loopback port** (not exposed publicly — Caddy only fronts the web
app, never the DB). Below uses `55432`; change it if taken.

```bash
docker run -d \
  --name shotiq-db \
  --restart unless-stopped \
  -e POSTGRES_USER=shotiq \
  -e POSTGRES_PASSWORD='CHANGE_ME_STRONG' \
  -e POSTGRES_DB=shotiq \
  -p 127.0.0.1:55432:5432 \
  -v shotiq-db-data:/var/lib/postgresql/data \
  postgres:16

# Verify it's up and loopback-only:
docker ps --filter name=shotiq-db
ss -ltnp | grep 55432   # should show 127.0.0.1:55432, not 0.0.0.0
```

---

## 3. Configure environment

```bash
cd /opt/shotiq
cp .env.production.example .env.production
# Edit .env.production:
#   DATABASE_URL=postgresql://shotiq:CHANGE_ME_STRONG@127.0.0.1:55432/shotiq?schema=public
#   NEXTAUTH_SECRET=$(openssl rand -base64 32)
#   NEXTAUTH_URL=https://shotiq.194-146-12-139.sslip.io
#   NEXT_PUBLIC_APP_URL=https://shotiq.194-146-12-139.sslip.io
#   GOOGLE_AI_API_KEY=...    (+ any media/LLM keys you have)
nano .env.production
```

`.env.production` is git-ignored and sourced automatically by `deploy.sh`.

---

## 4. First deploy (install → migrate → seed → build → PM2)

The `deploy.sh` script does all of this and is safe to re-run:

```bash
cd /opt/shotiq
./deploy.sh
```

What it does:
1. `git pull --ff-only`
2. `npm ci`
3. `npx prisma migrate deploy` (forward-only migrations)
4. `npx prisma db seed` **only if the DB is empty** (seeds reference shooters)
5. `npm run build` with a capped `NODE_OPTIONS` heap
6. `pm2 start ecosystem.config.js --env production` (or `pm2 restart shotiq`), then `pm2 save`

Confirm it's listening locally:

```bash
pm2 status
curl -I http://127.0.0.1:3060
```

Make PM2 survive reboots (once per box):

```bash
pm2 startup    # run the command it prints
pm2 save
```

---

## 5. Add the Caddy route

Add a site block to the Caddyfile (typically `/etc/caddy/Caddyfile`) so Caddy
terminates HTTPS and reverse-proxies to the app on 3060:

```caddyfile
shotiq.194-146-12-139.sslip.io {
    reverse_proxy 127.0.0.1:3060
}
```

Reload Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

`sslip.io` resolves `shotiq.194-146-12-139.sslip.io` -> `194.146.12.139`
automatically, and Caddy provisions a Let's Encrypt cert on first request.

---

## 6. Smoke-test the live site

Open **https://shotiq.194-146-12-139.sslip.io** and check the critical path:

- [ ] Sign up, log out, log back in (jose/bcrypt auth + CSRF on mutations)
- [ ] Upload a shot -> on-device MoveNet analysis returns results
- [ ] Results page shows real numbers and persists (DB-first)
- [ ] Create a goal / custom drill -> confirm it saves

---

## Updating (subsequent deploys)

```bash
ssh contabo
cd /opt/shotiq
./deploy.sh
```

## Handy commands

```bash
pm2 logs shotiq            # tail app logs
pm2 restart shotiq         # manual restart
docker logs -f shotiq-db   # database logs
npx prisma migrate status  # check migration state (run in /opt/shotiq)
```

## Troubleshooting

- **502 from Caddy** — app isn't up: `pm2 status`, `pm2 logs shotiq`, confirm `curl -I http://127.0.0.1:3060`.
- **Prisma can't connect** — check `DATABASE_URL` host/port match the container's `127.0.0.1:<port>` mapping and that `shotiq-db` is running.
- **Build OOM** — lower `--max-old-space-size` in `deploy.sh`, or add swap.
- **Cert not issued** — ensure port 443 is open and `shotiq.194-146-12-139.sslip.io` resolves to this box.
