import { jsPDF } from 'jspdf'
import { drawBoardOutlinePdf } from './drawBoard'
import { drawBoardHolesPdf, type HoleStyle } from './drawHoles'
import { drawLaneBackgroundsPdf, drawLaneSpiralLinesPdf } from './drawLanes'
import { exportFileName } from './exportFileName'
import { generateCribbageBoard } from './generateBoard'
import { DIAGRAM_HEIGHT_CM, DIAGRAM_WIDTH_CM, BOARD_OUTLINE_LINE_WIDTH_MM } from './geometry'
import { DEFAULT_LAYOUT, type LayoutVariant } from './layouts'
import {
  DEFAULT_REPRESENTATION,
  type BoardRepresentation,
} from './representations'

const CM_TO_MM = 10
const MARGIN_MM = 10
const BLACK: [number, number, number] = [0, 0, 0]

function holeStyleForRepresentation(representation: BoardRepresentation): HoleStyle {
  return representation === 'drill-template' ? 'crosshair' : 'disk'
}

export function exportHexagonPdf(
  layout: LayoutVariant = DEFAULT_LAYOUT,
  representation: BoardRepresentation = DEFAULT_REPRESENTATION,
) {
  const board = generateCribbageBoard(undefined, layout)
  const pageW = DIAGRAM_WIDTH_CM * CM_TO_MM + 2 * MARGIN_MM
  const pageH = DIAGRAM_HEIGHT_CM * CM_TO_MM + 2 * MARGIN_MM
  const cx = pageW / 2
  const cy = pageH / 2

  const pdf = new jsPDF({
    unit: 'mm',
    format: [pageW, pageH],
    orientation: pageW > pageH ? 'landscape' : 'portrait',
  })

  if (representation === 'color') {
    drawLaneBackgroundsPdf(pdf, cx, cy, board)
  }

  if (representation === 'lined') {
    drawLaneSpiralLinesPdf(pdf, cx, cy, board)
  }

  pdf.setDrawColor(...BLACK)
  pdf.setLineWidth(BOARD_OUTLINE_LINE_WIDTH_MM)
  drawBoardOutlinePdf(pdf, cx, cy, board.outline)

  drawBoardHolesPdf(pdf, cx, cy, board, holeStyleForRepresentation(representation))

  pdf.save(`${exportFileName(board)}.pdf`)
}
