import { GRID_PRESETS, TILE_SIZE_OPTIONS } from '../types'
import type { GridConfig } from '../types'

interface GridControlsProps {
  config: GridConfig
  onPresetChange: (size: number) => void
  onTileSizeChange: (size: number) => void
  onClear: () => void
}

export function GridControls({
  config,
  onPresetChange,
  onTileSizeChange,
  onClear,
}: GridControlsProps) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Grid
      </h2>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Grid size
          </p>
          <div className="grid grid-cols-3 gap-2">
            {GRID_PRESETS.map((preset) => {
              const isActive = config.width === preset && config.height === preset
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onPresetChange(preset)}
                  className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  {preset}×{preset}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="tile-size"
            className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-300"
          >
            Tile size ({config.tileSize}px)
          </label>
          <select
            id="tile-size"
            value={config.tileSize}
            onChange={(e) => onTileSizeChange(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {TILE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Clear canvas
        </button>
      </div>
    </section>
  )
}
