/**
 * Put the latest ShotIQ build in front of internal TestFlight testers.
 * Ported from the working hooptrack release lane.
 *
 *   node scripts/testflight-internal.mjs --build 1 --confirm
 *   node scripts/testflight-internal.mjs --build 1 --confirm --tester you@example.com
 *
 * Internal testing needs no beta review, so a build attached here is
 * installable on a device within minutes of processing finishing.
 *
 * Without --confirm this reports the current groups, their builds and their
 * testers, and changes nothing.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'

const APPS = [
  { key: 'shotiq', bundleId: 'com.baller70.shotiq', name: 'ShotIQ' },
]

const argv = process.argv.slice(2)
const flag = (name, fallback = undefined) => {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : fallback
}
const confirm = argv.includes('--confirm')
const buildNumber = flag('--build')
const testerEmail = flag('--tester')
const groupName = flag('--group', 'App Factory Internal')

function discoverCredentials() {
  const helper = path.join(path.dirname(new URL(import.meta.url).pathname), 'appfactory-credentials.sh')
  if (!fs.existsSync(helper)) return {}
  const out = path.join(os.tmpdir(), `asc-tf-${process.pid}`)
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
  const response = await fetch(endpoint.startsWith('http') ? endpoint : `${BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`HTTP ${response.status} on ${method} ${endpoint}: ${text.slice(0, 400)}`)
  return text ? JSON.parse(text) : {}
}

for (const app of APPS) {
  console.log(`\n== ${app.name}`)
  const apps = await api('GET', `/v1/apps?filter[bundleId]=${encodeURIComponent(app.bundleId)}&limit=1`)
  if (!apps.data?.length) {
    console.log('   no app record; skipping')
    continue
  }
  const appId = apps.data[0].id

  // Find the build to hand out.
  const query = buildNumber
    ? `/v1/builds?filter[app]=${appId}&filter[version]=${encodeURIComponent(buildNumber)}&limit=1`
    : `/v1/builds?filter[app]=${appId}&limit=1&sort=-uploadedDate`
  const builds = await api('GET', query)
  const build = builds.data?.[0]
  if (!build) {
    console.log(`   build ${buildNumber ?? '(latest)'} not found; skipping`)
    continue
  }
  const state = build.attributes?.processingState
  console.log(`   build ${build.attributes?.version} (${state})`)
  // A build that has expired disappears from TestFlight even though it is
  // still attached to the group and still valid for the App Store. That is the
  // difference between "gone from my phone" and "gone from Apple".
  console.log(
    `     expired: ${build.attributes?.expired}` +
      `, uploaded ${build.attributes?.uploadedDate}` +
      `, expires ${build.attributes?.expirationDate ?? 'n/a'}`,
  )
  const compliance = build.attributes?.usesNonExemptEncryption
  console.log(`     usesNonExemptEncryption: ${compliance}`)
  // Missing export compliance is the classic reason a build uploads fine and
  // then refuses to be installable from TestFlight: Apple rejects the attach
  // with "Build is not in an internally testable state" until the encryption
  // question is answered. ShotIQ only uses standard HTTPS, so the answer is no.
  if (compliance == null && confirm) {
    await api('PATCH', `/v1/builds/${build.id}`, {
      data: { type: 'builds', id: build.id, attributes: { usesNonExemptEncryption: false } },
    })
    console.log('     set usesNonExemptEncryption=false (standard HTTPS only)')
  }
  try {
    const detail = await api('GET', `/v1/builds/${build.id}/betaAppReviewSubmission`)
    console.log(`     betaAppReviewSubmission: ${detail.data?.attributes?.betaReviewState ?? 'none'}`)
  } catch {
    console.log('     betaAppReviewSubmission: none (internal testing needs none)')
  }
  // internalBuildState is what actually gates "installable": a VALID build with
  // compliance set can still sit in PROCESSING here for a few minutes, and a
  // tester invite during that window fails with NO_INSTALLABLE_BUILDS.
  try {
    const beta = await api('GET', `/v1/builds/${build.id}/buildBetaDetail`)
    console.log(
      `     internalBuildState: ${beta.data?.attributes?.internalBuildState}` +
        `, externalBuildState: ${beta.data?.attributes?.externalBuildState}`,
    )
  } catch (err) {
    console.log(`     buildBetaDetail unavailable: ${err.message.slice(0, 120)}`)
  }
  if (state !== 'VALID') {
    console.log('   not VALID yet; TestFlight cannot hand out a build still processing')
    continue
  }

  // Reuse an internal group if there is one; internal groups skip beta review.
  const groups = await api('GET', `/v1/apps/${appId}/betaGroups?limit=20`)
  let group = (groups.data ?? []).find(
    (g) => g.attributes?.isInternalGroup && g.attributes?.name === groupName,
  ) ?? (groups.data ?? []).find((g) => g.attributes?.isInternalGroup)

  if (!group) {
    if (!confirm) {
      console.log(`   WOULD CREATE internal group "${groupName}" (re-run with --confirm)`)
      continue
    }
    const created = await api('POST', '/v1/betaGroups', {
      data: {
        type: 'betaGroups',
        attributes: { name: groupName, isInternalGroup: true },
        relationships: { app: { data: { type: 'apps', id: appId } } },
      },
    })
    group = created.data
    console.log(`   created internal group ${group.id}`)
  }
  console.log(`   internal group "${group.attributes?.name}" (${group.id})`)

  const groupBuilds = await api('GET', `/v1/betaGroups/${group.id}/builds?limit=20`)
  const already = (groupBuilds.data ?? []).some((b) => b.id === build.id)
  if (already) {
    console.log('   build already in this group')
  } else if (!confirm) {
    console.log('   WOULD ATTACH the build to this group (re-run with --confirm)')
  } else {
    // The testable state can lag a few seconds behind the compliance PATCH,
    // so retry the attach instead of failing the whole run on the first 422.
    for (let attempt = 1; ; attempt++) {
      try {
        await api('POST', `/v1/betaGroups/${group.id}/relationships/builds`, {
          data: [{ type: 'builds', id: build.id }],
        })
        console.log('   build attached')
        break
      } catch (err) {
        if (attempt >= 6 || !String(err.message).includes('422')) throw err
        console.log(`   attach not accepted yet (attempt ${attempt}); retrying in 10s`)
        await new Promise((resolve) => setTimeout(resolve, 10_000))
      }
    }
  }

  const testers = await api('GET', `/v1/betaGroups/${group.id}/betaTesters?limit=50`)
  console.log(`   testers in group: ${testers.data?.length ?? 0}`)
  // state is the difference between "Apple sent it" and "he can install it":
  // INVITED means the invitation is out and unaccepted, ACCEPTED means the
  // Apple ID is linked, INSTALLED means it is on a device.
  for (const tester of testers.data ?? []) {
    const a = tester.attributes ?? {}
    console.log(
      `     - ${a.email ?? '(no email)'} — state ${a.state ?? 'unknown'}` +
        `, invite ${a.inviteType ?? 'unknown'}`,
    )
  }

  if (testerEmail) {
    let tester = (testers.data ?? []).find(
      (t) => t.attributes?.email?.toLowerCase() === testerEmail.toLowerCase(),
    )
    if (tester) {
      console.log(`   ${testerEmail} is already a tester`)
    } else if (!confirm) {
      console.log(`   WOULD INVITE ${testerEmail} (re-run with --confirm)`)
    } else {
      const created = await api('POST', '/v1/betaTesters', {
        data: {
          type: 'betaTesters',
          attributes: { email: testerEmail, firstName: 'Kevin', lastName: 'Houston' },
          relationships: { betaGroups: { data: [{ type: 'betaGroups', id: group.id }] } },
        },
      })
      tester = created.data
      console.log(`   added ${testerEmail} to the group`)
    }
    // Creating the betaTester record does NOT make Apple send the invitation —
    // the tester sits at state NOT_INVITED with no email and no app in
    // TestFlight until a betaTesterInvitations POST actually fires it.
    const testerState = tester?.attributes?.state
    if (confirm && tester && testerState !== 'ACCEPTED' && testerState !== 'INSTALLED') {
      try {
        await api('POST', '/v1/betaTesterInvitations', {
          data: {
            type: 'betaTesterInvitations',
            relationships: {
              betaTester: { data: { type: 'betaTesters', id: tester.id } },
              app: { data: { type: 'apps', id: appId } },
            },
          },
        })
        console.log(`   invitation email sent to ${testerEmail} — open it on the phone, then TestFlight`)
      } catch (err) {
        // Don't fail the whole run: the states printed above say why (usually
        // internalBuildState still PROCESSING). Re-run once it settles.
        console.log(`   invitation not sent yet: ${err.message.slice(0, 300)}`)
      }
    }
  }
}

console.log('\nInternal testers can install as soon as they accept; no beta review needed.')
