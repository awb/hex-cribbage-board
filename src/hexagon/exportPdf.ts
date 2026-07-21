import { jsPDF } from 'jspdf'
import { drawBoardHolesPdf } from './drawHoles'
import { drawLaneBackgroundsPdf } from './drawLanes'
import { generateCribbageBoard } from './generateBoard'
import {
  CENTER_CROSS_HALF_LENGTH_CM,
  DIAGRAM_HEIGHT_CM,
  DIAGRAM_WIDTH_CM,
  DARK_RADIAL_LINE_COLOR_RGB,
  HEXAGON_RING_CIRCUMRADIUS_MM,
  INNER_CIRCUMRADIUS_CM,
  INNER_CIRCUMRADIUS_MM,
  OUTER_CIRCUMRADIUS_MM,
  OUTER_FLAT_TO_FLAT_CM,
  RADIAL_LINE_COUNT,
  VERTEX_LINE_COLOR_RGB,
  centerCrossSegments,
  hexagonVertices,
  radialSegments,
} from './geometry'

const CM_TO_MM = 10
const MARGIN_MM = 10
const BLACK: [number, number, number] = [0, 0, 0]

export function exportHexagonPdf() {
  const board = generateCribbageBoard()
  const outerRadiusMm = OUTER_CIRCUMRADIUS_MM
  const pageW = DIAGRAM_WIDTH_CM * CM_TO_MM + 2 * MARGIN_MM
  const pageH = DIAGRAM_HEIGHT_CM * CM_TO_MM + 2 * MARGIN_MM
  const cx = pageW / 2
  const cy = pageH / 2

  const pdf = new jsPDF({
    unit: 'mm',
    format: [pageW, pageH],
    orientation: pageW > pageH ? 'landscape' : 'portrait',
  })

  drawLaneBackgroundsPdf(pdf, cx, cy, board)

  for (const { start, end, isGray } of radialSegments(
    cx,
    cy,
    INNER_CIRCUMRADIUS_MM,
    outerRadiusMm,
    RADIAL_LINE_COUNT,
  )) {
    pdf.setDrawColor(...(isGray ? VERTEX_LINE_COLOR_RGB : DARK_RADIAL_LINE_COLOR_RGB))
    pdf.setLineWidth(isGray ? 0.15 : 0.075)
    pdf.line(start[0], start[1], end[0], end[1])
  }

  pdf.setDrawColor(...DARK_RADIAL_LINE_COLOR_RGB)
  pdf.setLineWidth(0.25)
  for (const radiusMm of HEXAGON_RING_CIRCUMRADIUS_MM) {
    const vertices = hexagonVertices(cx, cy, radiusMm)
    for (let i = 0; i < vertices.length; i++) {
      const [x1, y1] = vertices[i]
      const [x2, y2] = vertices[(i + 1) % vertices.length]
      pdf.line(x1, y1, x2, y2)
    }
  }

  const crossHalfLengthMm = CENTER_CROSS_HALF_LENGTH_CM * CM_TO_MM
  const { horizontal, vertical } = centerCrossSegments(cx, cy, crossHalfLengthMm)
  pdf.setDrawColor(...BLACK)
  pdf.setLineWidth(0.1)
  pdf.line(horizontal[0][0], horizontal[0][1], horizontal[1][0], horizontal[1][1])
  pdf.line(vertical[0][0], vertical[0][1], vertical[1][0], vertical[1][1])

  drawBoardHolesPdf(pdf, cx, cy, board)

  pdf.save(`hexagon-${OUTER_FLAT_TO_FLAT_CM}cm-inner-${INNER_CIRCUMRADIUS_CM}cm-${RADIAL_LINE_COUNT}-lines.pdf`)
}
