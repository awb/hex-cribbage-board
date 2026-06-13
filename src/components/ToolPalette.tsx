import type { Tool } from '../types'

const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'pencil', label: 'Pencil', icon: '✏️' },
  { id: 'bucket', label: 'Bucket', icon: '🪣' },
  { id: 'eyedropper', label: 'Eyedropper', icon: '💧' },
]

interface ToolPaletteProps {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
}

export function ToolPalette({ activeTool, onToolChange }: ToolPaletteProps) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Tools
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {TOOLS.map((tool) => {
          const isActive = activeTool === tool.id
          return (
            <button
              key={tool.id}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={isActive}
              onClick={() => onToolChange(tool.id)}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-sm transition-colors ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-700'
              }`}
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {tool.icon}
              </span>
              <span className="text-xs font-medium">{tool.label}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Left-click drag to paint · Right-click drag to erase
      </p>
    </section>
  )
}
