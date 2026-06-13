import type { GridConfig, ProjectData } from '../types'

export function serializeProject(
  config: GridConfig,
  cells: (string | null)[],
): ProjectData {
  return {
    version: 1,
    width: config.width,
    height: config.height,
    tileSize: config.tileSize,
    cells,
  }
}

export function parseProject(data: unknown): {
  config: GridConfig
  cells: (string | null)[]
} {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid project file')
  }

  const project = data as Partial<ProjectData>

  if (
    project.version !== 1 ||
    typeof project.width !== 'number' ||
    typeof project.height !== 'number' ||
    typeof project.tileSize !== 'number' ||
    !Array.isArray(project.cells)
  ) {
    throw new Error('Unsupported or corrupt project format')
  }

  const expectedLength = project.width * project.height
  if (project.cells.length !== expectedLength) {
    throw new Error('Cell data does not match grid dimensions')
  }

  return {
    config: {
      width: project.width,
      height: project.height,
      tileSize: project.tileSize,
    },
    cells: project.cells.map((cell) =>
      cell === null || typeof cell === 'string' ? cell : null,
    ),
  }
}

export function downloadJson(filename: string, data: ProjectData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  triggerDownload(filename, blob)
}

export function downloadPng(filename: string, canvas: HTMLCanvasElement): void {
  canvas.toBlob((blob) => {
    if (blob) triggerDownload(filename, blob)
  }, 'image/png')
}

function triggerDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
