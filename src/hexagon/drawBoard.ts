import { HOLES_PER_GROUP } from './constants'
import { artworkSvgElements, drawArtworkCanvas, segmentLaneLineSvgElement } from './drawArtwork'
import { drawBoardHolesCanvas, holeSvgElements, holesSvgElements, type HoleStyle } from './drawHoles'
import {
  drawLaneBackgroundsCanvas,
  drawLaneSpiralLinesCanvas,
  laneBackgroundSvgElements,
  laneSpiralLineSvgElements,
} from './drawLanes'
import { BOARD_OUTLINE_COLOR, BOARD_OUTLINE_LINE_WIDTH_PX, LINE_COLOR, SECTION_LINE_COLOR } from './geometry'
import { polarToCanvas } from './polar'
import type { BoardRepresentation } from './representations'
import type { BoardOutline, CribbageBoard, PolarPoint } from './types'

function holeStyleForRepresentation(representation: BoardRepresentation): HoleStyle {
  if (representation === 'drill-template') return 'crosshair'
  if (representation === 'artwork') return 'ring'
  return 'disk'
}

function outlineCanvasPoints(
  cx: number,
  cy: number,
  outline: BoardOutline,
  unitsPerMm: number,
): [number, number][] {
  return outline.vertices.map((vertex) => polarToCanvas(cx, cy, vertex, unitsPerMm))
}

function polarLineCanvasPoints(
  cx: number,
  cy: number,
  start: PolarPoint,
  end: PolarPoint,
  unitsPerMm: number,
): [[number, number], [number, number]] {
  return [polarToCanvas(cx, cy, start, unitsPerMm), polarToCanvas(cx, cy, end, unitsPerMm)]
}

function strokePolylineCanvas(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  lineWidth: number,
  strokeStyle: string,
  closePath: boolean,
) {
  if (points.length < 2) return

  ctx.strokeStyle = strokeStyle
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1])
  }
  if (closePath) ctx.closePath()
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

function strokeLineCanvas(
  ctx: CanvasRenderingContext2D,
  start: [number, number],
  end: [number, number],
  lineWidth: number,
  strokeStyle: string,
) {
  strokePolylineCanvas(ctx, [start, end], lineWidth, strokeStyle, false)
}

function strokeOutlineCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outline: BoardOutline,
  unitsPerMm: number,
  lineWidth: number,
  strokeStyle: string,
) {
  strokePolylineCanvas(
    ctx,
    outlineCanvasPoints(cx, cy, outline, unitsPerMm),
    lineWidth,
    strokeStyle,
    true,
  )

  for (const line of outline.sectionLines) {
    const [start, end] = polarLineCanvasPoints(cx, cy, line.start, line.end, unitsPerMm)
    strokeLineCanvas(ctx, start, end, Math.max(1, lineWidth * 0.6), SECTION_LINE_COLOR)
  }
}

function svgLayer(id: string, content: string): string {
  const inner = content.trim()
  if (!inner) return ''
  return `<g id="${id}" inkscape:groupmode="layer" inkscape:label="${id}">\n${inner}\n</g>`
}

function svgGroup(id: string, content: string): string {
  const inner = content.trim()
  if (!inner) return ''
  return `<g id="${id}">\n${inner}\n</g>`
}

function trackSegmentSvgElements(
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerMm: number,
  holeStyle: HoleStyle,
): string {
  const groups: string[] = []
  let segmentNumber = 0

  for (const lane of board.track.lanes) {
    for (const segment of lane.segments) {
      segmentNumber += 1
      const parts = [
        segment.holes.length === HOLES_PER_GROUP
          ? segmentLaneLineSvgElement(cx, cy, segment.holes, unitsPerMm)
          : '',
        holesSvgElements(cx, cy, segment.holes, unitsPerMm, holeStyle, LINE_COLOR, LINE_COLOR),
      ]
      groups.push(svgGroup(`segment-${segmentNumber}`, parts.filter(Boolean).join('\n')))
    }
  }

  return groups.filter(Boolean).join('\n')
}

function outlineHexSvgElement(
  cx: number,
  cy: number,
  outline: BoardOutline,
  unitsPerMm: number,
  stroke: string,
  strokeWidth: number,
): string {
  const polygonPoints = outlineCanvasPoints(cx, cy, outline, unitsPerMm)
    .map(([x, y]) => `${x},${y}`)
    .join(' ')
  return `<polygon points="${polygonPoints}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
}

function sectionLineSvgElements(
  cx: number,
  cy: number,
  outline: BoardOutline,
  unitsPerMm: number,
  strokeWidth: number,
): string {
  return outline.sectionLines
    .map((line) => {
      const [start, end] = polarLineCanvasPoints(cx, cy, line.start, line.end, unitsPerMm)
      return `<line x1="${start[0]}" y1="${start[1]}" x2="${end[0]}" y2="${end[1]}" stroke="${SECTION_LINE_COLOR}" stroke-width="${strokeWidth}"/>`
    })
    .join('\n')
}

function outlineSvgElements(
  cx: number,
  cy: number,
  outline: BoardOutline,
  unitsPerMm: number,
  stroke: string,
  strokeWidth: number,
): string {
  return [
    outlineHexSvgElement(cx, cy, outline, unitsPerMm, stroke, strokeWidth),
    sectionLineSvgElements(cx, cy, outline, unitsPerMm, strokeWidth),
  ]
    .filter(Boolean)
    .join('\n')
}

export function drawBoardCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerCm: number,
  representation: BoardRepresentation,
) {
  const unitsPerMm = unitsPerCm / 10
  const holeLineWidth = Math.max(0.5, unitsPerCm * 0.04)
  const spiralLineWidth = Math.max(0.75, unitsPerCm * 0.06)
  const holeStyle = holeStyleForRepresentation(representation)

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.lineCap = 'round'

  if (representation === 'color') {
    drawLaneBackgroundsCanvas(ctx, cx, cy, board, unitsPerMm)
  }

  if (representation === 'lined') {
    drawLaneSpiralLinesCanvas(ctx, cx, cy, board, unitsPerMm, spiralLineWidth)
  }

  if (representation === 'artwork') {
    drawArtworkCanvas(ctx, cx, cy, board, unitsPerMm)
  }

  strokeOutlineCanvas(
    ctx,
    cx,
    cy,
    board.outline,
    unitsPerMm,
    BOARD_OUTLINE_LINE_WIDTH_PX,
    BOARD_OUTLINE_COLOR,
  )
  drawBoardHolesCanvas(
    ctx,
    cx,
    cy,
    board,
    unitsPerMm,
    holeStyle,
    LINE_COLOR,
    LINE_COLOR,
    holeLineWidth,
  )
}

export function boardSvgElements(
  cx: number,
  cy: number,
  board: CribbageBoard,
  unitsPerCm: number,
  representation: BoardRepresentation,
): string {
  const unitsPerMm = unitsPerCm / 10
  const holeStyle = holeStyleForRepresentation(representation)
  const elements: string[] = []

  if (representation === 'color') {
    elements.push(laneBackgroundSvgElements(cx, cy, board, unitsPerMm))
  }

  if (representation === 'lined') {
    elements.push(laneSpiralLineSvgElements(cx, cy, board, unitsPerMm, 0.06 * unitsPerCm))
  }

  if (representation === 'artwork') {
    return [
      svgLayer('artwork', artworkSvgElements(cx, cy, board, unitsPerMm)),
      svgLayer('track', trackSegmentSvgElements(cx, cy, board, unitsPerMm, holeStyle)),
      svgLayer(
        'outline',
        outlineHexSvgElement(
          cx,
          cy,
          board.outline,
          unitsPerMm,
          BOARD_OUTLINE_COLOR,
          BOARD_OUTLINE_LINE_WIDTH_PX,
        ),
      ),
    ]
      .filter(Boolean)
      .join('\n')
  }

  elements.push(
    outlineSvgElements(
      cx,
      cy,
      board.outline,
      unitsPerMm,
      BOARD_OUTLINE_COLOR,
      BOARD_OUTLINE_LINE_WIDTH_PX,
    ),
  )
  elements.push(holeSvgElements(cx, cy, board, unitsPerMm, holeStyle, LINE_COLOR, LINE_COLOR))

  return elements.join('\n')
}

export function drawBoardOutlinePdf(
  pdf: import('jspdf').jsPDF,
  cx: number,
  cy: number,
  outline: BoardOutline,
) {
  const points = outlineCanvasPoints(cx, cy, outline, 1)
  if (points.length >= 2) {
    pdf.setDrawColor(255, 0, 0)
    pdf.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
      pdf.lineTo(points[i][0], points[i][1])
    }
    pdf.lineTo(points[0][0], points[0][1])
    pdf.stroke()
  }

  pdf.setDrawColor(212, 212, 216)
  for (const line of outline.sectionLines) {
    const [start, end] = polarLineCanvasPoints(cx, cy, line.start, line.end, 1)
    pdf.line(start[0], start[1], end[0], end[1])
  }
}
