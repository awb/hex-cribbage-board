import type { LayoutVariant } from './layouts'

export type PolarPoint = {
  r: number
  theta: number
}

export type Segment = {
  holes: PolarPoint[]
  start: PolarPoint
  end: PolarPoint
  minimumHoleSpacingMm: number
}

export type Lane = {
  segments: Segment[]
  bgColor: string
  minimumHoleSpacingMm: number
}

export type Track = {
  lanes: Lane[]
  minimumHoleSpacingMm: number
  outermostTrackRadiusMm: number
  innermostTrackRadiusMm: number
}

export type BoardOutline = {
  vertices: PolarPoint[]
  innerBoardRadius: number
  sectionLines: { start: PolarPoint; end: PolarPoint }[]
}

export type CribbageBoard = {
  initialRadius: number
  layout: LayoutVariant
  outline: BoardOutline
  track: Track
}

export type CartesianPoint = {
  x: number
  y: number
}
