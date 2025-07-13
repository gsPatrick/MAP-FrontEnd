// src/pages/RecorrenciasPage/RecorrenciasPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Button, Row, Col, Card, Select, Table, Tag,
  Space, Tooltip, Modal, Empty, message, Layout
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  BellOutlined, CheckCircleOutlined, RetweetOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

import ModalNovaRecorrencia from '../../modals/ModalNovaRecorrencia/ModalNovaRecorrencia';

import './RecorrenciasPage.css';

dayjs.locale('pt-br');

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

// <<< MUDANÇA 1: Importar useModal >>>
const { useModal } = Modal;

const frequencyMap = {
  daily: 'Diária',
  weekly: 'Semanal',
  'bi-weekly': 'Quinzenal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  'semi-annually': 'Semestral',
  annually: 'Anual',
};

const translateFrequency = (freq) => frequencyMap[freq] || freq;

const RecorrenciasPage = () => {
  const { 
    currentProfile,
    loadingProfiles,
    isAuthenticated
  } = useProfile();
  
  // <<< MUDANÇA 2: Inicializar o hook useModal >>>
  const [modal, contextHolder] = useModal();

  const [recurrences, setRecurrences] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState('todas'); 
  const [filterStatus, setFilterStatus] = useState('todas'); 

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecurrence, setEditingRecurrence] = useState(null);

  // ... (o resto das funções como fetchRecurrences, handleOpenModal, etc., permanecem iguais) ...
  const fetchRecurrences = useCallback(async () => {
    if (!currentProfile || !isAuthenticated) {
      setRecurrences([]); setLoading(false); return;
    }
    setLoading(true);
    try {
      const params = {};
      if (filterType !== 'todas') params.type = filterType; 
      if (filterStatus === 'ativa') params.isActive = true;
      if (filterStatus === 'inativa') params.isActive = false;
      params.sortBy = 'nextDueDate';
      params.sortOrder = 'ASC';

      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/recurring-rules`, { params });
      if (response.data && response.data.status === 'success' && response.data.data.rules) {
        setRecurrences(response.data.data.rules.map(r => ({ ...r, value: parseFloat(r.value) })) || []);
      } else {
        setRecurrences([]);
      }
    } catch (error) {
      console.error("Erro ao carregar recorrências:", error);
      setRecurrences([]);
    } finally {
      setLoading(false);
    }
  }, [currentProfile, isAuthenticated, filterType, filterStatus]);

  useEffect(() => {
    if (!loadingProfiles && isAuthenticated) {
        fetchRecurrences();
    }
  }, [fetchRecurrences, loadingProfiles, isAuthenticated]);


  const handleOpenModal = (recurrence = null) => {
    setEditingRecurrence(recurrence);
    setIsModalVisible(true);
  };
  
  const handleModalCancel = () => {
      setIsModalVisible(false);
      setEditingRecurrence(null);
  };
  
  const handleModalSuccess = () => {
      fetchRecurrences();
      handleModalCancel();
  };

  // <<< MUDANÇA 3: Usar a instância `modal` do hook em vez da chamada estática `Modal` >>>
  const handleDeleteRecurrence = (recurrenceId, recurrenceDescription) => {
    console.log(`[handleDeleteRecurrence] Função chamada para ID: ${recurrenceId}, Descrição: "${recurrenceDescription}"`);
    
    if (!currentProfile) {
        console.error("[handleDeleteRecurrence] ERRO: currentProfile é nulo. Ação abortada.");
        return;
    }
    
    modal.confirm({ // <-- Usando a instância `modal`
        title: "Confirmar Exclusão",
        content: `Tem certeza que deseja excluir a recorrência "${recurrenceDescription}"?`,
        okText: "Excluir",
        okType: "danger",
        cancelText: "Cancelar",
        onOk: async () => {
            console.log(`[handleDeleteRecurrence -> onOk] Usuário confirmou a exclusão. Tentando chamar a API para o ID: ${recurrenceId}`);
            try {
                const endpoint = `/financial-accounts/${currentProfile.id}/recurring-rules/${recurrenceId}`;
                console.log(`[handleDeleteRecurrence -> onOk] Enviando requisição DELETE para: ${endpoint}`);
                
                await apiClient.delete(endpoint);
                
                console.log(`[handleDeleteRecurrence -> onOk] API retornou sucesso. Mensagem de sucesso será exibida.`);
                message.success(`Recorrência "${recurrenceDescription}" excluída.`);
                fetchRecurrences();
            } catch (error) {
                console.error(`[handleDeleteRecurrence -> onOk] ERRO na chamada da API para exclusão:`, error);
                message.error('Falha ao excluir a recorrência. Verifique o console para detalhes.');
            }
        },
        onCancel() {
            console.log('[handleDeleteRecurrence -> onCancel] Usuário cancelou a exclusão.');
        },
    });
  };

  const columns = [
    { title: 'Descrição', dataIndex: 'description', key: 'description', ellipsis: true, width: 250, sorter: (a,b) => a.description.localeCompare(b.description) },
    { title: 'Tipo', dataIndex: 'type', key: 'type', width: 100, render: t => <Tag color={t === 'Entrada' ? 'green' : 'volcano'}>{t.toUpperCase()}</Tag>, sorter: (a,b) => a.type.localeCompare(b.type) },
    { title: 'Valor (R$)', dataIndex: 'value', key: 'value', align: 'right', width: 120, render: v => parseFloat(v).toFixed(2).replace('.',','), sorter: (a,b) => a.value - b.value },
    { title: 'Frequência', dataIndex: 'frequency', key: 'frequency', width: 120, render: (freq) => translateFrequency(freq), sorter: (a,b) => a.frequency.localeCompare(b.frequency) },
    { title: 'Próxima Data', dataIndex: 'nextDueDate', key: 'nextDueDate', width: 130, render: d => d ? dayjs(d).format('DD/MM/YYYY') : 'N/A', sorter: (a,b) => dayjs(a.nextDueDate).unix() - dayjs(b.nextDueDate).unix(), defaultSortOrder: 'ascend' },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', width: 100, render: s => <Tag color={s ? 'blue' : 'default'}>{s ? 'Ativa' : 'Inativa'}</Tag>, sorter: (a,b) => a.isActive - b.isActive },
    { title: 'Ação Automática', dataIndex: 'autoCreateTransaction', key: 'autoCreateTransaction', width: 180, render: a => (a ? <Space><CheckCircleOutlined/> Criar Transação</Space> : <Space><BellOutlined/> Apenas Lembrar</Space>) },
    { title: 'Ações', key: 'action', width: 100, align: 'center', fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar"><Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}/></Tooltip>
          <Tooltip title="Excluir">
              <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRecurrence(record.id, record.description);
                  }}
              />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loadingProfiles || (!isAuthenticated && !currentProfile)) {
      return (<Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}><Title level={4}>Carregando...</Title></Content>);
  }

  return (
    <Content className="panel-content-area recorrencias-content">
      <Title level={2} className="page-title-recorrencias"><RetweetOutlined style={{marginRight: '10px'}}/>Gerenciar Recorrências</Title>
      <Paragraph type="secondary" style={{marginBottom: '25px'}}>Configure suas receitas e despesas recorrentes do perfil: <Text strong>{currentProfile?.name}</Text></Paragraph>

      <Card className="filters-card-recorrencias" bordered={false}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} md={8}><Text strong>Tipo:</Text><Select value={filterType} onChange={setFilterType} style={{ width: '100%' }}><Option value="todas">Todas</Option><Option value="Entrada">Receitas</Option><Option value="Saída">Despesas</Option></Select></Col>
          <Col xs={24} sm={12} md={8}><Text strong>Status:</Text><Select value={filterStatus} onChange={setFilterStatus} style={{ width: '100%' }}><Option value="todas">Todos</Option><Option value="ativa">Ativas</Option><Option value="inativa">Inativas</Option></Select></Col>
          <Col xs={24} sm={24} md={8} style={{textAlign: 'right'}}><Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} className="btn-add-recorrencia">Nova Recorrência</Button></Col>
        </Row>
      </Card>

      <Card title="Minhas Regras de Recorrência" bordered={false} style={{ marginTop: '24px' }} className="recurrences-table-card">
        <Table columns={columns} dataSource={recurrences} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1000 }}/>
      </Card>

      <ModalNovaRecorrencia
        open={isModalVisible}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
        currentProfile={currentProfile}
        editingRecorrencia={editingRecurrence}
      />
      
      {/* <<< MUDANÇA 4: Adicionar o contextHolder ao final do JSX >>> */}
      {/* Isso é necessário para que o modal de confirmação possa ser renderizado no DOM */}
      {contextHolder}
    </Content>
  );
};

export default RecorrenciasPage;