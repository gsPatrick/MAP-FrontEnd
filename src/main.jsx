// src/main.jsx
// Patch oficial p/ antd v5 funcionar com React 19 (Modal.confirm, message,
// notification estáticos). Sem isso, os métodos estáticos NÃO renderizam.
import '@ant-design/v5-patch-for-react-19';
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css' // Importando estilos globais
import { ProfileProvider } from './contexts/ProfileContext'; // <<< IMPORTAR AQUI
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ProfileProvider> {/* <<< ENVOLVER O APP AQUI */}
          <App />
        </ProfileProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
)