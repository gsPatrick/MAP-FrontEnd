// src/pages/PainelUsuario/TransacoesPage/TransacoesPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Layout, Typography, Button, Row, Col, Card, Select, DatePicker,
  Table, Tag, Space, Statistic, Tooltip, Modal, Form, Input, InputNumber, // Removido Radio, já que o modal de transação não o usa diretamente para tipo.
  Empty, message
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined,
  // Ícones de seta e gráficos não são usados diretamente aqui, mas podem permanecer se desejar
} from '@ant-design/icons';
// import { Line, Pie, Column as ColumnChart } from '@ant-design/charts'; // Gráficos não são desta página
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

// Contexto
import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

// Componentes do Painel
import HeaderPanel from '../../componentsPanel/HeaderPanel/HeaderPanel';
import SidebarPanel from '../../componentsPanel/SidebarPanel/SidebarPanel';
// Modais de Receita/Despesa (reutilizados do PainelUsuario)
import ModalNovaReceita from '../../modals/ModalNovaReceita/ModalNovaReceita';
import ModalNovaDespesa from '../../modals/ModalNovaDespesa/ModalNovaDespesa';

import './TransacoesPage.css';

dayjs.locale('pt-br');

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker; // Para filtro de período

const TransacoesPage = () => {
  const { 
    currentProfile,
    loadingProfiles,
    isAuthenticated
  } = useProfile();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const userNameForHeader = currentProfile?.ownerClientName || currentProfile?.name || "Usuário MAP";

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]); // Este pode não ser mais necessário se a API fizer toda a filtragem
  
  // Filtros
  const [filterPeriod, setFilterPeriod] = useState([dayjs().startOf('month'), dayjs().endOf('month')]); // Array [startDate, endDate]
  const [filterType, setFilterType] = useState('todas'); // 'todas', 'Entrada', 'Saída'
  const [filterCategory, setFilterCategory] = useState(null); // ID da categoria
  const [filterDescription, setFilterDescription] = useState('');


  const [allSystemCategories, setAllSystemCategories] = useState([]); // Para popular o Select de filtro de categoria
  const [loading, setLoading] = useState(true); // Loading da página/tabela

  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionTypeForModal, setTransactionTypeForModal] = useState('despesa'); // 'Entrada' ou 'Saída'

  const [form] = Form.useForm(); // Formulário para o modal unificado


  // Buscar categorias do sistema uma vez
  useEffect(() => {
    if (isAuthenticated) {
      apiClient.get('/system/financial-categories?isActive=true') // Busca apenas categorias ativas
        .then(response => {
          if (response.data && response.data.status === 'success') {
            setAllSystemCategories(response.data.data || []);
          }
        })
        .catch(error => {
          console.error("Erro ao buscar categorias do sistema:", error);
          message.error("Não foi possível carregar as categorias para filtro.");
        });
    }
  }, [isAuthenticated]);

  // Buscar transações quando filtros ou perfil mudarem
  useEffect(() => {
    if (!loadingProfiles && isAuthenticated && currentProfile) {
      fetchTransactions();
    } else if (!loadingProfiles && !isAuthenticated) {
      setLoading(false);
      setTransactions([]);
    } else if (!loadingProfiles && isAuthenticated && !currentProfile) {
        setLoading(false);
        setTransactions([]);
    }
  }, [filterPeriod, filterType, filterCategory, filterDescription, currentProfile, loadingProfiles, isAuthenticated]);


  const fetchTransactions = async () => {
    if (!currentProfile) return;
    setLoading(true);
    
    const params = {
      // page: 1, // Adicionar paginação se necessário no futuro
      // limit: 100, // Por enquanto, pegar um limite alto para o frontend filtrar/paginar
      dateStart: filterPeriod && filterPeriod[0] ? filterPeriod[0].format('YYYY-MM-DD') : undefined,
      dateEnd: filterPeriod && filterPeriod[1] ? filterPeriod[1].format('YYYY-MM-DD') : undefined,
      type: filterType !== 'todas' ? filterType : undefined,
      financialCategoryId: filterCategory || undefined,
      search: filterDescription || undefined, // Backend usa 'search' para descrição/notas
      sortBy: 'transactionDate',
      sortOrder: 'DESC'
    };

    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/transactions`, { params });
      if (response.data && response.data.status === 'success') {
        setTransactions(response.data.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      message.error("Não foi possível carregar as transações.");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };
  
  // O useMemo para `summary` e `categoryChartData` foi removido, pois os gráficos não estão nesta página.
  // Se precisar de resumo, pode ser calculado aqui.

  const handleOpenModal = (type, transaction = null) => {
    setTransactionTypeForModal(type); // 'Entrada' ou 'Saída'
    setEditingTransaction(transaction);
    // O preenchimento do formulário já é feito pelo useEffect nos modais
    setIsTransactionModalVisible(true);
  };

  const handleTransactionModalOk = async (values) => {
    if (!currentProfile) {
        message.error("Perfil não selecionado.");
        return;
    }

    const isEditing = !!editingTransaction;
    const endpoint = isEditing 
        ? `/financial-accounts/${currentProfile.id}/transactions/${editingTransaction.id}`
        : `/financial-accounts/${currentProfile.id}/transactions`;
    const method = isEditing ? 'put' : 'post';

    const dataToSend = {
      ...values, // description, value, financialCategoryId (ID), notes
      transactionDate: dayjs(values.data).format('YYYY-MM-DD'), // Modal envia 'data'
      type: transactionTypeForModal, // Tipo definido ao abrir o modal
    };
    delete dataToSend.data; // Remove o campo 'data' original

    // Lógica específica para despesas (cartão, parcelamento)
    if (transactionTypeForModal === 'Saída') {
        dataToSend.creditCardId = values.cartaoId || null; // Do ModalNovaDespesa
        
        if (values.formaPagamento === 'cartao' && values.cartaoId && values.isParcelada) {
            // Se for edição de parcelada, o endpoint e payload são diferentes
            if (isEditing) {
                 message.warn("A edição completa de compras parceladas (valor, parcelas, cartão) deve ser feita pela funcionalidade 'Refazer Compra Parcelada'. Aqui você pode editar descrição, categoria ou notas da parcela individual.");
                 // Para edição de parcela individual, só alguns campos são permitidos.
                 // O backend deve tratar isso. Aqui, enviamos o que o modal permite alterar.
                 // O endpoint continua sendo o de update da transação individual da parcela.
            } else { // Criando uma nova parcelada
                dataToSend.endpoint = `/financial-accounts/${currentProfile.id}/transactions/parcelled`; // Sobrescreve endpoint
                dataToSend.totalValue = dataToSend.value; // 'value' do form é o total
                dataToSend.numberOfParcels = values.numeroParcelas;
                dataToSend.initialDueDate = dataToSend.transactionDate; // Data da compra
                // creditCardId já está em dataToSend
                delete dataToSend.value;
            }
        }
        // Remove campos de controle do modal de despesa
        delete dataToSend.formaPagamento;
        delete dataToSend.isParceladaCheck;
        delete dataToSend.cartaoId; // Já foi para creditCardId
        if (!values.isParcelada) delete dataToSend.numeroParcelas;
    }


    try {
      const response = await apiClient[method](dataToSend.endpoint || endpoint, dataToSend);
      if (response.data && response.data.status === 'success') {
        message.success(`Transação ${isEditing ? 'atualizada' : 'adicionada'} com sucesso!`);
        setIsTransactionModalVisible(false);
        setEditingTransaction(null);
        fetchTransactions(); // Atualiza a lista
      } else {
        message.error(response.data?.message || `Falha ao ${isEditing ? 'atualizar' : 'adicionar'} transação.`);
      }
    } catch (error) {
      console.error(`Erro ao ${isEditing ? 'atualizar' : 'adicionar'} transação:`, error);
      // A mensagem de erro do interceptor já deve ter sido exibida
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!currentProfile) return;
    Modal.confirm({
        title: "Confirmar Exclusão",
        content: "Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.",
        okText: "Excluir",
        okType: "danger",
        cancelText: "Cancelar",
        onOk: async () => {
            try {
                await apiClient.delete(`/financial-accounts/${currentProfile.id}/transactions/${transactionId}`);
                message.success("Transação excluída com sucesso.");
                fetchTransactions();
            } catch (error) {
                console.error("Erro ao excluir transação:", error);
            }
        }
    });
  }

  const columns = [
    { title: 'Data', dataIndex: 'transactionDate', key: 'transactionDate', render: (text) => dayjs(text).format('DD/MM/YY'), width: 100, sorter: (a,b) => dayjs(a.transactionDate).unix() - dayjs(b.transactionDate).unix(), defaultSortOrder: 'descend' },
    { title: 'Descrição', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Categoria', dataIndex: ['category', 'name'], key: 'category', width: 180, ellipsis: true }, // Acessa category.name
    { title: 'Valor (R$)', dataIndex: 'value', key: 'value', align: 'right', width: 130,
      render: (text, record) => (
        <Text type={record.type === 'Entrada' ? 'success' : 'danger'} strong>
          {record.type === 'Entrada' ? '+' : '-'} {parseFloat(text).toFixed(2).replace('.', ',')}
        </Text>
      ),
      sorter: (a,b) => parseFloat(a.value) - parseFloat(b.value),
    },
    { title: 'Tipo', dataIndex: 'type', key: 'type', width: 100,
      render: (text) => <Tag color={text === 'Entrada' ? 'green' : 'volcano'}>{text.toUpperCase()}</Tag>,
    },
    { title: 'Ações', key: 'action', width: 100, align: 'center', fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar">
            {/* Se for parcela filha, talvez desabilitar edição ou ter lógica diferente */}
            <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record.type, record)} disabled={record.isParcel && record.originalAccountId !== record.id}/>
          </Tooltip>
          <Tooltip title="Excluir">
             {/* Se for parcela mãe, perguntar se quer excluir todas as parcelas */}
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteTransaction(record.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];
  
  const summaryData = useMemo(() => {
    const totalReceitas = transactions.filter(t => t.type === 'Entrada').reduce((sum, t) => sum + parseFloat(t.value), 0);
    const totalDespesas = transactions.filter(t => t.type === 'Saída').reduce((sum, t) => sum + parseFloat(t.value), 0);
    return {
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
    };
  }, [transactions]);


  if (loadingProfiles) {
    return (
        <Layout style={{ minHeight: '100vh' }}>
             <SidebarPanel collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} selectedProfileType={currentProfile?.type}/>
             <Layout className="site-layout" style={{ marginLeft: sidebarCollapsed ? 80 : 220 }}>
                <HeaderPanel userName={userNameForHeader}/>
                <Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}>
                    <Typography.Title level={4}><FilterOutlined spin style={{marginRight: 10}}/> Carregando perfis...</Typography.Title>
                </Content>
            </Layout>
        </Layout>
    );
  }
  if (!isAuthenticated && !loadingProfiles) {
     return (
        <Layout style={{ minHeight: '100vh' }}><Content style={{padding: 50, textAlign: 'center'}}><Title level={3}>Acesso Negado.</Title><Button type="primary" onClick={() => window.location.href = '/login'}>Login</Button></Content></Layout>
      );
  }
  if (!currentProfile && isAuthenticated && !loadingProfiles) {
       return (
        <Layout style={{ minHeight: '100vh' }}>
             <SidebarPanel collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} selectedProfileType={null}/>
             <Layout className="site-layout" style={{ marginLeft: sidebarCollapsed ? 80 : 220 }}>
                <HeaderPanel userName={userNameForHeader}/>
                <Content style={{padding: 50, textAlign: 'center'}}>
                    <Empty description="Nenhum perfil financeiro selecionado. Por favor, selecione ou crie um perfil em 'Meu Perfil'."/>
                     <Button type="link" onClick={() => window.location.href = '/painel/meu-perfil'}>Ir para Meu Perfil</Button>
                </Content>
            </Layout>
        </Layout>
      );
  }

  return (
    <Layout style={{ minHeight: '100vh' }} className="transacoes-page-main-layout">
      <SidebarPanel 
        collapsed={sidebarCollapsed} 
        onCollapse={setSidebarCollapsed} 
        selectedProfileType={currentProfile?.type}
      />
      <Layout className="site-layout" style={{ marginLeft: sidebarCollapsed ? 80 : 220, transition: 'margin-left 0.2s ease' }}>
        <HeaderPanel userName={userNameForHeader} />
        
        <Content className="panel-content-area transacoes-content">
          <Title level={2} className="page-title-transactions">Minhas Transações</Title>
          <Paragraph type="secondary" style={{marginBottom: '25px'}}>
            Visualize e gerencie suas receitas e despesas do perfil: <Text strong>{currentProfile?.name || 'N/D'}</Text>
          </Paragraph>

          <Card className="filters-card-transactions" bordered={false}>
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} sm={12} md={7} lg={6}>
                <Text strong>Período:</Text>
                <RangePicker 
                    value={filterPeriod} 
                    onChange={(dates) => setFilterPeriod(dates || [dayjs().startOf('month'), dayjs().endOf('month')])} 
                    style={{ width: '100%' }} 
                    format="DD/MM/YYYY"
                    allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={5} lg={4}>
                <Text strong>Tipo:</Text>
                <Select value={filterType} onChange={setFilterType} style={{ width: '100%' }}>
                  <Option value="todas">Todas</Option>
                  <Option value="Entrada">Receitas</Option>
                  <Option value="Saída">Despesas</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6} lg={5}>
                 <Text strong>Categoria:</Text>
                 <Select 
                    value={filterCategory} 
                    onChange={setFilterCategory} 
                    style={{ width: '100%' }} 
                    placeholder="Todas as categorias" 
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                 >
                    {allSystemCategories.map(cat => <Option key={cat.id} value={cat.id} label={cat.name}>{cat.name}</Option>)}
                 </Select>
              </Col>
               <Col xs={24} sm={12} md={6} lg={5}>
                 <Text strong>Buscar Descrição:</Text>
                 <Input 
                    placeholder="Filtrar por descrição..." 
                    value={filterDescription}
                    onChange={e => setFilterDescription(e.target.value)}
                    allowClear
                />
              </Col>
              <Col xs={24} sm={24} md={24} lg={4} style={{textAlign: 'right'}}>
                <Space style={{width: '100%'}} direction="vertical" size="small">
                    <Button type="primary" icon={<PlusOutlined />} block onClick={() => handleOpenModal('Entrada')} className="btn-add-receita">
                        Nova Receita
                    </Button>
                    <Button type="primary" danger icon={<PlusOutlined />} block onClick={() => handleOpenModal('Saída')} className="btn-add-despesa">
                        Nova Despesa
                    </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="summary-stat-card receita">
                <Statistic title="Total Receitas (Filtrado)" value={summaryData.totalReceitas} prefix="R$" precision={2} valueStyle={{ color: 'var(--map-verde-escuro)' }} loading={loading}/>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="summary-stat-card despesa">
                <Statistic title="Total Despesas (Filtrado)" value={summaryData.totalDespesas} prefix="R$" precision={2} valueStyle={{ color: 'var(--map-vermelho-escuro)' }} loading={loading}/>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="summary-stat-card saldo">
                <Statistic title="Saldo do Período (Filtrado)" value={summaryData.saldo} prefix="R$" precision={2} valueStyle={{ color: summaryData.saldo >= 0 ? 'var(--map-dourado)' : 'var(--map-vermelho-escuro)' }} loading={loading}/>
              </Card>
            </Col>
          </Row>

          {/* Gráficos foram removidos para simplificar, já que estavam no PainelUsuario */}

          <Card title="Histórico de Transações" bordered={false} style={{ marginTop: '24px' }} className="transactions-table-card">
            <Table
              columns={columns}
              dataSource={transactions} // Usa 'transactions' que é o resultado direto da API com filtros do backend
              rowKey="id"
              loading={loading}
              pagination={{ 
                pageSize: 10, 
                showSizeChanger: true, 
                pageSizeOptions: ['10', '20', '50', '100'], 
                position: ['bottomRight'],
                // total: transactions.length, // Remover se a API retornar 'totalItems' para paginação no backend
                // onChange: (page, pageSize) => { /* Lógica para paginação no backend */ }
              }}
              scroll={{ x: 700 }}
              size="middle"
              locale={{ emptyText: <Empty description={loading ? "Carregando..." : "Nenhuma transação encontrada para os filtros selecionados."} image={Empty.PRESENTED_IMAGE_SIMPLE}/> }}
            />
          </Card>
           
           {/* Modal Unificado para Adicionar/Editar Transação */}
            {transactionTypeForModal === 'Entrada' && isTransactionModalVisible && (
                <ModalNovaReceita
                    visible={isTransactionModalVisible}
                    onCancel={() => { setIsTransactionModalVisible(false); setEditingTransaction(null); }}
                    onOk={handleTransactionModalOk}
                    currentProfile={currentProfile}
                    editingTransaction={editingTransaction}
                />
            )}
            {transactionTypeForModal === 'Saída' && isTransactionModalVisible && (
                 <ModalNovaDespesa
                    visible={isTransactionModalVisible}
                    onCancel={() => { setIsTransactionModalVisible(false); setEditingTransaction(null); }}
                    onOk={handleTransactionModalOk}
                    currentProfile={currentProfile}
                    editingTransaction={editingTransaction}
                />
            )}

        </Content>
      </Layout>
    </Layout>
  );
};

export default TransacoesPage;