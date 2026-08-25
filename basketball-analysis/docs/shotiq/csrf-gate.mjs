/**
 * CSRF GATE — asserts the token is per REQUEST, not per BUILD.
 *
 * This exists because the control was silently disabled by a repair to
 * something else. `/api/auth/csrf` takes no arguments and reads nothing
 * request-scoped, so Next 14 classified it as static and prerendered it: the
 * token and its Set-Cookie were frozen into the dist and every caller in the
 * world shared one secret. It was only dynamic before that because static
 * generation was FAILING; fixing the build is what froze it.
 *
 * Nothing in the source changed, so no source review would have caught it — the
 * defect lives in the artefact. This gate reads the artefact.
 *
 *   PORT=3240 node docs/shotiq/csrf-gate.mjs
 *   DIST=.next-v13 node docs/shotiq/csrf-gate.mjs   (also checks the manifest)
 */
import fs from 'fs'
import path from 'path'

const PORT = process.env.PORT || 3240
const BASE = `http://localhost:${PORT}`
const results = []
const check = (name, pass, detail) => {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`)
}

// 1. Live: independent GETs must return different tokens.
const tokens = []
const cookies = []
for (let i = 0; i < 4; i += 1) {
  const r = await fetch(`${BASE}/api/auth/csrf`)
  tokens.push((await r.json()).csrfToken)
  cookies.push((r.headers.get('set-cookie') || '').split(';')[0])
}
check('four independent GETs return four DIFFERENT tokens',
  new Set(tokens).size === 4, `${new Set(tokens).size} distinct of 4 — ${tokens.map((t) => t.slice(0, 8)).join(' ')}`)
check('the Set-Cookie tracks the body token',
  cookies.every((c, i) => c.includes(tokens[i])), 'each cookie carries its own response body token')

// 2. Artefact: the route must not appear in the prerender manifest.
const dist = process.env.DIST
if (dist) {
  const f = path.join(dist, 'prerender-manifest.json')
  const m = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { routes: {} }
  const frozen = Object.keys(m.routes || {}).filter((k) => k.startsWith('/api'))
  check('no /api route is prerendered into the dist',
    frozen.length === 0, frozen.length ? `FROZEN: ${frozen.join(', ')}` : 'none')
}

// 3. Source: a ZERO-ARGUMENT handler is the shape that gets prerendered.
//
// The manifest check above is necessary and not sufficient — it only sees what
// this build happened to freeze. `/api/auth/csrf` was dynamic for months purely
// because static generation was failing; the moment the build worked, its token
// was baked in. Any handler declared with an EMPTY parameter list reads nothing
// request-scoped and can be classified static on some future build, so it has to
// SAY it is dynamic rather than rely on the classification.
//
// OPTIONS handlers are exempt: they answer a preflight with constant CORS
// headers, so a frozen copy is the same answer. Everything else must declare.
{
  const roots = 'src/app/api'
  const offenders = []
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name === 'route.ts' || e.name === 'route.tsx') {
        const src = fs.readFileSync(full, 'utf8')
        const declares = /^export\s+const\s+dynamic\s*=/m.test(src)
        if (declares) continue
        const re = /^export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD)\s*\(\s*\)/gm
        let m
        while ((m = re.exec(src))) offenders.push(`${full}:${m[1]}`)
      }
    }
  }
  if (fs.existsSync(roots)) {
    walk(roots)
    check('every zero-argument API handler declares `dynamic`',
      offenders.length === 0,
      offenders.length ? `MISSING: ${offenders.join(', ')}` : 'none take an empty parameter list without declaring it')
  }
}

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} probes passed`)
if (failed.length) { console.log(`FAILED: ${failed.map((f) => f.name).join(', ')}`); process.exit(1) }
