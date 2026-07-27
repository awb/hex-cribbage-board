import { OUTLINE_RADIUS_MM, TRACK_SPACING } from './constants'
import type { BoardOutline, PolarPoint, Track } from './types'

/** Thetas of outer hex vertices that get section lines to the inner board radius. */
export const SECTION_LINE_THETAS = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3] as const

export function innermostHoleRadiusMm(track: Pick<Track, 'lanes'>): number {
  let minR = Infinity

  for (const lane of track.lanes) {
    for (const segment of lane.segments) {
      for (const hole of segment.holes) {
        minR = Math.min(minR, hole.r)
      }
    }
  }

  return minR
}

/** Inner board radius: 2× track spacing inside the innermost hole. */
export function innerBoardRadiusMm(track: Pick<Track, 'lanes'>): number {
  return innermostHoleRadiusMm(track) - 2 * TRACK_SPACING
}

function sectionLines(
  outerRadius: number,
  innerRadius: number,
): { start: PolarPoint; end: PolarPoint }[] {
  return SECTION_LINE_THETAS.map((theta) => ({
    start: { r: outerRadius, theta },
    end: { r: innerRadius, theta },
  }))
}

/** Pointy-top hexagon with a vertex at the top (theta = 0). */
export function generateBoardOutline(track: Track): BoardOutline {
  const outerRadius = OUTLINE_RADIUS_MM
  const innerRadius = innerBoardRadiusMm(track)

  return {
    vertices: Array.from({ length: 6 }, (_, i) => ({
      r: outerRadius,
      theta: (i * Math.PI) / 3 + Math.PI / 6,
    })),
    innerBoardRadius: innerRadius,
    sectionLines: sectionLines(outerRadius, 0),
  }
}
