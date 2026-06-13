import type { UseTiledCanvasReturn } from '../hooks/useTiledCanvas'
import { ColorPickerSection } from './ColorPickerSection'
import { FileActions } from './FileActions'
import { GridControls } from './GridControls'
import { ToolPalette } from './ToolPalette'

interface SidebarProps {
  canvas: UseTiledCanvasReturn
}

export function Sidebar({ canvas }: SidebarProps) {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-6 overflow-y-auto border-r border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <header>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Tile Designer
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {canvas.config.width}×{canvas.config.height} · {canvas.config.tileSize}px tiles
        </p>
      </header>

      <ToolPalette
        activeTool={canvas.activeTool}
        onToolChange={canvas.setActiveTool}
      />

      <ColorPickerSection
        activeColor={canvas.activeColor}
        recentColors={canvas.recentColors}
        onColorChange={canvas.setActiveColor}
      />

      <GridControls
        config={canvas.config}
        onPresetChange={canvas.setGridPreset}
        onTileSizeChange={canvas.setTileSize}
        onClear={canvas.clearGrid}
      />

      <FileActions
        onExportPng={canvas.exportPng}
        onSaveProject={canvas.saveProject}
        onLoadProject={canvas.loadProject}
      />
    </aside>
  )
}
