import type { CartesianPoint, PolarPoint } from './types'

/** Convert polar mm coordinates to Cartesian mm (theta = 0 at the top vertex). */
export function polarToCartesianMm(point: PolarPoint): CartesianPoint {
  const angle = point.theta - Math.PI / 2
  return {
    x: point.r * Math.cos(angle),
    y: point.r * Math.sin(angle),
  }
}

export function cartesianToPolarMm(x: number, y: number): PolarPoint {
  return {
    r: Math.hypot(x, y),
    theta: Math.atan2(y, x) + Math.PI / 2,
  }
}

export function polarToCanvas(
  cx: number,
  cy: number,
  point: PolarPoint,
  unitsPerMm: number,
): [number, number] {
  const { x, y } = polarToCartesianMm(point)
  return [cx + x * unitsPerMm, cy + y * unitsPerMm]
}
