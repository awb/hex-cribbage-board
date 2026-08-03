import type { CartesianPoint, PolarPoint } from './types'
import { BOARD_DRAWING_ROTATION_RAD } from './geometry'

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

export function polarMidpointCartesian(a: PolarPoint, b: PolarPoint): PolarPoint {
  const ac = polarToCartesianMm(a)
  const bc = polarToCartesianMm(b)
  return cartesianToPolarMm((ac.x + bc.x) / 2, (ac.y + bc.y) / 2)
}

export function polarToCanvas(
  cx: number,
  cy: number,
  point: PolarPoint,
  unitsPerMm: number,
): [number, number] {
  const { x, y } = polarToCartesianMm(point)
  let px = cx + x * unitsPerMm
  let py = cy + y * unitsPerMm

  if (BOARD_DRAWING_ROTATION_RAD !== 0) {
    const dx = px - cx
    const dy = py - cy
    const cos = Math.cos(BOARD_DRAWING_ROTATION_RAD)
    const sin = Math.sin(BOARD_DRAWING_ROTATION_RAD)
    px = cx + dx * cos - dy * sin
    py = cy + dx * sin + dy * cos
  }

  return [px, py]
}
