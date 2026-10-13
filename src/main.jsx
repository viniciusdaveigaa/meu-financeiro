import { createRoot } from 'react-dom/client'
import './styles.css'
import { initTheme } from './utils/theme.js'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import App from './App.jsx'

// Inicializa as cores personalizadas imediatamente antes de montar a UI
initTheme()

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)

