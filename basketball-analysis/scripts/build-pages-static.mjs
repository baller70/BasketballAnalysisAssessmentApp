#!/usr/bin/env node
/**
 * Static preview export for GitHub Pages.
 *
 * `output: 'export'` cannot include server pieces, so the API routes and the
 * auth middleware are moved aside for the duration of the build and always
 * restored afterwards. In the exported preview, client fetches to /api/* 404
 * and every screen falls back to its honest signed-out/empty state — this is a
 * VISUAL PREVIEW of the canonical interface, not the production deployment.
 *
 *   NEXT_BASEPATH=/<repo> node scripts/build-pages-static.mjs
 */
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'

const TMP = '.pages-tmp'
const MOVES = [
  ['src/app/api', `${TMP}/api`],
  ['src/middleware.ts', `${TMP}/middleware.ts`],
  /* `/results/[id]` is a DYNAMIC segment whose ids are cuids minted when a
     player uploads a shot. `output: 'export'` demands every dynamic segment
     name its params at build time, and this one cannot: there are no analyses
     at build time, and an empty `generateStaticParams()` does not satisfy the
     check — Next still reports the route as missing it. The two dynamic routes
     that DO build (drills, elite shooters) can only do so because they are
     fixed catalogues.
     Listing a made-up id to get past the error would publish a preview page
     addressed by an analysis belonging to nobody. The route needs the API this
     preview deliberately removes, so it belongs in the same list as the API
     itself. Production, which runs a real server, serves it normally.
     This is why the Pages deploy failed on all 30 pushes before this. */
  ['src/app/results/[id]', `${TMP}/results-id`],
]

mkdirSync(TMP, { recursive: true })
const moved = []
try {
  for (const [from, to] of MOVES) {
    if (existsSync(from)) { renameSync(from, to); moved.push([from, to]) }
  }
  rmSync('out', { recursive: true, force: true })
  rmSync('.next', { recursive: true, force: true })
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      CAPACITOR_BUILD: 'true', // repo's existing switch for output:'export'
    },
  })
  // Pages runs Jekyll by default, which drops _next/ — disable it.
  writeFileSync('out/.nojekyll', '')
  console.log('✅ static preview exported to out/')
} finally {
  for (const [from, to] of moved.reverse()) renameSync(to, from)
  rmSync(TMP, { recursive: true, force: true })
}
