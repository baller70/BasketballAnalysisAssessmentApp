/**
 * Revoke stale Apple Development certificates so xcodebuild can mint a fresh
 * one. A device build on the headless Mac signs inside a throwaway keychain
 * that is deleted afterwards, orphaning the certificate's private key — the
 * next build then fails with "Your account already has an Apple Development
 * signing certificate for this machine, but its private key is not installed".
 *
 *   node scripts/revoke-stale-dev-cert.mjs --confirm
 *
 * Development certificates only sign local device builds; TestFlight and App
 * Store builds use Distribution certificates and are untouched.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'

const confirm = process.argv.includes('--confirm')

function discoverCredentials() {
  const helper = path.join(path.dirname(new URL(import.meta.url).pathname), 'appfactory-credentials.sh')
  if (!fs.existsSync(helper)) return {}
  const out = path.join(os.tmpdir(), `asc-cert-${process.pid}`)
  try {
    execFileSync('bash', [helper, out], { stdio: ['ignore', 'inherit', 'inherit'] })
    const found = {}
    for (const line of fs.readFileSync(out, 'utf8').split('\n')) {
      const m = /^export ([A-Z_]+)=(.*)$/.exec(line)
      if (m) found[m[1]] = m[2].replace(/^'(.*)'$/s, '$1').replace(/'\\''/g, "'")
    }
    return found
  } catch {
    return {}
  } finally {
    fs.rmSync(out, { force: true })
  }
}

let keyId = process.env.ASC_KEY_ID
let issuerId = process.env.ASC_ISSUER_ID
let keyPath = process.env.ASC_KEY_PATH
if (!keyId || !issuerId || !keyPath || !fs.existsSync(keyPath)) {
  const found = discoverCredentials()
  keyId = keyId || found.ASC_KEY_ID
  issuerId = issuerId || found.ASC_ISSUER_ID
  if (!keyPath || !fs.existsSync(keyPath)) keyPath = found.ASC_KEY_PATH ?? keyPath
}
if (!keyId || !issuerId || !keyPath || !fs.existsSync(keyPath)) {
  console.error('No App Store Connect key.')
  process.exit(2)
}

const base64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const issuedAt = Math.floor(Date.now() / 1000)
const signingInput = [
  base64url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' })),
  base64url(JSON.stringify({ iss: issuerId, iat: issuedAt, exp: issuedAt + 15 * 60, aud: 'appstoreconnect-v1' })),
].join('.')
const token = `${signingInput}.${base64url(
  crypto.sign('sha256', Buffer.from(signingInput), {
    key: fs.readFileSync(keyPath, 'utf8'),
    dsaEncoding: 'ieee-p1363',
  }),
)}`

const BASE = 'https://api.appstoreconnect.apple.com'
async function api(method, endpoint) {
  const response = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`HTTP ${response.status} on ${method} ${endpoint}: ${text.slice(0, 300)}`)
  return text ? JSON.parse(text) : {}
}

const certs = await api('GET', '/v1/certificates?filter[certificateType]=DEVELOPMENT&limit=50')
const list = certs.data ?? []
console.log(`Apple Development certificates on the team: ${list.length}`)
for (const cert of list) {
  const a = cert.attributes ?? {}
  console.log(`  - ${cert.id}: "${a.name}" serial ${a.serialNumber}, expires ${a.expirationDate}`)
  if (confirm) {
    await api('DELETE', `/v1/certificates/${cert.id}`)
    console.log('    revoked — xcodebuild will mint a fresh one on the next device build')
  } else {
    console.log('    WOULD REVOKE (re-run with --confirm)')
  }
}
if (!list.length) console.log('Nothing to revoke.')
