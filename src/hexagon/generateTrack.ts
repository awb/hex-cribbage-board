import { LANE_BACKGROUND_COLORS, LANE_COUNT, LANE_SPACING } from './constants'
import { generateLane } from './generateLane'
import type { LayoutConfig } from './layouts'
import type { PolarPoint, Track } from './types'

export function generateTrack(
  startingPoint: PolarPoint,
  _numberOfHoles: number,
  deltaRadius: number,
  layout: LayoutConfig,
): Track {
  const deltaTheta = (2 * Math.PI) / layout.segmentsPerRound
  const vertexDeltaRadius = deltaRadius / layout.segmentsPerRound

  const lanes = Array.from({ length: LANE_COUNT }, (_, laneIndex) => ({
    ...generateLane(
      {
        r: startingPoint.r - laneIndex * LANE_SPACING,
        theta: startingPoint.theta + layout.pathStartOffsetInRadians,
      },
      vertexDeltaRadius,
      deltaTheta,
      layout.spiral,
    ),
    bgColor: LANE_BACKGROUND_COLORS[laneIndex],
  }))

  return { lanes }
}
