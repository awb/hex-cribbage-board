import { MAX_RECENT_COLORS } from '../types'

export function addRecentColor(recent: string[], color: string): string[] {
  const normalized = color.toLowerCase()
  const filtered = recent.filter((c) => c.toLowerCase() !== normalized)
  return [color, ...filtered].slice(0, MAX_RECENT_COLORS)
}

export function createEmptyGrid(width: number, height: number): (string | null)[] {
  return Array.from({ length: width * height }, () => null)
}

export function resizeGridCells(
  cells: (string | null)[],
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number,
): (string | null)[] {
  const next = createEmptyGrid(newWidth, newHeight)
  const copyWidth = Math.min(oldWidth, newWidth)
  const copyHeight = Math.min(oldHeight, newHeight)

  for (let y = 0; y < copyHeight; y++) {
    for (let x = 0; x < copyWidth; x++) {
      next[y * newWidth + x] = cells[y * oldWidth + x]
    }
  }

  return next
}
