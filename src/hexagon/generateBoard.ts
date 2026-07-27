import { INITIAL_RADIUS, TRACK_LENGTH, TURN_DELTA_RADIUS } from './constants'
import { generateBoardOutline } from './generateBoardOutline'
import { generateTrack } from './generateTrack'
import { DEFAULT_LAYOUT, layoutConfig, type LayoutVariant } from './layouts'
import type { CribbageBoard } from './types'

export function generateCribbageBoard(
  initialRadius: number = INITIAL_RADIUS,
  layout: LayoutVariant = DEFAULT_LAYOUT,
): CribbageBoard {
  const track = generateTrack(
    { r: initialRadius, theta: 0 },
    TRACK_LENGTH,
    TURN_DELTA_RADIUS,
    layoutConfig(layout),
  )

  return {
    initialRadius,
    layout,
    outline: generateBoardOutline(track),
    track,
  }
}

export function boardHoles(board: CribbageBoard) {
  return board.track.lanes.flatMap((lane) =>
    lane.segments.flatMap((segment) => segment.holes),
  )
}
