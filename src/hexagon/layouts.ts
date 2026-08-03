import { dodecagonalSpiral, hexagonalSpiralFromMidSides, hexagonalSpiralFromVertices, type SpiralFn } from './spirals'

export type LayoutVariant = 'dodecagonal' | 'hexagonal'

export type LayoutConfig = {
  segmentsPerRound: number
  pathStartOffsetInRadians: number
  spiral: SpiralFn
}

export const LAYOUTS: Record<LayoutVariant, LayoutConfig> = {
  dodecagonal: {
    segmentsPerRound: 12,
    pathStartOffsetInRadians: Math.PI / 6,
    spiral: dodecagonalSpiral,
  },
  hexagonal: {
    segmentsPerRound: 12,
    pathStartOffsetInRadians: Math.PI / 6,
    spiral: hexagonalSpiralFromMidSides,
  },
  hexagonalFromVertices: {
    segmentsPerRound: 12,
    pathStartOffsetInRadians: 3*Math.PI / 6,
    spiral: hexagonalSpiralFromVertices,
  },
}

export const DEFAULT_LAYOUT: LayoutVariant = 'hexagonal'

export function layoutConfig(variant: LayoutVariant): LayoutConfig {
  return LAYOUTS[variant]
}
