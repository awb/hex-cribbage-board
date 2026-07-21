import { cartesianToPolarMm, polarToCartesianMm } from './polar'
import type { PolarPoint, Segment } from './types'

const HOLES_PER_GROUP = 5

/**
 * Place holes in groups of five along the straight segment between start and end.
 * Exterior padding and inter-group gaps are both PADDING × hole spacing / 2 and
 * PADDING × hole spacing respectively (see README example: 1100 mm, n = 10, PADDING = 1.5).
 */
export function generateSegment(
  start: PolarPoint,
  end: PolarPoint,
  padding: number,
  n: number,
): Segment {
  const startCart = polarToCartesianMm(start)
  const endCart = polarToCartesianMm(end)
  const dx = endCart.x - startCart.x
  const dy = endCart.y - startCart.y
  const length = Math.hypot(dx, dy)

  if (length === 0 || n === 0) {
    return { start, end, holes: [] }
  }

  const numGroups = n / HOLES_PER_GROUP
  const holeSpacing = length / (numGroups * (4 + padding))
  const distances: number[] = []
  let distance = (padding * holeSpacing) / 2

  for (let group = 0; group < numGroups; group++) {
    for (let hole = 0; hole < HOLES_PER_GROUP; hole++) {
      distances.push(distance)
      if (hole < HOLES_PER_GROUP - 1) {
        distance += holeSpacing
      }
    }
    if (group < numGroups - 1) {
      distance += padding * holeSpacing
    }
  }

  const holes = distances.map((distanceAlong) => {
    const t = distanceAlong / length
    const x = startCart.x + t * dx
    const y = startCart.y + t * dy
    return cartesianToPolarMm(x, y)
  })

  return { start, end, holes }
}
