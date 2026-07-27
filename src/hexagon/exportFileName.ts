import { LANE_COUNT } from './constants'
import type { CribbageBoard } from './types'

/** e.g. hex-cribbage-board-hexagonal-3-95-4.4 */
export function exportFileName(board: CribbageBoard): string {
  const minSpacing = board.track.minimumHoleSpacingMm.toFixed(1)
  return `hex-cribbage-board-${board.layout}-${LANE_COUNT}-${board.initialRadius}-${minSpacing}`
}
