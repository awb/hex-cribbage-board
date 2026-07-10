export const RADIAL_LINE_COUNT = 72
export const RING_BASE_FLAT_CM = 10
export const RING_OUTER_FLAT_CM = 20
export const CENTER_CROSS_HALF_LENGTH_CM = 0.3

/**
 * Spacing x divides the 10cm span evenly with ring gaps of x, x, 1.5x, x, x.
 * Sizes follow 10, 10+x, 10+2x, 10+3.5x, 10+4.5x, 20 cm flat-to-flat.
 */
export const RING_SPACING_CM = (RING_OUTER_FLAT_CM - RING_BASE_FLAT_CM) / 5.5
const RING_X_COEFFICIENTS = [0, 1, 2, 3.5, 4.5, 5.5]

export const RING_FLAT_TO_FLAT_CM = RING_X_COEFFICIENTS.map(
  (coefficient) => RING_BASE_FLAT_CM + coefficient * RING_SPACING_CM,
)

export function flatToCircumradiusCm(flatToFlatCm: number): number {
  return flatToFlatCm / Math.sqrt(3)
}

export const RING_CIRCUMRADIUS_CM = RING_FLAT_TO_FLAT_CM.map(flatToCircumradiusCm)
export const RING_CIRCUMRADIUS_MM = RING_CIRCUMRADIUS_CM.map((radius) => radius * 10)

export const INNER_FLAT_TO_FLAT_CM = RING_FLAT_TO_FLAT_CM[0]
export const OUTER_FLAT_TO_FLAT_CM = RING_FLAT_TO_FLAT_CM[5]
export const INNER_FLAT_TO_FLAT_MM = INNER_FLAT_TO_FLAT_CM * 10
export const OUTER_FLAT_TO_FLAT_MM = OUTER_FLAT_TO_FLAT_CM * 10

/** Pointy-top hexagon: flat-to-flat distance equals sqrt(3) * circumradius. */
export const INNER_CIRCUMRADIUS_CM = RING_CIRCUMRADIUS_CM[0]
export const OUTER_CIRCUMRADIUS_CM = RING_CIRCUMRADIUS_CM[5]
export const INNER_CIRCUMRADIUS_MM = RING_CIRCUMRADIUS_MM[0]
export const OUTER_CIRCUMRADIUS_MM = RING_CIRCUMRADIUS_MM[5]

export const DIAGRAM_WIDTH_CM = OUTER_FLAT_TO_FLAT_CM
export const DIAGRAM_HEIGHT_CM = 2 * OUTER_CIRCUMRADIUS_CM

export const LINE_COLOR = '#18181b'
export const VERTEX_LINE_COLOR = '#a1a1aa'

export type Point = [number, number]

export type RadialSegment = {
  start: Point
  end: Point
  isGray: boolean
}

function isGrayRadialLine(index: number, count: number): boolean {
  const linesPerSector = count / 6
  return index % linesPerSector === 0 || index % linesPerSector === linesPerSector / 2
}

export function hexagonVertices(cx: number, cy: number, radius: number): Point[] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 3
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  })
}

function raySegmentIntersection(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number | null {
  const sx = x2 - x1
  const sy = y2 - y1
  const denom = dx * sy - dy * sx
  if (Math.abs(denom) < 1e-10) return null

  const t = ((x1 - ox) * sy - (y1 - oy) * sx) / denom
  const u = ((x1 - ox) * dy - (y1 - oy) * dx) / denom
  if (t > 1e-10 && u >= 0 && u <= 1) return t
  return null
}

/** Distance from center to hexagon boundary along a ray at the given angle. */
export function hexagonBoundaryDistance(angle: number, circumradius: number): number {
  const vertices = hexagonVertices(0, 0, circumradius)
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  let distance = Infinity

  for (let i = 0; i < 6; i++) {
    const [x1, y1] = vertices[i]
    const [x2, y2] = vertices[(i + 1) % 6]
    const t = raySegmentIntersection(0, 0, dx, dy, x1, y1, x2, y2)
    if (t !== null && t < distance) distance = t
  }

  return distance
}

export function radialSegments(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  count: number,
): RadialSegment[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i * 2 * Math.PI) / count - Math.PI / 2
    const innerDist = hexagonBoundaryDistance(angle, innerRadius)
    const outerDist = hexagonBoundaryDistance(angle, outerRadius)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    return {
      start: [cx + innerDist * cos, cy + innerDist * sin],
      end: [cx + outerDist * cos, cy + outerDist * sin],
      isGray: isGrayRadialLine(i, count),
    }
  })
}
