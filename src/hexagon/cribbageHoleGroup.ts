import type { jsPDF } from 'jspdf'
import {
  OUTER_CIRCUMRADIUS_MM,
  POLAR_OUTER_RADIUS,
  RADIAL_LINE_COUNT,
  type Point,
  polarToCartesian,
} from './geometry'

export const YELLOW_HOLE_DIAMETER_MM = 5
export const GREEN_HOLE_DIAMETER_IN = 0.125
export const GREEN_HOLE_DIAMETER_MM = GREEN_HOLE_DIAMETER_IN * 25.4
export const TRACK_POINT_COUNT = 13
export const TRACK_START_INSET_MM = 10
export const TRACK_R_STEP_MM = 20 / 6
export const GREEN_RADIAL_OFFSET_MM = 5
export const TRACK_THETA_STEP = Math.PI / 3
export const GREEN_DOTS_PER_YELLOW = 30

export const HOLE_GROUP_STYLES = {
  yellow: {
    css: '#facc15',
    rgb: [250, 204, 21] as [number, number, number],
    connectPoints: true,
    holeDiameterMm: YELLOW_HOLE_DIAMETER_MM,
  },
  green: {
    css: '#22c55e',
    rgb: [34, 197, 94] as [number, number, number],
    connectPoints: false,
    holeDiameterMm: GREEN_HOLE_DIAMETER_MM,
  },
} as const

export type HoleGroupColor = keyof typeof HOLE_GROUP_STYLES

export type PolarPoint = {
  r: number
  theta: number
}

export type CribbageHoleGroup = {
  id: string
  points: PolarPoint[]
  color: HoleGroupColor
}

function mmToPolarRadius(mm: number): number {
  return (mm / OUTER_CIRCUMRADIUS_MM) * POLAR_OUTER_RADIUS
}

function trackPolarRadiusStep(): number {
  return mmToPolarRadius(TRACK_R_STEP_MM)
}

function trackStartPolarRadius(): number {
  return mmToPolarRadius(OUTER_CIRCUMRADIUS_MM - TRACK_START_INSET_MM)
}

function generateSpiralTrackPoints(): PolarPoint[] {
  const rStepPolar = trackPolarRadiusStep()
  const startR = trackStartPolarRadius()

  return Array.from({ length: TRACK_POINT_COUNT }, (_, i) => ({
    r: startR - i * rStepPolar,
    theta: i * TRACK_THETA_STEP,
  }))
}

export function createSpiralTrackGroup(): CribbageHoleGroup {
  return {
    id: 'spiral-track',
    color: 'yellow',
    points: generateSpiralTrackPoints(),
  }
}

function darkRadialCanvasAngles(count: number): number[] {
  const linesPerSector = count / 6

  return Array.from({ length: count }, (_, i) => {
    if (i % linesPerSector === 0 || i % linesPerSector === linesPerSector / 2) {
      return null
    }
    return (i * 2 * Math.PI) / count - Math.PI / 2
  }).filter((angle): angle is number => angle !== null)
}

function cartesianToPolar(
  cx: number,
  cy: number,
  x: number,
  y: number,
  outerRadius: number,
): PolarPoint {
  const dx = x - cx
  const dy = y - cy
  const distance = Math.hypot(dx, dy)
  return {
    r: (distance / outerRadius) * POLAR_OUTER_RADIUS,
    theta: Math.atan2(dy, dx) + Math.PI / 2,
  }
}

function intersectSegmentWithRadial(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  angle: number,
  minRadius: number,
  maxRadius: number,
): Point | null {
  const dx = bx - ax
  const dy = by - ay
  const dirX = Math.cos(angle)
  const dirY = Math.sin(angle)
  const denom = dx * dirY - dy * dirX
  if (Math.abs(denom) < 1e-10) return null

  const t = ((cx - ax) * dirY - (cy - ay) * dirX) / denom
  if (t < 0 || t > 1) return null

  const px = ax + t * dx
  const py = ay + t * dy
  const dist = Math.hypot(px - cx, py - cy)
  if (dist < minRadius - 1e-6 || dist > maxRadius + 1e-6) return null

  return [px, py]
}

function greenDotsAtCrossing(crossing: PolarPoint): PolarPoint[] {
  const rStep = mmToPolarRadius(GREEN_RADIAL_OFFSET_MM)
  return [
    crossing,
    { r: crossing.r - rStep, theta: crossing.theta },
    { r: crossing.r - 2 * rStep, theta: crossing.theta },
  ]
}

function createGreenHoleGroupsForTrack(
  track: CribbageHoleGroup,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
): CribbageHoleGroup[] {
  const trackPositions = resolveHoleGroupPositions(cx, cy, outerRadius, track)
  const darkAngles = darkRadialCanvasAngles(RADIAL_LINE_COUNT)
  const groups: CribbageHoleGroup[] = []

  for (let i = 0; i < track.points.length - 1; i++) {
    const [ax, ay] = trackPositions[i]
    const [bx, by] = trackPositions[i + 1]
    const greenPoints: PolarPoint[] = []

    for (const angle of darkAngles) {
      const hit = intersectSegmentWithRadial(
        ax,
        ay,
        bx,
        by,
        cx,
        cy,
        angle,
        innerRadius,
        outerRadius,
      )
      if (!hit) continue

      const crossing = cartesianToPolar(cx, cy, hit[0], hit[1], outerRadius)
      greenPoints.push(...greenDotsAtCrossing(crossing))
    }

    groups.push({
      id: `green-${track.id}-${i}`,
      color: 'green',
      points: greenPoints,
    })
  }

  return groups
}

export function getAllHoleGroups(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
): CribbageHoleGroup[] {
  const track = createSpiralTrackGroup()
  return createGreenHoleGroupsForTrack(track, cx, cy, innerRadius, outerRadius)
}

export function resolveHoleGroupPositions(
  cx: number,
  cy: number,
  outerRadius: number,
  group: CribbageHoleGroup,
): Point[] {
  return group.points.map(({ r, theta }) =>
    polarToCartesian(cx, cy, r, theta, outerRadius),
  )
}

function strokeHoleConnections(
  ctx: CanvasRenderingContext2D,
  points: Point[],
) {
  if (points.length < 2) return

  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1])
  }
  ctx.stroke()
}

function fillHoles(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  holeRadius: number,
) {
  for (const [x, y] of points) {
    ctx.beginPath()
    ctx.arc(x, y, holeRadius, 0, 2 * Math.PI)
    ctx.fill()
  }
}

export function drawHoleGroupsCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  unitsPerCm: number,
  lineWidth: number,
  groups: CribbageHoleGroup[] = getAllHoleGroups(cx, cy, innerRadius, outerRadius),
) {
  for (const group of groups) {
    const style = HOLE_GROUP_STYLES[group.color]
    const points = resolveHoleGroupPositions(cx, cy, outerRadius, group)
    const holeRadius = (style.holeDiameterMm / 10 / 2) * unitsPerCm

    ctx.strokeStyle = style.css
    ctx.fillStyle = style.css
    ctx.lineWidth = lineWidth

    if (style.connectPoints) {
      strokeHoleConnections(ctx, points)
    }
    fillHoles(ctx, points, holeRadius)
  }
}

export function drawHoleGroupsPdf(
  pdf: jsPDF,
  cx: number,
  cy: number,
  innerRadiusMm: number,
  outerRadiusMm: number,
  groups: CribbageHoleGroup[] = getAllHoleGroups(cx, cy, innerRadiusMm, outerRadiusMm),
) {
  for (const group of groups) {
    const style = HOLE_GROUP_STYLES[group.color]
    const points = resolveHoleGroupPositions(cx, cy, outerRadiusMm, group)
    const holeRadiusMm = style.holeDiameterMm / 2

    pdf.setDrawColor(...style.rgb)
    pdf.setFillColor(...style.rgb)
    pdf.setLineWidth(0.2)

    if (style.connectPoints) {
      for (let i = 1; i < points.length; i++) {
        const [x1, y1] = points[i - 1]
        const [x2, y2] = points[i]
        pdf.line(x1, y1, x2, y2)
      }
    }

    for (const [x, y] of points) {
      pdf.circle(x, y, holeRadiusMm, 'F')
    }
  }
}
