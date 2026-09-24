import {
  CENTER_LANE_INDEX,
  HOLES_PER_GROUP,
  LANE_LINE_COLOR,
  LANE_LINE_PADDING_MM,
  LANE_LINE_STROKE_MM,
  LANE_SPACING_MM,
  LOGO_SIDE_MM,
  LOGO_STROKE_COLOR,
  LOGO_STROKE_MM,
  LOGO_TRISECT_THETAS,
  READY_BOX_CORNER_RADIUS_MM,
  READY_BOX_FILL_COLOR,
  READY_BOX_PADDING_MM,
  READY_BOX_STROKE_COLOR,
  WINNER_CIRCLE_STROKE_COLOR,
  WINNER_CIRCLE_STROKE_MM,
} from './constants'
import { polarToCanvas } from './polar'
import type { CribbageBoard, PolarPoint } from './types'

type CanvasPoint = [number, number]

type OrientedBox = {
  centerX: number
  centerY: number
  width: number
  height: number
  angle: number
}

function hexRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

function readyHoles(board: CribbageBoard): PolarPoint[] {
  return board.track.lanes.flatMap((lane) => lane.segments[0]?.holes ?? [])
}

function winnerHole(board: CribbageBoard): PolarPoint | undefined {
  const lane = board.track.lanes[CENTER_LANE_INDEX]
  const segment = lane?.segments[lane.segments.length - 1]
  return segment?.holes[segment.holes.length - 1]
}

function scoringGroups(board: CribbageBoard): PolarPoint[][] {
  return board.track.lanes.flatMap((lane) =>
    lane.segments.filter((segment) => segment.holes.length === HOLES_PER_GROUP).map((segment) => segment.holes),
  )
}

function readyBox(cx: number, cy: number, board: CribbageBoard, unitsPerMm: number): OrientedBox | undefined {
  const holes = readyHoles(board)
  if (holes.length === 0) return undefined

  const points = holes.map((hole) => polarToCanvas(cx, cy, hole, unitsPerMm))
  const firstSegment = board.track.lanes[0]?.segments[0]
  const axisStart = firstSegment
    ? polarToCanvas(cx, cy, firstSegment.start, unitsPerMm)
    : points[0]
  const axisEnd = firstSegment
    ? polarToCanvas(cx, cy, firstSegment.end, unitsPerMm)
    : points[points.length - 1]
  const axisDx = axisEnd[0] - axisStart[0]
  const axisDy = axisEnd[1] - axisStart[1]
  const axisLength = Math.hypot(axisDx, axisDy)
  const ux = axisLength === 0 ? 1 : axisDx / axisLength
  const uy = axisLength === 0 ? 0 : axisDy / axisLength
  const vx = -uy
  const vy = ux
  const padding = READY_BOX_PADDING_MM * unitsPerMm

  let minU = Infinity
  let maxU = -Infinity
  let minV = Infinity
  let maxV = -Infinity
  for (const [x, y] of points) {
    const u = x * ux + y * uy
    const v = x * vx + y * vy
    minU = Math.min(minU, u)
    maxU = Math.max(maxU, u)
    minV = Math.min(minV, v)
    maxV = Math.max(maxV, v)
  }

  minU -= padding
  maxU += padding
  minV -= padding
  maxV += padding

  const midU = (minU + maxU) / 2
  const midV = (minV + maxV) / 2
  return {
    centerX: midU * ux + midV * vx,
    centerY: midU * uy + midV * vy,
    width: maxU - minU,
    height: maxV - minV,
    angle: Math.atan2(uy, ux),
  }
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

function mapLocal(box: OrientedBox, lx: number, ly: number): CanvasPoint {
  const cos = Math.cos(box.angle)
  const sin = Math.sin(box.angle)
  return [box.centerX + lx * cos - ly * sin, box.centerY + lx * sin + ly * cos]
}

function quadraticToCubic(
  start: CanvasPoint,
  control: CanvasPoint,
  end: CanvasPoint,
): { c1: CanvasPoint; c2: CanvasPoint; end: CanvasPoint } {
  return {
    c1: [start[0] + ((control[0] - start[0]) * 2) / 3, start[1] + ((control[1] - start[1]) * 2) / 3],
    c2: [end[0] + ((control[0] - end[0]) * 2) / 3, end[1] + ((control[1] - end[1]) * 2) / 3],
    end,
  }
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

export function drawReadyBoxCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
) {
  const box = readyBox(cx, cy, board, unitsPerMm)
  if (!box) return

  const radius = Math.min(
    READY_BOX_CORNER_RADIUS_MM * unitsPerMm,
    box.width / 2,
    box.height / 2,
  )

  ctx.save()
  ctx.translate(box.centerX, box.centerY)
  ctx.rotate(box.angle)
  ctx.beginPath()
  ctx.roundRect(-box.width / 2, -box.height / 2, box.width, box.height, radius)
  ctx.fillStyle = READY_BOX_FILL_COLOR
  ctx.strokeStyle = READY_BOX_STROKE_COLOR
  ctx.lineWidth = 0.7 * unitsPerMm
  ctx.fill()
  ctx.stroke()
  ctx.restore()
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
  const box = readyBox(cx, cy, board, unitsPerMm)
  if (!box) return ''
  const radius = Math.min(
    READY_BOX_CORNER_RADIUS_MM * unitsPerMm,
    box.width / 2,
    box.height / 2,
  )
  const degrees = (box.angle * 180) / Math.PI
  return `<rect x="${-box.width / 2}" y="${-box.height / 2}" width="${box.width}" height="${box.height}" rx="${radius}" ry="${radius}" fill="${READY_BOX_FILL_COLOR}" stroke="${READY_BOX_STROKE_COLOR}" stroke-width="${0.7 * unitsPerMm}" transform="translate(${box.centerX} ${box.centerY}) rotate(${degrees})"/>`
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

function curveCorner(
  pdf: import('jspdf').jsPDF,
  start: CanvasPoint,
  corner: CanvasPoint,
  end: CanvasPoint,
) {
  const cubic = quadraticToCubic(start, corner, end)
  pdf.curveTo(cubic.c1[0], cubic.c1[1], cubic.c2[0], cubic.c2[1], cubic.end[0], cubic.end[1])
}

function drawRoundedObbPdf(
  pdf: import('jspdf').jsPDF,
  box: OrientedBox,
  radiusMm: number,
  fill: [number, number, number],
  stroke: [number, number, number],
) {
  const hw = box.width / 2
  const hh = box.height / 2
  const r = Math.min(radiusMm, hw, hh)
  const world = (lx: number, ly: number) => mapLocal(box, lx, ly)

  const start = world(hw - r, -hh)
  pdf.moveTo(start[0], start[1])
  pdf.lineTo(...world(-hw + r, -hh))
  curveCorner(pdf, world(-hw + r, -hh), world(-hw, -hh), world(-hw, -hh + r))
  pdf.lineTo(...world(-hw, hh - r))
  curveCorner(pdf, world(-hw, hh - r), world(-hw, hh), world(-hw + r, hh))
  pdf.lineTo(...world(hw - r, hh))
  curveCorner(pdf, world(hw - r, hh), world(hw, hh), world(hw, hh - r))
  pdf.lineTo(...world(hw, -hh + r))
  curveCorner(pdf, world(hw, -hh + r), world(hw, -hh), world(hw - r, -hh))

  pdf.setFillColor(...fill)
  pdf.setDrawColor(...stroke)
  pdf.fillStroke()
}

export function drawReadyBoxPdf(
  pdf: import('jspdf').jsPDF,
  cx: number,
  cy: number,
  board: CribbageBoard,
) {
  const box = readyBox(cx, cy, board, 1)
  if (!box) return
  pdf.setLineWidth(0.35)
  drawRoundedObbPdf(
    pdf,
    box,
    READY_BOX_CORNER_RADIUS_MM,
    [219, 234, 254],
    hexRgb(READY_BOX_STROKE_COLOR),
  )
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
