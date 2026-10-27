/** Flat-top hexagon: flat-to-flat distance equals sqrt(3) * circumradius. */
export function outlineFlatToFlatMm(circumradiusMm: number): number {
  return circumradiusMm * Math.sqrt(3)
}

export function diagramSizeCm(circumradiusMm: number): { widthCm: number; heightCm: number } {
  const radiusCm = circumradiusMm / 10
  return {
    widthCm: 2 * radiusCm,
    heightCm: radiusCm * Math.sqrt(3),
  }
}

export const LINE_COLOR = '#0000ff'

/** Board outline hexagon stroke. */
export const BOARD_OUTLINE_COLOR = '#ff0000'

/** Grey 2 mm section lines through the board outline. */
export const SECTION_LINE_COLOR = '#a1a1aa'
export const SECTION_LINE_STROKE_MM = 2

/** Rotate the board π/3 counter-clockwise from the previous pointy-top page orientation. */
export const BOARD_DRAWING_ROTATION_RAD = -Math.PI / 2

/** Extra clockwise rotation of the track relative to the outline. */
export const TRACK_ROTATION_RAD = Math.PI / 6

export const LANE_SPIRAL_LINE_COLOR = '#a1a1aa'

/** Board outline and section line stroke width in CSS pixels. */
export const BOARD_OUTLINE_LINE_WIDTH_PX = 2

/** Same stroke width for PDF export (mm at 96 dpi). */
export const BOARD_OUTLINE_LINE_WIDTH_MM = (BOARD_OUTLINE_LINE_WIDTH_PX * 25.4) / 96
