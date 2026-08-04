export const LANE_SPACING = 5
export const TRACK_SPACING = 0.6 * LANE_SPACING

/** Outer board hexagon circumradius in mm (vertex at theta = 0). */
export const OUTLINE_RADIUS_MM = 120

/** Outermost lane start radius: at least 2× track spacing inside the board outline. */
export const INITIAL_RADIUS = OUTLINE_RADIUS_MM - 2 * TRACK_SPACING

export const TRACK_LENGTH = 120
export const PADDING = 2
export const HOLES_PER_GROUP = 5

/** Every spiral must yield this many vertices (24 segments × 5 holes = 120 holes). */
export const SPIRAL_VERTEX_COUNT = TRACK_LENGTH / HOLES_PER_GROUP + 1

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
