import {
  FINISH_LANE_INDEX,
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
import { polarToCanvas, polarToCartesianMm } from './polar'
import type { CribbageBoard, PolarPoint, Segment } from './types'

type CanvasPoint = [number, number]

function hexRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

function unwrapAngle(theta: number, around: number): number {
  let unwrapped = theta
  while (unwrapped - around > Math.PI) unwrapped -= 2 * Math.PI
  while (around - unwrapped > Math.PI) unwrapped += 2 * Math.PI
  return unwrapped
}

function unwrapThetas(thetas: number[]): number[] {
  if (thetas.length === 0) return []
  const unwrapped = [thetas[0]]
  for (let i = 1; i < thetas.length; i++) {
    unwrapped.push(unwrapAngle(thetas[i], unwrapped[i - 1]))
  }
  return unwrapped
}

function cartesianDelta(from: PolarPoint, to: PolarPoint): { x: number; y: number } {
  const start = polarToCartesianMm(from)
  const end = polarToCartesianMm(to)
  return { x: end.x - start.x, y: end.y - start.y }
}

/** Outward polar normal of the outline side most parallel to the first segment. */
function hexFlatNormalForSegment(
  vertices: PolarPoint[],
  segment: Segment,
  holes: PolarPoint[],
): number {
  const segmentDelta = cartesianDelta(segment.start, segment.end)
  const segmentLength = Math.hypot(segmentDelta.x, segmentDelta.y)
  const probe = holes[0] ?? segment.start

  let bestPhi = vertices[0]?.theta ?? 0
  let bestAlign = -1
  let bestDepth = -Infinity
  for (let i = 0; i < vertices.length; i++) {
    const next = vertices[(i + 1) % vertices.length]
    const side = cartesianDelta(vertices[i], next)
    const sideLength = Math.hypot(side.x, side.y)
    if (segmentLength === 0 || sideLength === 0) continue
    const align = Math.abs(
      (segmentDelta.x * side.x + segmentDelta.y * side.y) / (segmentLength * sideLength),
    )
    const phi = (vertices[i].theta + unwrapAngle(next.theta, vertices[i].theta)) / 2
    const depth = probe.r * Math.cos(probe.theta - phi)
    if (align > bestAlign + 1e-6 || (Math.abs(align - bestAlign) <= 1e-6 && depth > bestDepth)) {
      bestAlign = align
      bestDepth = depth
      bestPhi = phi
    }
  }
  return bestPhi
}

/** The six READY holes on the first segment of each lane. */
function readyHoles(board: CribbageBoard): PolarPoint[] {
  return board.track.lanes.flatMap((lane) => lane.segments[0]?.holes ?? [])
}

/**
 * Trapezoid around the READY holes: inner/outer sides parallel to the hex
 * outline, the other two sides radial.
 */
function readyTrapezoidCorners(
  holes: PolarPoint[],
  vertices: PolarPoint[],
  segment: Segment,
): PolarPoint[] | undefined {
  if (holes.length < 3) return undefined

  const thetas = unwrapThetas(holes.map((hole) => hole.theta))
  const phi = hexFlatNormalForSegment(vertices, segment, holes)
  const depths = holes.map((hole) => hole.r * Math.cos(hole.theta - phi))
  const dMin = Math.min(...depths) - READY_BOX_PADDING_MM
  const dMax = Math.max(...depths) + READY_BOX_PADDING_MM

  const meanR = holes.reduce((sum, hole) => sum + hole.r, 0) / holes.length
  const angularPadding = READY_BOX_PADDING_MM / Math.max(meanR, 1)
  const tMin = Math.min(...thetas) - angularPadding
  const tMax = Math.max(...thetas) + angularPadding
  const cosMin = Math.cos(tMin - phi)
  const cosMax = Math.cos(tMax - phi)
  if (dMin <= 0 || cosMin <= 0 || cosMax <= 0 || tMax <= tMin) return undefined

  return [
    { r: dMax / cosMin, theta: tMin },
    { r: dMax / cosMax, theta: tMax },
    { r: dMin / cosMax, theta: tMax },
    { r: dMin / cosMin, theta: tMin },
  ]
}

function readyTrapezoids(board: CribbageBoard): PolarPoint[][] {
  const segment = board.track.lanes[0]?.segments[0]
  if (!segment) return []
  const corners = readyTrapezoidCorners(readyHoles(board), board.outline.vertices, segment)
  return corners ? [corners] : []
}

function winnerHole(board: CribbageBoard): PolarPoint | undefined {
  const lane = board.track.lanes[FINISH_LANE_INDEX]
  const segment = lane?.segments[lane.segments.length - 1]
  return segment?.holes[0]
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
