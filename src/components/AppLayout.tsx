import type { UseTiledCanvasReturn } from '../hooks/useTiledCanvas'
import { Sidebar } from './Sidebar'
import { TiledCanvas } from './TiledCanvas'

interface AppLayoutProps {
  canvas: UseTiledCanvasReturn
}

export function AppLayout({ canvas }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar canvas={canvas} />
      <main className="flex min-w-0 flex-1 flex-col p-4">
        <TiledCanvas canvas={canvas} />
      </main>
    </div>
  )
}
