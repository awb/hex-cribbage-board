import { jsPDF } from 'jspdf'
import { drawBoardOutlinePdf } from './drawBoard'
import { drawBoardHolesPdf } from './drawHoles'
import { drawLaneBackgroundsPdf } from './drawLanes'
import { exportFileName } from './exportFileName'
import { generateCribbageBoard } from './generateBoard'
import { DIAGRAM_HEIGHT_CM, DIAGRAM_WIDTH_CM, BOARD_OUTLINE_LINE_WIDTH_MM } from './geometry'
import { DEFAULT_LAYOUT, type LayoutVariant } from './layouts'

const CM_TO_MM = 10
const MARGIN_MM = 10
const BLACK: [number, number, number] = [0, 0, 0]

export function exportHexagonPdf(layout: LayoutVariant = DEFAULT_LAYOUT) {
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

  drawLaneBackgroundsPdf(pdf, cx, cy, board)

  pdf.setDrawColor(...BLACK)
  pdf.setLineWidth(BOARD_OUTLINE_LINE_WIDTH_MM)
  drawBoardOutlinePdf(pdf, cx, cy, board.outline)

  drawBoardHolesPdf(pdf, cx, cy, board)

  pdf.save(`${exportFileName(board)}.pdf`)
}
