import {
  HOLES_PER_GROUP,
  LANE_LINE_COLOR,
  LANE_LINE_PADDING_MM,
  LANE_LINE_STROKE_MM,
  LANE_SPACING_MM,
  LOGO_SIDE_MM,
  LOGO_STROKE_COLOR,
  LOGO_STROKE_MM,
  LOGO_TRISECT_THETAS,
  READY_BOX_FILL_COLOR,
  READY_BOX_PADDING_MM,
  READY_BOX_STROKE_COLOR,
  WINNER_CIRCLE_STROKE_COLOR,
  WINNER_CIRCLE_STROKE_MM,
} from './constants'
import { polarToCanvas } from './polar'
import type { CribbageBoard, PolarPoint } from './types'

type CanvasPoint = [number, number]

function hexRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

function unwrapThetas(thetas: number[]): number[] {
  if (thetas.length === 0) return []
  const unwrapped = [thetas[0]]
  for (let i = 1; i < thetas.length; i++) {
    let theta = thetas[i]
    const previous = unwrapped[i - 1]
    while (theta - previous > Math.PI) theta -= 2 * Math.PI
    while (previous - theta > Math.PI) theta += 2 * Math.PI
    unwrapped.push(theta)
  }
  return unwrapped
}

/** Last two holes of each segment, grouped by segment index across lanes. */
function readyHoleGroups(board: CribbageBoard): PolarPoint[][] {
  const segmentCount = Math.max(0, ...board.track.lanes.map((lane) => lane.segments.length))
  const groups: PolarPoint[][] = []

  for (let index = 0; index < segmentCount; index++) {
    const holes = board.track.lanes.flatMap((lane) => lane.segments[index]?.holes.slice(-2) ?? [])
    if (holes.length >= 3) groups.push(holes)
  }

  return groups
}

function readyTrapezoidCorners(holes: PolarPoint[]): PolarPoint[] | undefined {
  if (holes.length < 3) return undefined

  const radii = holes.map((hole) => hole.r)
  const thetas = unwrapThetas(holes.map((hole) => hole.theta))
  const meanR = radii.reduce((sum, radius) => sum + radius, 0) / radii.length
  const angularPadding = READY_BOX_PADDING_MM / Math.max(meanR, 1)
  const rMin = Math.min(...radii) - READY_BOX_PADDING_MM
  const rMax = Math.max(...radii) + READY_BOX_PADDING_MM
  const tMin = Math.min(...thetas) - angularPadding
  const tMax = Math.max(...thetas) + angularPadding
  if (rMin <= 0 || tMax <= tMin) return undefined

  return [
    { r: rMax, theta: tMin },
    { r: rMax, theta: tMax },
    { r: rMin, theta: tMax },
    { r: rMin, theta: tMin },
  ]
}

function readyTrapezoids(board: CribbageBoard): PolarPoint[][] {
  return readyHoleGroups(board)
    .map(readyTrapezoidCorners)
    .filter((corners): corners is PolarPoint[] => corners !== undefined)
}

function winnerHole(board: CribbageBoard): PolarPoint | undefined {
  const holes = board.track.lanes[0]?.segments.flatMap((segment) => segment.holes) ?? []
  return holes[1]
}

function scoringGroups(board: CribbageBoard): PolarPoint[][] {
  return board.track.lanes.flatMap((lane) =>
    lane.segments.filter((segment) => segment.holes.length === HOLES_PER_GROUP).map((segment) => segment.holes),
  )
}

function extendSegment(start: CanvasPoint, end: CanvasPoint, padding: number): [CanvasPoint, CanvasPoint] {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const length = Math.hypot(dx, dy)
  if (length === 0) return [start, end]
  const ux = dx / length
  const uy = dy / length
  return [
    [start[0] - ux * padding, start[1] - uy * padding],
    [end[0] + ux * padding, end[1] + uy * padding],
  ]
}

function logoVertices(): PolarPoint[] {
  return Array.from({ length: 6 }, (_, i) => ({
    r: LOGO_SIDE_MM,
    theta: (i * Math.PI) / 3,
  }))
}

function logoTrisectPairs(): [PolarPoint, PolarPoint][] {
  return LOGO_TRISECT_THETAS.map((theta) => [
    { r: LOGO_SIDE_MM, theta },
    { r: LOGO_SIDE_MM, theta: theta + Math.PI },
  ])
}

function strokeReadyTrapezoids(
  drawPolygon: (points: CanvasPoint[]) => void,
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
) {
  for (const corners of readyTrapezoids(board)) {
    drawPolygon(corners.map((corner) => polarToCanvas(cx, cy, corner, unitsPerMm)))
  }
}

export function drawReadyBoxCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
) {
  ctx.fillStyle = READY_BOX_FILL_COLOR
  ctx.strokeStyle = READY_BOX_STROKE_COLOR
  ctx.lineWidth = 0.7 * unitsPerMm
  strokeReadyTrapezoids(
    (points) => {
      if (points.length < 3) return
      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1])
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    },
    cx,
    cy,
    board,
    unitsPerMm,
  )
}

export function drawWinnerCircleCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
) {
  const hole = winnerHole(board)
  if (!hole) return

  const [x, y] = polarToCanvas(cx, cy, hole, unitsPerMm)
  ctx.beginPath()
  ctx.arc(x, y, LANE_SPACING_MM * unitsPerMm, 0, 2 * Math.PI)
  ctx.strokeStyle = WINNER_CIRCLE_STROKE_COLOR
  ctx.lineWidth = WINNER_CIRCLE_STROKE_MM * unitsPerMm
  ctx.stroke()
}

export function drawLaneLinesCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
) {
  const padding = LANE_LINE_PADDING_MM * unitsPerMm
  ctx.strokeStyle = LANE_LINE_COLOR
  ctx.lineWidth = LANE_LINE_STROKE_MM * unitsPerMm
  ctx.lineCap = 'round'

  ctx.beginPath()
  for (const holes of scoringGroups(board)) {
    const start = polarToCanvas(cx, cy, holes[0], unitsPerMm)
    const end = polarToCanvas(cx, cy, holes[holes.length - 1], unitsPerMm)
    const [from, to] = extendSegment(start, end, padding)
    ctx.moveTo(from[0], from[1])
    ctx.lineTo(to[0], to[1])
  }
  ctx.stroke()
}

export function drawLogoCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  unitsPerMm: number,
) {
  const points = logoVertices().map((vertex) => polarToCanvas(cx, cy, vertex, unitsPerMm))
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1])
  }
  ctx.closePath()
  ctx.strokeStyle = LOGO_STROKE_COLOR
  ctx.lineWidth = LOGO_STROKE_MM * unitsPerMm
  ctx.stroke()

  ctx.beginPath()
  for (const [start, end] of logoTrisectPairs()) {
    const a = polarToCanvas(cx, cy, start, unitsPerMm)
    const b = polarToCanvas(cx, cy, end, unitsPerMm)
    ctx.moveTo(a[0], a[1])
    ctx.lineTo(b[0], b[1])
  }
  ctx.stroke()
}

export function drawArtworkCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
) {
  drawLogoCanvas(ctx, cx, cy, unitsPerMm)
  drawLaneLinesCanvas(ctx, cx, cy, board, unitsPerMm)
  drawReadyBoxCanvas(ctx, cx, cy, board, unitsPerMm)
  drawWinnerCircleCanvas(ctx, cx, cy, board, unitsPerMm)
}

export function readyBoxSvgElement(
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
): string {
  return readyTrapezoids(board)
    .map((corners) => {
      const points = corners
        .map((corner) => polarToCanvas(cx, cy, corner, unitsPerMm))
        .map(([x, y]) => `${x},${y}`)
        .join(' ')
      return `<polygon points="${points}" fill="${READY_BOX_FILL_COLOR}" stroke="${READY_BOX_STROKE_COLOR}" stroke-width="${0.7 * unitsPerMm}"/>`
    })
    .join('\n')
}

export function winnerCircleSvgElement(
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
): string {
  const hole = winnerHole(board)
  if (!hole) return ''
  const [x, y] = polarToCanvas(cx, cy, hole, unitsPerMm)
  return `<circle cx="${x}" cy="${y}" r="${LANE_SPACING_MM * unitsPerMm}" fill="none" stroke="${WINNER_CIRCLE_STROKE_COLOR}" stroke-width="${WINNER_CIRCLE_STROKE_MM * unitsPerMm}"/>`
}

export function laneLineSvgElements(
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
): string {
  const padding = LANE_LINE_PADDING_MM * unitsPerMm
  return scoringGroups(board)
    .map((holes) => {
      const start = polarToCanvas(cx, cy, holes[0], unitsPerMm)
      const end = polarToCanvas(cx, cy, holes[holes.length - 1], unitsPerMm)
      const [from, to] = extendSegment(start, end, padding)
      return `<line x1="${from[0]}" y1="${from[1]}" x2="${to[0]}" y2="${to[1]}" stroke="${LANE_LINE_COLOR}" stroke-width="${LANE_LINE_STROKE_MM * unitsPerMm}" stroke-linecap="round"/>`
    })
    .join('\n')
}

export function logoSvgElements(cx: number, cy: number, unitsPerMm: number): string {
  const points = logoVertices()
    .map((vertex) => polarToCanvas(cx, cy, vertex, unitsPerMm))
    .map(([x, y]) => `${x},${y}`)
    .join(' ')
  const lines = logoTrisectPairs()
    .map(([start, end]) => {
      const a = polarToCanvas(cx, cy, start, unitsPerMm)
      const b = polarToCanvas(cx, cy, end, unitsPerMm)
      return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${LOGO_STROKE_COLOR}" stroke-width="${LOGO_STROKE_MM * unitsPerMm}"/>`
    })
    .join('\n')
  return `<polygon points="${points}" fill="none" stroke="${LOGO_STROKE_COLOR}" stroke-width="${LOGO_STROKE_MM * unitsPerMm}"/>\n${lines}`
}

export function artworkSvgElements(
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
): string {
  return [
    logoSvgElements(cx, cy, unitsPerMm),
    laneLineSvgElements(cx, cy, board, unitsPerMm),
    readyBoxSvgElement(cx, cy, board, unitsPerMm),
    winnerCircleSvgElement(cx, cy, board, unitsPerMm),
  ]
    .filter(Boolean)
    .join('\n')
}

export function drawReadyBoxPdf(
  pdf: import('jspdf').jsPDF,
  cx: number,
  cy: number,
  board: CribbageBoard,
) {
  pdf.setFillColor(219, 234, 254)
  pdf.setDrawColor(...hexRgb(READY_BOX_STROKE_COLOR))
  pdf.setLineWidth(0.35)
  for (const corners of readyTrapezoids(board)) {
    const points = corners.map((corner) => polarToCanvas(cx, cy, corner, 1))
    if (points.length < 3) continue
    pdf.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
      pdf.lineTo(points[i][0], points[i][1])
    }
    pdf.lineTo(points[0][0], points[0][1])
    pdf.fillStroke()
  }
}

export function drawWinnerCirclePdf(
  pdf: import('jspdf').jsPDF,
  cx: number,
  cy: number,
  board: CribbageBoard,
) {
  const hole = winnerHole(board)
  if (!hole) return
  const [x, y] = polarToCanvas(cx, cy, hole, 1)
  pdf.setDrawColor(...hexRgb(WINNER_CIRCLE_STROKE_COLOR))
  pdf.setLineWidth(WINNER_CIRCLE_STROKE_MM)
  pdf.circle(x, y, LANE_SPACING_MM, 'S')
}

export function drawLaneLinesPdf(
  pdf: import('jspdf').jsPDF,
  cx: number,
  cy: number,
  board: CribbageBoard,
) {
  pdf.setDrawColor(...hexRgb(LANE_LINE_COLOR))
  pdf.setLineWidth(LANE_LINE_STROKE_MM)
  for (const holes of scoringGroups(board)) {
    const start = polarToCanvas(cx, cy, holes[0], 1)
    const end = polarToCanvas(cx, cy, holes[holes.length - 1], 1)
    const [from, to] = extendSegment(start, end, LANE_LINE_PADDING_MM)
    pdf.line(from[0], from[1], to[0], to[1])
  }
}

export function drawLogoPdf(pdf: import('jspdf').jsPDF, cx: number, cy: number) {
  const points = logoVertices().map((vertex) => polarToCanvas(cx, cy, vertex, 1))
  pdf.setDrawColor(...hexRgb(LOGO_STROKE_COLOR))
  pdf.setLineWidth(LOGO_STROKE_MM)
  pdf.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) {
    pdf.lineTo(points[i][0], points[i][1])
  }
  pdf.lineTo(points[0][0], points[0][1])
  pdf.stroke()

  for (const [start, end] of logoTrisectPairs()) {
    const a = polarToCanvas(cx, cy, start, 1)
    const b = polarToCanvas(cx, cy, end, 1)
    pdf.line(a[0], a[1], b[0], b[1])
  }
}

export function drawArtworkPdf(
  pdf: import('jspdf').jsPDF,
  cx: number,
  cy: number,
  board: CribbageBoard,
) {
  drawLogoPdf(pdf, cx, cy)
  drawLaneLinesPdf(pdf, cx, cy, board)
  drawReadyBoxPdf(pdf, cx, cy, board)
  drawWinnerCirclePdf(pdf, cx, cy, board)
}
