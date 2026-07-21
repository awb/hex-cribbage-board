export type PolarPoint = {
  r: number
  theta: number
}

export type Segment = {
  holes: PolarPoint[]
  start: PolarPoint
  end: PolarPoint
}

export type Lane = {
  segments: Segment[]
  bgColor: string
}

export type Track = {
  lanes: Lane[]
}

export type CribbageBoard = {
  initialRadius: number
  track: Track
}

export type CartesianPoint = {
  x: number
  y: number
}
