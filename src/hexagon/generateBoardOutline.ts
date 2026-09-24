import { HEX_INRADIUS_PER_SIDE, TRACK_SPACING_MM } from './constants'
import type { BoardOutline, PolarPoint, Track } from './types'

/** Thetas of outer hex vertices that get section lines through the center. */
export const SECTION_LINE_THETAS = Array.from({ length: 3 }, (_, i) => ((2 * i) * Math.PI) / 3 + Math.PI / 6)

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
  return innermostHoleRadiusMm(track) - 2 * TRACK_SPACING_MM
}

/** First hole of the first lane — the outermost hole used to size the outline. */
export function outermostHole(track: Pick<Track, 'lanes'>): PolarPoint {
  const hole = track.lanes[0]?.segments[0]?.holes[0]
  if (!hole) {
    throw new Error('Track has no first-lane first hole to size the outline')
  }
  return hole
}

/**
 * Circumradius of a regular hexagon whose inscribed circle reaches the outermost
 * hole. Inradius = (√3/2) × side, and side equals circumradius.
 */
export function outlineCircumradiusMm(track: Pick<Track, 'lanes'>): number {
  return outermostHole(track).r / HEX_INRADIUS_PER_SIDE
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

/** Pointy-top hexagon with a vertex at the top (theta = 0) after drawing rotation. */
export function generateBoardOutline(track: Track): BoardOutline {
  const circumradiusMm = outlineCircumradiusMm(track)
  const innerRadius = innerBoardRadiusMm(track)

  return {
    circumradiusMm,
    vertices: Array.from({ length: 6 }, (_, i) => ({
      r: circumradiusMm,
      theta: (i * Math.PI) / 3 + Math.PI / 6,
    })),
    innerBoardRadius: innerRadius,
    sectionLines: sectionLines(circumradiusMm, 0),
  }
}
