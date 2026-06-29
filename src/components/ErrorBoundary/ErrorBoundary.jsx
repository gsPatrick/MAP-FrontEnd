// src/components/ErrorBoundary/ErrorBoundary.jsx
import React from 'react';

// Detecta erros de carregamento de chunk (build antigo em cache após deploy).
const isChunkError = (error) => {
  const msg = (error && (error.message || String(error))) || '';
  return /Loading chunk|dynamically imported module|Failed to fetch dynamically|Importing a module script failed|ChunkLoadError/i.test(msg);
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, isChunk: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, isChunk: isChunkError(error) };
  }

  componentDidCatch(error) {
    // Em erro de chunk, recarrega 1x automaticamente para pegar o build novo.
    if (isChunkError(error) && !sessionStorage.getItem('__chunkReloaded')) {
      sessionStorage.setItem('__chunkReloaded', '1');
      window.location.reload();
      return;
    }
    console.error('[ErrorBoundary] Erro capturado:', error);
  }

  handleReload = () => {
    sessionStorage.removeItem('__chunkReloaded');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Para erro de chunk já estamos recarregando; não mostra nada para não piscar.
      if (this.state.isChunk) return null;
      return (
        <div style={{
          minHeight: '60vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center',
          fontFamily: 'Inter, sans-serif', color: '#2c3e50'
        }}>
          <h2 style={{ margin: 0 }}>Ops, algo deu errado nesta tela.</h2>
          <p style={{ color: '#7f8c8d', margin: 0 }}>Tente recarregar a página. Se persistir, faça login novamente.</p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#b24a0a', color: '#fff', fontWeight: 600
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
