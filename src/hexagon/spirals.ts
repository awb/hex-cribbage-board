import { LANE_VERTEX_COUNT, SPIRAL_VERTEX_COUNT } from './constants'
import { polarMidpointCartesian } from './polar'
import type { PolarPoint } from './types'

export type SpiralFn = (
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
  extraEndVertices?: number,
) => PolarPoint[]

function expandWithMidpoints(vertices: PolarPoint[]): PolarPoint[] {
  const expanded: PolarPoint[] = []

  for (let i = 0; i < vertices.length - 1; i++) {
    expanded.push(vertices[i])
    expanded.push(polarMidpointCartesian(vertices[i], vertices[i + 1]))
  }
  expanded.push(vertices[vertices.length - 1])

  return expanded
}

/** 26 vertices of a 12-sided spiral: starter segment plus 24 scoring segments. */
export function dodecagonalSpiral(
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
  extraEndVertices = 0,
): PolarPoint[] {
  return Array.from({ length: LANE_VERTEX_COUNT + extraEndVertices }, (_, i) => ({
    r: start.r - (i - 1) * deltaRadius,
    theta: start.theta + (i - 1) * deltaTheta,
  }))
}

/**
 * 6-sided macro spiral expanded with edge midpoints. Omits the last point so the
 * path ends on a half-edge; keeps the first macro vertex as the starter-segment
 * start. Requires 14 macro vertices so that expand (27 points) minus the last
 * yields LANE_VERTEX_COUNT (26).
 */
export function hexagonalSpiralFromMidSides(
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
  extraEndVertices = 0,
): PolarPoint[] {
  const expanded = hexagonalSpiralExpanded(start, deltaRadius, deltaTheta)
  return extraEndVertices > 0 ? expanded : expanded.slice(0, -1)
}

export function hexagonalSpiralFromVertices(
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
  extraEndVertices = 0,
): PolarPoint[] {
  const expanded = hexagonalSpiralExpanded(start, deltaRadius, deltaTheta)
  const previousMacro: PolarPoint = {
    r: start.r + 2 * deltaRadius,
    theta: start.theta - 2 * deltaTheta,
  }
  const endOmit = 2 - extraEndVertices
  return [polarMidpointCartesian(previousMacro, start), ...expanded.slice(0, -endOmit)]
}

function hexagonalSpiralExpanded(
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
): PolarPoint[] {
  const macroDeltaTheta = 2 * deltaTheta
  const macroDeltaRadius = 2 * deltaRadius
  const macroVertexCount = (SPIRAL_VERTEX_COUNT + 3) / 2

  const macroVertices = Array.from({ length: macroVertexCount }, (_, i) => ({
    r: start.r - i * macroDeltaRadius,
    theta: start.theta + i * macroDeltaTheta,
  }))

  return expandWithMidpoints(macroVertices)
}