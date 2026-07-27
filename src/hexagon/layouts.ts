import { dodecagonalSpiral, hexagonalSpiral, type SpiralFn } from './spirals'

export type LayoutVariant = 'dodecagonal' | 'hexagonal'

export type LayoutConfig = {
  segmentsPerRound: number
  pathStartOffsetInRadians: number
  spiral: SpiralFn
}

export const LAYOUTS: Record<LayoutVariant, LayoutConfig> = {
  dodecagonal: {
    segmentsPerRound: 12,
    pathStartOffsetInRadians: 0,
    spiral: dodecagonalSpiral,
  },
  hexagonal: {
    segmentsPerRound: 12,
    pathStartOffsetInRadians: Math.PI / 6,
    spiral: hexagonalSpiral,
  },
}

export const DEFAULT_LAYOUT: LayoutVariant = 'hexagonal'

export function layoutConfig(variant: LayoutVariant): LayoutConfig {
  return LAYOUTS[variant]
}
