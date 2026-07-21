import { HOLE_CROSS_LENGTH_MM, HOLE_DIAMETER_MM } from './constants'
import { polarToCanvas } from './polar'
import type { CribbageBoard, PolarPoint } from './types'

function drawHoleCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hole: PolarPoint,
  unitsPerMm: number,
  strokeStyle: string,
  lineWidth: number,
) {
  const [x, y] = polarToCanvas(cx, cy, hole, unitsPerMm)
  const radius = (HOLE_DIAMETER_MM / 2) * unitsPerMm
  const crossHalf = (HOLE_CROSS_LENGTH_MM / 2) * unitsPerMm

  ctx.strokeStyle = strokeStyle
  ctx.fillStyle = strokeStyle
  ctx.lineWidth = lineWidth

  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x - crossHalf, y)
  ctx.lineTo(x + crossHalf, y)
  ctx.moveTo(x, y - crossHalf)
  ctx.lineTo(x, y + crossHalf)
  ctx.stroke()
}

export function drawBoardHolesCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
  strokeStyle = '#18181b',
  lineWidth = 0.5,
) {
  for (const lane of board.track.lanes) {
    for (const segment of lane.segments) {
      for (const hole of segment.holes) {
        drawHoleCanvas(ctx, cx, cy, hole, unitsPerMm, strokeStyle, lineWidth)
      }
    }
  }
}

export function holeSvgElements(
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
  stroke = '#18181b',
): string {
  const elements: string[] = []

  for (const lane of board.track.lanes) {
    for (const segment of lane.segments) {
      for (const hole of segment.holes) {
        const [x, y] = polarToCanvas(cx, cy, hole, unitsPerMm)
        const radius = (HOLE_DIAMETER_MM / 2) * unitsPerMm
        const crossHalf = (HOLE_CROSS_LENGTH_MM / 2) * unitsPerMm

        elements.push(
          `<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${stroke}" stroke-width="0.5"/>`,
          `<line x1="${x - crossHalf}" y1="${y}" x2="${x + crossHalf}" y2="${y}" stroke="${stroke}" stroke-width="0.5"/>`,
          `<line x1="${x}" y1="${y - crossHalf}" x2="${x}" y2="${y + crossHalf}" stroke="${stroke}" stroke-width="0.5"/>`,
        )
      }
    }
  }

  return elements.join('\n')
}

export function drawBoardHolesPdf(
  pdf: import('jspdf').jsPDF,
  cx: number,
  cy: number,
  board: CribbageBoard,
) {
  const holeRadius = HOLE_DIAMETER_MM / 2
  const crossHalf = HOLE_CROSS_LENGTH_MM / 2
  const black: [number, number, number] = [0, 0, 0]

  pdf.setDrawColor(...black)
  pdf.setLineWidth(0.1)

  for (const lane of board.track.lanes) {
    for (const segment of lane.segments) {
      for (const hole of segment.holes) {
        const [x, y] = polarToCanvas(cx, cy, hole, 1)
        pdf.circle(x, y, holeRadius, 'S')
        pdf.line(x - crossHalf, y, x + crossHalf, y)
        pdf.line(x, y - crossHalf, x, y + crossHalf)
      }
    }
  }
}
