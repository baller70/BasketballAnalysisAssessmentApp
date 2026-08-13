/**
 * ALL THREE GATES, ONE COMMAND, ONE EXIT CODE.
 *
 *   SCREEN=005 PORT=3297 node docs/shotiq/gates.mjs
 *
 * WHY THIS EXISTS, and it is not tidiness. Every round of this screen is
 * recorded as "gates markup 11/11, csrf 3/3, desktop-leak 7/7", and until now
 * that line was assembled by remembering to run three separate commands with
 * three different argument shapes. Two of those have a failure mode that looks
 * exactly like success:
 *
 *   * `markup-gate.mjs` defaults to `SCREEN=004`. Every "005 gate 11/11" for the
 *     first thirteen rounds had graded a screen finished five rounds earlier —
 *     the run passed, the number was right, and it was about the wrong screen
 *     (rule 87). Forgetting the variable is silent.
 *   * `next start` inherits `NODE_ENV=development` from this container, under
 *     which 005 is genuinely 10/11 (rule 88). A gate run against the wrong
 *     runtime is not wrong so much as unrelated.
 *
 * So this runner pins `SCREEN` explicitly, checks the server's runtime before
 * it trusts any result, and refuses to report a pass it did not actually get.
 * It adds no probes of its own — it is a way of not skipping one.
 *
 * Exit code is 0 only when all three gates exit 0 AND the runtime check passes.
 */
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3181
const SCREEN = process.env.SCREEN || ''
const base = 'http://localhost:' + PORT

if (!SCREEN) {
  console.error('FAIL  SCREEN is not set. markup-gate defaults to 004 and would silently grade the wrong screen (rule 87).')
  process.exit(2)
}

/** Run one gate, stream nothing, return {code, tail} — the summary line only. */
function gate(file, env) {
  return new Promise((resolve) => {
    const out = []
    const p = spawn(process.execPath, [path.join(HERE, file)], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    p.stdout.on('data', (d) => out.push(d.toString()))
    p.stderr.on('data', (d) => out.push(d.toString()))
    p.on('close', (code) => {
      const lines = out.join('').split('\n').filter((l) => l.trim())
      // Prefer the gate's own verdict; then its first real error; then anything.
      // A crash used to summarise as "Node.js v22.22.2" — the LAST line of a
      // stack trace — which reads like a version report rather than a failure.
      const summary =
        [...lines].reverse().find((l) => /\d+\/\d+ probes passed/.test(l)) ||
        lines.find((l) => /^(FAIL|Error|[A-Za-z]*Error:)/.test(l.trim())) ||
        lines.find((l) => l.trim()) ||
        '(no output)'
      const fails = lines.filter((l) => l.startsWith('FAIL'))
      resolve({ code, summary: summary.trim(), fails })
    })
  })
}

// --- the runtime check, before any gate result is believed ------------------
// A production build serves a different markup gate result than a dev one, and
// the difference is not visible in the captures (they are byte-identical), so
// this is the one thing that cannot be inferred from a gate's own output.
let runtimeOk = false
let runtimeNote = ''
try {
  const res = await fetch(base + '/verify-email?email=probe%40example.com')
  const html = await res.text()
  // THE FIRST VERSION OF THIS CHECK DID NOT WORK, and it was caught by running
  // it against a real dev server rather than by reasoning (rule 99). It looked
  // for `react-refresh` / `webpack-hmr` in the HTML; neither string appears in
  // either runtime on this Next version, so it reported "production build"
  // against a dev server while markup-gate returned the 10/11 that IS the dev
  // signature. A check that cannot fail is worse than no check.
  //
  // The discriminator that does work is a property of the served bytes: dev
  // serves its chunks with a cache-busting query, production serves
  // content-hashed filenames with none.
  //     dev   /_next/static/chunks/main-app.js?v=1786605911432
  //     prod  /_next/static/chunks/fd9d1056-175135dbaad28189.js
  // Verified against both runtimes side by side before being written down.
  const chunks = html.match(/\/_next\/static\/chunks\/[^"']+/g) || []
  const dev = chunks.some((c) => c.includes('?v=')) || chunks.length === 0
  runtimeOk = res.ok && !dev
  runtimeNote = res.ok
    ? (dev
        ? `server is running a DEV build — gate results do not transfer (rule 88); chunks: ${chunks.slice(0, 1).join('') || 'none found'}`
        : `production build (${chunks.length} content-hashed chunks, no cache-busting query)`)
    : `GET returned ${res.status}`
} catch (e) {
  runtimeNote = `server unreachable on ${base}: ${e.message}`
}
console.log(`${runtimeOk ? 'PASS' : 'FAIL'}  runtime — ${runtimeNote}`)

const results = []
for (const [file, env, label] of [
  ['markup-gate.mjs', { SCREEN, PORT }, `markup (SCREEN=${SCREEN})`],
  ['csrf-gate.mjs', { PORT }, 'csrf'],
  ['desktop-leak-gate.mjs', { PORT }, 'desktop-leak'],
]) {
  const r = await gate(file, env)
  results.push({ label, ...r })
  console.log(`${r.code === 0 ? 'PASS' : 'FAIL'}  ${label} — ${r.summary}`)
  for (const f of r.fails) console.log(`      ${f}`)
}

const bad = results.filter((r) => r.code !== 0)
const line = results.map((r) => `${r.label.split(' ')[0]} ${r.summary.match(/\d+\/\d+/)?.[0] || '?'}`).join(', ')
console.log(`\n${bad.length === 0 && runtimeOk ? 'ALL GATES PASS' : 'GATES FAILED'} — ${line}`)
process.exit(bad.length === 0 && runtimeOk ? 0 : 1)
