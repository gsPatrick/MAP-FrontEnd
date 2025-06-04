// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css' // Importando estilos globais
import { ProfileProvider } from './contexts/ProfileContext'; // <<< IMPORTAR AQUI

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProfileProvider> {/* <<< ENVOLVER O APP AQUI */}
        <App />
      </ProfileProvider>
    </BrowserRouter>
  </React.StrictMode>
)