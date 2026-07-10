import {
  CENTER_CROSS_HALF_LENGTH_CM,
  INNER_CIRCUMRADIUS_CM,
  OUTER_CIRCUMRADIUS_CM,
  LINE_COLOR,
  RADIAL_LINE_COUNT,
  RING_CIRCUMRADIUS_CM,
  VERTEX_LINE_COLOR,
  hexagonVertices,
  radialSegments,
} from './geometry'

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
  ctx.beginPath()
  ctx.moveTo(cx - halfLength, cy)
  ctx.lineTo(cx + halfLength, cy)
  ctx.moveTo(cx, cy - halfLength)
  ctx.lineTo(cx, cy + halfLength)
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

export function drawHexagonDiagram(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  unitsPerCm: number,
) {
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

  for (const { start, end, isGray } of radialSegments(
    cx,
    cy,
    innerRadius,
    outerRadius,
    RADIAL_LINE_COUNT,
  )) {
    ctx.strokeStyle = isGray ? VERTEX_LINE_COLOR : LINE_COLOR
    ctx.lineWidth = radialLineWidth
    ctx.beginPath()
    ctx.moveTo(start[0], start[1])
    ctx.lineTo(end[0], end[1])
    ctx.stroke()
  }

  ctx.strokeStyle = LINE_COLOR
  for (const radius of RING_CIRCUMRADIUS_CM.map((ringRadius) => ringRadius * unitsPerCm)) {
    strokeHexagon(ctx, cx, cy, radius, hexLineWidth)
  }
  strokeCenterCross(ctx, cx, cy, crossHalfLength, crossLineWidth)
}
