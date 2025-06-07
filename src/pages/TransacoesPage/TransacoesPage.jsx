// src/pages/PainelUsuario/TransacoesPage/TransacoesPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Layout, Typography, Button, Row, Col, Card, Select, DatePicker,
  Table, Tag, Space, Statistic, Tooltip, Modal, Form, Input, InputNumber,
  Empty, message
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

// Contexto
import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

// Modais de Receita/Despesa (reutilizados do PainelUsuario)
import ModalNovaReceita from '../../modals/ModalNovaReceita/ModalNovaReceita';
import ModalNovaDespesa from '../../modals/ModalNovaDespesa/ModalNovaDespesa';

import './TransacoesPage.css';

dayjs.locale('pt-br');

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const TransacoesPage = () => {
  const { 
    currentProfile,
    loadingProfiles,
    isAuthenticated
  } = useProfile();

  const [transactions, setTransactions] = useState([]);
  
  // Filtros
  const [filterPeriod, setFilterPeriod] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [filterType, setFilterType] = useState('todas');
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterDescription, setFilterDescription] = useState('');

  const [allSystemCategories, setAllSystemCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionTypeForModal, setTransactionTypeForModal] = useState('despesa');

  // Buscar categorias do sistema uma vez
  useEffect(() => {
    if (isAuthenticated) {
      apiClient.get('/system/financial-categories?isActive=true')
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
  
  const handleOpenModal = (type, transaction = null) => {
    setTransactionTypeForModal(type);
    setEditingTransaction(transaction);
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
      ...values,
      transactionDate: dayjs(values.data).format('YYYY-MM-DD'),
      type: transactionTypeForModal,
    };
    delete dataToSend.data;

    if (transactionTypeForModal === 'Saída') {
        dataToSend.creditCardId = values.cartaoId || null;
        if (values.formaPagamento === 'cartao' && values.cartaoId && values.isParcelada) {
            if (isEditing) {
                 message.warn("A edição completa de compras parceladas deve ser feita pela funcionalidade 'Refazer Compra Parcelada'. Aqui você pode editar detalhes da parcela individual.");
            } else {
                dataToSend.endpoint = `/financial-accounts/${currentProfile.id}/transactions/parcelled`;
                dataToSend.totalValue = dataToSend.value;
                dataToSend.numberOfParcels = values.numeroParcelas;
                dataToSend.initialDueDate = dataToSend.transactionDate;
                delete dataToSend.value;
            }
        }
        delete dataToSend.formaPagamento;
        delete dataToSend.isParceladaCheck;
        delete dataToSend.cartaoId;
        if (!values.isParcelada) delete dataToSend.numeroParcelas;
    }

    try {
      const response = await apiClient[method](dataToSend.endpoint || endpoint, dataToSend);
      if (response.data && response.data.status === 'success') {
        message.success(`Transação ${isEditing ? 'atualizada' : 'adicionada'} com sucesso!`);
        setIsTransactionModalVisible(false);
        setEditingTransaction(null);
        fetchTransactions();
      } else {
        message.error(response.data?.message || `Falha ao ${isEditing ? 'atualizar' : 'adicionar'} transação.`);
      }
    } catch (error) {
      console.error(`Erro ao ${isEditing ? 'atualizar' : 'adicionar'} transação:`, error);
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
    { title: 'Categoria', dataIndex: ['category', 'name'], key: 'category', width: 180, ellipsis: true },
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
            <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record.type, record)} disabled={record.isParcel && record.originalAccountId !== record.id}/>
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
    return {
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
    };
  }, [transactions]);

  if (loadingProfiles) {
    return (
        <Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}>
            <Typography.Title level={4}>Carregando perfis...</Typography.Title>
        </Content>
    );
  }
  if (!isAuthenticated && !loadingProfiles) {
     return (
        <Content style={{padding: 50, textAlign: 'center'}}><Title level={3}>Acesso Negado.</Title><Button type="primary" onClick={() => window.location.href = '/login'}>Login</Button></Content>
      );
  }
  if (!currentProfile && isAuthenticated && !loadingProfiles) {
       return (
        <Content style={{padding: 50, textAlign: 'center'}}>
            <Empty description="Nenhum perfil financeiro selecionado. Por favor, selecione ou crie um perfil em 'Meu Perfil'."/>
             <Button type="link" onClick={() => window.location.href = '/painel/meu-perfil'}>Ir para Meu Perfil</Button>
        </Content>
      );
  }

  return (
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

      <Card title="Histórico de Transações" bordered={false} style={{ marginTop: '24px' }} className="transactions-table-card">
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true, 
            pageSizeOptions: ['10', '20', '50', '100'], 
            position: ['bottomRight'],
          }}
          scroll={{ x: 700 }}
          size="middle"
          locale={{ emptyText: <Empty description={loading ? "Carregando..." : "Nenhuma transação encontrada para os filtros selecionados."} image={Empty.PRESENTED_IMAGE_SIMPLE}/> }}
        />
      </Card>
       
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
  );
};

export default TransacoesPage;