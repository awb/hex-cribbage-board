import { useCallback, useEffect, useRef, useState } from 'react'
import type { GridConfig, Tool } from '../types'
import { DEFAULT_COLOR } from '../types'
import { addRecentColor, createEmptyGrid, resizeGridCells } from '../utils/colors'
import { floodFill } from '../utils/floodFill'
import {
  downloadPng,
  downloadJson,
  parseProject,
  serializeProject,
} from '../utils/projectIO'

const CHECKER_LIGHT = '#e5e7eb'
const CHECKER_DARK = '#d1d5db'
const GRID_LINE = 'rgba(0, 0, 0, 0.08)'

function getCellFromEvent(
  event: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  config: GridConfig,
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const px = (event.clientX - rect.left) * scaleX
  const py = (event.clientY - rect.top) * scaleY
  const x = Math.floor(px / config.tileSize)
  const y = Math.floor(py / config.tileSize)

  if (x < 0 || x >= config.width || y < 0 || y >= config.height) {
    return null
  }

  return { x, y }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  config: GridConfig,
  cells: (string | null)[],
  showGridLines: boolean,
): void {
  const { width, height, tileSize } = config
  const canvasWidth = width * tileSize
  const canvasHeight = height * tileSize

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = cells[y * width + x]
      const px = x * tileSize
      const py = y * tileSize

      if (color) {
        ctx.fillStyle = color
        ctx.fillRect(px, py, tileSize, tileSize)
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? CHECKER_LIGHT : CHECKER_DARK
        ctx.fillRect(px, py, tileSize, tileSize)
      }
    }
  }

  if (showGridLines && tileSize >= 4) {
    ctx.strokeStyle = GRID_LINE
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 0; x <= width; x++) {
      const px = x * tileSize + 0.5
      ctx.moveTo(px, 0)
      ctx.lineTo(px, canvasHeight)
    }
    for (let y = 0; y <= height; y++) {
      const py = y * tileSize + 0.5
      ctx.moveTo(0, py)
      ctx.lineTo(canvasWidth, py)
    }
    ctx.stroke()
  }
}

export function useTiledCanvas(initialPreset = 16) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const isPaintingRef = useRef(false)
  const isErasingRef = useRef(false)
  const lastCellRef = useRef<string | null>(null)

  const [config, setConfig] = useState<GridConfig>({
    width: initialPreset,
    height: initialPreset,
    tileSize: 16,
  })
  const [cells, setCells] = useState<(string | null)[]>(() =>
    createEmptyGrid(initialPreset, initialPreset),
  )
  const [activeColor, setActiveColor] = useState(DEFAULT_COLOR)
  const [activeTool, setActiveTool] = useState<Tool>('pencil')
  const [recentColors, setRecentColors] = useState<string[]>([DEFAULT_COLOR])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawGrid(ctx, config, cells, true)
  }, [config, cells])

  useEffect(() => {
    render()
  }, [render])

  const setCell = useCallback(
    (x: number, y: number, color: string | null) => {
      setCells((prev) => {
        const index = y * config.width + x
        if (prev[index] === color) return prev
        const next = [...prev]
        next[index] = color
        return next
      })
    },
    [config.width],
  )

  const applyColor = useCallback(
    (color: string) => {
      setActiveColor(color)
      setRecentColors((prev) => addRecentColor(prev, color))
    },
    [],
  )

  const paintAt = useCallback(
    (x: number, y: number, color: string) => {
      const key = `${x},${y}`
      if (lastCellRef.current === key) return
      lastCellRef.current = key
      setCell(x, y, color)
    },
    [setCell],
  )

  const eraseAt = useCallback(
    (x: number, y: number) => {
      const key = `${x},${y}`
      if (lastCellRef.current === key) return
      lastCellRef.current = key
      setCell(x, y, null)
    },
    [setCell],
  )

  const handlePointerDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      event.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return

      const cell = getCellFromEvent(event, canvas, config)
      if (!cell) return

      if (event.button === 2) {
        isErasingRef.current = true
        lastCellRef.current = null
        eraseAt(cell.x, cell.y)
        return
      }

      if (event.button !== 0) return

      if (activeTool === 'eyedropper') {
        const index = cell.y * config.width + cell.x
        const sampled = cells[index]
        if (sampled) applyColor(sampled)
        return
      }

      if (activeTool === 'bucket') {
        setCells((prev) =>
          floodFill(prev, config.width, config.height, cell.x, cell.y, activeColor),
        )
        setRecentColors((prev) => addRecentColor(prev, activeColor))
        return
      }

      isPaintingRef.current = true
      lastCellRef.current = null
      paintAt(cell.x, cell.y, activeColor)
      setRecentColors((prev) => addRecentColor(prev, activeColor))
    },
    [
      activeColor,
      activeTool,
      applyColor,
      cells,
      config,
      eraseAt,
      paintAt,
    ],
  )

  const handlePointerMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isPaintingRef.current && !isErasingRef.current) return

      const canvas = canvasRef.current
      if (!canvas) return

      const cell = getCellFromEvent(event, canvas, config)
      if (!cell) return

      if (isErasingRef.current) {
        eraseAt(cell.x, cell.y)
      } else {
        paintAt(cell.x, cell.y, activeColor)
      }
    },
    [activeColor, config, eraseAt, paintAt],
  )

  const stopPainting = useCallback(() => {
    isPaintingRef.current = false
    isErasingRef.current = false
    lastCellRef.current = null
  }, [])

  useEffect(() => {
    window.addEventListener('mouseup', stopPainting)
    return () => window.removeEventListener('mouseup', stopPainting)
  }, [stopPainting])

  const setGridPreset = useCallback(
    (size: number) => {
      setConfig((prev) => {
        setCells((current) =>
          resizeGridCells(current, prev.width, prev.height, size, size),
        )
        return { ...prev, width: size, height: size }
      })
    },
    [],
  )

  const setTileSize = useCallback((tileSize: number) => {
    setConfig((prev) => ({ ...prev, tileSize }))
  }, [])

  const clearGrid = useCallback(() => {
    setCells(createEmptyGrid(config.width, config.height))
  }, [config.width, config.height])

  const exportPng = useCallback(() => {
    const offscreen = exportCanvasRef.current ?? document.createElement('canvas')
    exportCanvasRef.current = offscreen

    offscreen.width = config.width * config.tileSize
    offscreen.height = config.height * config.tileSize

    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    drawGrid(ctx, config, cells, false)
    downloadPng('tile-art.png', offscreen)
  }, [config, cells])

  const saveProject = useCallback(() => {
    downloadJson('tile-project.json', serializeProject(config, cells))
  }, [config, cells])

  const loadProject = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = parseProject(JSON.parse(reader.result as string))
        setConfig(parsed.config)
        setCells(parsed.cells)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load project'
        alert(message)
      }
    }
    reader.readAsText(file)
  }, [])

  const cursorClass =
    activeTool === 'eyedropper'
      ? 'cursor-crosshair'
      : activeTool === 'bucket'
        ? 'cursor-cell'
        : 'cursor-pointer'

  return {
    canvasRef,
    config,
    cells,
    activeColor,
    activeTool,
    recentColors,
    cursorClass,
    setActiveColor: applyColor,
    setActiveTool,
    setGridPreset,
    setTileSize,
    clearGrid,
    handlePointerDown,
    handlePointerMove,
    stopPainting,
    exportPng,
    saveProject,
    loadProject,
  }
}

export type UseTiledCanvasReturn = ReturnType<typeof useTiledCanvas>
