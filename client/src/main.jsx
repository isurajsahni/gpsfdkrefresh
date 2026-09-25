// First, so storage is usable before any other module runs
import './utils/storageFallback'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { reloadForNewBuild } from './utils/staleBuild'

// A page file failed to load, usually because a deploy replaced it while this
// tab was open. Reload into the new build instead of showing the error screen.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewBuild()) event.preventDefault()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
