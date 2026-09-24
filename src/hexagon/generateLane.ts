import {
  FINISH_HOLE_INDICES,
  HOLES_PER_GROUP,
  LANE_VERTEX_COUNT,
  PADDING,
  STARTER_HOLE_INDICES,
  TRACK_LENGTH_HOLES,
} from './constants'
import { generateSegment } from './generateSegment'
import type { SpiralFn } from './spirals'
import type { Lane, PolarPoint, Segment } from './types'

function segmentWithHoles(
  start: PolarPoint,
  end: PolarPoint,
  holeIndices: readonly number[],
): Segment {
  const segment = generateSegment(start, end, PADDING, HOLES_PER_GROUP)
  return {
    ...segment,
    holes: holeIndices.map((index) => segment.holes[index]),
  }
}

export function generateLane(
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
  spiral: SpiralFn,
  includeFinishSegment = false,
): Pick<Lane, 'segments' | 'minimumHoleSpacingMm'> {
  const extraEndVertices = includeFinishSegment ? 1 : 0
  const vertices = spiral(start, deltaRadius, deltaTheta, extraEndVertices)
  const expectedCount = LANE_VERTEX_COUNT + extraEndVertices
  if (vertices.length !== expectedCount) {
    throw new Error(
      `Spiral produced ${vertices.length} vertices, expected ${expectedCount} for a starter segment plus ${TRACK_LENGTH_HOLES} holes`,
    )
  }
  const segments = [segmentWithHoles(vertices[0], vertices[1], STARTER_HOLE_INDICES)]
  let minimumHoleSpacingMm = segments[0].minimumHoleSpacingMm

  const lastScoringVertex = LANE_VERTEX_COUNT - 1
  for (let i = 1; i < lastScoringVertex; i++) {
    const segment = generateSegment(vertices[i], vertices[i + 1], PADDING, HOLES_PER_GROUP)
    segments.push(segment)
    minimumHoleSpacingMm = Math.min(minimumHoleSpacingMm, segment.minimumHoleSpacingMm)
  }

  if (includeFinishSegment) {
    const finish = segmentWithHoles(
      vertices[lastScoringVertex],
      vertices[lastScoringVertex + 1],
      FINISH_HOLE_INDICES,
    )
    segments.push(finish)
    minimumHoleSpacingMm = Math.min(minimumHoleSpacingMm, finish.minimumHoleSpacingMm)
  }

  return { segments, minimumHoleSpacingMm }
}
