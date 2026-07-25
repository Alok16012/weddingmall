import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { assertNoSecretKey } from '@/lib/env'

// Security guard: refuse to boot if a service/secret key leaked into the client bundle.
assertNoSecretKey()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
