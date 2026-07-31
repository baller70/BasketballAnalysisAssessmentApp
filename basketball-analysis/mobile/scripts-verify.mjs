// Structural verification: every canonical iOS screenId is registered exactly
// once and every registered component carries its screen testID in source.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const map = JSON.parse(readFileSync('../docs/shotiq/screen-implementation-map.json', 'utf8'))
const want = new Set(map.filter((r) => r.platform === 'ios').map((r) => r.screenId))

const registry = readFileSync('src/registry.ts', 'utf8')
const registered = [...registry.matchAll(/\['(ios\.[a-z0-9-]+)'/g)].map((m) => m[1])
const regSet = new Set(registered)

let src = ''
for (const dir of ['src', 'src/screens']) {
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.tsx') || f.endsWith('.ts')) src += readFileSync(join(dir, f), 'utf8')
  }
}
src += readFileSync('App.tsx', 'utf8')
const testIDs = new Set([...src.matchAll(/testID="(screen-ios-[a-z0-9-]+)"/g)].map((m) => m[1]))

const missingReg = [...want].filter((id) => !regSet.has(id))
const missingTid = [...want].filter((id) => !testIDs.has(`screen-${id.replace(/\./g, '-')}`))
const dupes = registered.filter((id, i) => registered.indexOf(id) !== i)

console.log(`canonical iOS screens : ${want.size}`)
console.log(`registered            : ${regSet.size}`)
console.log(`testIDs found         : ${[...testIDs].length}`)
if (missingReg.length) console.log('MISSING FROM REGISTRY:', missingReg)
if (missingTid.length) console.log('MISSING testID:', missingTid)
if (dupes.length) console.log('DUPLICATE registrations:', dupes)
const ok = !missingReg.length && !missingTid.length && !dupes.length && want.size === 72
console.log(ok ? 'VERIFY PASS 72/72' : 'VERIFY FAIL')
process.exit(ok ? 0 : 1)
