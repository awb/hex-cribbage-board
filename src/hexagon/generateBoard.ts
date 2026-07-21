import { INITIAL_RADIUS, TRACK_LENGTH, TRACK_SPACING } from './constants'
import { generateTrack } from './generateTrack'
import type { CribbageBoard } from './types'

export function generateCribbageBoard(initialRadius: number = INITIAL_RADIUS): CribbageBoard {
  const track = generateTrack({ r: initialRadius, theta: 0 }, TRACK_LENGTH, TRACK_SPACING)

  return {
    initialRadius,
    track,
  }
}

export function boardHoles(board: CribbageBoard) {
  return board.track.lanes.flatMap((lane) =>
    lane.segments.flatMap((segment) => segment.holes),
  )
}
