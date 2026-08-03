import { LANE_SPACING } from './constants'
import { LANE_SPIRAL_LINE_COLOR } from './geometry'
import { polarToCanvas } from './polar'
import type { CribbageBoard, Lane, PolarPoint } from './types'

function laneCenterline(lane: Lane): PolarPoint[] {
  if (lane.segments.length === 0) return []
  return [lane.segments[0].start, ...lane.segments.map((segment) => segment.end)]
}

function unitNormal(ax: number, ay: number, bx: number, by: number): [number, number] {
  const dx = bx - ax
  const dy = by - ay
  const length = Math.hypot(dx, dy)
  if (length === 0) return [0, 0]
  return [-dy / length, dx / length]
}

function buildLaneRibbon(centerline: [number, number][], halfWidth: number): [number, number][] {
  if (centerline.length < 2) return []

  const left: [number, number][] = []
  const right: [number, number][] = []

  for (let i = 0; i < centerline.length; i++) {
    let nx: number
    let ny: number

    if (i === 0) {
      ;[nx, ny] = unitNormal(
        centerline[0][0],
        centerline[0][1],
        centerline[1][0],
        centerline[1][1],
      )
    } else if (i === centerline.length - 1) {
      const last = centerline.length - 1
      ;[nx, ny] = unitNormal(
        centerline[last - 1][0],
        centerline[last - 1][1],
        centerline[last][0],
        centerline[last][1],
      )
    } else {
      const [n1x, n1y] = unitNormal(
        centerline[i - 1][0],
        centerline[i - 1][1],
        centerline[i][0],
        centerline[i][1],
      )
      const [n2x, n2y] = unitNormal(
        centerline[i][0],
        centerline[i][1],
        centerline[i + 1][0],
        centerline[i + 1][1],
      )
      nx = n1x + n2x
      ny = n1y + n2y
      const length = Math.hypot(nx, ny)
      if (length > 0) {
        nx /= length
        ny /= length
      } else {
        nx = n1x
        ny = n1y
      }
    }

    const [x, y] = centerline[i]
    left.push([x + nx * halfWidth, y + ny * halfWidth])
    right.push([x - nx * halfWidth, y - ny * halfWidth])
  }

  return [...left, ...right.reverse()]
}

function laneRibbonPoints(
  cx: number,
  cy: number,
  lane: Lane,
  unitsPerMm: number,
): [number, number][] {
  const centerline = laneCenterline(lane).map((point) => polarToCanvas(cx, cy, point, unitsPerMm))
  return buildLaneRibbon(centerline, (LANE_SPACING / 2) * unitsPerMm)
}

function parseRgba(color: string): { r: number; g: number; b: number; a: number } {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (!match) {
    return { r: 0, g: 0, b: 0, a: 1 }
  }
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] === undefined ? 1 : Number(match[4]),
  }
}

/** Solid RGB blended 50% over white for PDF (no alpha support needed). */
function pdfFillColor(color: string): [number, number, number] {
  const { r, g, b, a } = parseRgba(color)
  const blend = (channel: number) => Math.round(channel * a + 255 * (1 - a))
  return [blend(r), blend(g), blend(b)]
}

function laneHoleSequence(lane: Lane): PolarPoint[] {
  return lane.segments.flatMap((segment) => segment.holes)
}

function laneSpiralCanvasPoints(
  cx: number,
  cy: number,
  lane: Lane,
  unitsPerMm: number,
): [number, number][] {
  return laneHoleSequence(lane).map((hole) => polarToCanvas(cx, cy, hole, unitsPerMm))
}

export function drawLaneSpiralLinesCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
  lineWidth: number,
) {
  ctx.strokeStyle = LANE_SPIRAL_LINE_COLOR
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const lane of board.track.lanes) {
    const points = laneSpiralCanvasPoints(cx, cy, lane, unitsPerMm)
    if (points.length < 2) continue

    ctx.beginPath()
    ctx.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1])
    }
    ctx.stroke()
  }
}

export function laneSpiralLineSvgElements(
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
  strokeWidth: number,
): string {
  return board.track.lanes
    .map((lane) => {
      const points = laneSpiralCanvasPoints(cx, cy, lane, unitsPerMm)
      if (points.length < 2) return ''

      const pathData = points
        .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
        .join(' ')

      return `<path d="${pathData}" fill="none" stroke="${LANE_SPIRAL_LINE_COLOR}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
    })
    .filter(Boolean)
    .join('\n')
}

export function drawLaneSpiralLinesPdf(
  pdf: import('jspdf').jsPDF,
  cx: number,
  cy: number,
  board: CribbageBoard,
) {
  const gray: [number, number, number] = [161, 161, 170]
  pdf.setDrawColor(...gray)
  pdf.setLineWidth(0.15)

  for (const lane of board.track.lanes) {
    const points = laneSpiralCanvasPoints(cx, cy, lane, 1)
    if (points.length < 2) continue

    pdf.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
      pdf.lineTo(points[i][0], points[i][1])
    }
    pdf.stroke()
  }
}

export function drawLaneBackgroundsCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
) {
  for (const lane of board.track.lanes) {
    const ribbon = laneRibbonPoints(cx, cy, lane, unitsPerMm)
    if (ribbon.length < 3 || !lane.bgColor) continue

    ctx.fillStyle = lane.bgColor
    ctx.beginPath()
    ctx.moveTo(ribbon[0][0], ribbon[0][1])
    for (let i = 1; i < ribbon.length; i++) {
      ctx.lineTo(ribbon[i][0], ribbon[i][1])
    }
    ctx.closePath()
    ctx.fill()
  }
}

export function laneBackgroundSvgElements(
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
): string {
  return board.track.lanes
    .map((lane) => {
      const ribbon = laneRibbonPoints(cx, cy, lane, unitsPerMm)
      if (ribbon.length < 3 || !lane.bgColor) return ''

      const points = ribbon.map(([x, y]) => `${x},${y}`).join(' ')
      return `<polygon points="${points}" fill="${lane.bgColor}" stroke="none"/>`
    })
    .filter(Boolean)
    .join('\n')
}

export function drawLaneBackgroundsPdf(
  pdf: import('jspdf').jsPDF,
  cx: number,
  cy: number,
  board: CribbageBoard,
) {
  for (const lane of board.track.lanes) {
    const ribbon = laneRibbonPoints(cx, cy, lane, 1)
    if (ribbon.length < 3 || !lane.bgColor) continue

    const [r, g, b] = pdfFillColor(lane.bgColor)
    pdf.setFillColor(r, g, b)
    pdf.setDrawColor(r, g, b)

    pdf.moveTo(ribbon[0][0], ribbon[0][1])
    for (let i = 1; i < ribbon.length; i++) {
      pdf.lineTo(ribbon[i][0], ribbon[i][1])
    }
    pdf.lineTo(ribbon[0][0], ribbon[0][1])
    pdf.fill()
  }
}
