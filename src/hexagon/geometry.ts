export const RADIAL_LINE_COUNT = 72
export const INNER_CIRCUMRADIUS_CM = 4
export const OUTER_FLAT_TO_FLAT_CM = 20
export const CENTER_CROSS_HALF_LENGTH_CM = 0.3

export function flatToCircumradiusCm(flatToFlatCm: number): number {
  return flatToFlatCm / Math.sqrt(3)
}

export function circumradiusToFlatCm(circumradiusCm: number): number {
  return circumradiusCm * Math.sqrt(3)
}

export const INNER_FLAT_TO_FLAT_CM = circumradiusToFlatCm(INNER_CIRCUMRADIUS_CM)
export const INNER_FLAT_TO_FLAT_MM = INNER_FLAT_TO_FLAT_CM * 10
export const OUTER_FLAT_TO_FLAT_MM = OUTER_FLAT_TO_FLAT_CM * 10

/** Pointy-top hexagon: flat-to-flat distance equals sqrt(3) * circumradius. */
export const OUTER_CIRCUMRADIUS_CM = flatToCircumradiusCm(OUTER_FLAT_TO_FLAT_CM)
export const INNER_CIRCUMRADIUS_MM = INNER_CIRCUMRADIUS_CM * 10
export const OUTER_CIRCUMRADIUS_MM = OUTER_CIRCUMRADIUS_CM * 10

export const HEXAGON_RING_CIRCUMRADIUS_CM = [INNER_CIRCUMRADIUS_CM, OUTER_CIRCUMRADIUS_CM]
export const HEXAGON_RING_CIRCUMRADIUS_MM = [INNER_CIRCUMRADIUS_MM, OUTER_CIRCUMRADIUS_MM]

export const DIAGRAM_WIDTH_CM = OUTER_FLAT_TO_FLAT_CM
export const DIAGRAM_HEIGHT_CM = 2 * OUTER_CIRCUMRADIUS_CM

export const LINE_COLOR = '#18181b'
export const VERTEX_LINE_COLOR = '#a1a1aa'
export const DARK_RADIAL_LINE_COLOR = '#d4d4d8'
export const DARK_RADIAL_LINE_COLOR_RGB: [number, number, number] = [212, 212, 216]
export const VERTEX_LINE_COLOR_RGB: [number, number, number] = [161, 161, 170]

/** Polar radius of the outermost hexagon vertex; polar tracks use r = 100 there. */
export const POLAR_OUTER_RADIUS = 100

/** Rotation applied to the hex fabrication template behind the track. */
export const HEX_TEMPLATE_ROTATION = Math.PI / 6

export type Point = [number, number]

export function rotatePointAround(
  cx: number,
  cy: number,
  x: number,
  y: number,
  angle: number,
): Point {
  const dx = x - cx
  const dy = y - cy
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]
}

export function centerCrossSegments(
  cx: number,
  cy: number,
  halfLength: number,
): { horizontal: [Point, Point]; vertical: [Point, Point] } {
  return {
    horizontal: [
      rotatePointAround(cx, cy, cx - halfLength, cy, HEX_TEMPLATE_ROTATION),
      rotatePointAround(cx, cy, cx + halfLength, cy, HEX_TEMPLATE_ROTATION),
    ],
    vertical: [
      rotatePointAround(cx, cy, cx, cy - halfLength, HEX_TEMPLATE_ROTATION),
      rotatePointAround(cx, cy, cx, cy + halfLength, HEX_TEMPLATE_ROTATION),
    ],
  }
}

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
    const angle = -Math.PI / 2 + (i * Math.PI) / 3 + HEX_TEMPLATE_ROTATION
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
  })
}

/** Polar angles use 0 at the outer hexagon's first vertex (pointy-top). */
export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  theta: number,
  outerRadius: number,
): Point {
  const canvasAngle = theta - Math.PI / 2
  const distance = (r / POLAR_OUTER_RADIUS) * outerRadius
  return [
    cx + distance * Math.cos(canvasAngle),
    cy + distance * Math.sin(canvasAngle),
  ]
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
    const angle = (i * 2 * Math.PI) / count - Math.PI / 2 + HEX_TEMPLATE_ROTATION
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
