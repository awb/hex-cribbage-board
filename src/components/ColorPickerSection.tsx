import { useState } from 'react'

interface ColorPickerSectionProps {
  activeColor: string
  recentColors: string[]
  onColorChange: (color: string) => void
}

export function ColorPickerSection({
  activeColor,
  recentColors,
  onColorChange,
}: ColorPickerSectionProps) {
  const [hexDraft, setHexDraft] = useState<string | null>(null)
  const hexInput = hexDraft ?? activeColor

  const commitHex = (value: string) => {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      onColorChange(value)
    }
    setHexDraft(null)
  }

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Color
      </h2>

      <div className="flex items-center gap-3">
        <label className="relative block h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-600">
          <span
            className="absolute inset-0"
            style={{ backgroundColor: activeColor }}
            aria-hidden="true"
          />
          <input
            type="color"
            value={activeColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Pick color"
          />
        </label>

        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Hex
          </label>
          <input
            type="text"
            value={hexInput}
            onFocus={() => setHexDraft(activeColor)}
            onChange={(e) => setHexDraft(e.target.value)}
            onBlur={() => commitHex(hexInput)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitHex(hexInput)
            }}
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-sm text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
          Recent colors
        </p>
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 8 }, (_, i) => {
            const color = recentColors[i]
            return (
              <button
                key={i}
                type="button"
                disabled={!color}
                title={color ?? 'Empty slot'}
                aria-label={color ? `Select ${color}` : 'Empty color slot'}
                onClick={() => color && onColorChange(color)}
                className={`aspect-square rounded-md border transition-transform ${
                  color
                    ? 'border-zinc-300 hover:scale-105 dark:border-zinc-600'
                    : 'border-dashed border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50'
                } ${color && color.toLowerCase() === activeColor.toLowerCase() ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-zinc-900' : ''}`}
                style={color ? { backgroundColor: color } : undefined}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
