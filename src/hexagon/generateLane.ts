import { PADDING } from './constants'
import { generateSegment } from './generateSegment'
import type { Lane, PolarPoint } from './types'

export function generateLane(
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
  n: number,
  holesPerSegment: number,
): Pick<Lane, 'segments'> {
  const segments = []
  let current = start

  for (let i = 0; i < n - 1; i++) {
    const end: PolarPoint = {
      r: current.r - deltaRadius,
      theta: current.theta + deltaTheta,
    }
    segments.push(generateSegment(current, end, PADDING, holesPerSegment))
    current = end
  }

  return { segments }
}
