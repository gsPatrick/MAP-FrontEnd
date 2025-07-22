import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FaArrowUp, FaArrowDown, FaPlus, FaCalendarAlt, FaRetweet, 
  FaPiggyBank, FaChartPie, FaExclamationTriangle, FaTimes
} from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

// --- IMPORTAÇÃO DOS MODAIS ESPECÍFICOS ---
import ModalNovaReceita from '../../modals/ModalNovaReceita/ModalNovaReceita';
import ModalNovaDespesa from '../../modals/ModalNovaDespesa/ModalNovaDespesa';
import ModalNovoCompromisso from '../../modals/ModalNovoCompromisso/ModalNovoCompromisso';
import ModalNovaRecorrencia from '../../modals/ModalNovaRecorrencia/ModalNovaRecorrencia';
import ModalNovoAgendamentoPJ from '../../modals/ModalNovoAgendamentoPJ/ModalNovoAgendamentoPJ';
import ModalPjClientAppointment from '../../modals/ModalPjClientAppointment/ModalPjClientAppointment';
import ModalPjServiceAppointment from '../../modals/ModalPjServiceAppointment/ModalPjServiceAppointment';

import './PainelUsuario.css';

// --- Configuração do Day.js ---
dayjs.locale('pt-br');
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.updateLocale('pt-br', {
  relativeTime: { future: "em %s", past: "há %s", s: 'poucos segundos', m: "um minuto", mm: "%d minutos", h: "uma hora", hh: "%d horas", d: "um dia", dd: "%d dias", M: "um mês", MM: "%d meses", y: "um ano", yy: "%d anos" }
});

// --- Componente para Legenda Customizada do Gráfico ---
const renderCustomLegend = ({ payload }) => {
  return (
    <div className="custom-legend-wrapper">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: entry.color }} />
          <span className="legend-text">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};


const PainelUsuario = () => {
  const { currentProfile, loadingProfiles, isAuthenticated, fetchUserProfiles } = useProfile();

  // --- Estados do Componente ---
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [financialSummary, setFinancialSummary] = useState({ currentBalance: 0, incomeThisMonth: 0, expensesThisMonth: 0 });
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [upcomingItems, setUpcomingItems] = useState([]);

  // --- ESTADOS DOS MODAIS ESPECÍFICOS ---
  const [isReceitaModalVisible, setIsReceitaModalVisible] = useState(false);
  const [isDespesaModalVisible, setIsDespesaModalVisible] = useState(false);
  const [isRecorrenciaModalVisible, setIsRecorrenciaModalVisible] = useState(false);
  const [isCompromissoModalVisible, setIsCompromissoModalVisible] = useState(false);
  const [isPjChooserModalVisible, setIsPjChooserModalVisible] = useState(false);
  const [isPjClientModalVisible, setIsPjClientModalVisible] = useState(false);
  const [isPjServiceModalVisible, setIsPjServiceModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const userNameForHeader = useMemo(() => 
    currentProfile?.ownerClientName || currentProfile?.name || "Usuário MAP"
  , [currentProfile]);

  // --- Funções de Busca de Dados ---
  const fetchDataForDashboard = useCallback(async (profileId) => {
    if (!profileId) {
        setDashboardLoading(false); 
        return;
    }
    setDashboardLoading(true); 
    try {
        const [summaryRes, upcomingTransactionsRes, upcomingAppointmentsRes] = await Promise.all([
            apiClient.get(`/financial-accounts/${profileId}/summary`, { params: { period: 'este_mes' } }),
            apiClient.get(`/financial-accounts/${profileId}/transactions`, { params: { isPayableOrReceivable: true, isPaidOrReceived: false, dueAfter: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), sortBy: 'dueDate', sortOrder: 'ASC', limit: 5 } }),
            apiClient.get(`/financial-accounts/${profileId}/appointments`, { params: { status: 'Scheduled', eventDateTime_gte: dayjs().toISOString(), sortBy: 'eventDateTime', sortOrder: 'ASC', limit: 5 } })
        ]);
        
        if (summaryRes.data?.status === 'success') {
            setFinancialSummary({
                currentBalance: summaryRes.data.data.netBalance,
                incomeThisMonth: summaryRes.data.data.totalIncome,
                expensesThisMonth: summaryRes.data.data.totalExpenses,
            });
        }
        
        let combinedUpcoming = [];
        if (upcomingTransactionsRes.data?.status === 'success') { combinedUpcoming.push(...upcomingTransactionsRes.data.transactions.map(t => ({ id: `trans_${t.id}`, title: t.description, dueDate: t.dueDate, amount: parseFloat(t.value), itemType: 'transaction', transactionType: t.type === 'Entrada' ? 'receber' : 'pagar' }))); }
        if (upcomingAppointmentsRes.data?.status === 'success') { combinedUpcoming.push(...upcomingAppointmentsRes.data.data.map(app => ({ id: `appt_${app.id}`, title: app.title, dueDate: app.eventDateTime, amount: app.associatedValue ? parseFloat(app.associatedValue) : null, itemType: 'appointment', transactionType: 'lembrete' }))); }
        
        combinedUpcoming.sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());
        setUpcomingItems(combinedUpcoming.slice(0, 5));

    } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
        setDashboardLoading(false);
    }
  }, []);
  
  const fetchChartData = useCallback(async (profileId, type, setData) => {
    if (!profileId) {
      setData([]);
      return;
    }
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');
    try {
      const response = await apiClient.get(`/financial-accounts/${profileId}/transactions`, { params: { type: type, dateStart: monthStart, dateEnd: monthEnd, limit: 1000 } });
      const transactions = response.data.transactions || [];
      const groupedData = transactions.reduce((acc, transaction) => {
        const categoryName = transaction.category?.name || 'Sem Categoria';
        const value = parseFloat(transaction.value) || 0;
        if (!acc[categoryName]) { acc[categoryName] = { name: categoryName, value: 0 }; }
        acc[categoryName].value += value;
        return acc;
      }, {});
      setData(Object.values(groupedData));
    } catch (error) {
      console.error(`Erro ao buscar dados do gráfico de ${type}:`, error);
      setData([]);
    }
  }, []);

  // --- Efeitos ---
  useEffect(() => {
    if (isAuthenticated && currentProfile) {
      fetchDataForDashboard(currentProfile.id);
      fetchChartData(currentProfile.id, 'Entrada', setIncomeCategories);
      fetchChartData(currentProfile.id, 'Saída', setExpenseCategories);
    } else {
      setDashboardLoading(false);
    }
  }, [isAuthenticated, currentProfile, fetchDataForDashboard, fetchChartData]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!isAuthenticated && !loadingProfiles && !!token) { 
      fetchUserProfiles(); 
    }
  }, [isAuthenticated, loadingProfiles, fetchUserProfiles]);


  // --- LÓGICA DE MANIPULAÇÃO DOS MODAIS ---
  const handleNovoAgendamentoClick = () => {
    setEditingItem(null);
    if (currentProfile?.type === 'PF') {
      setIsCompromissoModalVisible(true);
    } else if (currentProfile?.type === 'PJ' || currentProfile?.type === 'MEI') {
      setIsPjChooserModalVisible(true);
    } else {
      // Idealmente, um componente de notificação customizado seria usado aqui
      console.warn('Selecione um perfil para criar um agendamento.');
    }
  };

  const handleSuccess = (modalSetter) => {
    fetchDataForDashboard(currentProfile.id);
    modalSetter(false); // Fecha o modal específico
  };
  
  // --- Funções de Formatação ---
  const formatCurrency = (value) => {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const PIE_COLORS = ['#FA8C16', '#8BC34A', '#F44336', '#1677ff', '#FAAD14', '#52c41a', '#2f54eb'];

  // --- Renderização Condicional ---
  if (loadingProfiles || (dashboardLoading && isAuthenticated && currentProfile)) {
    return (
      <div className="dashboard-loading-container">
        <div className="loader-card">
          <FaChartPie className="loader-icon" />
          <h2 className="loader-text">Carregando Painel...</h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !loadingProfiles) {
    return (
      <div className="dashboard-state-container">
        <div className="state-card">
            <FaExclamationTriangle className="state-icon" />
            <h2 className="state-title">Acesso Negado</h2>
            <p className="state-description">Você precisa estar logado para ver esta página.</p>
            <button className="state-action-button" onClick={() => window.location.href = '/login'}>Ir para Login</button>
        </div>
      </div>
    );
  }
  
  if (!currentProfile && isAuthenticated && !loadingProfiles) {
    return (
        <div className="dashboard-state-container">
            <div className="state-card">
                <FaExclamationTriangle className="state-icon" />
                <h2 className="state-title">Nenhum Perfil Selecionado</h2>
                <p className="state-description">Por favor, selecione um perfil para continuar.</p>
                <button className="state-action-button" onClick={() => window.location.href = '/painel/meu-perfil'}>Gerenciar Perfis</button>
            </div>
        </div>
    );
  }

  // --- Renderização Principal ---
  return (
    <>
      <main className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="header-greeting">
            Visão Geral: <span className="header-profile-name">{currentProfile?.name || 'N/D'}</span>
          </h1>
          <p className="header-welcome-text">Olá, {userNameForHeader.split(' ')[0]}! Acompanhe suas finanças e atividades.</p>
        </div>

        <section className="dashboard-grid">
          
          <div className="summary-card balance animated-card">
            <div className="card-icon-wrapper"><FaPiggyBank className="card-icon" /></div>
            <div className="card-content">
              <p className="card-title">Saldo do Mês</p>
              <h3 className="card-value">{formatCurrency(financialSummary.currentBalance)}</h3>
            </div>
          </div>
          <div className="summary-card income animated-card" style={{animationDelay: '0.1s'}}>
              <div className="card-icon-wrapper"><FaArrowUp className="card-icon" /></div>
            <div className="card-content">
              <p className="card-title">Receitas do Mês</p>
              <h3 className="card-value">{formatCurrency(financialSummary.incomeThisMonth)}</h3>
            </div>
          </div>
          <div className="summary-card expenses animated-card" style={{animationDelay: '0.2s'}}>
            <div className="card-icon-wrapper"><FaArrowDown className="card-icon" /></div>
            <div className="card-content">
              <p className="card-title">Despesas do Mês</p>
              <h3 className="card-value">{formatCurrency(financialSummary.expensesThisMonth)}</h3>
            </div>
          </div>
          
          <div className="quick-actions-card animated-card" style={{animationDelay: '0.3s'}}>
            <h4 className="card-section-title">Ações Rápidas</h4>
            <div className="actions-grid">
              <button className="action-button income" onClick={() => { setEditingItem(null); setIsReceitaModalVisible(true); }}><FaPlus /> Nova Receita</button>
              <button className="action-button expense" onClick={() => { setEditingItem(null); setIsDespesaModalVisible(true); }}><FaPlus /> Nova Despesa</button>
              <button className="action-button neutral" onClick={handleNovoAgendamentoClick}><FaCalendarAlt /> Novo Compromisso</button>
              <button className="action-button recurrence" onClick={() => { setEditingItem(null); setIsRecorrenciaModalVisible(true); }}><FaRetweet /> Nova Recorrência</button>
            </div>
          </div>

          <div className="card chart-card animated-card" style={{animationDelay: '0.4s'}}>
            <h4 className="card-section-title">Receitas por Categoria</h4>
            {incomeCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend content={renderCustomLegend} verticalAlign="bottom" />
                  <Pie data={incomeCategories} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={80} outerRadius={110} fill="#8884d8" paddingAngle={5}>
                    {incomeCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state">Nenhum dado de receita este mês.</div>}
          </div>

          <div className="card chart-card animated-card" style={{animationDelay: '0.5s'}}>
            <h4 className="card-section-title">Despesas por Categoria</h4>
            {expenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend content={renderCustomLegend} verticalAlign="bottom" />
                  <Pie data={expenseCategories} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={80} outerRadius={110} fill="#8884d8" paddingAngle={5}>
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state">Nenhuma despesa este mês.</div>}
          </div>

          <div className="card list-card animated-card" style={{animationDelay: '0.6s'}}>
            <h4 className="card-section-title">Próximos Vencimentos e Lembretes</h4>
            {upcomingItems.length > 0 ? (
              <ul className="upcoming-list">
                {upcomingItems.map(item => (
                  <li key={item.id} className="upcoming-list-item">
                    <div className={`item-avatar ${item.transactionType || item.itemType}`}>
                      {item.itemType === 'transaction' ? (item.transactionType === 'pagar' ? <FaArrowDown /> : <FaArrowUp />) : <FaCalendarAlt />}
                    </div>
                    <div className="item-details">
                      <p className="item-title">{item.title}</p>
                      <p className="item-description">
                        {`Vence ${dayjs(item.dueDate).fromNow()} (${dayjs(item.dueDate).format('DD/MM/YY')})`}
                        {item.amount && <span> | {formatCurrency(item.amount)}</span>}
                      </p>
                    </div>
                    <span className={`item-tag ${item.transactionType || item.itemType}`}>
                      {item.itemType === 'transaction' ? `A ${item.transactionType.toUpperCase()}` : 'LEMBRETE'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <div className="empty-state">Nenhuma conta ou lembrete próximo.</div>}
          </div>

        </section>
      </main>

      {/* --- RENDERIZAÇÃO CONDICIONAL DE TODOS OS MODAIS --- */}
      <ModalNovaReceita
          open={isReceitaModalVisible}
          onCancel={() => setIsReceitaModalVisible(false)}
          onSuccess={() => handleSuccess(setIsReceitaModalVisible)}
          currentProfile={currentProfile}
          editingTransaction={editingItem}
      />
      <ModalNovaDespesa
          open={isDespesaModalVisible}
          onCancel={() => setIsDespesaModalVisible(false)}
          onSuccess={() => handleSuccess(setIsDespesaModalVisible)}
          currentProfile={currentProfile}
          editingTransaction={editingItem}
      />
      <ModalNovaRecorrencia
          open={isRecorrenciaModalVisible}
          onCancel={() => setIsRecorrenciaModalVisible(false)}
          onSuccess={() => handleSuccess(setIsRecorrenciaModalVisible)}
          currentProfile={currentProfile}
          editingRecorrencia={editingItem}
      />
      <ModalNovoCompromisso
          open={isCompromissoModalVisible}
          onCancel={() => setIsCompromissoModalVisible(false)}
          onSuccess={() => handleSuccess(setIsCompromissoModalVisible)}
          currentProfile={currentProfile}
          editingAppointment={editingItem}
      />
      <ModalNovoAgendamentoPJ
          open={isPjChooserModalVisible}
          onCancel={() => setIsPjChooserModalVisible(false)}
          onSelectClientFlow={() => {
              setIsPjChooserModalVisible(false);
              setIsPjClientModalVisible(true);
          }}
          onSelectServiceFlow={() => {
              setIsPjChooserModalVisible(false);
              setIsPjServiceModalVisible(true);
          }}
      />
      <ModalPjClientAppointment
          open={isPjClientModalVisible}
          onCancel={() => setIsPjClientModalVisible(false)}
          onSuccess={() => handleSuccess(setIsPjClientModalVisible)}
          currentProfile={currentProfile}
      />
      <ModalPjServiceAppointment
          open={isPjServiceModalVisible}
          onCancel={() => setIsPjServiceModalVisible(false)}
          onSuccess={() => handleSuccess(setIsPjServiceModalVisible)}
          currentProfile={currentProfile}
      />
    </>
  );
};

export default PainelUsuario;