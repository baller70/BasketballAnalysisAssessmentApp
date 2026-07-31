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
