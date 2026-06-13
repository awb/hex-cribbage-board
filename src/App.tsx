import { useTiledCanvas } from './hooks/useTiledCanvas'
import { AppLayout } from './components/AppLayout'

function App() {
  const canvas = useTiledCanvas(16)

  return <AppLayout canvas={canvas} />
}

export default App
