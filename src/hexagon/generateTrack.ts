import { LANE_BACKGROUND_COLORS, LANE_COUNT, LANE_SPACING } from './constants'
import { generateLane } from './generateLane'
import type { LayoutConfig } from './layouts'
import type { PolarPoint, Track } from './types'

export function generateTrack(
  startingPoint: PolarPoint,
  numberOfHoles: number,
  deltaRadius: number,
  layout: LayoutConfig,
): Track {
  const deltaTheta = (2 * Math.PI) / layout.segmentsPerRound
  const vertexDeltaRadius = deltaRadius / layout.segmentsPerRound
  const vertexCount = numberOfHoles / layout.holesPerSegment + 1

  const lanes = Array.from({ length: LANE_COUNT }, (_, laneIndex) => ({
    ...generateLane(
      {
        r: startingPoint.r - laneIndex * LANE_SPACING,
        theta: startingPoint.theta,
      },
      vertexDeltaRadius,
      deltaTheta,
      vertexCount,
      layout.holesPerSegment,
    ),
    bgColor: LANE_BACKGROUND_COLORS[laneIndex],
  }))

  return { lanes }
}
