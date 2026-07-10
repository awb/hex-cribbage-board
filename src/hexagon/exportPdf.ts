import { jsPDF } from 'jspdf'
import {
  CENTER_CROSS_HALF_LENGTH_CM,
  DIAGRAM_HEIGHT_CM,
  DIAGRAM_WIDTH_CM,
  INNER_CIRCUMRADIUS_MM,
  INNER_FLAT_TO_FLAT_CM,
  OUTER_CIRCUMRADIUS_MM,
  OUTER_FLAT_TO_FLAT_CM,
  RADIAL_LINE_COUNT,
  RING_CIRCUMRADIUS_MM,
  hexagonVertices,
  radialSegments,
} from './geometry'

const CM_TO_MM = 10
const MARGIN_MM = 10
const BLACK: [number, number, number] = [0, 0, 0]
const GRAY: [number, number, number] = [161, 161, 170]

export function exportHexagonPdf() {
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

  pdf.setLineWidth(0.15)
  for (const { start, end, isGray } of radialSegments(
    cx,
    cy,
    INNER_CIRCUMRADIUS_MM,
    outerRadiusMm,
    RADIAL_LINE_COUNT,
  )) {
    pdf.setDrawColor(...(isGray ? GRAY : BLACK))
    pdf.line(start[0], start[1], end[0], end[1])
  }

  pdf.setDrawColor(...BLACK)
  pdf.setLineWidth(0.25)
  for (const radiusMm of RING_CIRCUMRADIUS_MM) {
    const vertices = hexagonVertices(cx, cy, radiusMm)
    for (let i = 0; i < vertices.length; i++) {
      const [x1, y1] = vertices[i]
      const [x2, y2] = vertices[(i + 1) % vertices.length]
      pdf.line(x1, y1, x2, y2)
    }
  }

  const crossHalfLengthMm = CENTER_CROSS_HALF_LENGTH_CM * CM_TO_MM
  pdf.setLineWidth(0.1)
  pdf.line(cx - crossHalfLengthMm, cy, cx + crossHalfLengthMm, cy)
  pdf.line(cx, cy - crossHalfLengthMm, cx, cy + crossHalfLengthMm)

  pdf.save(`hexagon-${OUTER_FLAT_TO_FLAT_CM}cm-${INNER_FLAT_TO_FLAT_CM}cm-${RADIAL_LINE_COUNT}-lines.pdf`)
}
