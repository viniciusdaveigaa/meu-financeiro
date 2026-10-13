import { createRoot } from 'react-dom/client'
import './styles.css'
import { initTheme } from './utils/theme.js'
import App from './App.jsx'

// Inicializa as cores personalizadas imediatamente antes de montar a UI
initTheme()

createRoot(document.getElementById('root')).render(<App />)

