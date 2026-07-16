import { execFileSync } from 'node:child_process'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

describe('Capacitor build script', () => {
  it('is valid JavaScript before it modifies build files', () => {
    const script = path.resolve(process.cwd(), 'scripts/build-capacitor.js')

    expect(() => {
      execFileSync(process.execPath, ['--check', script], { stdio: 'pipe' })
    }).not.toThrow()
  })
})
