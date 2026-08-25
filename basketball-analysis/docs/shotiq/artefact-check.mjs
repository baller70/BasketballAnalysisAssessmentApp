/**
 * ARTEFACT CHECK — does the committed render still match what the ledger records?
 *
 *   node docs/shotiq/artefact-check.mjs            # verify
 *   node docs/shotiq/artefact-check.mjs --update   # rewrite the block after a round
 *
 * Rule 96 says that after a container restart you must re-capture and require the
 * md5 AND the whole-screen figure to match what the ledger records. The figure was
 * always in the 005 row; THE MD5 WAS RECORDED NOWHERE, so the exact half of that
 * test did not exist for its first several firings. The CURRENT ARTEFACT block in
 * the ledger now holds it, and this script is what keeps the block honest — a
 * stale md5 there is worse than none, because rule 96 would reject a good dist.
 *
 * It compares three things and exits non-zero on any disagreement:
 *   1. the render PNG's md5 against the block
 *   2. the canonical PNG's md5 against the block  (a rollback can take either)
 *   3. the report's first line against the block
 */
import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const LEDGER = path.join(HERE, '..', 'SCREEN-LEDGER.md')
const RENDER = path.join(HERE, 'grading', 'render', '005-verify-email.png')
const CANON = path.join(HERE, 'grading', 'canonical', '005-verify-email.png')
const REPORT = path.join(HERE, 'grading', 'render', '005-report.txt')

const md5 = (p) => createHash('md5').update(fs.readFileSync(p)).digest('hex')
const actual = {
  render: md5(RENDER),
  canon: md5(CANON),
  figure: fs.readFileSync(REPORT, 'utf8').split('\n')[0].trim(),
}

const ledger = fs.readFileSync(LEDGER, 'utf8')
const block = ledger.match(/### CURRENT ARTEFACT[\s\S]*?\n\n### /)
if (!block) {
  console.error('FAIL  no CURRENT ARTEFACT block in the ledger — rule 96 has no datum to check against.')
  process.exit(2)
}
const recorded = {
  render: (block[0].match(/render[\s\S]*?md5 ([0-9a-f]{32})/) || [])[1],
  canon: (block[0].match(/canonical[\s\S]*?md5 ([0-9a-f]{32})/) || [])[1],
  figure: (block[0].match(/reproduces\s+(whole screen[^\n]*)/) || [])[1]?.trim(),
}

if (process.argv.includes('--update')) {
  let out = block[0]
  out = out.replace(/(render[\s\S]*?md5 )[0-9a-f]{32}/, `$1${actual.render}`)
  out = out.replace(/(canonical[\s\S]*?md5 )[0-9a-f]{32}/, `$1${actual.canon}`)
  out = out.replace(/(reproduces\s+)whole screen[^\n]*/, `$1${actual.figure}`)
  fs.writeFileSync(LEDGER, ledger.replace(block[0], out))
  console.log('UPDATED  render', actual.render, '\n         figure', actual.figure)
  process.exit(0)
}

let bad = 0
for (const k of ['render', 'canon', 'figure']) {
  const ok = recorded[k] === actual[k]
  if (!ok) bad++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${k.padEnd(7)} ledger ${recorded[k] || '(absent)'}\n            actual ${actual[k]}`)
}
console.log(`\n${bad ? 'ARTEFACT DOES NOT MATCH THE LEDGER' : 'artefact matches the ledger'}`)
process.exit(bad ? 1 : 0)
