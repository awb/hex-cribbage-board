import {
  HOLES_PER_SEGMENT,
  LANE_BACKGROUND_COLORS,
  LANE_COUNT,
  LANE_SPACING,
  SEGMENTS_PER_ROUND,
} from './constants'
import { generateLane } from './generateLane'
import type { PolarPoint, Track } from './types'

export function generateTrack(
  startingPoint: PolarPoint,
  numberOfHoles: number,
  deltaRadius: number,
): Track {
  const deltaTheta = (2 * Math.PI) / SEGMENTS_PER_ROUND
  const vertexDeltaRadius = deltaRadius / SEGMENTS_PER_ROUND
  const vertexCount = numberOfHoles / HOLES_PER_SEGMENT + 1

  const lanes = Array.from({ length: LANE_COUNT }, (_, laneIndex) => ({
    ...generateLane(
      {
        r: startingPoint.r - laneIndex * LANE_SPACING,
        theta: startingPoint.theta,
      },
      vertexDeltaRadius,
      deltaTheta,
      vertexCount,
    ),
    bgColor: LANE_BACKGROUND_COLORS[laneIndex],
  }))

  return { lanes }
}
