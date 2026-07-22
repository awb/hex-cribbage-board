/** Outer track start radius in mm; polar theta = 0 at the first hex vertex. */
export const INITIAL_RADIUS = 100

export const LANE_SPACING = 5
export const TRACK_SPACING = 0.5 * LANE_SPACING

export const TRACK_LENGTH = 120
export const PADDING = 1.5
export const HOLES_PER_GROUP = 5

export const HOLE_DIAMETER_MM = 3
export const HOLE_CROSS_LENGTH_MM = 4

export const LANE_COUNT = 3

/** Radial drop per full turn: room for all lanes plus gap before the next turn. */
export const TURN_DELTA_RADIUS = LANE_COUNT * LANE_SPACING + TRACK_SPACING

/** Lane background fills at 50% opacity (red, green, blue). */
export const LANE_BACKGROUND_COLORS = [
  'rgba(239, 68, 68, 0.5)',
  'rgba(34, 197, 94, 0.5)',
  'rgba(59, 130, 246, 0.5)',
] as const
