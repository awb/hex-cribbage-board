import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { OUTLINE_RADIUS_MM, TRACK_LENGTH } from './constants'
import { drawBoardCanvas } from './drawBoard'
import { exportHexagonPdf } from './exportPdf'
import { exportHexagonSvg } from './exportSvg'
import { generateCribbageBoard } from './generateBoard'
import {
  DEFAULT_LAYOUT,
  LAYOUTS,
  type LayoutVariant,
} from './layouts'
import { DIAGRAM_HEIGHT_CM, DIAGRAM_WIDTH_CM, OUTLINE_FLAT_TO_FLAT_CM } from './geometry'
import {
  BOARD_REPRESENTATIONS,
  DEFAULT_REPRESENTATION,
  REPRESENTATION_LABELS,
  type BoardRepresentation,
} from './representations'

const LAYOUT_LABELS: Record<LayoutVariant, string> = {
  dodecagonal: 'Dodecagonal',
  hexagonal: 'Hexagonal',
  hexagonalFromVertices: 'Hexagonal 2',
}

function formatMm(value: number): string {
  return value.toFixed(1)
}

export function HexagonApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<LayoutVariant>(DEFAULT_LAYOUT)
  const [representation, setRepresentation] = useState<BoardRepresentation>(DEFAULT_REPRESENTATION)
  const board = useMemo(() => generateCribbageBoard(undefined, layout), [layout])

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
    drawBoardCanvas(ctx, drawW / 2, drawH / 2, board, unitsPerCm, representation)
  }, [board, representation])

  useEffect(() => {
    redraw()
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(redraw)
    observer.observe(container)
    return () => observer.disconnect()
  }, [redraw])

  const layoutConfig = LAYOUTS[layout]

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 text-zinc-900">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Hex Cribbage Board</h1>
          <p className="text-sm text-zinc-500">
            {formatMm(OUTLINE_RADIUS_MM)}&nbsp;mm outline circumradius ·{' '}
            {OUTLINE_FLAT_TO_FLAT_CM.toFixed(1)}&nbsp;cm flat-to-flat · track{' '}
            {formatMm(board.track.outermostTrackRadiusMm)}–{formatMm(board.track.innermostTrackRadiusMm)}
            &nbsp;mm · min hole spacing {formatMm(board.track.minimumHoleSpacingMm)}&nbsp;mm ·{' '}
            {TRACK_LENGTH} holes × 3 lanes · {LAYOUT_LABELS[layout].toLowerCase()} layout ·{' '}
            {REPRESENTATION_LABELS[representation].toLowerCase()} view
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <fieldset className="flex items-center gap-1 rounded-lg border border-zinc-300 p-1">
            <legend className="sr-only">Layout</legend>
            {(Object.keys(LAYOUTS) as LayoutVariant[]).map((variant) => (
              <button
                key={variant}
                type="button"
                aria-pressed={layout === variant}
                onClick={() => setLayout(variant)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  layout === variant
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {LAYOUT_LABELS[variant]}
              </button>
            ))}
          </fieldset>
          <fieldset className="flex items-center gap-1 rounded-lg border border-zinc-300 p-1">
            <legend className="sr-only">Representation</legend>
            {BOARD_REPRESENTATIONS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={representation === option}
                onClick={() => setRepresentation(option)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  representation === option
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {REPRESENTATION_LABELS[option]}
              </button>
            ))}
          </fieldset>
          <button
            type="button"
            onClick={() => exportHexagonPdf(layout, representation)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={() => exportHexagonSvg(layout, representation)}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
          >
            Export SVG
          </button>
        </div>
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
      <p className="sr-only">
        {layoutConfig.segmentsPerRound} segments per turn, path offset{' '}
        {layoutConfig.pathStartOffsetInRadians} radians, {representation} representation
      </p>
    </div>
  )
}
