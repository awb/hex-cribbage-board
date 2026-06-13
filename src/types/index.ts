export type Tool = 'pencil' | 'bucket' | 'eyedropper'

export type GridPreset = 16 | 32 | 64

export interface GridConfig {
  width: number
  height: number
  tileSize: number
}

export interface ProjectData {
  version: 1
  width: number
  height: number
  tileSize: number
  cells: (string | null)[]
}

export interface TiledCanvasState {
  config: GridConfig
  cells: (string | null)[]
  activeColor: string
  activeTool: Tool
  recentColors: string[]
}

export const GRID_PRESETS: GridPreset[] = [16, 32, 64]
export const TILE_SIZE_OPTIONS = [8, 12, 16, 24, 32] as const
export const MAX_RECENT_COLORS = 8
export const DEFAULT_COLOR = '#6366f1'
export const TRANSPARENT = null
