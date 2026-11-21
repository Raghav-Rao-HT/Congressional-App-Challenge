import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { ConfigError } from './components/ConfigError.tsx'
import { missingFirebaseConfig } from './lib/firebaseConfig.ts'

async function start() {
  const root = createRoot(document.getElementById('root')!)

  // If the Firebase settings are missing from this build, say so on screen. Loading the app would throw before React
  // mounts and leave a blank white page, so App and AuthProvider (which load Firebase) are imported only when it is safe.
  const missing = missingFirebaseConfig()
  if (missing.length > 0) {
    root.render(
      <StrictMode>
        <ConfigError missing={missing} />
      </StrictMode>,
    )
    return
  }

  const [{ default: App }, { AuthProvider }] = await Promise.all([import('./App.tsx'), import('./context/AuthProvider.tsx')])
  root.render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}

void start()
