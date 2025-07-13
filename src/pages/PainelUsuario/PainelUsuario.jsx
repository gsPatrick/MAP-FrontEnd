import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout, Typography, Card, Row, Col, Statistic, Progress, Button, List, Tag, Empty, Space, Avatar, message, Timeline } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusCircleOutlined,
  CalendarOutlined,
  RetweetOutlined,
  DollarCircleOutlined,
  PieChartOutlined
} from '@ant-design/icons';
// REMOÇÃO: A importação de { Line, Pie } foi removida.
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

import ModalNovaReceita from '../../modals/ModalNovaReceita/ModalNovaReceita';
import ModalNovaDespesa from '../../modals/ModalNovaDespesa/ModalNovaDespesa';
import ModalNovoCompromisso from '../../modals/ModalNovoCompromisso/ModalNovoCompromisso';
import ModalNovaRecorrencia from '../../modals/ModalNovaRecorrencia/ModalNovaRecorrencia';
import ModalNovoAgendamentoPJ from '../../modals/ModalNovoAgendamentoPJ/ModalNovoAgendamentoPJ';
import ModalPjClientAppointment from '../../modals/ModalPjClientAppointment/ModalPjClientAppointment';
import ModalPjServiceAppointment from '../../modals/ModalPjServiceAppointment/ModalPjServiceAppointment';

import './PainelUsuario.css';

dayjs.locale('pt-br');
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.updateLocale('pt-br', {
  relativeTime: { future: "em %s", past: "há %s", s: 'poucos segundos', m: "um minuto", mm: "%d minutos", h: "uma hora", hh: "%d horas", d: "um dia", dd: "%d dias", M: "um mês", MM: "%d meses", y: "um ano", yy: "%d anos" }
});

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const PainelUsuario = () => {
  const { currentProfile, loadingProfiles, isAuthenticated, fetchUserProfiles } = useProfile();

  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [financialSummary, setFinancialSummary] = useState({ currentBalance: 0, incomeThisMonth: 0, expensesThisMonth: 0 });
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [upcomingItems, setUpcomingItems] = useState([]);
  const [isReceitaModalVisible, setIsReceitaModalVisible] = useState(false);
  const [isDespesaModalVisible, setIsDespesaModalVisible] = useState(false);
  const [isRecorrenciaModalVisible, setIsRecorrenciaModalVisible] = useState(false);
  const [isCompromissoModalVisible, setIsCompromissoModalVisible] = useState(false);
  const [isPjChooserModalVisible, setIsPjChooserModalVisible] = useState(false);
  const [isPjClientModalVisible, setIsPjClientModalVisible] = useState(false);
  const [isPjServiceModalVisible, setIsPjServiceModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const userNameForHeader = currentProfile?.ownerClientName || currentProfile?.name || "Usuário MAP";

  const fetchDataForDashboard = useCallback(async (profileId) => {
    // ... (Esta função permanece a mesma, buscando os dados principais)
    if (!profileId) {
        setDashboardLoading(false); 
        return;
    }
    setDashboardLoading(true); 
    try {
        const [
            summaryRes,
            trendRes,
            upcomingTransactionsRes,
            upcomingAppointmentsRes
        ] = await Promise.all([
            apiClient.get(`/financial-accounts/${profileId}/summary`, { params: { period: 'este_mes' } }),
            apiClient.get(`/financial-accounts/${profileId}/monthly-trend`),
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
        if (trendRes.data?.status === 'success') { setMonthlyTrend(trendRes.data.data || []); }
        let combinedUpcoming = [];
        if (upcomingTransactionsRes.data?.status === 'success') { combinedUpcoming.push(...upcomingTransactionsRes.data.transactions.map(t => ({ id: `trans_${t.id}`, title: t.description, dueDate: t.dueDate, amount: parseFloat(t.value), itemType: 'transaction', transactionType: t.type === 'Entrada' ? 'receber' : 'pagar' }))); }
        if (upcomingAppointmentsRes.data?.status === 'success') { combinedUpcoming.push(...upcomingAppointmentsRes.data.data.map(app => ({ id: `appt_${app.id}`, title: app.title, dueDate: app.eventDateTime, amount: app.associatedValue ? parseFloat(app.associatedValue) : null, itemType: 'appointment', transactionType: app.associatedTransactionType || (app.associatedValue ? 'lembrete_valor' : 'lembrete') }))); }
        combinedUpcoming.sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());
        setUpcomingItems(combinedUpcoming.slice(0, 5));
    } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        message.error("Não foi possível carregar os dados do painel.");
    } finally {
        setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentProfile?.id) { setExpenseCategories([]); return; }
    const fetchAndProcessExpenseData = async () => {
        const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
        const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');
        try {
            const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/transactions`, { params: { type: 'Saída', dateStart: monthStart, dateEnd: monthEnd, limit: 1000 } });
            const transactions = response.data.transactions || [];
            const groupedData = transactions.reduce((acc, transaction) => {
                const categoryName = transaction.category?.name || 'Sem Categoria';
                const value = parseFloat(transaction.value) || 0;
                if (!acc[categoryName]) { acc[categoryName] = 0; }
                acc[categoryName] += value;
                return acc;
            }, {});
            const chartData = Object.keys(groupedData).map(key => ({ type: key, value: groupedData[key] }));
            setExpenseCategories(chartData);
        } catch (error) { setExpenseCategories([]); }
    };
    fetchAndProcessExpenseData();
  }, [currentProfile]);

  useEffect(() => {
    if (!currentProfile?.id) { setIncomeCategories([]); return; }
    const fetchAndProcessIncomeData = async () => {
        const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
        const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');
        try {
            const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/transactions`, { params: { type: 'Entrada', dateStart: monthStart, dateEnd: monthEnd, limit: 1000 } });
            const transactions = response.data.transactions || [];
            const groupedData = transactions.reduce((acc, transaction) => {
                const categoryName = transaction.category?.name || 'Sem Categoria';
                const value = parseFloat(transaction.value) || 0;
                if (!acc[categoryName]) { acc[categoryName] = 0; }
                acc[categoryName] += value;
                return acc;
            }, {});
            const chartData = Object.keys(groupedData).map(key => ({ type: key, value: groupedData[key] }));
            setIncomeCategories(chartData);
        } catch (error) { setIncomeCategories([]); }
    };
    fetchAndProcessIncomeData();
  }, [currentProfile]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const shouldBeAuthenticated = !!token;
    if ((!isAuthenticated || !currentProfile) && !loadingProfiles && shouldBeAuthenticated) { fetchUserProfiles(); return; }
    if (loadingProfiles) return;
    if (isAuthenticated && currentProfile) { fetchDataForDashboard(currentProfile.id); }
    else { setDashboardLoading(false); }
  }, [isAuthenticated, loadingProfiles, currentProfile, fetchUserProfiles, fetchDataForDashboard]);

  const handleNovoAgendamentoClick = () => {
    setEditingItem(null);
    if (currentProfile?.type === 'PF') { setIsCompromissoModalVisible(true); }
    else if (currentProfile?.type === 'PJ' || currentProfile?.type === 'MEI') { setIsPjChooserModalVisible(true); }
    else { message.info('Selecione um perfil para criar um agendamento.'); }
  };

  const formatCurrency = (value) => `R$ ${parseFloat(value || 0).toFixed(2).replace('.', ',')}`;
  
  // <<< NOVO useMemo para processar dados para o Timeline >>>
  const evolutionData = useMemo(() => {
    const grouped = monthlyTrend.reduce((acc, item) => {
        if (!acc[item.month]) {
            acc[item.month] = {};
        }
        acc[item.month][item.type.toLowerCase()] = item.value;
        return acc;
    }, {});

    return Object.keys(grouped).map(month => ({
        month,
        receitas: grouped[month].receitas || 0,
        despesas: grouped[month].despesas || 0
    })).reverse(); // .reverse() para mostrar o mês mais recente primeiro
  }, [monthlyTrend]);

  // ... (lógica de carregamento e acesso negado) ...
  if (loadingProfiles || (dashboardLoading && isAuthenticated && currentProfile)) { 
    return ( <div className="dashboard-loading" style={{ minHeight: 'calc(100vh - 64px)' }}><div className="skeleton-loader-card"><PieChartOutlined className="loader-icon" /><Title level={4}>Carregando...</Title><Progress percent={loadingProfiles ? 30 : 70} status="active"/></div></div>)
  }
  if (!isAuthenticated && !loadingProfiles) { 
      return ( <Content style={{padding: 50, textAlign: 'center'}}><Title level={3}>Acesso Negado</Title><Button type="primary" onClick={() => window.location.href = '/login'}>Ir para Login</Button></Content>);
  }
  if (!currentProfile && isAuthenticated && !loadingProfiles){
       return ( <Content className="panel-content-area dashboard-loading"><div className="skeleton-loader-card"><PieChartOutlined className="loader-icon" style={{animation: 'none'}}/><Title level={4}>Nenhum Perfil Selecionado</Title><Button type="primary" onClick={() => window.location.href = '/painel/meu-perfil'}>Ir para Meu Perfil</Button></div></Content>)
  }

  return (
    <>
        <Content className="panel-content-area dashboard-overview">
          <div className="dashboard-header-title">
            <Title level={2} className="dashboard-greeting">Visão Geral: <span className="highlight-profile-name">{currentProfile?.name || 'N/D'}</span></Title>
            <Paragraph className="dashboard-welcome-text">Olá, {userNameForHeader.split(' ')[0]}! Acompanhe suas finanças e atividades.</Paragraph>
          </div>

          <Row gutter={[24, 24]} className="financial-summary-row">
            <Col xs={24} sm={12} lg={8} xl={6}><Card variant="elevated" className="summary-card balance-card animated-card"><Statistic title="Saldo do Mês" value={financialSummary.currentBalance} prefix="R$" loading={dashboardLoading} /></Card></Col>
            <Col xs={24} sm={12} lg={8} xl={6}><Card variant="elevated" className="summary-card income-card animated-card" style={{animationDelay: '0.1s'}}><Statistic title="Receitas do Mês" value={financialSummary.incomeThisMonth} prefix="R$" suffix={<ArrowUpOutlined />} loading={dashboardLoading} /></Card></Col>
            <Col xs={24} sm={12} lg={8} xl={6}><Card variant="elevated" className="summary-card expenses-card animated-card" style={{animationDelay: '0.2s'}}><Statistic title="Despesas do Mês" value={financialSummary.expensesThisMonth} prefix="R$" suffix={<ArrowDownOutlined />} loading={dashboardLoading} /></Card></Col>
            <Col xs={24} sm={12} lg={24} xl={6}><Card variant="elevated" className="summary-card quick-actions-card animated-card" style={{animationDelay: '0.3s'}}><Title level={5}>Ações Rápidas</Title><Space direction="vertical" style={{width: '100%'}} size="middle"><Button type="primary" icon={<PlusCircleOutlined />} block className="quick-action-btn income" onClick={() => { setEditingItem(null); setIsReceitaModalVisible(true); }} disabled={dashboardLoading}>Nova Receita</Button><Button type="primary" danger icon={<PlusCircleOutlined />} block className="quick-action-btn expense" onClick={() => { setEditingItem(null); setIsDespesaModalVisible(true); }} disabled={dashboardLoading}>Nova Despesa</Button><Button icon={<CalendarOutlined />} block className="quick-action-btn neutral" onClick={handleNovoAgendamentoClick} disabled={dashboardLoading}>Novo Compromisso</Button><Button icon={<RetweetOutlined />} block className="quick-action-btn recurrence" onClick={() => { setEditingItem(null); setIsRecorrenciaModalVisible(true);}} disabled={dashboardLoading}>Nova Recorrência</Button></Space></Card></Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: '30px' }}>
            <Col xs={24} lg={12} className="animated-card" style={{animationDelay: '0.5s'}}>
              <Card title="Top 5 Receitas por Categoria" variant="outlined" className="list-card" loading={dashboardLoading}>
                {(!dashboardLoading && incomeCategories.length > 0) ? (
                  <List
                    dataSource={incomeCategories.sort((a,b) => b.value - a.value).slice(0, 5)}
                    renderItem={item => {
                      const total = financialSummary.incomeThisMonth;
                      const percent = total > 0 ? (item.value / total) * 100 : 0;
                      return(
                        <List.Item>
                          <List.Item.Meta title={item.type} />
                          <div style={{textAlign: 'right', width: '120px'}}>
                            <Text strong>{formatCurrency(item.value)}</Text>
                            <Progress percent={percent} showInfo={false} strokeColor="#52c41a" size="small"/>
                          </div>
                        </List.Item>
                      )
                    }}
                  />
                ) : <Empty description="Sem dados de receita."/>}
              </Card>
            </Col>
            <Col xs={24} lg={12} className="animated-card" style={{animationDelay: '0.5s'}}>
              <Card title="Top 5 Despesas por Categoria" variant="outlined" className="list-card" loading={dashboardLoading}>
                {(!dashboardLoading && expenseCategories.length > 0) ? (
                    <List
                        dataSource={expenseCategories.sort((a,b) => b.value - a.value).slice(0, 5)}
                        renderItem={item => {
                          const total = financialSummary.expensesThisMonth;
                          const percent = total > 0 ? (item.value / total) * 100 : 0;
                          return(
                            <List.Item>
                              <List.Item.Meta title={item.type} />
                              <div style={{textAlign: 'right', width: '120px'}}>
                                <Text strong>{formatCurrency(item.value)}</Text>
                                <Progress percent={percent} showInfo={false} strokeColor="#f5222d" size="small"/>
                              </div>
                            </List.Item>
                          )
                        }}
                    />
                ) : <Empty description="Sem dados de despesa."/>}
              </Card>
            </Col>
          </Row>
          


          <Row gutter={[24, 24]} style={{ marginTop: '30px' }}>
            <Col span={24} className="animated-card" style={{animationDelay: '0.6s'}}>
              <Card title="Próximos Vencimentos e Lembretes" variant="outlined" className="list-card" loading={dashboardLoading}>
                <List itemLayout="horizontal" dataSource={upcomingItems} locale={{emptyText: "Nenhuma conta ou lembrete próximo."}} renderItem={item => (<List.Item><List.Item.Meta avatar={<Avatar className={`upcoming-item-avatar ${item.transactionType || item.itemType}`} icon={item.itemType === 'transaction' ? (item.transactionType === 'pagar' ? <ArrowDownOutlined /> : <ArrowUpOutlined />) : <CalendarOutlined />} />} title={<Text>{item.title}</Text>} description={`Vence em: ${dayjs(item.dueDate).format('DD/MM/YY')} (${dayjs(item.dueDate).fromNow()})` + (item.amount ? ` | Valor: R$ ${item.amount.toFixed(2)}` : '')} /><Tag className={`upcoming-item-tag ${item.transactionType || item.itemType}`}>{item.itemType === 'transaction' ? `CONTA A ${item.transactionType.toUpperCase()}` : 'LEMBRETE'}</Tag></List.Item>)} />
              </Card>
            </Col>
          </Row>
        </Content>

        <ModalNovaReceita
            open={isReceitaModalVisible}
            onCancel={() => setIsReceitaModalVisible(false)}
            onSuccess={() => {fetchDataForDashboard(currentProfile.id);}}
            currentProfile={currentProfile}
            editingTransaction={editingItem}
        />
        <ModalNovaDespesa
            open={isDespesaModalVisible}
            onCancel={() => setIsDespesaModalVisible(false)}
            onSuccess={() => {fetchDataForDashboard(currentProfile.id);}}
            currentProfile={currentProfile}
            editingTransaction={editingItem}
        />
        <ModalNovaRecorrencia
            open={isRecorrenciaModalVisible}
            onCancel={() => setIsRecorrenciaModalVisible(false)}
            onSuccess={() => {fetchDataForDashboard(currentProfile.id);}}
            currentProfile={currentProfile}
            editingRecorrencia={editingItem}
        />
        <ModalNovoCompromisso
            open={isCompromissoModalVisible}
            onCancel={() => setIsCompromissoModalVisible(false)}
            onSuccess={() => {fetchDataForDashboard(currentProfile.id);}}
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
            onSuccess={() => {fetchDataForDashboard(currentProfile.id);}}
            currentProfile={currentProfile}
        />
        <ModalPjServiceAppointment
            open={isPjServiceModalVisible}
            onCancel={() => setIsPjServiceModalVisible(false)}
            onSuccess={() => {fetchDataForDashboard(currentProfile.id);}}
            currentProfile={currentProfile}
        />
    </>
  );
};

export default PainelUsuario;