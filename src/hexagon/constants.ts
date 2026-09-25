export const LANE_SPACING_MM = 7
export const TRACK_SPACING_MM = 1.4 * LANE_SPACING_MM

/** Outermost lane start radius in mm. */
export const INITIAL_RADIUS_MM = 150 - 1 * TRACK_SPACING_MM

export const TRACK_LENGTH_HOLES = 120
export const PADDING = 1.6
export const HOLES_PER_GROUP = 5

/** 0-based indices of holes kept on the starter segment (3rd and 4th of 5). */
export const STARTER_HOLE_INDICES = [2, 3] as const

/** 0-based indices of holes kept on the center-lane finish segment (3rd of 5). */
export const FINISH_HOLE_INDICES = [2] as const

/** Scoring-track vertices (24 segments × 5 holes = 120 holes). */
export const SPIRAL_VERTEX_COUNT = TRACK_LENGTH_HOLES / HOLES_PER_GROUP + 1

/** Includes the extra vertex for the starter segment at the beginning of each lane. */
export const LANE_VERTEX_COUNT = SPIRAL_VERTEX_COUNT + 1

export const HOLE_DIAMETER_MM = 3
export const HOLE_CROSS_LENGTH_MM = 4

export const LANE_COUNT = 3
export const CENTER_LANE_INDEX = 1

/** Radial drop per full turn: room for all lanes plus gap before the next turn. */
export const TURN_DELTA_RADIUS_MM = LANE_COUNT * LANE_SPACING_MM + TRACK_SPACING_MM

/** Regular hexagon: distance from center to a flat is √3/2 × side. */
export const HEX_INRADIUS_PER_SIDE = Math.sqrt(3) / 2

/** Lane background fills at 50% opacity (red, green, blue). */
export const LANE_BACKGROUND_COLORS = [
  'rgba(239, 68, 68, 0.5)',
  'rgba(34, 197, 94, 0.5)',
  'rgba(59, 130, 246, 0.5)',
] as const

/** Artwork: trapezoid around the last two READY holes of each segment. */
export const READY_BOX_STROKE_COLOR = '#2563eb'
export const READY_BOX_FILL_COLOR = 'rgba(37, 99, 235, 0.12)'
export const READY_BOX_PADDING_MM = 3

/** Artwork: WINNER circle on the second hole of the first lane. */
export const WINNER_CIRCLE_STROKE_COLOR = '#ca8a04'
export const WINNER_CIRCLE_STROKE_MM = 2

/** Artwork: thin line through each 5-hole group. */
export const LANE_LINE_COLOR = '#a1a1aa'
export const LANE_LINE_STROKE_MM = 0.35
export const LANE_LINE_PADDING_MM = 1.5

/** Artwork: center logo hexagon. */
export const LOGO_SIDE_MM = 40
export const LOGO_STROKE_COLOR = '#18181b'
export const LOGO_STROKE_MM = 0.6
export const LOGO_TRISECT_THETAS = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3] as const
