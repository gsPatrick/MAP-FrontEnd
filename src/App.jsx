// src/App.jsx

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Spin, ConfigProvider, App as AntApp } from 'antd';
import ptBR from 'antd/locale/pt_BR';

import PainelLayout from './PainelLayout/PainelLayout';
import PlanosPage from './pages/Planos/Planos';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import PaymentStatusPage from './pages/PaymentStatusPage/PaymentStatusPage';

// Lazy-loaded components
const LandingPage = lazy(() => import('./pages/LandingPage/LandingPage'));
const PainelUsuario = lazy(() => import('./pages/PainelUsuario/PainelUsuario'));
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));
const SignupPage = lazy(() => import('./pages/Signup/Signup'));
const SubscriptionSuccessPage = lazy(() => import('./pages/SubscriptionSuccessPage/SubscriptionSuccessPage'));
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
const PublicBookingPage = lazy(() => import('./pages/PublicBookingPage/PublicBookingPage'));
const ServicesAndCrmPage = lazy(() => import('./pages/ServicesAndCrmPage/ServicesAndCrmPage'));
const AgendaCRMPage = lazy(() => import('./pages/AgendaCRMPage/AgendaCRMPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage/PrivacyPolicyPage'));
const ChecklistPage = lazy(() => import('./pages/ChecklistPage/ChecklistPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage/CheckoutPage'));
const ActivateAccountPage = lazy(() => import('./pages/ActivateAccountPage/ActivateAccountPage'));
const AffiliateLandingPage = lazy(() => import('./pages/AffiliateLandingPage/AffiliateLandingPage'));

// <<< INÍCIO DA CORREÇÃO: Imports para as novas páginas de Admin >>>
const AdminPage = lazy(() => import('./pages/AdminPage/AdminPage'));
const UserManagementPage = lazy(() => import('./pages/AdminPage/pages/UserManagementPage'));
const AffiliateManagementPage = lazy(() => import('./pages/AdminPage/pages/AffiliateManagementPage'));
const DashboardOverview = lazy(() => import('./pages/AdminPage/pages/DashboardOverview')); // <<< LINHA QUE FALTAVA
const PlanManagementPage = lazy(() => import('./pages/AdminPage/pages/PlanManagementPage')); // <<< ADICIONE ESTA LINHA
const BroadcastPage = lazy(() => import('./pages/AdminPage/pages/BroadcastPage'));         // <<< ADICIONE ESTA LINHA
const AdminSettingsPage = lazy(() => import('./pages/AdminPage/pages/AdminSettingsPage')); // <<< Nova Página de Configurações
// <<< FIM DA MODIFICAÇÃO >>>

const AppLayoutSuspense = () => (
  <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
    <Outlet />
  </Suspense>
);

// Componente que define todas as rotas da aplicação
const AppRoutes = () => (
  <Routes>
    <Route element={<AppLayoutSuspense />}>
      {/* === ROTAS PÚBLICAS === */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/planos" element={<PlanosPage />} />
      <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
      <Route path="/ativar-conta" element={<ActivateAccountPage />} />
      <Route path="/indicacao/:affiliateCode" element={<AffiliateLandingPage />} />

      {/* === FLUXO DE CADASTRO E PAGAMENTO === */}
      <Route path="/assinar/:planId" element={<SignupPage />} />
      <Route path="/cadastro-sucesso/:planId" element={<SubscriptionSuccessPage />} />
      <Route path="/checkout/:planId" element={<CheckoutPage />} />
      <Route path="/payment-success" element={<PaymentStatusPage />} />
      <Route path="/payment-failure" element={<PaymentStatusPage />} />
      <Route path="/payment-pending" element={<PaymentStatusPage />} />

      {/* === ROTAS DE AGENDAMENTO PÚBLICO E ADMIN === */}
      <Route path="/agendar/:financialAccountId" element={<PublicBookingPage />} />

      {/* Rota de Admin com rotas filhas */}
      <Route path="/admin/dashboard" element={<AdminPage />}>
        <Route index element={<DashboardOverview />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="affiliates" element={<AffiliateManagementPage />} />
        <Route path="plans" element={<PlanManagementPage />} />
        <Route path="broadcast" element={<BroadcastPage />} />
        <Route path="settings" element={<AdminSettingsPage />} /> {/* <<< Nova Rota */}
      </Route>
    </Route>

    {/* === ROTAS PROTEGIDAS DO PAINEL === */}
    <Route
      element={
        <ProtectedRoute>
          <PainelLayout />
        </ProtectedRoute>
      }
    >
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

    {/* Rota para páginas não encontradas */}
    <Route path="*" element={<div><h1>404 - Página Não Encontrada</h1></div>} />
  </Routes>
);


function App() {
  return (
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: '#b24a0a',
          colorInfo: '#b24a0a',
          colorSuccess: '#389e0d',
          colorWarning: '#faad14',
          colorError: '#cf1322',
          borderRadius: 8,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
      }}
    >
      <AntApp>
        <AppRoutes />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;