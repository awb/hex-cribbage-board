import {
  CENTER_CROSS_HALF_LENGTH_CM,
  DARK_RADIAL_LINE_COLOR,
  HEXAGON_RING_CIRCUMRADIUS_CM,
  INNER_CIRCUMRADIUS_CM,
  LINE_COLOR,
  OUTER_CIRCUMRADIUS_CM,
  RADIAL_LINE_COUNT,
  VERTEX_LINE_COLOR,
  centerCrossSegments,
  hexagonVertices,
  radialSegments,
} from './geometry'
import { drawBoardHolesCanvas, holeSvgElements } from './drawHoles'
import { drawLaneBackgroundsCanvas, laneBackgroundSvgElements } from './drawLanes'
import type { CribbageBoard } from './types'

function strokeHexagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  lineWidth: number,
) {
  const vertices = hexagonVertices(cx, cy, radius)
  ctx.beginPath()
  ctx.moveTo(vertices[0][0], vertices[0][1])
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i][0], vertices[i][1])
  }
  ctx.closePath()
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

function strokeCenterCross(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  halfLength: number,
  lineWidth: number,
) {
  const { horizontal, vertical } = centerCrossSegments(cx, cy, halfLength)
  ctx.beginPath()
  ctx.moveTo(horizontal[0][0], horizontal[0][1])
  ctx.lineTo(horizontal[1][0], horizontal[1][1])
  ctx.moveTo(vertical[0][0], vertical[0][1])
  ctx.lineTo(vertical[1][0], vertical[1][1])
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

export function drawBoardCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerCm: number,
) {
  const unitsPerMm = unitsPerCm / 10
  const outerRadius = OUTER_CIRCUMRADIUS_CM * unitsPerCm
  const innerRadius = INNER_CIRCUMRADIUS_CM * unitsPerCm

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.lineCap = 'round'
  const radialLineWidth = Math.max(1, unitsPerCm * 0.08)
  const hexLineWidth = Math.max(1.5, unitsPerCm * 0.12)
  const crossLineWidth = Math.max(0.5, unitsPerCm * 0.04)
  const crossHalfLength = CENTER_CROSS_HALF_LENGTH_CM * unitsPerCm
  const holeLineWidth = Math.max(0.5, unitsPerCm * 0.04)

  drawLaneBackgroundsCanvas(ctx, cx, cy, board, unitsPerMm)

  for (const { start, end, isGray } of radialSegments(
    cx,
    cy,
    innerRadius,
    outerRadius,
    RADIAL_LINE_COUNT,
  )) {
    ctx.strokeStyle = isGray ? VERTEX_LINE_COLOR : DARK_RADIAL_LINE_COLOR
    ctx.lineWidth = isGray ? radialLineWidth : radialLineWidth / 2
    ctx.beginPath()
    ctx.moveTo(start[0], start[1])
    ctx.lineTo(end[0], end[1])
    ctx.stroke()
  }

  ctx.strokeStyle = DARK_RADIAL_LINE_COLOR
  for (const radius of HEXAGON_RING_CIRCUMRADIUS_CM.map((ringRadius) => ringRadius * unitsPerCm)) {
    strokeHexagon(ctx, cx, cy, radius, hexLineWidth)
  }

  ctx.strokeStyle = LINE_COLOR
  strokeCenterCross(ctx, cx, cy, crossHalfLength, crossLineWidth)
  drawBoardHolesCanvas(ctx, cx, cy, board, unitsPerMm, LINE_COLOR, holeLineWidth)
}

export function boardSvgElements(
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerCm: number,
): string {
  const unitsPerMm = unitsPerCm / 10
  const outerRadius = OUTER_CIRCUMRADIUS_CM * unitsPerCm
  const innerRadius = INNER_CIRCUMRADIUS_CM * unitsPerCm
  const elements: string[] = []

  elements.push(laneBackgroundSvgElements(cx, cy, board, unitsPerMm))

  for (const { start, end, isGray } of radialSegments(
    cx,
    cy,
    innerRadius,
    outerRadius,
    RADIAL_LINE_COUNT,
  )) {
    const color = isGray ? VERTEX_LINE_COLOR : DARK_RADIAL_LINE_COLOR
    const width = isGray ? 0.15 : 0.075
    elements.push(
      `<line x1="${start[0]}" y1="${start[1]}" x2="${end[0]}" y2="${end[1]}" stroke="${color}" stroke-width="${width * unitsPerCm}"/>`,
    )
  }

  for (const radius of HEXAGON_RING_CIRCUMRADIUS_CM.map((ringRadius) => ringRadius * unitsPerCm)) {
    const vertices = hexagonVertices(cx, cy, radius)
    const points = vertices.map(([x, y]) => `${x},${y}`).join(' ')
    elements.push(
      `<polygon points="${points}" fill="none" stroke="${DARK_RADIAL_LINE_COLOR}" stroke-width="${0.12 * unitsPerCm}"/>`,
    )
  }

  const crossHalf = CENTER_CROSS_HALF_LENGTH_CM * unitsPerCm
  const { horizontal, vertical } = centerCrossSegments(cx, cy, crossHalf)
  elements.push(
    `<line x1="${horizontal[0][0]}" y1="${horizontal[0][1]}" x2="${horizontal[1][0]}" y2="${horizontal[1][1]}" stroke="${LINE_COLOR}" stroke-width="${0.04 * unitsPerCm}"/>`,
    `<line x1="${vertical[0][0]}" y1="${vertical[0][1]}" x2="${vertical[1][0]}" y2="${vertical[1][1]}" stroke="${LINE_COLOR}" stroke-width="${0.04 * unitsPerCm}"/>`,
  )

  elements.push(holeSvgElements(cx, cy, board, unitsPerMm, LINE_COLOR))

  return elements.join('\n')
}
