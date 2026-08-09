/**
 * Create an Apple Development signing certificate through the App Store
 * Connect API and import the matching private key into an unlocked keychain.
 *
 * Usage:
 *   node scripts/create-dev-certificate.mjs \
 *     --keychain /path/to/device.keychain-db \
 *     --keychain-password "$PASSWORD" \
 *     --work-dir /path/to/signing-work
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'

const args = new Map()
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i]
  if (!arg.startsWith('--')) continue
  const key = arg.slice(2)
  const next = process.argv[i + 1]
  if (next && !next.startsWith('--')) {
    args.set(key, next)
    i += 1
  } else {
    args.set(key, '1')
  }
}

const keychain = args.get('keychain')
const keychainPassword = args.get('keychain-password')
const workDir = args.get('work-dir') ?? fs.mkdtempSync(path.join(os.tmpdir(), 'shotiq-signing-'))
const commonName = args.get('common-name') ?? 'ShotIQ Device Development'

if (!keychain || !keychainPassword) {
  console.error('Pass --keychain and --keychain-password.')
  process.exit(2)
}

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
async function api(method, endpoint, body) {
  const response = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`HTTP ${response.status} on ${method} ${endpoint}: ${text.slice(0, 800)}`)
  return text ? JSON.parse(text) : {}
}

fs.mkdirSync(workDir, { recursive: true, mode: 0o700 })
const csr = path.join(workDir, 'apple-development.csr')
const certDer = path.join(workDir, 'apple-development.cer')

function tclQuote(value) {
  return `{${String(value).replaceAll('\\', '\\\\').replaceAll('}', '\\}')}}`
}

const expectScript = path.join(workDir, 'create-csr.expect')
fs.writeFileSync(expectScript, `
set timeout 30
set csr ${tclQuote(csr)}
set keychain ${tclQuote(keychain)}
spawn certtool r $csr k=$keychain a
expect "Enter key and certificate label:"
send "${commonName.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}\\r"
expect "Select key algorithm by letter:"
send "r\\r"
expect "Enter key size in bits or CR for default:"
send "2048\\r"
expect "OK (y/anything)?"
send "y\\r"
expect "Enter cert/key usage"
send "s\\r"
expect "Select signature algorithm by letter:"
send "2\\r"
expect "OK (y/anything)?"
send "y\\r"
expect "Enter challenge string:"
send "shotiq\\r"
expect "Common Name"
send "${commonName.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}\\r"
expect "Country"
send "US\\r"
expect "Organization"
send "Kevin Houston\\r"
expect "Organization Unit"
send "DD9G8RP575\\r"
expect "State/Province"
send "\\r"
expect "Email Address"
send "khouston721@gmail.com\\r"
expect "Is this OK"
send "y\\r"
expect eof
`)
execFileSync('expect', [expectScript], { stdio: 'inherit' })
execFileSync('certtool', ['V', csr], { stdio: 'inherit' })

const csrContent = fs.readFileSync(csr, 'utf8')
let certificate
let lastError
for (const certificateType of [process.env.SHOTIQ_DEV_CERT_TYPE ?? 'IOS_DEVELOPMENT', 'DEVELOPMENT']) {
  try {
    certificate = await api('POST', '/v1/certificates', {
      data: {
        type: 'certificates',
        attributes: {
          certificateType,
          csrContent,
        },
      },
    })
    break
  } catch (error) {
    lastError = error
    if (certificateType === 'IOS_DEVELOPMENT') throw error
  }
}
if (!certificate) throw lastError

const attrs = certificate.data?.attributes ?? {}
if (!attrs.certificateContent) throw new Error('App Store Connect did not return certificateContent.')

fs.writeFileSync(certDer, Buffer.from(attrs.certificateContent, 'base64'))
execFileSync('certtool', ['i', certDer, `k=${keychain}`, 'd'], { stdio: 'inherit' })
execFileSync('security', [
  'set-key-partition-list',
  '-S',
  'apple-tool:,apple:,codesign:',
  '-k',
  keychainPassword,
  keychain,
], { stdio: 'ignore' })
execFileSync('security', ['find-identity', '-v', '-p', 'codesigning', keychain], { stdio: 'inherit' })

console.log(`Created ${attrs.name ?? 'Apple Development'} certificate ${certificate.data.id}.`)
