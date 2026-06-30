# SHOTIQ — Desktop (Tauri) & iOS (Capacitor) Build Guide

Both native shells are **thin wrappers that load the live web app**
(`https://shotiq.194-146-12-139.sslip.io`). On-device MoveNet analysis runs
inside the webview; auth/DB/API hit the live Contabo backend. This means the
native apps need **no separate backend** — just point at the live URL (already
configured) and build.

Prereqs not present on the build machine used for the production push:
- **Rust toolchain** (for Tauri desktop) — install via `https://rustup.rs`.
- **Full Xcode + an Apple Developer account** (for iOS signing/archive).

---

## Desktop (Tauri)

Config already points at the live URL:
- `tauri-dist/index.html` splash → redirects to the live site.
- `src-tauri/tauri.conf.json` CSP → allows the live `*.sslip.io` host.

Build:
```bash
cd basketball-analysis
# one-time: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
npm run tauri:build            # current platform
npm run tauri:build:mac        # universal-apple-darwin .app/.dmg
```
Artifacts land in `src-tauri/target/release/bundle/`.

---

## iOS (Capacitor)

Config already points at the live URL via `capacitor.config.ts` `server.url`,
so the app loads the live site directly (no broken static export needed).

Build / open in Xcode:
```bash
cd basketball-analysis
npx cap sync ios               # sync the live-URL config into the iOS project
npx cap open ios               # opens ios/App in Xcode
```
Then in Xcode: set your Team (Apple Developer account), bump the bundle version,
and Archive → Distribute. The `ios/App` project, icons, and permission strings
(camera/photo) are already scaffolded.

> Note: because `server.url` is set, the app is a native shell around the live
> web app. To ship a fully self-contained binary later (offline-first), build a
> static export that calls the live API and drop `server.url`.

---

## After changing the public domain
If the live host changes from `shotiq.194-146-12-139.sslip.io` to a real domain
(e.g. `app.shotiqai.com`), update all three in one pass:
1. `capacitor.config.ts` → `server.url` + `allowNavigation`
2. `tauri-dist/index.html` → `window.location.href`
3. `src-tauri/tauri.conf.json` → CSP host list
4. Backend `.env.production` → `NEXTAUTH_URL` + `NEXT_PUBLIC_APP_URL`, and the
   Caddy site block on Contabo.
