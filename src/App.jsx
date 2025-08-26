// src/App.jsx

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import PainelLayout from './PainelLayout/PainelLayout';
import PlanosPage from './pages/Planos/Planos';

const LandingPage = lazy(() => import('./pages/LandingPage/LandingPage'));
const PainelUsuario = lazy(() => import('./pages/PainelUsuario/PainelUsuario'));
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));
const Signup = lazy(() => import('./pages/Signup/Signup')); // <<< ADICIONAR IMPORT
const ChatbotPage = lazy(() => import('./pages/ChatbotPage/ChatbotPage'));
const CartoesPage = lazy(() => import('./pages/CartoesPage/CartoesPage'));
const TransacoesPage = lazy(() => import('./pages/TransacoesPage/TransacoesPage'));
const RecorrenciasPage = lazy(() => import('./pages/RecorrenciasPage/RecorrenciasPage'));
const HidratacaoPage = lazy(() => import('./pages/HidratacaoPage/HidratacaoPage'));
const AgendamentosPage = lazy(() => import('./pages/AgendamentosPage/AgendamentosPage'));
const ProdutosEstoquePage = lazy(() => import('./pages/ProdutosEstoquePage/ProdutosEstoquePage'));
const MeuPerfilPage = lazy(() => import('./pages/MeuPerfilPage/MeuPerfilPage'));
const CategoriasPage = lazy(() => import('./pages/CategoriasPage/CategoriasPage'));
const ConfiguracoesPage = lazy(() => import('./pages/ConfiguracoesPage/ConfiguracoesPage'));
const BusinessClientsPage = lazy(() => import('./pages/BusinessClientsPage/BusinessClientsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage/AdminPage'));
const PublicBookingPage = lazy(() => import('./pages/PublicBookingPage/PublicBookingPage'));
const ServicesAndCrmPage = lazy(() => import ('./pages/ServicesAndCrmPage/ServicesAndCrmPage'));
const AgendaCRMPage = lazy(() => import('./pages/AgendaCRMPage/AgendaCRMPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage/PrivacyPolicyPage'));
const ChecklistPage = lazy(() => import('./pages/ChecklistPage/ChecklistPage'));

const AppLayoutSuspense = () => (
  <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
    <Outlet />
  </Suspense>
);

function App() {
  return (
    <Routes>
      <Route element={<AppLayoutSuspense />}>
        <Route path="/planos" element={<PlanosPage />} /> 
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/assinar/:planId" element={<Signup />} /> {/* <<< ADICIONAR NOVA ROTA */}
        <Route path="/agendar/:financialAccountId" element={<PublicBookingPage />} />
        <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
      </Route>
      <Route path="/admin/dashboard" element={<AdminPage />} /> 

      <Route element={<PainelLayout />}>
        <Route element={<AppLayoutSuspense />}>
            <Route path="/painel" element={<PainelUsuario />} />
            <Route path="/painel/chat" element={<ChatbotPage />} />
            <Route path="/painel/cartoes" element={<CartoesPage />} />
            <Route path="/painel/transacoes" element={<TransacoesPage />} />
            <Route path="/painel/recorrencias" element={<RecorrenciasPage />} />
            <Route path="/painel/hidratacao" element={<HidratacaoPage />} />
            <Route path="/painel/agendamentos" element={<AgendamentosPage />} />
            <Route path="/painel/produtos" element={<ProdutosEstoquePage />} />
            <Route path="/painel/servicos" element={<ServicesAndCrmPage />} />
            <Route path="/painel/meu-perfil" element={<MeuPerfilPage />} />
            <Route path="/painel/categorias" element={<CategoriasPage />} />
            <Route path="/painel/configuracoes" element={<ConfiguracoesPage />} />
            <Route path="/painel/clientes" element={<BusinessClientsPage />} />
            <Route path="/painel/agenda-crm" element={<AgendaCRMPage />} />
            <Route path="/painel/checklist" element={<ChecklistPage />} />
        </Route>
      </Route>
      
      <Route path="*" element={
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
          <div><h1>404 - Página Não Encontrada</h1></div>
        </Suspense>
      } />
    </Routes>
  );
}

export default App;