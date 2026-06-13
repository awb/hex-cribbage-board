import { useRef } from 'react'

interface FileActionsProps {
  onExportPng: () => void
  onSaveProject: () => void
  onLoadProject: (file: File) => void
}

export function FileActions({
  onExportPng,
  onSaveProject,
  onLoadProject,
}: FileActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Export / Import
      </h2>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onExportPng}
          className="w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Export PNG
        </button>

        <button
          type="button"
          onClick={onSaveProject}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Save Project
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Load Project
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onLoadProject(file)
            e.target.value = ''
          }}
        />
      </div>
    </section>
  )
}
