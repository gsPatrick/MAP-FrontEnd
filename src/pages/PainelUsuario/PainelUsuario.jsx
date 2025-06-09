import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Typography, Card, Row, Col, Statistic, Progress, Button, List, Tag, Empty, Space, Avatar, message } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusCircleOutlined,
  CalendarOutlined,
  PieChartOutlined,
  RetweetOutlined,
  DollarCircleOutlined,
} from '@ant-design/icons';
import { Line, Pie } from '@ant-design/charts';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

// REMOVIDAS importações de HeaderPanel e SidebarPanel
import ModalNovaReceita from '../../modals/ModalNovaReceita/ModalNovaReceita';
import ModalNovaDespesa from '../../modals/ModalNovaDespesa/ModalNovaDespesa';
import ModalNovoCompromisso from '../../modals/ModalNovoCompromisso/ModalNovoCompromisso';
import ModalNovaRecorrencia from '../../modals/ModalNovaRecorrencia/ModalNovaRecorrencia';

import './PainelUsuario.css';

dayjs.locale('pt-br');
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.updateLocale('pt-br', {
  relativeTime: {
    future: "em %s",
    past: "há %s",
    s: 'poucos segundos',
    m: "um minuto",
    mm: "%d minutos",
    h: "uma hora",
    hh: "%d horas",
    d: "um dia",
    dd: "%d dias",
    M: "um mês",
    MM: "%d meses",
    y: "um ano",
    yy: "%d anos"
  }
});

const { Content } = Layout; // Content ainda é útil
const { Title, Paragraph, Text } = Typography;

const PainelUsuario = () => {
  const {
    currentProfile,
    loadingProfiles,
    isAuthenticated
  } = useProfile();

  // REMOVIDO estado do sidebarCollapsed
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [financialSummary, setFinancialSummary] = useState({ currentBalance: 0, incomeThisMonth: 0, expensesThisMonth: 0 });
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [upcomingItems, setUpcomingItems] = useState([]);

  const [isReceitaModalVisible, setIsReceitaModalVisible] = useState(false);
  const [isDespesaModalVisible, setIsDespesaModalVisible] = useState(false);
  const [isCompromissoModalVisible, setIsCompromissoModalVisible] = useState(false);
  const [isRecorrenciaModalVisible, setIsRecorrenciaModalVisible] = useState(false);
  const [editingRecorrencia, setEditingRecorrencia] = useState(null);
  
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const userNameForHeader = currentProfile?.ownerClientName || currentProfile?.name || "Usuário MAP";

 const fetchDataForDashboard = async (profileId) => {
    if (!profileId) {
        setDashboardLoading(false);
        return;
    }
    setDashboardLoading(true);
    try {
        const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
        const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');

        const [
            summaryRes,
            expenseCategoriesRes,
            incomeCategoriesRes,
            trendRes,
            upcomingTransactionsRes,
            upcomingAppointmentsRes
        ] = await Promise.all([
            // 1. Resumo Financeiro do Mês - Rota CORRETA
            apiClient.get(`/financial-accounts/${profileId}/summary`, { params: { period: 'este_mes' } }),
            
            // 2. Resumo de Categorias de Despesa do Mês
            apiClient.get(`/financial-accounts/${profileId}/expense-category-summary`, { params: { dateStart: monthStart, dateEnd: monthEnd } }),
            
            // 3. Resumo de Categorias de Receita do Mês
            apiClient.get(`/financial-accounts/${profileId}/income-category-summary`, { params: { dateStart: monthStart, dateEnd: monthEnd } }).catch(() => ({ data: { data: [] }})),
            
            // 4. Tendência Mensal
            apiClient.get(`/financial-accounts/${profileId}/monthly-trend`),

            // 5. Próximas Contas a Pagar/Receber - Parâmetro CORRETO
            apiClient.get(`/financial-accounts/${profileId}/transactions`, { 
                params: { 
                    isPayableOrReceivable: true, 
                    isPaidOrReceived: false, 
                    dueAfter: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), // CORREÇÃO: de 'due_after' para 'dueAfter'
                    sortBy: 'dueDate', 
                    sortOrder: 'ASC', 
                    limit: 5 
                } 
            }),

            // 6. Próximos Compromissos
            apiClient.get(`/financial-accounts/${profileId}/appointments`, { params: { status: 'Scheduled', eventDateTime_gte: dayjs().toISOString(), sortBy: 'eventDateTime', sortOrder: 'ASC', limit: 5 } })
        ]);

        // Processa o resumo financeiro
        if (summaryRes.data.status === 'success') {
            setFinancialSummary({
                currentBalance: summaryRes.data.data.accountTotalBalance,
                incomeThisMonth: summaryRes.data.data.totalIncome,
                expensesThisMonth: summaryRes.data.data.totalExpenses,
            });
        }
        
        // Processa as categorias de despesa
        if (expenseCategoriesRes.data.status === 'success') {
            setExpenseCategories(expenseCategoriesRes.data.data || []);
        }
        
        // Processa as categorias de receita (se o endpoint existir)
        if (incomeCategoriesRes.data.status === 'success' && incomeCategoriesRes.data.data.length > 0) {
            setIncomeCategories(incomeCategoriesRes.data.data);
        } else {
             const allTransactionsMonthRes = await apiClient.get(`/financial-accounts/${profileId}/transactions`, { params: { dateStart: monthStart, dateEnd: monthEnd, limit: 1000 } });
             if (allTransactionsMonthRes.data.status === 'success') {
                 const allTransactionsMonth = allTransactionsMonthRes.data.transactions || [];
                 const groupedIncomes = allTransactionsMonth.filter(t => t.type === 'Entrada').reduce((acc, curr) => {
                    const categoryName = curr.category?.name || 'Outras Receitas';
                    acc[categoryName] = (acc[categoryName] || 0) + parseFloat(curr.value);
                    return acc;
                }, {});
                setIncomeCategories(Object.entries(groupedIncomes).map(([type, value]) => ({ type, value })));
             }
        }

        // Processa a tendência mensal
        if (trendRes.data.status === 'success') {
            setMonthlyTrend(trendRes.data.data || []);
        }

        // Processa os próximos itens
        let combinedUpcoming = [];
        if (upcomingTransactionsRes.data.status === 'success') {
            combinedUpcoming.push(...upcomingTransactionsRes.data.transactions.map(t => ({ id: `trans_${t.id}`, title: t.description, dueDate: t.dueDate, amount: parseFloat(t.value), itemType: 'transaction', transactionType: t.type === 'Entrada' ? 'receber' : 'pagar' })));
        }
        if (upcomingAppointmentsRes.data.status === 'success') {
            combinedUpcoming.push(...upcomingAppointmentsRes.data.data.map(app => ({ id: `appt_${app.id}`, title: app.title, dueDate: app.eventDateTime, amount: app.associatedValue ? parseFloat(app.associatedValue) : null, itemType: 'appointment', transactionType: app.associatedTransactionType || (app.associatedValue ? 'lembrete_valor' : 'lembrete') })));
        }
        combinedUpcoming.sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());
        setUpcomingItems(combinedUpcoming.slice(0, 5));

    } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        message.error("Não foi possível carregar os dados do painel.");
    } finally {
        setDashboardLoading(false);
    }
};
  
  useEffect(() => {
    // REMOVIDO: document.body.classList.add('painel-active');
    if (!loadingProfiles && isAuthenticated && currentProfile) {
        fetchDataForDashboard(currentProfile.id);
    } else if (!loadingProfiles && !isAuthenticated) {
        setDashboardLoading(false);
    } else if (!loadingProfiles && isAuthenticated && !currentProfile){
        setDashboardLoading(false);
    }
  }, [currentProfile, loadingProfiles, isAuthenticated]);

  const handleAddGeneric = (type, values) => {
    if (!currentProfile) {
        message.error("Nenhum perfil selecionado para adicionar a transação.");
        return;
    }
    let endpoint = '';
    let successMessage = '';
    const dataToSend = { ...values };
    if (values.data && dayjs.isDayjs(values.data)) {
        dataToSend.transactionDate = values.data.format('YYYY-MM-DD');
        delete dataToSend.data;
    }
    if (values.prazo) {
        dataToSend.eventDateTime = values.prazo.toISOString(); // Ajustado para ISOString
        delete dataToSend.prazo;
    }
    if (type === 'recorrencia') {
        if (values.startDate && dayjs.isDayjs(values.startDate)) {
            dataToSend.startDate = values.startDate.format('YYYY-MM-DD');
        }
        if (values.hasOwnProperty('endDate')) {
            dataToSend.endDate = values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : null;
        }
    }
    switch (type) {
        case 'receita':
            endpoint = `/financial-accounts/${currentProfile.id}/transactions`;
            dataToSend.type = 'Entrada';
            dataToSend.isPayableOrReceivable = false;
            dataToSend.isPaidOrReceived = true;
            successMessage = `Receita "${values.description}" adicionada!`;
            setIsReceitaModalVisible(false);
            setEditingTransaction(null);
            break;
        case 'despesa':
            endpoint = `/financial-accounts/${currentProfile.id}/transactions`;
            dataToSend.type = 'Saída';
            dataToSend.isPayableOrReceivable = false;
            dataToSend.isPaidOrReceived = true;
            if (values.cartaoId) dataToSend.creditCardId = values.cartaoId;
            delete dataToSend.cartaoId;
            if (values.formaPagamento === 'cartao' && values.creditCardId && values.isParcelada) {
                endpoint = `/financial-accounts/${currentProfile.id}/transactions/parcelled`;
                dataToSend.totalValue = dataToSend.value; 
                dataToSend.initialDueDate = dataToSend.transactionDate; 
                delete dataToSend.value;
                successMessage = `Compra parcelada "${values.description}" registrada!`;
            } else if (values.formaPagamento === 'cartao' && values.creditCardId && !values.isParcelada) {
                successMessage = `Despesa "${values.description}" no cartão adicionada!`;
            } else {
                successMessage = `Despesa "${values.description}" adicionada!`;
            }
            delete dataToSend.isParceladaCheck;
            delete dataToSend.formaPagamento;
            if (!values.isParcelada) delete dataToSend.numeroParcelas;
            setIsDespesaModalVisible(false);
            setEditingTransaction(null);
            break;
        case 'compromisso':
            endpoint = `/financial-accounts/${currentProfile.id}/appointments`;
            dataToSend.title = values.titulo;
            if (values.valor) dataToSend.associatedValue = values.valor;
            if (values.tipoValor) dataToSend.associatedTransactionType = values.tipoValor;
            delete dataToSend.titulo;
            delete dataToSend.valor;
            delete dataToSend.tipoValor;
            delete dataToSend.prazoRelativoValor;
            delete dataToSend.prazoRelativoUnidade;
            delete dataToSend.tipoAgendamento;
            successMessage = `Compromisso "${dataToSend.title}" agendado!`;
            setIsCompromissoModalVisible(false);
            setEditingAppointment(null);
            break;
        case 'recorrencia':
            endpoint = `/financial-accounts/${currentProfile.id}/recurring-rules`;
            successMessage = `Recorrência "${values.description}" criada!`;
            setIsRecorrenciaModalVisible(false);
            setEditingRecorrencia(null);
            break;
        default:
            message.error("Tipo de adição desconhecido.");
            return;
    }
    apiClient.post(endpoint, dataToSend)
        .then(response => {
            if (response.data && response.data.status === 'success') {
                message.success(successMessage);
                fetchDataForDashboard(currentProfile.id);
            } else {
                message.error(response.data?.message || `Falha ao adicionar ${type}.`);
            }
        })
        .catch(error => {
            console.error(`Erro ao adicionar ${type}:`, error);
        });
  };

  const formatCurrency = (value) => `R$ ${parseFloat(value || 0).toFixed(2).replace('.', ',')}`;

  const expensePieConfig = useMemo(() => ({
    appendPadding: 10,
    data: expenseCategories.length > 0 ? expenseCategories : [{type: "Sem despesas", value: 1, isPlaceholder: true}],
    angleField: 'value',
    colorField: 'type',
    radius: 0.82,
    innerRadius: 0.62,
    label: expenseCategories.length > 0 && !expenseCategories[0]?.isPlaceholder ? {
      type: 'spider',
      offset: '15%',
      content: ({ type, value, percent }) => {
          const percentage = (percent * 100).toFixed(1);
          if (parseFloat(percentage) > 3) {
            return `${type}\n${percentage}%`;
          }
          return '';
      },
      style: { fontSize: 9, fill: 'rgba(0, 0, 0, 0.75)'},
    } : false,
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }, {type: 'tooltip'}],
    legend: false,
    tooltip: {
        formatter: (datum) => {
          if(datum.isPlaceholder) return null;
          const totalExpenses = expenseCategories.reduce((sum, item) => sum + parseFloat(item.value), 0);
          const percentage = totalExpenses > 0 ? ((parseFloat(datum.value) / totalExpenses) * 100).toFixed(1) : 0;
          return { name: datum.type, value: `${formatCurrency(datum.value)} (${percentage}%)` };
        },
    },
    statistic: {
      title: { offsetY: -4, content: 'Total Despesas', style: {fontSize: '13px', color: 'var(--header-text-secondary)'} },
      content: {
        offsetY: 4,
        style: { fontSize: '18px', fontWeight: 'bold', color: 'var(--map-vermelho-escuro)'},
        formatter: () => expenseCategories.length > 0 && !expenseCategories[0]?.isPlaceholder 
            ? `${formatCurrency(expenseCategories.reduce((acc, curr) => acc + parseFloat(curr.value), 0))}` 
            : "R$ 0,00",
      },
    },
    theme: 'light',
    color: ['#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#F78C6B', '#7A869A', '#5F6C7F'],
  }), [expenseCategories]);

  const incomePieConfig = useMemo(() => ({
    appendPadding: 10,
    data: incomeCategories.length > 0 ? incomeCategories : [{type: "Sem receitas", value: 1, isPlaceholder: true}],
    angleField: 'value',
    colorField: 'type',
    radius: 0.82,
    innerRadius: 0.62,
    label: incomeCategories.length > 0 && !incomeCategories[0]?.isPlaceholder ? {
      type: 'spider',
      offset: '15%',
      content: ({ type, value, percent }) => {
          const percentage = (percent * 100).toFixed(1);
          if (parseFloat(percentage) > 3) {
            return `${type}\n${percentage}%`;
          }
          return '';
      },
      style: { fontSize: 9, fill: 'rgba(0, 0, 0, 0.75)' },
    } : false,
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }, {type: 'tooltip'}],
    legend: false,
    tooltip: {
        formatter: (datum) => {
          if(datum.isPlaceholder) return null;
          const totalIncomes = incomeCategories.reduce((sum, item) => sum + parseFloat(item.value), 0);
          const percentage = totalIncomes > 0 ? ((parseFloat(datum.value) / totalIncomes) * 100).toFixed(1) : 0;
          return { name: datum.type, value: `${formatCurrency(datum.value)} (${percentage}%)` };
        },
    },
    statistic: {
      title: { offsetY: -4, content: 'Total Receitas', style: {fontSize: '13px', color: 'var(--header-text-secondary)'} },
      content: {
        offsetY: 4,
        style: { fontSize: '18px', fontWeight: 'bold', color: 'var(--map-verde-escuro)'},
        formatter: () => incomeCategories.length > 0 && !incomeCategories[0]?.isPlaceholder 
            ? `${formatCurrency(incomeCategories.reduce((acc, curr) => acc + parseFloat(curr.value), 0))}` 
            : "R$ 0,00",
      },
    },
    theme: 'light',
    color: ['#4CAF50', '#8BC34A', '#AED581', '#C5E1A5', '#DCEDC8', '#B9F6CA', '#69F0AE', '#00E676'],
  }), [incomeCategories]);


  const lineConfig = useMemo(() => ({
    data: monthlyTrend,
    xField: 'month',
    yField: 'value',
    seriesField: 'type',
    yAxis: { label: { formatter: (v) => `R$ ${parseFloat(v) / 1000}k` } },
    legend: { position: 'top-right', itemName: {style: {fill: 'var(--header-text-secondary)'}} },
    smooth: true,
    lineStyle: (d) => {
        if(d.type === 'Receitas') return {stroke: 'var(--map-dourado)', lineWidth: 2.5, shadowColor: 'rgba(224,188,99,0.3)', shadowBlur: 8};
        return {stroke: 'var(--map-laranja)', lineWidth: 2.5, lineDash: [4,4], shadowColor: 'rgba(204,102,51,0.3)', shadowBlur: 8};
    },
    point: { size: 3, shape: 'circle', style: { fill: 'white', lineWidth: 1.5 } },
    tooltip: {
        formatter: (datum) => {
          return { name: datum.type, value: `R$ ${parseFloat(datum.value).toFixed(2).replace('.',',')}` };
        },
      },
    theme: 'light',
    animation: { appear: { animation: 'path-in', duration: 600 } },
  }), [monthlyTrend]);

  // REMOVIDO FooterPanelPlaceholder

  if (loadingProfiles || (dashboardLoading && isAuthenticated)) {
    return (
        <div className="dashboard-loading" style={{ minHeight: 'calc(100vh - 64px)' }}>
            <div className="skeleton-loader-card">
                <PieChartOutlined className="loader-icon" />
                <Title level={4} style={{color: 'var(--map-cinza-texto)', marginTop: '15px'}}>
                    {loadingProfiles ? "Carregando seu perfil..." : "Carregando sua Visão Geral..."}
                </Title>
                <Paragraph style={{color: 'var(--map-cinza-texto)'}}>Aguarde um momento, estamos preparando tudo para você.</Paragraph>
                <Progress percent={loadingProfiles ? 30 : 70} status="active" strokeColor={{ from: 'var(--map-dourado)', to: 'var(--map-laranja)' }} trailColor="#f0f0f0"/>
            </div>
        </div>
    )
  }

  if (!isAuthenticated && !loadingProfiles) {
      return (
        <Content style={{padding: 50, textAlign: 'center'}}>
            <Title level={3}>Acesso Negado</Title>
            <Paragraph>Você precisa estar logado para acessar o painel.</Paragraph>
            <Button type="primary" onClick={() => window.location.href = '/login'}>Ir para Login</Button>
        </Content>
      );
  }
  
  if (!currentProfile && isAuthenticated && !loadingProfiles){
       return (
        <Content className="panel-content-area dashboard-loading">
             <div className="skeleton-loader-card" style={{padding: '40px'}}>
                <PieChartOutlined className="loader-icon" style={{animation: 'none', transform: 'none', opacity: 0.6}}/>
                <Title level={4} style={{color: 'var(--map-cinza-texto)', marginTop: '20px'}}>Nenhum Perfil Selecionado</Title>
                <Paragraph style={{color: 'var(--map-cinza-texto)'}}>
                    Parece que você não tem nenhum perfil financeiro (PF/PJ) selecionado ou cadastrado.
                </Paragraph>
                <Paragraph style={{color: 'var(--map-cinza-texto)'}}>
                     Vá para "Meu Perfil" para criar ou selecionar um perfil financeiro para começar.
                </Paragraph>
                 <Button type="primary" onClick={() => window.location.href = '/painel/meu-perfil'} style={{marginTop: '15px'}}>
                    Ir para Meu Perfil
                </Button>
            </div>
        </Content>
    )
  }

  return (
    <>
        <Content className="panel-content-area dashboard-overview">
          <div className="dashboard-header-title">
            <Title level={2} className="dashboard-greeting">
              Visão Geral: <span className="highlight-profile-name">{currentProfile?.name || 'N/D'}</span>
            </Title>
            <Paragraph className="dashboard-welcome-text">
              Olá, {userNameForHeader.split(' ')[0]}! Acompanhe suas finanças e atividades de forma clara e eficiente.
            </Paragraph>
          </div>

          <Row gutter={[24, 24]} className="financial-summary-row">
            <Col xs={24} sm={12} lg={8} xl={6}>
              <Card bordered={false} className="summary-card balance-card animated-card">
                <Statistic
                  title="Saldo Atual"
                  value={financialSummary.currentBalance}
                  precision={2}
                  prefix="R$"
                  valueStyle={{ color: 'var(--map-laranja-escuro)' }}
                  loading={dashboardLoading}
                />
                <Progress 
                    percent={dashboardLoading ? 0 : Math.max(0, Math.min(100, Math.round((financialSummary.incomeThisMonth / (financialSummary.incomeThisMonth + financialSummary.expensesThisMonth || 1)) * 100) || 0))} 
                    showInfo={false} strokeColor="var(--map-dourado)" size="small" style={{marginTop: '10px'}}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8} xl={6}>
              <Card bordered={false} className="summary-card income-card animated-card" style={{animationDelay: '0.1s'}}>
                <Statistic
                  title="Receitas do Mês"
                  value={financialSummary.incomeThisMonth}
                  precision={2}
                  prefix="R$"
                  valueStyle={{ color: 'var(--map-verde-escuro)' }}
                  suffix={<ArrowUpOutlined />}
                  loading={dashboardLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8} xl={6}>
              <Card bordered={false} className="summary-card expenses-card animated-card" style={{animationDelay: '0.2s'}}>
                <Statistic
                  title="Despesas do Mês"
                  value={financialSummary.expensesThisMonth}
                  precision={2}
                  prefix="R$"
                  valueStyle={{ color: 'var(--map-vermelho-escuro)' }}
                  suffix={<ArrowDownOutlined />}
                  loading={dashboardLoading}
                />
              </Card>
            </Col>
             <Col xs={24} sm={12} lg={24} xl={6}>
                <Card bordered={false} className="summary-card quick-actions-card animated-card" style={{animationDelay: '0.3s'}}>
                    <Title level={5} style={{marginBottom: '15px', color: 'var(--header-text-primary)'}}>Ações Rápidas</Title>
                    <Space direction="vertical" style={{width: '100%'}} size="middle">
                        <Button type="primary" icon={<PlusCircleOutlined />} block className="quick-action-btn income" onClick={() => { setEditingTransaction(null); setIsReceitaModalVisible(true); }} disabled={dashboardLoading}>Nova Receita</Button>
                        <Button type="primary" danger icon={<PlusCircleOutlined />} block className="quick-action-btn expense" onClick={() => { setEditingTransaction(null); setIsDespesaModalVisible(true); }} disabled={dashboardLoading}>Nova Despesa</Button>
                        <Button icon={<CalendarOutlined />} block className="quick-action-btn neutral" onClick={() => { setEditingAppointment(null); setIsCompromissoModalVisible(true);}} disabled={dashboardLoading}>Novo Compromisso</Button>
                        <Button icon={<RetweetOutlined />} block className="quick-action-btn recurrence" onClick={() => {setEditingRecorrencia(null); setIsRecorrenciaModalVisible(true);}} disabled={dashboardLoading}>Nova Recorrência</Button>
                    </Space>
                </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: '30px' }}>
            <Col xs={24} lg={12} className="animated-card" style={{animationDelay: '0.5s'}}>
              <Card title="Distribuição de Receitas por Categoria" bordered={false} className="chart-card" loading={dashboardLoading}>
                 {(!dashboardLoading && incomeCategories.length > 0 && !incomeCategories[0]?.isPlaceholder) ? 
                    <Pie {...incomePieConfig} style={{ height: '320px' }} /> :
                    (!dashboardLoading && <Empty description="Sem receitas para exibir no gráfico." image={Empty.PRESENTED_IMAGE_SIMPLE} className="empty-chart-state"/>)
                }
              </Card>
            </Col>
            <Col xs={24} lg={12} className="animated-card" style={{animationDelay: '0.5s'}}>
              <Card title="Distribuição de Despesas por Categoria" bordered={false} className="chart-card" loading={dashboardLoading}>
                 {(!dashboardLoading && expenseCategories.length > 0 && !expenseCategories[0]?.isPlaceholder) ? 
                    <Pie {...expensePieConfig} style={{ height: '320px' }} /> :
                    (!dashboardLoading && <Empty description="Sem despesas para exibir no gráfico." image={Empty.PRESENTED_IMAGE_SIMPLE} className="empty-chart-state"/>)
                }
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[24,24]} style={{marginTop: '30px'}}>
            <Col xs={24} lg={24} className="animated-card" style={{animationDelay: '0.4s'}}>
              <Card title="Evolução Mensal (Receitas vs. Despesas)" bordered={false} className="chart-card">
                {(!dashboardLoading && monthlyTrend.length > 0) ? 
                    <Line {...lineConfig} style={{ height: '320px' }} /> :
                    (!dashboardLoading && <Empty description="Sem dados de evolução mensal para exibir." image={Empty.PRESENTED_IMAGE_SIMPLE} className="empty-chart-state"/>)
                }
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: '30px' }}>
            <Col span={24} className="animated-card" style={{animationDelay: '0.6s'}}>
              <Card title="Próximos Vencimentos e Lembretes" bordered={false} className="list-card" loading={dashboardLoading}>
                {(!dashboardLoading && upcomingItems.length > 0) ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={upcomingItems}
                    renderItem={item => (
                      <List.Item
                        actions={[
                            <Button type="text" size="small" key={`action-${item.id}`} className="list-item-action-btn">
                                Detalhes
                            </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                                className={`upcoming-item-avatar ${item.transactionType || item.itemType}`}
                                icon={
                                    item.itemType === 'transaction' 
                                        ? (item.transactionType === 'pagar' ? <ArrowDownOutlined /> : <ArrowUpOutlined />) 
                                        : (item.amount ? <DollarCircleOutlined /> : <CalendarOutlined />)
                                }
                            />
                          }
                          title={<Text className="list-item-title">{item.title}</Text>}
                          description={
                            `Vence em: ${dayjs(item.dueDate).format('DD/MM/YYYY')} (${dayjs(item.dueDate).fromNow()})` +
                            (item.amount !== null && item.amount !== undefined ? ` | Valor: R$ ${item.amount.toFixed(2).replace('.', ',')}` : '')
                          }
                        />
                         <Tag 
                            className={`upcoming-item-tag ${item.transactionType || item.itemType}`}
                            color={
                                item.itemType === 'transaction' 
                                    ? (item.transactionType === 'pagar' ? 'volcano' : 'green') 
                                    : (item.amount ? (item.transactionType === 'Pagar' ? 'purple' : 'blue') : 'default')
                            }
                        >
                            {
                                item.itemType === 'transaction' 
                                    ? (item.transactionType === 'pagar' ? 'CONTA A PAGAR' : 'CONTA A RECEBER') 
                                    : (item.amount ? `LEMBRETE (${item.transactionType || 'Valor'})` : 'LEMBRETE')
                            }
                        </Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                    !dashboardLoading && <Empty description="Nenhuma conta ou lembrete próximo para este perfil." image={Empty.PRESENTED_IMAGE_SIMPLE} className="empty-list-state"/>
                )}
              </Card>
            </Col>
          </Row>
        </Content>

        <ModalNovaReceita
            visible={isReceitaModalVisible}
            onCancel={() => { setIsReceitaModalVisible(false); setEditingTransaction(null); }}
            onOk={(values) => handleAddGeneric('receita', values)}
            currentProfile={currentProfile}
            editingTransaction={editingTransaction}
        />
        <ModalNovaDespesa
            visible={isDespesaModalVisible}
            onCancel={() => { setIsDespesaModalVisible(false); setEditingTransaction(null); }}
            onOk={(values) => handleAddGeneric('despesa', values)}
            currentProfile={currentProfile}
            editingTransaction={editingTransaction}
        />
        <ModalNovoCompromisso
            visible={isCompromissoModalVisible}
            onCancel={() => { setIsCompromissoModalVisible(false); setEditingAppointment(null); }}
            onOk={(values) => handleAddGeneric('compromisso', values)}
            currentProfile={currentProfile}
            editingAppointment={editingAppointment}
        />
        <ModalNovaRecorrencia
            visible={isRecorrenciaModalVisible}
            onCancel={() => {setIsRecorrenciaModalVisible(false); setEditingRecorrencia(null);}}
            onOk={(values) => handleAddGeneric('recorrencia', values)}
            currentProfile={currentProfile}
            editingRecorrencia={editingRecorrencia}
        />
    </>
  );
};

export default PainelUsuario;