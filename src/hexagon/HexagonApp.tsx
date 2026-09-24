import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LANE_SPACING_MM, TRACK_SPACING_MM } from './constants'
import { drawBoardCanvas } from './drawBoard'
import { exportHexagonPdf } from './exportPdf'
import { exportHexagonSvg } from './exportSvg'
import { generateCribbageBoard } from './generateBoard'
import { diagramSizeCm, outlineFlatToFlatMm } from './geometry'
import {
  DEFAULT_LAYOUT,
  LAYOUTS,
  LAYOUT_LABELS,
  type LayoutVariant,
} from './layouts'
import {
  BOARD_REPRESENTATIONS,
  DEFAULT_REPRESENTATION,
  REPRESENTATION_LABELS,
  type BoardRepresentation,
} from './representations'

function formatMm(value: number): string {
  return value.toFixed(1)
}

export function HexagonApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<LayoutVariant>(DEFAULT_LAYOUT)
  const [representation, setRepresentation] = useState<BoardRepresentation>(DEFAULT_REPRESENTATION)
  const board = useMemo(() => generateCribbageBoard(undefined, layout), [layout])
  const { widthCm, heightCm } = diagramSizeCm(board.outline.circumradiusMm)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const padding = 32
    const availableW = Math.max(rect.width - padding, 200)
    const availableH = Math.max(rect.height - padding, 200)

    const unitsPerCm = Math.min(availableW / widthCm, availableH / heightCm) * 0.92
    const drawW = widthCm * unitsPerCm
    const drawH = heightCm * unitsPerCm

    canvas.width = drawW * dpr
    canvas.height = drawH * dpr
    canvas.style.width = `${drawW}px`
    canvas.style.height = `${drawH}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawBoardCanvas(ctx, drawW / 2, drawH / 2, board, unitsPerCm, representation)
  }, [board, representation, widthCm, heightCm])

  useEffect(() => {
    redraw()
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(redraw)
    observer.observe(container)
    return () => observer.disconnect()
  }, [redraw])

  const layoutConfig = LAYOUTS[layout]
  const holesPerLane = board.track.lanes.map((lane) =>
    lane.segments.reduce((count, segment) => count + segment.holes.length, 0),
  )

  const attributes: { label: string; value: string }[] = [
    { label: 'Outline', value: `${formatMm(board.outline.circumradiusMm)} mm` },
    { label: 'Flat-to-flat', value: `${(outlineFlatToFlatMm(board.outline.circumradiusMm) / 10).toFixed(1)} cm` },
    {
      label: 'Track',
      value: `${formatMm(board.track.outermostTrackRadiusMm)}–${formatMm(board.track.innermostTrackRadiusMm)} mm`,
    },
    { label: 'Min hole spacing', value: `${formatMm(board.track.minimumHoleSpacingMm)} mm` },
    { label: 'Track spacing', value: `${formatMm(TRACK_SPACING_MM)} mm` },
    { label: 'Lane spacing', value: `${formatMm(LANE_SPACING_MM)} mm` },
    { label: 'Holes', value: holesPerLane.join(' / ') },
    { label: 'Layout', value: LAYOUT_LABELS[layout] },
    { label: 'View', value: REPRESENTATION_LABELS[representation] },
  ]

  const attributeRows: { label: string; value: string }[][] = []
  for (let i = 0; i < attributes.length; i += 3) {
    attributeRows.push(attributes.slice(i, i + 3))
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Hex Cribbage Board</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Layout"
              className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-300 p-1"
            >
              {(Object.keys(LAYOUTS) as LayoutVariant[]).map((variant) => (
                <button
                  key={variant}
                  type="button"
                  aria-pressed={layout === variant}
                  onClick={() => setLayout(variant)}
                  className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
                    layout === variant
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {LAYOUT_LABELS[variant]}
                </button>
              ))}
            </div>
            <div
              role="group"
              aria-label="Representation"
              className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-300 p-1"
            >
              {BOARD_REPRESENTATIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={representation === option}
                  onClick={() => setRepresentation(option)}
                  className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
                    representation === option
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {REPRESENTATION_LABELS[option]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => exportHexagonPdf(layout, representation)}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              Export PDF
            </button>
            <button
              type="button"
              onClick={() => exportHexagonSvg(layout, representation)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
            >
              Export SVG
            </button>
        </div>
        <table className="mt-3 text-xs text-zinc-600">
          <caption className="sr-only">Board attributes</caption>
          <tbody>
            {attributeRows.map((row) => (
              <tr key={row.map((cell) => cell.label).join('|')}>
                {row.map((cell) => (
                  <Fragment key={cell.label}>
                    <th className="pr-2 text-left font-medium text-zinc-500">{cell.label}</th>
                    <td className="pr-6 text-zinc-800">{cell.value}</td>
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
