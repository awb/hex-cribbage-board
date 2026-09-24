export type BoardRepresentation = 'drill-template' | 'color' | 'lined' | 'artwork'

export const BOARD_REPRESENTATIONS: BoardRepresentation[] = [
  'drill-template',
  'color',
  'lined',
  'artwork',
]

export const REPRESENTATION_LABELS: Record<BoardRepresentation, string> = {
  'drill-template': 'Drill template',
  color: 'Color',
  lined: 'Lined',
  artwork: 'Artwork',
}

export const DEFAULT_REPRESENTATION: BoardRepresentation = 'color'
