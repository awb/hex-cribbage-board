import { LANE_BACKGROUND_COLORS, LANE_COUNT, LANE_SPACING } from './constants'
import { generateLane } from './generateLane'
import type { LayoutConfig } from './layouts'
import type { PolarPoint, Track } from './types'

function trackHoleRadiusBounds(track: Pick<Track, 'lanes'>): {
  outermostTrackRadiusMm: number
  innermostTrackRadiusMm: number
} {
  let outermostTrackRadiusMm = 0
  let innermostTrackRadiusMm = Infinity

  for (const lane of track.lanes) {
    for (const segment of lane.segments) {
      outermostTrackRadiusMm = Math.max(outermostTrackRadiusMm, segment.start.r, segment.end.r)
      for (const hole of segment.holes) {
        outermostTrackRadiusMm = Math.max(outermostTrackRadiusMm, hole.r)
        innermostTrackRadiusMm = Math.min(innermostTrackRadiusMm, hole.r)
      }
    }
  }

  return { outermostTrackRadiusMm, innermostTrackRadiusMm }
}

export function generateTrack(
  startingPoint: PolarPoint,
  _numberOfHoles: number,
  deltaRadius: number,
  layout: LayoutConfig,
): Track {
  const deltaTheta = (2 * Math.PI) / layout.segmentsPerRound
  const vertexDeltaRadius = deltaRadius / layout.segmentsPerRound

  let minimumHoleSpacingMm = Infinity
  const lanes = Array.from({ length: LANE_COUNT }, (_, laneIndex) => {
    const lane = generateLane(
      {
        r: startingPoint.r - laneIndex * LANE_SPACING,
        theta: startingPoint.theta + layout.pathStartOffsetInRadians,
      },
      vertexDeltaRadius,
      deltaTheta,
      layout.spiral,
    )
    minimumHoleSpacingMm = Math.min(minimumHoleSpacingMm, lane.minimumHoleSpacingMm)

    return {
      ...lane,
      bgColor: LANE_BACKGROUND_COLORS[laneIndex],
    }
  })

  const { outermostTrackRadiusMm, innermostTrackRadiusMm } = trackHoleRadiusBounds({ lanes })

  return {
    lanes,
    minimumHoleSpacingMm,
    outermostTrackRadiusMm,
    innermostTrackRadiusMm,
  }
}
