// --- START OF FILE App.jsx ---

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
// import { ProfileProvider } from './contexts/ProfileContext'; // <<< REMOVIDO, pois está em main.jsx

// Lazy loading para as páginas principais
const LandingPage = lazy(() => import('./pages/LandingPage/LandingPage'));
const PainelUsuario = lazy(() => import('./pages/PainelUsuario/PainelUsuario'));
// const AdminDashboard = lazy(() => import('./pages/AdminDashboard/AdminDashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));
const ChatbotPage = lazy(() => import('./pages/ChatbotPage/ChatbotPage'));
const CartoesPage = lazy(() => import('./pages/CartoesPage/CartoesPage'));
const TransacoesPage = lazy(() => import('./pages/TransacoesPage/TransacoesPage'));
const RecorrenciasPage = lazy(() => import('./pages/RecorrenciasPage/RecorrenciasPage'));
const HidratacaoPage = lazy(() => import('./pages/HidratacaoPage/HidratacaoPage'));
const AgendamentosPage = lazy(() => import('./pages/AgendamentosPage/AgendamentosPage'));
const ProdutosEstoquePage = lazy(() => import('./pages/ProdutosEstoquePage/ProdutosEstoquePage'));
const MeuPerfilPage = lazy(() => import('./pages/MeuPerfilPage/MeuPerfilPage'));
// const KanbanBoardPage = lazy(() => import('./pages/KanbanBoardPage/KanbanPage'));
const CategoriasPage = lazy(() => import('./pages/CategoriasPage/CategoriasPage'));
const ConfiguracoesPage = lazy(() => import('./pages/ConfiguracoesPage/ConfiguracoesPage'));
const BusinessClientsPage = lazy(() => import('./pages/BusinessClientsPage/BusinessClientsPage'));
// Componente de Layout Básico para Suspense
const AppLayoutSuspense = () => (
  <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
    <Outlet />
  </Suspense>
);

// Componente de Layout para as Páginas do Painel
// Este Outlet será onde as páginas do painel (PainelUsuario, CartoesPage, etc.) serão renderizadas
// Não precisa mais do ProfileProvider aqui se ele estiver no main.jsx
const PainelLayout = () => (
  <Outlet /> // O ProfileProvider já envolve todo o App a partir do main.jsx
);


function App() {
  return (
    <Routes>
      {/* Rotas públicas ou com layout diferente */}
      <Route element={<AppLayoutSuspense />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Outras rotas públicas aqui, se houver */}
      </Route>

      {/* Rotas do Painel - todas estas compartilharão o ProfileContext globalmente */}
      {/* O PainelLayout apenas define a estrutura, o ProfileContext já está disponível */}
      <Route element={<PainelLayout />}>
        {/* Usamos AppLayoutSuspense novamente aqui se cada página do painel for lazy loaded */}
        <Route element={<AppLayoutSuspense />}>
            <Route path="/painel" element={<PainelUsuario />} />
            <Route path="/painel/chat" element={<ChatbotPage />} />
            <Route path="/painel/cartoes" element={<CartoesPage />} />
            <Route path="/painel/transacoes" element={<TransacoesPage />} />
            <Route path="/painel/recorrencias" element={<RecorrenciasPage />} />
            <Route path="/painel/hidratacao" element={<HidratacaoPage />} />
            <Route path="/painel/agendamentos" element={<AgendamentosPage />} />
            <Route path="/painel/produtos" element={<ProdutosEstoquePage />} />
            <Route path="/painel/meu-perfil" element={<MeuPerfilPage />} />
            <Route path="/painel/categorias" element={<CategoriasPage />} />
            <Route path="/painel/configuracoes" element={<ConfiguracoesPage />} />
            <Route path="/painel/clientes" element={<BusinessClientsPage />} />
            {/* Adicione outras sub-rotas do painel aqui */}
        </Route>
      </Route>
      
      {/* Rota 404 - Página não encontrada - deve ser a última */}
      {/* Colocar dentro do AppLayoutSuspense se quiser o fallback de loading para ela também */}
      <Route path="*" element={
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
          <div><h1>404 - Página Não Encontrada</h1></div>
        </Suspense>
      } />
    </Routes>
  );
}

export default App;
// --- END OF FILE App.jsx ---