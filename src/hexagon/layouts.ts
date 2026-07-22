export type LayoutVariant = 'dodecagonal' | 'hexagonal'

export type LayoutConfig = {
  segmentsPerRound: number
  holesPerSegment: number
}

export const LAYOUTS: Record<LayoutVariant, LayoutConfig> = {
  dodecagonal: { segmentsPerRound: 12, holesPerSegment: 5 },
  hexagonal: { segmentsPerRound: 6, holesPerSegment: 10 },
}

export const DEFAULT_LAYOUT: LayoutVariant = 'dodecagonal'

export function layoutConfig(variant: LayoutVariant): LayoutConfig {
  return LAYOUTS[variant]
}
