import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { obtenerTemaInicial } from './hooks/useTema'

document.documentElement.setAttribute('data-tema', obtenerTemaInicial())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
