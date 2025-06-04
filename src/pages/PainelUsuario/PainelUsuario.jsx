import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Typography, Card, Row, Col, Statistic, Progress, Button, List, Tag, Empty, Space, Avatar, message } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusCircleOutlined,
  CalendarOutlined, // Usado para compromissos na lista
  PieChartOutlined,
  RetweetOutlined,
  DollarCircleOutlined, // Usado para transações financeiras na lista
} from '@ant-design/icons';
import { Line, Pie } from '@ant-design/charts';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

import HeaderPanel from '../../componentsPanel/HeaderPanel/HeaderPanel';
import SidebarPanel from '../../componentsPanel/SidebarPanel/SidebarPanel';
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

const { Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const PainelUsuario = () => {
  const {
    currentProfile,
    loadingProfiles,
    isAuthenticated
  } = useProfile();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [financialSummary, setFinancialSummary] = useState({ currentBalance: 0, incomeThisMonth: 0, expensesThisMonth: 0 });
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]); // <<< NOVO ESTADO PARA GRÁFICO DE RECEITAS
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [upcomingItems, setUpcomingItems] = useState([]); // <<< Alterado de upcomingBills para upcomingItems

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
        setFinancialSummary({ currentBalance: 0, incomeThisMonth: 0, expensesThisMonth: 0 });
        setExpenseCategories([]);
        setIncomeCategories([]);
        setMonthlyTrend([]);
        setUpcomingItems([]);
        return;
    }
    setDashboardLoading(true);
    try {
      // 1. Resumo Financeiro
      const summaryRes = await apiClient.get(`/financial-accounts/${profileId}/transactions/summary`, {
          params: {
              dateStart: dayjs().startOf('month').format('YYYY-MM-DD'),
              dateEnd: dayjs().endOf('month').format('YYYY-MM-DD'),
          }
      });
      if (summaryRes.data && summaryRes.data.status === 'success') {
        setFinancialSummary({
            currentBalance: summaryRes.data.data.saldoEfetivado,
            incomeThisMonth: summaryRes.data.data.totalEntradas,
            expensesThisMonth: summaryRes.data.data.totalSaidas,
        });
      }

      // 2. Transações para gráficos de categoria (Receitas e Despesas)
      const transactionsForChartsRes = await apiClient.get(`/financial-accounts/${profileId}/transactions`, {
        params: {
          dateStart: dayjs().startOf('month').format('YYYY-MM-DD'),
          dateEnd: dayjs().endOf('month').format('YYYY-MM-DD'),
          limit: 1000, // Pegar um número grande para agrupar
        }
      });
      if (transactionsForChartsRes.data && transactionsForChartsRes.data.status === 'success') {
        const allTransactionsMonth = transactionsForChartsRes.data.transactions || [];
        
        const groupedExpenses = allTransactionsMonth
            .filter(t => t.type === 'Saída')
            .reduce((acc, curr) => {
                const categoryName = curr.category?.name || 'Outras Despesas';
                acc[categoryName] = (acc[categoryName] || 0) + parseFloat(curr.value);
                return acc;
            }, {});
        setExpenseCategories(Object.entries(groupedExpenses).map(([type, value]) => ({ type, value })));
        
        const groupedIncomes = allTransactionsMonth
            .filter(t => t.type === 'Entrada')
            .reduce((acc, curr) => {
                const categoryName = curr.category?.name || 'Outras Receitas';
                acc[categoryName] = (acc[categoryName] || 0) + parseFloat(curr.value);
                return acc;
            }, {});
        setIncomeCategories(Object.entries(groupedIncomes).map(([type, value]) => ({ type, value })));
      }
      
      // 3. Tendência Mensal
      const trendData = [];
      for (let i = 5; i >= 0; i--) {
        const monthTarget = dayjs().subtract(i, 'month');
        const monthSummaryRes = await apiClient.get(`/financial-accounts/${profileId}/transactions/summary`, {
            params: {
                dateStart: monthTarget.startOf('month').format('YYYY-MM-DD'),
                dateEnd: monthTarget.endOf('month').format('YYYY-MM-DD'),
            }
        });
        if (monthSummaryRes.data && monthSummaryRes.data.status === 'success') {
            trendData.push({ month: monthTarget.format('MMM'), type: 'Receitas', value: parseFloat(monthSummaryRes.data.data.totalEntradas) });
            trendData.push({ month: monthTarget.format('MMM'), type: 'Despesas', value: parseFloat(monthSummaryRes.data.data.totalSaidas) });
        }
      }
      setMonthlyTrend(trendData);

      // 4. Próximos Itens (Transações Pendentes e Compromissos Agendados)
      let combinedUpcoming = [];

      // Buscar Transações Pendentes
      const upcomingTransactionsRes = await apiClient.get(`/financial-accounts/${profileId}/transactions`, {
        params: {
          isPayableOrReceivable: true,
          isPaidOrReceived: false,
          dueDate_gte: dayjs().format('YYYY-MM-DD'), 
          sortBy: 'dueDate',
          sortOrder: 'ASC',
          limit: 5 // Limite para transações
        }
      });
      if (upcomingTransactionsRes.data && upcomingTransactionsRes.data.status === 'success') {
        const financialUpcoming = upcomingTransactionsRes.data.transactions.map(t => ({
            id: `trans_${t.id}`, // Adiciona prefixo para chave única
            title: t.description,
            dueDate: t.dueDate, // Usar dueDate para transações
            amount: parseFloat(t.value),
            itemType: 'transaction', // Tipo para diferenciar na renderização
            transactionType: t.type === 'Entrada' ? 'receber' : 'pagar'
        }));
        combinedUpcoming.push(...financialUpcoming);
      }

      // Buscar Compromissos Agendados
      const upcomingAppointmentsRes = await apiClient.get(`/financial-accounts/${profileId}/appointments`, {
          params: {
              status: 'Scheduled', // Ou 'Scheduled,Confirmed' dependendo da lógica do backend
              eventDateTime_gte: dayjs().toISOString(), // A partir de agora
              sortBy: 'eventDateTime',
              sortOrder: 'ASC',
              limit: 5 // Limite para compromissos
          }
      });
      if (upcomingAppointmentsRes.data && upcomingAppointmentsRes.data.status === 'success') {
          const appointmentUpcoming = upcomingAppointmentsRes.data.appointments.map(app => ({
              id: `appt_${app.id}`, // Adiciona prefixo
              title: app.title,
              dueDate: app.eventDateTime, // Usar eventDateTime para compromissos
              amount: app.associatedValue ? parseFloat(app.associatedValue) : null,
              itemType: 'appointment', // Tipo para diferenciar
              transactionType: app.associatedTransactionType || (app.associatedValue ? 'lembrete_valor' : 'lembrete')
          }));
          combinedUpcoming.push(...appointmentUpcoming);
      }
      
      // Ordenar combinados e pegar os N mais próximos
      combinedUpcoming.sort((a,b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());
      setUpcomingItems(combinedUpcoming.slice(0, 5)); // Pega os 5 mais próximos no total

    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      message.error("Não foi possível carregar os dados do painel.");
       setFinancialSummary({ currentBalance: 0, incomeThisMonth: 0, expensesThisMonth: 0 });
       setExpenseCategories([]);
       setIncomeCategories([]);
       setMonthlyTrend([]);
       setUpcomingItems([]);
    } finally {
      setDashboardLoading(false);
    }
  };
  
  useEffect(() => {
    document.body.classList.add('painel-active');
    if (!loadingProfiles && isAuthenticated && currentProfile) {
        fetchDataForDashboard(currentProfile.id);
    } else if (!loadingProfiles && !isAuthenticated) {
        setDashboardLoading(false);
    } else if (!loadingProfiles && isAuthenticated && !currentProfile){
        setDashboardLoading(false);
    }
  }, [currentProfile, loadingProfiles, isAuthenticated]);

  const handleAddGeneric = (type, values) => {
    // ... (lógica de handleAddGeneric permanece a mesma da resposta anterior)
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
        dataToSend.eventDateTime = values.prazo;
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

  // Configuração do Gráfico de Pizza para DESPESAS
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
          if (parseFloat(percentage) > 3) { // Só mostra label para fatias maiores
            return `${type}\n${percentage}%`;
          }
          return '';
      },
      style: { fontSize: 9, fill: 'rgba(0, 0, 0, 0.75)'},
    } : false,
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }, {type: 'tooltip'}],
    legend: false, // Remover legenda para dar mais espaço, tooltip mostrará
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

  // Configuração do Gráfico de Pizza para RECEITAS
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

  const FooterPanelPlaceholder = () => (
    <Footer style={{ textAlign: 'center', background: '#f0f2f5', padding: '15px 50px', fontSize: '13px', color: 'var(--header-text-secondary)' }}>
      MAP no Controle ©{new Date().getFullYear()} - Seu Assistente Pessoal Inteligente.
    </Footer>
  );

  if (loadingProfiles || (dashboardLoading && isAuthenticated)) {
    return (
        <Layout style={{ minHeight: '100vh' }} className="painel-usuario-main-layout">
            <SidebarPanel
                collapsed={sidebarCollapsed}
                onCollapse={setSidebarCollapsed}
                selectedProfileType={currentProfile?.type}
            />
            <Layout className="site-layout" style={{ marginLeft: sidebarCollapsed ? 80 : 220, transition: 'margin-left 0.2s ease' }}>
                <HeaderPanel userName={userNameForHeader} appName={sidebarCollapsed ? "" : "MAP"}/>
                <Content className="panel-content-area dashboard-loading">
                    <div className="skeleton-loader-card">
                        <PieChartOutlined className="loader-icon" />
                        <Title level={4} style={{color: 'var(--map-cinza-texto)', marginTop: '15px'}}>
                            {loadingProfiles ? "Carregando seu perfil..." : "Carregando sua Visão Geral..."}
                        </Title>
                        <Paragraph style={{color: 'var(--map-cinza-texto)'}}>Aguarde um momento, estamos preparando tudo para você.</Paragraph>
                        <Progress percent={loadingProfiles ? 30 : 70} status="active" strokeColor={{ from: 'var(--map-dourado)', to: 'var(--map-laranja)' }} trailColor="#f0f0f0"/>
                    </div>
                </Content>
                 <FooterPanelPlaceholder />
            </Layout>
        </Layout>
    )
  }

  if (!isAuthenticated && !loadingProfiles) {
      return (
        <Layout style={{ minHeight: '100vh' }}>
            <Content style={{padding: 50, textAlign: 'center'}}>
                <Title level={3}>Acesso Negado</Title>
                <Paragraph>Você precisa estar logado para acessar o painel.</Paragraph>
                <Button type="primary" onClick={() => window.location.href = '/login'}>Ir para Login</Button>
            </Content>
        </Layout>
      );
  }
  
  if (!currentProfile && isAuthenticated && !loadingProfiles){
       return (
        <Layout style={{ minHeight: '100vh' }} className="painel-usuario-main-layout">
            <SidebarPanel collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} selectedProfileType={null}/>
            <Layout className="site-layout" style={{ marginLeft: sidebarCollapsed ? 80 : 220, transition: 'margin-left 0.2s ease' }}>
                <HeaderPanel userName={userNameForHeader} appName={sidebarCollapsed ? "" : "MAP"}/>
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
                 <FooterPanelPlaceholder />
            </Layout>
        </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }} className="painel-usuario-main-layout">
      <SidebarPanel
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        selectedProfileType={currentProfile?.type}
      />
      <Layout className="site-layout" style={{ marginLeft: sidebarCollapsed ? 80 : 220, transition: 'margin-left 0.2s ease' }}>
        <HeaderPanel
          userName={userNameForHeader}
          appName={sidebarCollapsed ? "" : "MAP"}
        />
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
            <Col xs={24} lg={12} className="animated-card" style={{animationDelay: '0.5s'}}> {/* Mantido mesmo delay para aparecerem juntos */}
              <Card title="Distribuição de Despesas por Categoria" bordered={false} className="chart-card" loading={dashboardLoading}>
                 {(!dashboardLoading && expenseCategories.length > 0 && !expenseCategories[0]?.isPlaceholder) ? 
                    <Pie {...expensePieConfig} style={{ height: '320px' }} /> :
                    (!dashboardLoading && <Empty description="Sem despesas para exibir no gráfico." image={Empty.PRESENTED_IMAGE_SIMPLE} className="empty-chart-state"/>)
                }
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[24,24]} style={{marginTop: '30px'}}>
            <Col xs={24} lg={24} className="animated-card" style={{animationDelay: '0.4s'}}> {/* Ajustado o span para ocupar a linha toda */}
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
                    dataSource={upcomingItems} // Usa o estado combinado
                    renderItem={item => (
                      <List.Item
                        actions={[
                            <Button type="text" size="small" key={`action-${item.id}`} className="list-item-action-btn">
                                Detalhes {/* Ou alguma ação específica baseada em item.itemType */}
                            </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                                className={`upcoming-item-avatar ${item.transactionType || item.itemType}`} // Usa transactionType se for transação
                                icon={
                                    item.itemType === 'transaction' 
                                        ? (item.transactionType === 'pagar' ? <ArrowDownOutlined /> : <ArrowUpOutlined />) 
                                        : (item.amount ? <DollarCircleOutlined /> : <CalendarOutlined />) // Ícone para compromisso
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
        <FooterPanelPlaceholder />
      </Layout>

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
    </Layout>
  );
};

export default PainelUsuario;