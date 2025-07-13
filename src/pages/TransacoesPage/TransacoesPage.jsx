// src/pages/PainelUsuario/TransacoesPage/TransacoesPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout, Typography, Button, Row, Col, Card, Select, DatePicker,
  Table, Tag, Space, Statistic, Tooltip, Modal, Input, Empty, message
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

// Contexto
import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

// Modais
import ModalNovaReceita from '../../modals/ModalNovaReceita/ModalNovaReceita';
import ModalNovaDespesa from '../../modals/ModalNovaDespesa/ModalNovaDespesa';

import './TransacoesPage.css';

dayjs.locale('pt-br');

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// <<< MUDANÇA 1: Importar useModal >>>
const { useModal } = Modal;

const TransacoesPage = () => {
  const { 
    currentProfile,
    loadingProfiles,
    isAuthenticated
  } = useProfile();
  
  // <<< MUDANÇA 2: Inicializar o hook >>>
  const [modal, contextHolder] = useModal();

  const [transactions, setTransactions] = useState([]);
  
  const [filterPeriod, setFilterPeriod] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [filterType, setFilterType] = useState('todas');
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterDescription, setFilterDescription] = useState('');

  const [allSystemCategories, setAllSystemCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionTypeForModal, setTransactionTypeForModal] = useState('despesa');

  const fetchTransactions = useCallback(async () => {
    if (!currentProfile) return;
    setLoading(true);
    
    const params = {
      dateStart: filterPeriod && filterPeriod[0] ? filterPeriod[0].format('YYYY-MM-DD') : undefined,
      dateEnd: filterPeriod && filterPeriod[1] ? filterPeriod[1].format('YYYY-MM-DD') : undefined,
      type: filterType !== 'todas' ? filterType : undefined,
      financialCategoryId: filterCategory || undefined,
      search: filterDescription || undefined,
      sortBy: 'transactionDate',
      sortOrder: 'DESC'
    };

    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/transactions`, { params });
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      message.error("Não foi possível carregar as transações.");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [currentProfile, filterPeriod, filterType, filterCategory, filterDescription]);

  useEffect(() => {
    if (isAuthenticated && currentProfile) {
      const endpoint = `/financial-accounts/${currentProfile.id}/categories`;
      apiClient.get(endpoint, { params: { hierarchical: false } })
        .then(response => setAllSystemCategories(response.data.data || []))
        .catch(error => console.error(`Erro ao buscar categorias:`, error));
    }
  }, [isAuthenticated, currentProfile]);

  useEffect(() => {
    if (!loadingProfiles && isAuthenticated && currentProfile) {
      fetchTransactions();
    } else {
      setLoading(false);
      setTransactions([]);
    }
  }, [fetchTransactions, loadingProfiles, isAuthenticated, currentProfile]);

  const handleOpenModal = (type, transaction = null) => {
    setTransactionTypeForModal(type);
    setEditingTransaction(transaction);
    setIsTransactionModalVisible(true);
  };
  
  const handleModalCancel = () => {
      setIsTransactionModalVisible(false);
      setEditingTransaction(null);
  };

  const handleModalSuccess = () => {
      fetchTransactions();
      handleModalCancel();
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!currentProfile) return;
    
    // <<< MUDANÇA 3: Usar a instância `modal` do hook >>>
    modal.confirm({
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
                // Interceptor já deve mostrar o erro
            }
        }
    });
  }

  const columns = [
    { title: 'Data', dataIndex: 'transactionDate', key: 'transactionDate', render: (text) => dayjs(text).format('DD/MM/YY'), width: 100, sorter: (a,b) => dayjs(a.transactionDate).unix() - dayjs(b.transactionDate).unix(), defaultSortOrder: 'descend' },
    { title: 'Descrição', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Categoria', dataIndex: ['category', 'name'], key: 'category', width: 180, ellipsis: true },
    { title: 'Valor (R$)', dataIndex: 'value', key: 'value', align: 'right', width: 130,
      render: (text, record) => <Text type={record.type === 'Entrada' ? 'success' : 'danger'} strong>{record.type === 'Entrada' ? '+' : '-'} {parseFloat(text).toFixed(2).replace('.', ',')}</Text>,
      sorter: (a,b) => parseFloat(a.value) - parseFloat(b.value),
    },
    { title: 'Tipo', dataIndex: 'type', key: 'type', width: 100, render: (text) => <Tag color={text === 'Entrada' ? 'green' : 'volcano'}>{text.toUpperCase()}</Tag> },
    { title: 'Ações', key: 'action', width: 100, align: 'center', fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record.type, record)} />
          </Tooltip>
          <Tooltip title="Excluir">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteTransaction(record.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];
  
  const summaryData = useMemo(() => {
    const totalReceitas = transactions.filter(t => t.type === 'Entrada').reduce((sum, t) => sum + parseFloat(t.value), 0);
    const totalDespesas = transactions.filter(t => t.type === 'Saída').reduce((sum, t) => sum + parseFloat(t.value), 0);
    return { totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas };
  }, [transactions]);

  // --- O resto do componente continua igual... ---
  if (loadingProfiles || (!isAuthenticated && !currentProfile)) {
    return (<Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}><Title level={4}>Carregando...</Title></Content>);
  }

  return (
    <Content className="panel-content-area transacoes-content">
      <Title level={2} className="page-title-transactions">Minhas Transações</Title>
      <Paragraph type="secondary" style={{marginBottom: '25px'}}>Visualize e gerencie suas receitas e despesas do perfil: <Text strong>{currentProfile?.name || 'N/D'}</Text></Paragraph>

      <Card className="filters-card-transactions" bordered={false}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} md={7} lg={6}><Text strong>Período:</Text><RangePicker value={filterPeriod} onChange={(dates) => setFilterPeriod(dates)} style={{ width: '100%' }} format="DD/MM/YYYY"/></Col>
          <Col xs={24} sm={12} md={5} lg={4}><Text strong>Tipo:</Text><Select value={filterType} onChange={setFilterType} style={{ width: '100%' }}><Option value="todas">Todas</Option><Option value="Entrada">Receitas</Option><Option value="Saída">Despesas</Option></Select></Col>
          <Col xs={24} sm={12} md={6} lg={5}><Text strong>Categoria:</Text><Select value={filterCategory} onChange={setFilterCategory} style={{ width: '100%' }} placeholder="Todas as categorias" allowClear showSearch optionFilterProp="children">{allSystemCategories.map(cat => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)}</Select></Col>
          <Col xs={24} sm={12} md={6} lg={5}><Text strong>Buscar Descrição:</Text><Input placeholder="Filtrar por descrição..." value={filterDescription} onChange={e => setFilterDescription(e.target.value)} allowClear/></Col>
          <Col xs={24} sm={24} md={24} lg={4} style={{textAlign: 'right'}}>
            <Space style={{width: '100%'}} direction="vertical" size="small">
                <Button type="primary" icon={<PlusOutlined />} block onClick={() => handleOpenModal('Entrada')} className="btn-add-receita">Nova Receita</Button>
                <Button type="primary" danger icon={<PlusOutlined />} block onClick={() => handleOpenModal('Saída')} className="btn-add-despesa">Nova Despesa</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} sm={8}><Card bordered={false} className="summary-stat-card receita"><Statistic title="Total Receitas" value={summaryData.totalReceitas} prefix="R$" precision={2} loading={loading}/></Card></Col>
        <Col xs={24} sm={8}><Card bordered={false} className="summary-stat-card despesa"><Statistic title="Total Despesas" value={summaryData.totalDespesas} prefix="R$" precision={2} loading={loading}/></Card></Col>
        <Col xs={24} sm={8}><Card bordered={false} className="summary-stat-card saldo"><Statistic title="Saldo do Período" value={summaryData.saldo} prefix="R$" precision={2} loading={loading}/></Card></Col>
      </Row>

      <Card title="Histórico de Transações" bordered={false} style={{ marginTop: '24px' }} className="transactions-table-card">
        <Table columns={columns} dataSource={transactions} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 700 }}/>
      </Card>
       
       {isTransactionModalVisible && transactionTypeForModal === 'Entrada' && (
            <ModalNovaReceita
                open={isTransactionModalVisible}
                onCancel={handleModalCancel}
                onSuccess={handleModalSuccess}
                currentProfile={currentProfile}
                editingTransaction={editingTransaction}
            />
        )}
        {isTransactionModalVisible && transactionTypeForModal === 'Saída' && (
             <ModalNovaDespesa
                open={isTransactionModalVisible}
                onCancel={handleModalCancel}
                onSuccess={handleModalSuccess}
                currentProfile={currentProfile}
                editingTransaction={editingTransaction}
            />
        )}
      
      {/* <<< MUDANÇA 5: Adicionar o contextHolder ao final >>> */}
      {contextHolder}
    </Content>
  );
};

export default TransacoesPage;