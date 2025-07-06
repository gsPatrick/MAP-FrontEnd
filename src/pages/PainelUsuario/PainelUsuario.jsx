import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Adicionado useCallback
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
import { Line, Pie } from '@ant-design/charts'; // Assumindo que ant-design/charts está instalado
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

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const PainelUsuario = () => {
  const {
    currentProfile,
    loadingProfiles, // Estado de carregamento do ProfileContext
    isAuthenticated, // Estado de autenticação do ProfileContext
    fetchUserProfiles // <-- ADIÇÃO: Pegar a função para forçar a atualização do contexto
  } = useProfile();

  // Estado de carregamento local para os dados ESPECÍFICOS do dashboard (não o perfil)
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

 // Envolver fetchDataForDashboard em useCallback
 const fetchDataForDashboard = useCallback(async (profileId) => {
    if (!profileId) {
        setDashboardLoading(false); // Se não há perfil, não há dados para buscar
        return;
    }
    console.log(`[PainelUsuario] Buscando dados do dashboard para o perfil: ${profileId}`);
    setDashboardLoading(true); // Inicia o carregamento dos dados do dashboard
    try {
        const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
        const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');

        const [
            summaryRes,
            expenseCategoriesRes,
            incomeCategoriesRes, // Endpoint de receita pode não existir
            trendRes,
            upcomingTransactionsRes,
            upcomingAppointmentsRes
        ] = await Promise.all([
            // 1. Resumo Financeiro do Mês - Rota CORRETA
            apiClient.get(`/financial-accounts/${profileId}/summary`, { params: { period: 'este_mes' } }),
            
            // 2. Resumo de Categorias de Despesa do Mês
            apiClient.get(`/financial-accounts/${profileId}/expense-category-summary`, { params: { dateStart: monthStart, dateEnd: monthEnd } }),
            
            // 3. Resumo de Categorias de Receita do Mês (trata erro gracefulmente)
            apiClient.get(`/financial-accounts/${profileId}/income-category-summary`, { params: { dateStart: monthStart, dateEnd: monthEnd } }).catch(error => {
                 console.warn("API endpoint para resumo de receitas por categoria falhou. Tentando fallback:", error.message);
                 return { data: { data: [] }}; // Retorna estrutura vazia em caso de erro para não quebrar o Promise.all
            }),
            
            // 4. Tendência Mensal
            apiClient.get(`/financial-accounts/${profileId}/monthly-trend`),

            // 5. Próximas Contas a Pagar/Receber - Parâmetro CORRETO
            apiClient.get(`/financial-accounts/${profileId}/transactions`, { 
                params: { 
                    isPayableOrReceivable: true, 
                    isPaidOrReceived: false, 
                    dueAfter: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
                    sortBy: 'dueDate', 
                    sortOrder: 'ASC', 
                    limit: 5 
                } 
            }),

            // 6. Próximos Compromissos
            apiClient.get(`/financial-accounts/${profileId}/appointments`, { params: { status: 'Scheduled', eventDateTime_gte: dayjs().toISOString(), sortBy: 'eventDateTime', sortOrder: 'ASC', limit: 5 } })
        ]);

        // Processa os resultados
        if (summaryRes.data?.status === 'success') { // Usar optional chaining para segurança
            setFinancialSummary({
                currentBalance: summaryRes.data.data.accountTotalBalance,
                incomeThisMonth: summaryRes.data.data.totalIncome,
                expensesThisMonth: summaryRes.data.data.totalExpenses,
            });
        }
        
        if (expenseCategoriesRes.data?.status === 'success') { // Usar optional chaining
            setExpenseCategories(expenseCategoriesRes.data.data || []);
        }
        
        // Processa as categorias de receita (usando fallback se necessário)
        if (incomeCategoriesRes.data?.status === 'success' && incomeCategoriesRes.data.data.length > 0) { // Usar optional chaining
            setIncomeCategories(incomeCategoriesRes.data.data);
        } else {
             console.log("[PainelUsuario] Executando fallback para calcular categorias de receita do mês.");
             // Fallback: Buscar todas as transações do mês e agrupar as de Entrada
             const allTransactionsMonthRes = await apiClient.get(`/financial-accounts/${profileId}/transactions`, { params: { dateStart: monthStart, dateEnd: monthEnd, limit: 1000 } }); // Limite razoável
             if (allTransactionsMonthRes.data?.status === 'success') { // Usar optional chaining
                 const allTransactionsMonth = allTransactionsMonthRes.data.transactions || []; // Assumindo 'transactions' é a chave
                 const groupedIncomes = allTransactionsMonth.filter(t => t.type === 'Entrada').reduce((acc, curr) => {
                    const categoryName = curr.category?.name || 'Outras Receitas'; // Handle missing category gracefully
                    acc[categoryName] = (acc[categoryName] || 0) + parseFloat(curr.value || 0); // Handle potential non-numeric value
                    return acc;
                }, {});
                setIncomeCategories(Object.entries(groupedIncomes).map(([type, value]) => ({ type, value })));
             } else {
                 setIncomeCategories([]); // Garante que o estado fique vazio se o fallback falhar
             }
        }

        if (trendRes.data?.status === 'success') { // Usar optional chaining
            setMonthlyTrend(trendRes.data.data || []);
        }

        let combinedUpcoming = [];
        if (upcomingTransactionsRes.data?.status === 'success') { // Usar optional chaining
            combinedUpcoming.push(...upcomingTransactionsRes.data.transactions.map(t => ({ id: `trans_${t.id}`, title: t.description, dueDate: t.dueDate, amount: parseFloat(t.value), itemType: 'transaction', transactionType: t.type === 'Entrada' ? 'receber' : 'pagar' })));
        }
        if (upcomingAppointmentsRes.data?.status === 'success') { // Usar optional chaining
            combinedUpcoming.push(...upcomingAppointmentsRes.data.data.map(app => ({ id: `appt_${app.id}`, title: app.title, dueDate: app.eventDateTime, amount: app.associatedValue ? parseFloat(app.associatedValue) : null, itemType: 'appointment', transactionType: app.associatedTransactionType || (app.associatedValue ? 'lembrete_valor' : 'lembrete') })));
        }
        combinedUpcoming.sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());
        setUpcomingItems(combinedUpcoming.slice(0, 5));

    } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
        message.error("Não foi possível carregar os dados do painel.");
        // Limpar dados do dashboard em caso de erro
        setFinancialSummary({ currentBalance: 0, incomeThisMonth: 0, expensesThisMonth: 0 });
        setExpenseCategories([]);
        setIncomeCategories([]);
        setMonthlyTrend([]);
        setUpcomingItems([]);
    } finally {
        setDashboardLoading(false); // Finaliza o carregamento dos dados do dashboard
    }
 }, [currentProfile]); // Dependência: só precisa recarregar os dados do dashboard quando o perfil muda

  // --- ADIÇÃO/MODIFICAÇÃO: useEffect para sincronizar contexto e buscar dados ---
  useEffect(() => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');
      const shouldBeAuthenticated = !!token && !!userRole;

      console.log(`[PainelUsuario useEffect] Estado ProfileContext: isAuthenticated=${isAuthenticated}, loadingProfiles=${loadingProfiles}, currentProfile=${!!currentProfile}`);
      console.log(`[PainelUsuario useEffect] Estado localStorage: authToken=${!!token}, userRole=${!!userRole}, shouldBeAuthenticated=${shouldBeAuthenticated}`);

      // Cenário 1: ProfileContext indica que NÃO está autenticado ou está SEM perfil,
      //           mas o localStorage sugere que DEVERIA estar logado, E o contexto não está carregando perfis.
      //           -> Forçar o ProfileContext a re-ler o localStorage e atualizar seu estado interno.
      //           Isso acontece após o login, onde o localStorage é preenchido,
      //           mas o ProfileContext existente (não remontado) não reagiu ainda.
      if ((!isAuthenticated || !currentProfile) && !loadingProfiles && shouldBeAuthenticated) {
          console.log("[PainelUsuario useEffect] -> Detectado estado inconsistente no contexto, mas localStorage sugere autenticação. Forçando fetchUserProfiles do contexto.");
          // Chamar fetchUserProfiles() do contexto. Isso atualizará isAuthenticated e currentProfile.
          // O update do estado do contexto fará com que este useEffect rode novamente.
          fetchUserProfiles(); 
          return; // Sair desta execução do effect para evitar lógica baseada no estado antigo
      }

      // Cenário 2: ProfileContext indica que está carregando perfis (acontece no mount ou após chamar fetchUserProfiles)
      //           -> Apenas esperar. O effect vai re-executar quando loadingProfiles mudar para false.
       if (loadingProfiles) {
           console.log("[PainelUsuario useEffect] -> ProfileContext está carregando perfis. Aguardando...");
           return; // Sair
       }

      // Cenário 3: ProfileContext ESTÁ pronto (não está loading), autenticado, E tem um perfil selecionado.
      //           -> Este é o estado desejado. Agora podemos buscar os dados específicos do dashboard para este perfil.
      if (isAuthenticated && currentProfile) {
          console.log("[PainelUsuario useEffect] -> ProfileContext pronto e válido (Autenticado, com perfil). Buscando dados do dashboard.");
          // Chama a função local para buscar dados do dashboard.
          // fetchDataForDashboard já define dashboardLoading(true).
          fetchDataForDashboard(currentProfile.id); // Usa o ID do perfil garantido que está no contexto
      }
      // Cenário 4: ProfileContext NÃO está autenticado, NÃO está loading, E localStorage TAMBÉM não tem token/role.
      //           -> Estado consistente de "deslogado". Exibir a mensagem de Acesso Negado.
      else if (!isAuthenticated && !loadingProfiles && !shouldBeAuthenticated) {
           console.log("[PainelUsuario useEffect] -> ProfileContext e localStorage indicam não autenticado. Exibindo Acesso Negado.");
           setDashboardLoading(false); // Garante que o componente não fique em um estado de loading infinito se não autenticado
      }
       // Cenário 5: ProfileContext ESTÁ autenticado, NÃO está loading, mas está SEM currentProfile, E localStorage TAMBÉM não tem token/role.
       //           -> Estado consistente de "logado mas sem perfil financeiro". Exibir a mensagem "Nenhum Perfil Selecionado".
       //           (Isso pode acontecer para um usuário ADMIN, ou um CLIENTE que ainda não criou um perfil PF/PJ - embora a API crie um padrão).
      else if (!currentProfile && isAuthenticated && !loadingProfiles && !shouldBeAuthenticated) {
           console.log("[PainelUsuario useEffect] -> ProfileContext: autenticado sem perfil, localStorage vazio. Exibindo Nenhum Perfil Selecionado.");
           setDashboardLoading(false); // Garante que o componente não fique em loading
      }
       // Qualquer outro estado (como autenticado mas sem perfil, mas *com* localStorage indicando autenticação)
       // será capturado pelo primeiro 'if' na próxima execução do effect (após o update do contexto).


  }, [isAuthenticated, loadingProfiles, currentProfile, fetchUserProfiles, fetchDataForDashboard]); // CORREÇÃO: Dependências do useEffect

  const formatCurrency = (value) => `R$ ${parseFloat(value || 0).toFixed(2).replace('.', ',')}`;

  // Configurações dos gráficos (não precisam de modificação, dependem dos estados locais)
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
          if (parseFloat(percentage) > 3) { // Só mostra label se a fatia for maior que 3%
            return `${type}\n${percentage}%`;
          }
          return ''; // Não mostra label para fatias muito pequenas
      },
      style: { fontSize: 9, fill: 'rgba(0, 0, 0, 0.75)'},
    } : false,
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }, {type: 'tooltip'}],
    legend: false, // O label spider já identifica as categorias
    tooltip: {
        formatter: (datum) => {
          if(datum.isPlaceholder) return null;
          const totalExpenses = expenseCategories.reduce((sum, item) => sum + parseFloat(item.value || 0), 0); // Handle potential non-numeric
          const percentage = totalExpenses > 0 ? ((parseFloat(datum.value || 0) / totalExpenses) * 100).toFixed(1) : 0;
          return { name: datum.type, value: `${formatCurrency(datum.value)} (${percentage}%)` };
        },
    },
    statistic: {
      title: { offsetY: -4, content: 'Total Despesas', style: {fontSize: '13px', color: 'var(--header-text-secondary)'} },
      content: {
        offsetY: 4,
        style: { fontSize: '18px', fontWeight: 'bold', color: 'var(--map-vermelho-escuro)'},
        formatter: () => expenseCategories.length > 0 && !expenseCategories[0]?.isPlaceholder
            ? `${formatCurrency(expenseCategories.reduce((acc, curr) => acc + parseFloat(curr.value || 0), 0))}` // Handle potential non-numeric
            : "R$ 0,00",
      },
    },
    theme: 'light',
    color: ['#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#F78C6B', '#7A869A', '#5F6C7F', '#D62828', '#F77F00'], // Cores adicionais se houver mais categorias
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
          if (parseFloat(percentage) > 3) { // Só mostra label se a fatia for maior que 3%
            return `${type}\n${percentage}%`;
          }
          return ''; // Não mostra label para fatias muito pequenas
      },
      style: { fontSize: 9, fill: 'rgba(0, 0, 0, 0.75)' },
    } : false,
    interactions: [{ type: 'element-selected' }, { type: 'element-active' }, {type: 'tooltip'}],
    legend: false, // O label spider já identifica as categorias
    tooltip: {
        formatter: (datum) => {
           if(datum.isPlaceholder) return null;
          const totalIncomes = incomeCategories.reduce((sum, item) => sum + parseFloat(item.value || 0), 0); // Handle potential non-numeric
          const percentage = totalIncomes > 0 ? ((parseFloat(datum.value || 0) / totalIncomes) * 100).toFixed(1) : 0;
          return { name: datum.type, value: `${formatCurrency(datum.value)} (${percentage}%)` };
        },
    },
    statistic: {
      title: { offsetY: -4, content: 'Total Receitas', style: {fontSize: '13px', color: 'var(--header-text-secondary)'} },
      content: {
        offsetY: 4,
        style: { fontSize: '18px', fontWeight: 'bold', color: 'var(--map-verde-escuro)'},
        formatter: () => incomeCategories.length > 0 && !incomeCategories[0]?.isPlaceholder
            ? `${formatCurrency(incomeCategories.reduce((acc, curr) => acc + parseFloat(curr.value || 0), 0))}` // Handle potential non-numeric
            : "R$ 0,00",
      },
    },
    theme: 'light',
    color: ['#4CAF50', '#8BC34A', '#AED581', '#C5E1A5', '#DCEDC8', '#B9F6CA', '#69F0AE', '#00E676', '#9CCC65', '#7CB342'], // Cores adicionais
  }), [incomeCategories]);


  const lineConfig = useMemo(() => ({
    data: monthlyTrend,
    xField: 'month', // Supondo que o backend retorna 'month' formatado (ex: 'Jan', 'Fev')
    yField: 'value',
    seriesField: 'type', // Supondo 'Receitas' ou 'Despesas'
    yAxis: { 
        label: { 
            formatter: (v) => { // Formatador para o eixo Y
                 const value = parseFloat(v || 0);
                 if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1).replace('.', ',')}M`;
                 if (value >= 1000) return `R$ ${(value / 1000).toFixed(1).replace('.', ',')}k`;
                 return `R$ ${value.toFixed(0)}`; // Valores menores que 1k
            } 
        } 
    },
    xAxis: {
       // Pode precisar de configuração extra se o eixo X não for formatado corretamente
       // Por exemplo, se for data, usar type: 'time' ou 'cat' dependendo do formato
       type: 'cat', // Supondo que 'month' é uma categoria de string
       label: { autoRotate: true },
    },
    legend: { position: 'top-right', itemName: {style: {fill: 'var(--header-text-secondary)'}} },
    smooth: true,
    lineStyle: (d) => {
        if(d.type === 'Receitas') return {stroke: 'var(--map-dourado)', lineWidth: 2.5, shadowColor: 'rgba(224,188,99,0.3)', shadowBlur: 8};
        if(d.type === 'Despesas') return {stroke: 'var(--map-laranja)', lineWidth: 2.5, lineDash: [4,4], shadowColor: 'rgba(204,102,51,0.3)', shadowBlur: 8};
         return {stroke: '#999', lineWidth: 1.5}; // Cor padrão para outros tipos se houver
    },
    point: { size: 3, shape: 'circle', style: { fill: 'white', lineWidth: 1.5 } },
    tooltip: {
        formatter: (datum) => {
          return { name: datum.type, value: formatCurrency(datum.value) };
        },
      },
    theme: 'light',
    animation: { appear: { animation: 'path-in', duration: 600 } },
  }), [monthlyTrend]);


  // --- Lógica de Renderização Condicional ---
  // Prioridade: Loader do ProfileContext -> Acesso Negado -> Nenhum Perfil -> Loader do Dashboard -> Dashboard Completo

  // 1. Mostra loader se o ProfileContext está carregando OU
  //    se o dashboard local está carregando E o ProfileContext já indicou que está autenticado E com perfil.
  if (loadingProfiles || (dashboardLoading && isAuthenticated && currentProfile)) { 
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

  // 2. Se não está carregando (em nenhum nível) E o ProfileContext indica que NÃO está autenticado.
  //    (O useEffect já cuidou de tentar sincronizar se localStorage sugeria o contrário).
  if (!isAuthenticated && !loadingProfiles) { 
      return (
        <Content style={{padding: 50, textAlign: 'center', minHeight: 'calc(100vh - 64px)'}}> {/* Adiciona min-height para centralizar melhor */}
            <Title level={3}>Acesso Negado</Title>
            <Paragraph>Você precisa estar logado para acessar o painel.</Paragraph>
            {/* Usa window.location.href para forçar um recarregamento total na página de login, limpando o estado anterior */}
            <Button type="primary" onClick={() => window.location.href = '/login'}>Ir para Login</Button>
        </Content>
      );
  }
  
  // 3. Se não está carregando (em nenhum nível) E o ProfileContext ESTÁ autenticado, mas está SEM currentProfile.
   //    (O useEffect já cuidou de tentar sincronizar se localStorage sugeria o contrário).
  if (!currentProfile && isAuthenticated && !loadingProfiles){
       return (
        <Content className="panel-content-area dashboard-loading" style={{minHeight: 'calc(100vh - 64px)'}}> {/* Adiciona min-height */}
             <div className="skeleton-loader-card" style={{padding: '40px'}}>
                <PieChartOutlined className="loader-icon" style={{animation: 'none', transform: 'none', opacity: 0.6}}/>
                <Title level={4} style={{color: 'var(--map-cinza-texto)', marginTop: '20px'}}>Nenhum Perfil Selecionado</Title>
                <Paragraph style={{color: 'var(--map-cinza-texto)'}}>
                    Parece que você não tem nenhum perfil financeiro (PF/PJ) selecionado ou cadastrado para este tipo de acesso.
                </Paragraph>
                <Paragraph style={{color: 'var(--map-cinza-texto)'}}>
                     Vá para "Meu Perfil" para criar ou selecionar um perfil financeiro para começar.
                </Paragraph>
                 {/* Usa window.location.href para garantir que a página Meu Perfil inicialize o ProfileContext corretamente */}
                 <Button type="primary" onClick={() => window.location.href = '/painel/meu-perfil'} style={{marginTop: '15px'}}>
                    Ir para Meu Perfil
                </Button>
            </div>
        </Content>
    )
  }

  // 4. Se chegamos aqui, significa que !loadingProfiles é true, isAuthenticated é true, e currentProfile é truthy.
  //    Podemos renderizar o dashboard completo. dashboardLoading controlará os loaders internos.
  return (
    <>
        {/* Usando variant="elevated" ou "outlined" em vez de bordered={false} conforme warning */}
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
              <Card variant="elevated" className="summary-card balance-card animated-card">
                <Statistic
                  title="Saldo Atual"
                  value={financialSummary.currentBalance}
                  precision={2}
                  prefix="R$"
                  valueStyle={{ color: 'var(--map-laranja-escuro)' }}
                  loading={dashboardLoading}
                />
                 {/* A barra de progresso pode ser exibida mesmo durante dashboardLoading */}
                <Progress
                    percent={dashboardLoading ? 0 : Math.max(0, Math.min(100, Math.round((financialSummary.incomeThisMonth / (financialSummary.incomeThisMonth + financialSummary.expensesThisMonth || 1)) * 100) || 0))}
                    showInfo={false} strokeColor="var(--map-dourado)" size="small" style={{marginTop: '10px'}}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8} xl={6}>
              <Card variant="elevated" className="summary-card income-card animated-card" style={{animationDelay: '0.1s'}}>
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
              <Card variant="elevated" className="summary-card expenses-card animated-card" style={{animationDelay: '0.2s'}}>
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
             <Col xs={24} sm={12} lg={24} xl={6}> {/* Col para Quick Actions pode ser 24 em LG e 6 em XL */}
                <Card variant="elevated" className="summary-card quick-actions-card animated-card" style={{animationDelay: '0.3s'}}>
                    <Title level={5} style={{marginBottom: '15px', color: 'var(--header-text-primary)'}}>Ações Rápidas</Title>
                    <Space direction="vertical" style={{width: '100%'}} size="middle">
                        {/* Desabilitar botões enquanto carrega os dados do dashboard */}
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
              {/* Usar variant="outlined" para manter a borda definida no CSS */}
              <Card title="Distribuição de Receitas por Categoria" variant="outlined" className="chart-card" loading={dashboardLoading}>
                 {(!dashboardLoading && incomeCategories.length > 0 && !incomeCategories[0]?.isPlaceholder) ? 
                    <Pie {...incomePieConfig} style={{ height: '320px' }} /> :
                    (!dashboardLoading && <Empty description="Sem receitas para exibir no gráfico." image={Empty.PRESENTED_IMAGE_SIMPLE} className="empty-chart-state"/>)
                }
              </Card>
            </Col>
            <Col xs={24} lg={12} className="animated-card" style={{animationDelay: '0.5s'}}>
               {/* Usar variant="outlined" */}
              <Card title="Distribuição de Despesas por Categoria" variant="outlined" className="chart-card" loading={dashboardLoading}>
                 {(!dashboardLoading && expenseCategories.length > 0 && !expenseCategories[0]?.isPlaceholder) ? 
                    <Pie {...expensePieConfig} style={{ height: '320px' }} /> :
                    (!dashboardLoading && <Empty description="Sem despesas para exibir no gráfico." image={Empty.PRESENTED_IMAGE_SIMPLE} className="empty-chart-state"/>)
                }
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[24,24]} style={{marginTop: '30px'}}>
            <Col xs={24} lg={24} className="animated-card" style={{animationDelay: '0.4s'}}>
               {/* Usar variant="outlined" */}
              <Card title="Evolução Mensal (Receitas vs. Despesas)" variant="outlined" className="chart-card">
                {(!dashboardLoading && monthlyTrend.length > 0) ? 
                    <Line {...lineConfig} style={{ height: '320px' }} /> :
                    (!dashboardLoading && <Empty description="Sem dados de evolução mensal para exibir." image={Empty.PRESENTED_IMAGE_SIMPLE} className="empty-chart-state"/>)
                }
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: '30px' }}>
            <Col span={24} className="animated-card" style={{animationDelay: '0.6s'}}>
               {/* Usar variant="outlined" */}
              <Card title="Próximos Vencimentos e Lembretes" variant="outlined" className="list-card" loading={dashboardLoading}>
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
                            (item.amount !== null && item.amount !== undefined ? ` | Valor: R$ ${parseFloat(item.amount).toFixed(2).replace('.', ',')}` : '')
                          }
                        />
                         <Tag 
                            className={`upcoming-item-tag ${item.transactionType || item.itemType}`}
                            color={
                                item.itemType === 'transaction' 
                                    ? (item.transactionType === 'pagar' ? 'volcano' : 'green') 
                                    : (item.amount ? (item.transactionType === 'Pagar' ? 'purple' : 'blue') : 'default') // Ajustar cores se necessário
                            }
                        >
                            {
                                item.itemType === 'transaction' 
                                    ? (item.transactionType === 'pagar' ? 'CONTA A PAGAR' : 'CONTA A RECEBER') 
                                    : (item.amount ? `LEMBRETE (${item.transactionType || 'Valor'})` : 'LEMBRETE') // Ajustar textos se necessário
                            }
                        </Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                    // Exibe Empty se não estiver carregando E a lista de itens estiver vazia
                    !dashboardLoading && <Empty description="Nenhuma conta ou lembrete próximo para este perfil." image={Empty.PRESENTED_IMAGE_SIMPLE} className="empty-list-state"/>
                )}
              </Card>
            </Col>
          </Row>
        </Content>

        {/* Modais permanecem inalterados */}
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