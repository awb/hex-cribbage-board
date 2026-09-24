/** Pointy-top hexagon: flat-to-flat distance equals sqrt(3) * circumradius. */
export function outlineFlatToFlatMm(circumradiusMm: number): number {
  return circumradiusMm * Math.sqrt(3)
}

export function diagramSizeCm(circumradiusMm: number): { widthCm: number; heightCm: number } {
  const radiusCm = circumradiusMm / 10
  return {
    widthCm: radiusCm * Math.sqrt(3),
    heightCm: 2 * radiusCm,
  }
}

export const LINE_COLOR = '#18181b'

/** Light grey for the three lines that trisect the board outline. */
export const SECTION_LINE_COLOR = '#e4e4e7'

/** Rotate the board drawing 30° counter-clockwise on the page. */
export const BOARD_DRAWING_ROTATION_RAD = -Math.PI / 6

export const LANE_SPIRAL_LINE_COLOR = '#a1a1aa'

/** Board outline and section line stroke width in CSS pixels. */
export const BOARD_OUTLINE_LINE_WIDTH_PX = 2

/** Same stroke width for PDF export (mm at 96 dpi). */
export const BOARD_OUTLINE_LINE_WIDTH_MM = (BOARD_OUTLINE_LINE_WIDTH_PX * 25.4) / 96
