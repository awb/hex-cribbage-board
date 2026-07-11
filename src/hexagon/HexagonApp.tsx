import { useCallback, useEffect, useRef } from 'react'
import { drawHexagonDiagram } from './drawDiagram'
import { exportHexagonPdf } from './exportPdf'
import {
  DIAGRAM_HEIGHT_CM,
  DIAGRAM_WIDTH_CM,
  RADIAL_LINE_COUNT,
  RING_FLAT_TO_FLAT_CM,
} from './geometry'

function formatRingSizes(): string {
  return RING_FLAT_TO_FLAT_CM.map((size) => size.toFixed(1)).join(', ')
}

export function HexagonApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const padding = 32
    const availableW = Math.max(rect.width - padding, 200)
    const availableH = Math.max(rect.height - padding, 200)

    const unitsPerCm = Math.min(availableW / DIAGRAM_WIDTH_CM, availableH / DIAGRAM_HEIGHT_CM) * 0.92
    const drawW = DIAGRAM_WIDTH_CM * unitsPerCm
    const drawH = DIAGRAM_HEIGHT_CM * unitsPerCm

    canvas.width = drawW * dpr
    canvas.height = drawH * dpr
    canvas.style.width = `${drawW}px`
    canvas.style.height = `${drawH}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawHexagonDiagram(ctx, drawW / 2, drawH / 2, unitsPerCm)
  }, [])

  useEffect(() => {
    redraw()
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(redraw)
    observer.observe(container)
    return () => observer.disconnect()
  }, [redraw])

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 text-zinc-900">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Hex Cribbage Board</h1>
          <p className="text-sm text-zinc-500">
            6 concentric hexagons ({formatRingSizes()}&nbsp;cm flat-to-flat) ·{' '}
            {RADIAL_LINE_COUNT} radial lines · print-ready PDF
          </p>
        </div>
        <button
          type="button"
          onClick={exportHexagonPdf}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Export PDF
        </button>
      </header>

      <main
        ref={containerRef}
        className="flex flex-1 items-center justify-center p-6"
      >
        <canvas
          ref={canvasRef}
          className="rounded-lg border border-zinc-200 bg-white shadow-sm"
        />
      </main>
    </div>
  )
}
