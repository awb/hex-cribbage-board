import type { UseTiledCanvasReturn } from '../hooks/useTiledCanvas'

interface TiledCanvasProps {
  canvas: UseTiledCanvasReturn
}

export function TiledCanvas({ canvas }: TiledCanvasProps) {
  const { config, canvasRef, cursorClass, handlePointerDown, handlePointerMove, stopPainting } =
    canvas

  const pixelWidth = config.width * config.tileSize
  const pixelHeight = config.height * config.tileSize

  return (
    <div className="flex flex-1 items-center justify-center overflow-auto rounded-xl border border-zinc-200 bg-zinc-100 p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <div
        className="shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-700"
        style={{ lineHeight: 0 }}
      >
        <canvas
          ref={canvasRef}
          width={pixelWidth}
          height={pixelHeight}
          className={`block max-w-full ${cursorClass}`}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={stopPainting}
          onMouseLeave={stopPainting}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    </div>
  )
}
