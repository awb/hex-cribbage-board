import { HOLES_PER_GROUP, PADDING, SPIRAL_VERTEX_COUNT, TRACK_LENGTH } from './constants'
import { generateSegment } from './generateSegment'
import type { SpiralFn } from './spirals'
import type { Lane, PolarPoint } from './types'

export function generateLane(
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
  spiral: SpiralFn,
): Pick<Lane, 'segments' | 'minimumHoleSpacingMm'> {
  const vertices = spiral(start, deltaRadius, deltaTheta)
  if (vertices.length !== SPIRAL_VERTEX_COUNT) {
    throw new Error(
      `Spiral produced ${vertices.length} vertices, expected ${SPIRAL_VERTEX_COUNT} for ${TRACK_LENGTH} holes`,
    )
  }
  const segments = []
  let minimumHoleSpacingMm = Infinity

  for (let i = 0; i < vertices.length - 1; i++) {
    const segment = generateSegment(vertices[i], vertices[i + 1], PADDING, HOLES_PER_GROUP)
    segments.push(segment)
    minimumHoleSpacingMm = Math.min(minimumHoleSpacingMm, segment.minimumHoleSpacingMm)
  }

  return { segments, minimumHoleSpacingMm }
}
