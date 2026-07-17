export type DeviceModel = 'iPhone 11' | 'iPhone 12'
export type CaptureMode = 'safari' | 'native'
export type DeviceOrientation = 'portrait' | 'landscape'
export type DeviceCamera = 'front' | 'rear'

export interface DeviceCombination {
  device: DeviceModel
  mode: CaptureMode
  orientation: DeviceOrientation
  camera: DeviceCamera
}

export interface DeviceRun extends DeviceCombination {
  id: string
  commitSha: string
  metrics: {
    fps: number
    poseCompleteness: number
    shotPrecision: number
    shotRecall: number
    makeMissAccuracy: number
    phaseError: number
  }
  evidence: {
    fixtureId: string
    notes: string
  }
}

export interface DeviceMatrix {
  schemaVersion: 1
  app: 'ShotIQ'
  commitSha: string
  measuredAt: string
  runs: DeviceRun[]
}

export const REQUIRED_DEVICE_COMBINATIONS: DeviceCombination[] = (() => {
  const combinations: DeviceCombination[] = []
  for (const device of ['iPhone 11', 'iPhone 12'] as const) {
    for (const mode of ['safari', 'native'] as const) {
      for (const orientation of ['portrait', 'landscape'] as const) {
        for (const camera of ['front', 'rear'] as const) {
          combinations.push({ device, mode, orientation, camera })
        }
      }
    }
  }
  return combinations
})()

const commitPattern = /^[0-9a-f]{40}$/
const combinationKey = (value: DeviceCombination) =>
  `${value.device}|${value.mode}|${value.orientation}|${value.camera}`

export function validateDeviceMatrix(value: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { valid: false, errors: ['Device matrix must be an object'] }
  }
  const matrix = value as Partial<DeviceMatrix>
  if (matrix.schemaVersion !== 1 || matrix.app !== 'ShotIQ') errors.push('Device matrix schema/app identity is invalid')
  if (!commitPattern.test(matrix.commitSha ?? '')) errors.push('Matrix commit identity must be a full 40-character SHA')
  if (!matrix.measuredAt || Number.isNaN(new Date(matrix.measuredAt).getTime())) errors.push('Measured timestamp is invalid')
  if (!Array.isArray(matrix.runs)) return { valid: false, errors: [...errors, 'Device runs are missing'] }

  const found = new Set<string>()
  const ids = new Set<string>()
  matrix.runs.forEach((run, index) => {
    if (!run || typeof run !== 'object') {
      errors.push(`Run ${index} is invalid`)
      return
    }
    const key = combinationKey(run)
    if (found.has(key)) errors.push(`Duplicate device combination: ${key}`)
    found.add(key)
    if (!run.id?.trim() || ids.has(run.id)) errors.push(`Run ${index} has a missing or duplicate id`)
    ids.add(run.id)
    if (!commitPattern.test(run.commitSha) || run.commitSha !== matrix.commitSha) {
      errors.push(`Run ${run.id || index} commit identity does not match the matrix`)
    }
    const metricValues = Object.entries(run.metrics ?? {})
    const expectedMetrics = ['fps', 'poseCompleteness', 'shotPrecision', 'shotRecall', 'makeMissAccuracy', 'phaseError']
    for (const metric of expectedMetrics) {
      const metricValue = (run.metrics as Record<string, unknown> | undefined)?.[metric]
      if (typeof metricValue !== 'number' || !Number.isFinite(metricValue)) {
        errors.push(`Run ${run.id || index} metric ${metric} is missing`)
      }
    }
    const thresholds: Array<[keyof DeviceRun['metrics'], number]> = [
      ['fps', 15],
      ['shotPrecision', 0.95],
      ['shotRecall', 0.95],
      ['makeMissAccuracy', 0.9],
    ]
    for (const [metric, threshold] of thresholds) {
      const metricValue = run.metrics?.[metric]
      if (typeof metricValue === 'number' && Number.isFinite(metricValue) && metricValue < threshold) {
        errors.push(`Run ${run.id || index} metric ${metric} is below the release threshold`)
      }
    }
    if (metricValues.length !== expectedMetrics.length) errors.push(`Run ${run.id || index} metric set is invalid`)
    if (!run.evidence?.fixtureId?.trim() || !run.evidence?.notes?.trim()) {
      errors.push(`Run ${run.id || index} evidence is missing`)
    }
  })

  for (const required of REQUIRED_DEVICE_COMBINATIONS) {
    const key = combinationKey(required)
    if (!found.has(key)) errors.push(`Missing required device combination: ${key}`)
  }
  return { valid: errors.length === 0, errors }
}
