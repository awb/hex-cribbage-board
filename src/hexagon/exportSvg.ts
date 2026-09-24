import { boardSvgElements } from './drawBoard'
import { exportFileName } from './exportFileName'
import { generateCribbageBoard } from './generateBoard'
import { diagramSizeCm } from './geometry'
import { DEFAULT_LAYOUT, type LayoutVariant } from './layouts'
import {
  DEFAULT_REPRESENTATION,
  type BoardRepresentation,
} from './representations'

export function exportHexagonSvg(
  layout: LayoutVariant = DEFAULT_LAYOUT,
  representation: BoardRepresentation = DEFAULT_REPRESENTATION,
) {
  const board = generateCribbageBoard(undefined, layout)
  const { widthCm, heightCm } = diagramSizeCm(board.outline.circumradiusMm)
  const unitsPerCm = 10
  const width = widthCm * unitsPerCm
  const height = heightCm * unitsPerCm
  const cx = width / 2
  const cy = height / 2

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  ${boardSvgElements(cx, cy, board, unitsPerCm, representation)}
</svg>`

  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${exportFileName(board)}.svg`
  link.click()
  URL.revokeObjectURL(url)
}
