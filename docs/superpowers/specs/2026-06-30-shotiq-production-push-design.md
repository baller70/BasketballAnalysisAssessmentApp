# SHOTIQ — Production Push Design Spec

**Date:** 2026-06-30
**Branch:** `production-push`
**App root:** `basketball-analysis/` (Next.js 14); repo root holds the offline Python pipeline + docs.
**Goal:** Take SHOTIQ (AI basketball shot-analysis) from a half-wired prototype to a **finished, sellable production app** shipped on **Contabo** (web), plus **desktop (Tauri)** and **iOS (Capacitor)** builds. Executed as a 3-wave parallel agent swarm (~18 agents) with file-ownership partitioning and build gates between waves.

---

## Locked architecture decisions

1. **Analysis engine = on-device TF.js MoveNet**, canonical for image / video / live, behind a pluggable `PoseProvider` interface. Rationale (consumer product to be sold): on-device = zero per-user inference cost, offline-capable, privacy/App-Store friendly, no single point of failure, ports into Tauri/Capacitor webviews. The offline external Hugging Face Space dependency is removed as the primary path; a server "Pro accuracy" provider can slot in later via the same interface. Remove the hardcoded `75` fallback score; fix video via client frame-extraction → per-frame MoveNet.
2. **Postgres/Prisma is the single source of truth.** localStorage is demoted to an offline cache only. Every orphaned API (goals, workouts, saved-workouts, training-preferences, save-analysis, analysis-history) is wired; shot analyses + media persist to DB + object storage (Cloudflare R2 / S3).
3. **Security is fixed in Wave 0** before features build on it.
4. **Ship target:** Web + Desktop + iOS, all against a hosted backend on **Contabo** (`194.146.12.139`, the user's server — NOT Hetzner). Real domain TBD; default to an `sslip.io` host like the CoachAI app, swappable. Desktop/iOS shells point at `app.shotiqai.com` via config.
5. **All dead code removed**; every real user-facing nav item/feature preserved.

---

## Audit summary (what we're fixing)

Five recurring problems found across 9 parallel audits:
- **Split-brain persistence** — production-quality Prisma APIs exist but the UI uses localStorage; shot analyses never reach the DB on web (20-session cap).
- **Security** — forgeable-cookie auth bypass (`middleware.ts:47`), IDOR on `/api/profile`, swallowed token failures, localStorage password fallback, committed secrets.
- **Analysis fragility** — pose backend is an offline external HF Space not in repo; video pipeline broken (missing `NEXT_PUBLIC_VIDEO_API_URL`); hardcoded `75` scores; two divergent engines.
- **Duplication/dead code** — 4 disjoint shooter datasets, 2 point systems, 2 badge systems, ~6k dead lines in `results/demo/page.tsx`, dead `TrainingPlanCalendar` (7,792 ln), `ShareCardGame`, `mobileApi`, `platform/storage`, `AnalysisDashboard`, `AnnotatedImageDisplay`.
- **Shallow detection + no safety net** — only ~4 of 28 flaws fire; zero tests; no CI; 322 lint problems; no migration discipline.

---

## Swarm structure

**Collision control:** each agent owns an exclusive file set. Shared files get a single owner (`schema.prisma` → F2; `results/demo/page.tsx` → W1-Results). No Wave-1 agent edits `schema.prisma` or `package.json` deps — they request changes; F2 lands them up front. Build/typecheck gate between every wave.

### Wave 0 — Foundation (3 agents, barrier)
- **F1 · Security & Auth** — owns `middleware.ts`, `stores/authStore.ts`, `lib/auth/*`, `lib/authToken.ts`, `lib/csrf.ts`, `lib/rateLimit.ts`, `api/auth/*`, `api/profile/route.ts`, `signin/signup` pages, `.env` handling. Fix bypass, IDOR, mandatory secret, drop password fallback, forgot-password + email-verify flows.
- **F2 · Data & Persistence** — owns `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts`, `lib/prisma.ts`, `lib/storage/*`, `api/save-analysis`, `api/analysis-history`, `package.json` deps. Add all models/fields the features need (Settings, Badge/Challenge, Points ledger, FK fixes), migration discipline, signup→profile creation, R2/S3 media lib.
- **F3 · Analysis engine** — owns `services/visionAnalysis.ts`, `videoAnalysis.ts`, `poseDetection.ts`, `hooks/usePoseDetection.ts`, `services/coachingInsights.ts`, `services/coachingAnalysis.ts`, `components/analysis/*`, `lib/constants.ts`. MoveNet canonical behind `PoseProvider`; remove fake scores; fix video.

### Wave 1 — Features (~15 agents, parallel, file-partitioned)
Profile+onboarding · Settings · Media library · Points (unify 2 stacks → DB) · Badges · Challenges+streaks · Goals · Workouts+calendar (real recommender, not `Math.random`) · Saved-workouts+training-prefs · Drills+drill-video AI · Elite shooters (one DB dataset) · Comparison (one engine + build photo-overlay) · Flaw engine (generic rule evaluator → all 28 flaws) · Results monolith (delete ~6k dead lines + wire visible stubs; exclusive owner of `results/demo/page.tsx`) · Live camera + Share/export · Authenticated dashboard.

### Wave 2 — Harden & Ship (parallel)
Vitest suite + `tests/` + CI (`.github/workflows`) · lint to zero · `/qa` pass · deploy to Contabo (PM2 + Caddy + Postgres + R2, domain/DNS/TLS) · Tauri desktop build · Capacitor iOS build against live backend · post-deploy canary.

---

## Definition of done
Web app live on Contabo at a real domain; signup → analyze → persist → history all DB-backed and secure; all 28 flaws detectable; no dead code; lint + typecheck + build green; tests passing; desktop + iOS builds produced.

---

## Risks / open items
- **Domain ownership** of `shotiqai.com` unconfirmed — defaulting to `sslip.io`, swappable.
- **Secrets in `.env`** must be rotated before go-live (Neon DB looks like a dev instance; migrate to Contabo Postgres).
- **MoveNet accuracy** is heuristic — calibrate thresholds; "Pro" server provider deferred.
- **iOS** needs Mac + Xcode + Apple Developer account to actually archive/submit (build artifacts produced; store submission is a manual user step).
