# AGENTS.md - BasketballAnalysisAssessmentApp

## Codex Cloud Environment

Group: `KCLOUD-BUILDOUT-20260720`

Environment label: `KCLOUD-BUILDOUT-20260720-SALES-03-basketball-analysis-main-MULTIPLATFORM`

This repo is part of Kevin Houston's sale/buildout push. Use a fresh Codex Cloud environment for setup, build, test, and app-boundary work. Push setup changes directly to `main` unless Kevin gives different instructions.

## Primary App Path

The primary production app is:

```bash
basketball-analysis/
```

Do not use `nextjs_space/` as the active app. The root README marks it as old/deprecated.

## Required Reading

Before editing, read:

- `AGENTS.md`
- `README.md`
- `basketball-analysis/README.md`
- `basketball-analysis/package.json`
- `basketball-analysis/.env.example`
- relevant Tauri/Capacitor docs before touching desktop or mobile code

## Repo Boundaries

- Web app: `basketball-analysis/`
- Desktop/Tauri: inside `basketball-analysis/`, but treat as its own scoped task
- Capacitor/iOS/mobile: inside `basketball-analysis/`, but treat as its own scoped task
- Python/FastAPI backend folders: separate backend scope
- Hugging Face/Flask backend folders: separate backend scope
- Deprecated app: `nextjs_space/`

## Operating Rules

- Keep changes scoped and reviewable.
- Do not deploy unless Kevin explicitly approves.
- Do not invent production secrets or commit `.env` files.
- Do not run database migrations against shared or production databases without Kevin approval.
- Do not mix web, desktop, mobile, and backend changes in one broad pass unless Kevin approves that scope.
- For UI work, use visual verification and report what was checked.
- For vision/AI work, document provider, model, input/output shape, and fallback behavior.

## Setup

Use the documented npm path inside the primary app.

```bash
cd basketball-analysis
npm install
npm run build
```

## Verification

Run targeted checks for the files you touch. For web setup/build-readiness work, prefer:

```bash
cd basketball-analysis
npm run build
npm run test
```

Only run Tauri, Capacitor, or native mobile commands when the task is specifically scoped to those platforms.

## Commands To Avoid Without Kevin Approval

```bash
cd nextjs_space
cd basketball-analysis && npm run db:migrate
cd basketball-analysis && npm run db:seed
cd basketball-analysis && npm run tauri:build
cd basketball-analysis && npm run ios:build
```

Do not make deprecated code active. Do not deploy. Do not run production-impacting migrations or seed scripts.

## First Cloud Task Direction

The first fresh Codex Cloud environment should run a primary-app-path and build-readiness pass:

- confirm `basketball-analysis/` is the production app
- confirm `nextjs_space/` is deprecated
- run install and build inside `basketball-analysis/`
- inventory web, desktop/Tauri, mobile/Capacitor, Python backend, and Hugging Face backend boundaries
- produce a clean setup note for future tasks
- implement only one scoped setup/docs fix if clearly safe

## Final Response Required

Include:

- files changed
- commands run
- build/test result
- visual verification result if UI changed
- remaining risks
- exact next step for Kevin

## KCLOUD Access and Dependency Checklist

Before starting substantial Codex Cloud work for this repo, verify and report these items in the task output:

- **GitHub:** confirm the checkout is on `main`, `origin` is `https://github.com/baller70/BasketballAnalysisAssessmentApp.git`, and read/write GitHub access is available through the connected Codex Cloud GitHub integration.
- **Dependencies:** run the repo-specific setup/install/build commands listed above. Record the package manager, Node/runtime version, successful commands, and blockers.
- **Contabo read/write:** verify SSH read/write access when credentials are available with `ssh -o BatchMode=yes -o ConnectTimeout=10 root@194.146.12.139 'set -e; hostname; whoami; test -d /opt/apps && echo apps-ok; marker=/tmp/kcloud-rw-$(date +%s)-$; printf kcloud-rw-test > "$marker"; cat "$marker"; rm "$marker"; echo rw-ok'`. Do not deploy, sync, restart services, or edit Caddy/PM2 without Kevin's explicit approval.
- **Local Mac bridge read/write:** verify the Codex Cloud environment can reach Kevin's local bridge by creating, reading, and deleting a marker under `/Volumes/APPLICATIONS/CodexStorage/kcloud-local-bridge/rw-tests`. Treat `/Volumes/APPLICATIONS/CodexStorage/projects/codex-cloud-apps/BasketballAnalysisAssessmentApp` as this repo's local mirror/control path. If the bridge path is not mounted, report the exact missing connector instead of silently falling back.
- **Secrets:** never commit real production secrets. Inventory required env vars by name/category and use placeholders for setup checks.

