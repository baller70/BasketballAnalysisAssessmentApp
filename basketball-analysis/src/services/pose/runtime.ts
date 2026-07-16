import type { Platform } from '@/utils/platform'

import type { PoseProviderId } from './index'

/** Pick the native engine only inside Capacitor; iPhone Safari stays on web MoveNet. */
export function selectRuntimePoseProviderId(platform: Platform): PoseProviderId {
  return platform === 'ios' ? 'native-ios' : 'movenet'
}
