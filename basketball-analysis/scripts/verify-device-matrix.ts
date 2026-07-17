import { readFile } from 'fs/promises'
import { resolve } from 'path'

import { validateDeviceMatrix } from '../src/lib/vision/deviceMatrix'

async function main() {
  const matrixPath = resolve(process.cwd(), process.argv[2] || 'docs/validation/shotiq-device-matrix.json')
  const matrix = JSON.parse(await readFile(matrixPath, 'utf8'))
  const result = validateDeviceMatrix(matrix)
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  if (!result.valid) process.exitCode = 1
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
