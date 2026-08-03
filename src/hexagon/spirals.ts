import { SPIRAL_VERTEX_COUNT } from './constants'
import { polarMidpointCartesian } from './polar'
import type { PolarPoint } from './types'

export type SpiralFn = (
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
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

/** 25 vertices of a 12-sided spiral (24 segments × 5 holes). */
export function dodecagonalSpiral(
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
): PolarPoint[] {
  return Array.from({ length: SPIRAL_VERTEX_COUNT }, (_, i) => ({
    r: start.r - i * deltaRadius,
    theta: start.theta + i * deltaTheta,
  }))
}

/**
 * 6-sided macro spiral expanded with edge midpoints; first and last points omitted
 * so the path starts and ends on half-edges. Requires 14 macro vertices so that
 * expand (27 points) minus endpoints yields SPIRAL_VERTEX_COUNT (25).
 */
export function hexagonalSpiralFromMidSides(
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
): PolarPoint[] {
  return hexagonalSpiralExpanded(start, deltaRadius, deltaTheta).slice(1, -1)
}

export function hexagonalSpiralFromVertices(
  start: PolarPoint,
  deltaRadius: number,
  deltaTheta: number,
): PolarPoint[] {
  return hexagonalSpiralExpanded(start, deltaRadius, deltaTheta).slice(0, -2)
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