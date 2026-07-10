import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { HexagonApp } from './HexagonApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HexagonApp />
  </StrictMode>,
)
