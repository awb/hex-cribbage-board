import { dodecagonalSpiral, hexagonalSpiralFromMidSides, hexagonalSpiralFromVertices, type SpiralFn } from './spirals'

export type LayoutVariant = 'dodecagonal' | 'hexagonal' | 'hexagonal2'

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
  hexagonal2: {
    segmentsPerRound: 12,
    pathStartOffsetInRadians: 3*Math.PI / 6,
    spiral: hexagonalSpiralFromVertices,
  },
}

export const DEFAULT_LAYOUT: LayoutVariant = 'hexagonal2'

export function layoutConfig(variant: LayoutVariant): LayoutConfig {
  return LAYOUTS[variant]
}
export const LAYOUT_LABELS: Record<LayoutVariant, string> = {
  dodecagonal: 'Dodecagonal',
  hexagonal: 'Hexagonal',
  hexagonal2: 'Hexagonal 2',
}
