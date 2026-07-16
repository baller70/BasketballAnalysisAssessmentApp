import { createRequire } from 'node:module'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const buildModePath = path.resolve(process.cwd(), 'scripts/capacitor-build-mode.js')

describe('Capacitor build mode', () => {
  it('uses the remote shell by default for ShotIQ’s server-backed native app', () => {
    const { getCapacitorBuildMode } = require(buildModePath)
    expect(getCapacitorBuildMode({})).toBe('remote-shell')
  })

  it('allows an explicit static export for a future offline bundle', () => {
    const { getCapacitorBuildMode } = require(buildModePath)
    expect(getCapacitorBuildMode({ CAPACITOR_STATIC_BUILD: 'true' })).toBe('static-export')
  })
})
