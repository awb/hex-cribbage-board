import { OUTLINE_RADIUS_MM } from './constants'

const OUTLINE_RADIUS_CM = OUTLINE_RADIUS_MM / 10

/** Pointy-top hexagon: flat-to-flat distance equals sqrt(3) * circumradius. */
export const OUTLINE_FLAT_TO_FLAT_CM = OUTLINE_RADIUS_CM * Math.sqrt(3)

export const DIAGRAM_WIDTH_CM = OUTLINE_FLAT_TO_FLAT_CM
export const DIAGRAM_HEIGHT_CM = 2 * OUTLINE_RADIUS_CM

export const LINE_COLOR = '#18181b'

/** Board outline and section line stroke width in CSS pixels. */
export const BOARD_OUTLINE_LINE_WIDTH_PX = 2

/** Same stroke width for PDF export (mm at 96 dpi). */
export const BOARD_OUTLINE_LINE_WIDTH_MM = (BOARD_OUTLINE_LINE_WIDTH_PX * 25.4) / 96
