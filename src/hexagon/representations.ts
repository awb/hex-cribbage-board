export type BoardRepresentation = 'drill-template' | 'color' | 'lined'

export const BOARD_REPRESENTATIONS: BoardRepresentation[] = [
  'drill-template',
  'color',
  'lined',
]

export const REPRESENTATION_LABELS: Record<BoardRepresentation, string> = {
  'drill-template': 'Drill template',
  color: 'Color',
  lined: 'Lined',
}

export const DEFAULT_REPRESENTATION: BoardRepresentation = 'color'
