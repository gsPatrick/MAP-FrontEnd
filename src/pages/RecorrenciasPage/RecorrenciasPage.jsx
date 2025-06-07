// src/pages/RecorrenciasPage/RecorrenciasPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Typography, Button, Row, Col, Card, Select, Table, Tag,
  Space, Tooltip, Modal, Form, Input, InputNumber, DatePicker, Radio, Switch,
  Empty, message, Divider
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined,
  BellOutlined, CheckCircleOutlined, RetweetOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

// As importações de HeaderPanel e SidebarPanel foram removidas.
// import HeaderPanel from '../../componentsPanel/HeaderPanel/HeaderPanel';
// import SidebarPanel from '../../componentsPanel/SidebarPanel/SidebarPanel';

import './RecorrenciasPage.css';

dayjs.locale('pt-br');

// A importação de Layout e Content foi ajustada.
const { Content } = Typography; // Content pode vir de Layout, mas Typography também exporta componentes. Para evitar import não usado, vamos pegar de Typography ou ajustar.
// Melhor:
import { Layout } from 'antd';
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const diasDaSemanaModal = [
  { label: 'Domingo', value: 0 }, { label: 'Segunda-feira', value: 1 },
  { label: 'Terça-feira', value: 2 }, { label: 'Quarta-feira', value: 3 },
  { label: 'Quinta-feira', value: 4 }, { label: 'Sexta-feira', value: 5 },
  { label: 'Sábado', value: 6 },
];

const RecorrenciasPage = () => {
  const { 
    currentProfile,
    loadingProfiles,
    isAuthenticated
  } = useProfile();

  // O estado sidebarCollapsed foi removido.
  // const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // A variável userNameForHeader foi removida.
  // const userNameForHeader = currentProfile?.ownerClientName || currentProfile?.name || "Usuário Recorrências";

  const [recurrences, setRecurrences] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState('todas'); 
  const [filterStatus, setFilterStatus] = useState('todas'); 

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecurrence, setEditingRecurrence] = useState(null);
  const [form] = Form.useForm();

  const [frequenciaModal, setFrequenciaModal] = useState('monthly');
  const [loadingCategoriesModal, setLoadingCategoriesModal] = useState(false);
  const [categoriasDisponiveisModal, setCategoriasDisponiveisModal] = useState([]);

  const fetchRecurrences = async () => {
    if (!currentProfile || !isAuthenticated) {
      setRecurrences([]);
      setLoading(false);
      return;
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
      if (response.data && response.data.status === 'success') {
        setRecurrences(response.data.data.map(r => ({
            ...r, 
            value: parseFloat(r.value) 
        })) || []);
      } else {
        setRecurrences([]);
        message.error(response.data?.message || "Falha ao carregar recorrências.");
      }
    } catch (error) {
      console.error("Erro ao carregar recorrências:", error);
      setRecurrences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingProfiles && isAuthenticated) {
        fetchRecurrences();
    }
  }, [currentProfile, isAuthenticated, loadingProfiles, filterType, filterStatus]);

  useEffect(() => {
    if (isModalVisible && currentProfile) {
        setLoadingCategoriesModal(true);
        apiClient.get(`/financial-accounts/${currentProfile.id}/categories`) 
        .then(res => {
            if (res.data && res.data.status === 'success') {
                setCategoriasDisponiveisModal(res.data.data || []);
            } else {
                setCategoriasDisponiveisModal([]);
                message.error(res.data?.message || "Falha ao buscar categorias para o modal.");
            }
        })
        .catch(err => {
            console.error("Erro ao buscar categorias para o modal de recorrência:", err);
            setCategoriasDisponiveisModal([]);
        })
        .finally(() => setLoadingCategoriesModal(false));
    }
  }, [isModalVisible, currentProfile]);


  const handleOpenModal = (recurrence = null) => {
    setEditingRecurrence(recurrence);
    form.resetFields();
    
    if (recurrence) {
      const freqInicial = recurrence.frequency || 'monthly';
      setFrequenciaModal(freqInicial);

      form.setFieldsValue({
        description: recurrence.description,
        type: recurrence.type,
        value: parseFloat(recurrence.value),
        financialCategoryId: recurrence.financialCategoryId,
        frequency: freqInicial,
        interval: recurrence.interval || 1,
        startDate: recurrence.startDate ? dayjs(recurrence.startDate) : null,
        endDate: recurrence.endDate ? dayjs(recurrence.endDate) : null,
        dayOfMonth: recurrence.dayOfMonth,
        dayOfWeek: recurrence.dayOfWeek,
        autoCreateTransaction: recurrence.autoCreateTransaction !== undefined ? recurrence.autoCreateTransaction : true,
        isActive: recurrence.isActive !== undefined ? recurrence.isActive : true,
        notes: recurrence.notes,
      });
    } else {
      setFrequenciaModal('monthly');
      form.setFieldsValue({
        type: 'Saída',
        frequency: 'monthly',
        startDate: dayjs().add(1, 'day'),
        autoCreateTransaction: true,
        isActive: true,
        interval: 1,
      });
    }
    setIsModalVisible(true);
  };

  const handleFormSubmit = async (values) => {
    if (!currentProfile) {
        message.error("Nenhum perfil selecionado.");
        return;
    }
    const dataToSend = {
        ...values,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
        value: parseFloat(values.value),
    };

    if (values.frequency !== 'weekly' && values.frequency !== 'bi-weekly') {
        delete dataToSend.dayOfWeek;
    }
    if (values.frequency !== 'monthly' && values.frequency !== 'quarterly' && values.frequency !== 'semi-annually' && values.frequency !== 'annually') {
        delete dataToSend.dayOfMonth;
    }
    if (values.frequency === 'daily') {
        delete dataToSend.dayOfWeek;
        delete dataToSend.dayOfMonth;
    }

    try {
        if (editingRecurrence) {
            await apiClient.put(`/financial-accounts/${currentProfile.id}/recurring-rules/${editingRecurrence.id}`, dataToSend);
            message.success(`Recorrência "${dataToSend.description}" atualizada!`);
        } else {
            await apiClient.post(`/financial-accounts/${currentProfile.id}/recurring-rules`, dataToSend);
            message.success(`Recorrência "${dataToSend.description}" criada!`);
        }
        setIsModalVisible(false);
        setEditingRecurrence(null);
        fetchRecurrences(); 
    } catch (error) {
        console.error("Erro ao salvar recorrência:", error);
    }
  };

  const handleDeleteRecurrence = (recurrenceId, recurrenceDescription) => {
    if (!currentProfile) return;
    Modal.confirm({
        title: "Confirmar Exclusão",
        content: `Tem certeza que deseja excluir a recorrência "${recurrenceDescription}"?`,
        okText: "Excluir",
        okType: "danger",
        cancelText: "Cancelar",
        onOk: async () => {
            try {
                await apiClient.delete(`/financial-accounts/${currentProfile.id}/recurring-rules/${recurrenceId}`);
                message.success(`Recorrência "${recurrenceDescription}" excluída.`);
                fetchRecurrences();
            } catch (error) {
                console.error("Erro ao excluir recorrência:", error);
            }
        }
    });
  };

  const columns = [
    { title: 'Descrição', dataIndex: 'description', key: 'description', ellipsis: true, width: 250, sorter: (a,b) => a.description.localeCompare(b.description) },
    { title: 'Tipo', dataIndex: 'type', key: 'type', width: 100, render: t => <Tag color={t === 'Entrada' ? 'green' : 'volcano'}>{t.toUpperCase()}</Tag>, sorter: (a,b) => a.type.localeCompare(b.type) },
    { title: 'Valor (R$)', dataIndex: 'value', key: 'value', align: 'right', width: 120, render: v => parseFloat(v).toFixed(2).replace('.',','), sorter: (a,b) => a.value - b.value },
    { title: 'Frequência', dataIndex: 'frequency', key: 'frequency', width: 120, sorter: (a,b) => a.frequency.localeCompare(b.frequency) },
    { title: 'Próxima Data', dataIndex: 'nextDueDate', key: 'nextDueDate', width: 130, render: d => d ? dayjs(d).format('DD/MM/YYYY') : 'N/A', sorter: (a,b) => dayjs(a.nextDueDate).unix() - dayjs(b.nextDueDate).unix(), defaultSortOrder: 'ascend' },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', width: 100, render: s => <Tag color={s ? 'blue' : 'default'}>{s ? 'Ativa' : 'Inativa'}</Tag>, sorter: (a,b) => a.isActive - b.isActive },
    { title: 'Ação Automática', dataIndex: 'autoCreateTransaction', key: 'autoCreateTransaction', width: 180, render: a => (a ? <Space><CheckCircleOutlined/> Criar Transação</Space> : <Space><BellOutlined/> Apenas Lembrar</Space>) },
    { title: 'Ações', key: 'action', width: 100, align: 'center', fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} className="action-btn-recorrencia edit"/>
          </Tooltip>
          <Tooltip title="Excluir">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRecurrence(record.id, record.description)} className="action-btn-recorrencia delete"/>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Os retornos condicionais foram simplificados para renderizar apenas o conteúdo da página.
  if (loadingProfiles && !currentProfile) {
    return (
      <Layout.Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}>
          <RetweetOutlined style={{fontSize: 48, color: 'var(--map-laranja)'}} spin/>
      </Layout.Content>
    );
  }
  if (!isAuthenticated && !loadingProfiles) {
    return (
      <Layout.Content style={{ padding: 50, textAlign: 'center' }}>
        <Title level={3}>Acesso Negado</Title>
        <Paragraph>Você precisa estar logado para acessar esta página.</Paragraph>
      </Layout.Content>
    );
  }
  if (!currentProfile && isAuthenticated && !loadingProfiles) {
    return (
      <Layout.Content style={{ padding: 50, textAlign: 'center' }}>
        <Title level={3}>Nenhum Perfil Selecionado</Title>
        <Paragraph>Por favor, selecione um perfil financeiro para gerenciar recorrências.</Paragraph>
      </Layout.Content>
    );
  }

  return (
    // O Layout principal foi removido.
    <Layout.Content className="panel-content-area recorrencias-content">
      <Title level={2} className="page-title-recorrencias">
        <RetweetOutlined style={{marginRight: '10px', color: 'var(--map-laranja)'}}/>Gerenciar Recorrências
      </Title>
      <Paragraph type="secondary" style={{marginBottom: '25px'}}>
        Configure suas receitas e despesas recorrentes do perfil: <Text strong>{currentProfile?.name}</Text>
      </Paragraph>

      <Card className="filters-card-recorrencias" bordered={false}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} md={8}>
            <Text strong>Tipo:</Text>
            <Select value={filterType} onChange={setFilterType} style={{ width: '100%' }} className="filter-select">
              <Option value="todas">Todas</Option>
              <Option value="Entrada">Receitas</Option>
              <Option value="Saída">Despesas</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text strong>Status:</Text>
            <Select value={filterStatus} onChange={setFilterStatus} style={{ width: '100%' }} className="filter-select">
              <Option value="todas">Todos</Option>
              <Option value="ativa">Ativas</Option>
              <Option value="inativa">Inativas</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8} style={{textAlign: 'right'}}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} className="btn-add-recorrencia">
              Nova Recorrência
            </Button>
          </Col>
        </Row>
      </Card>

      <Card title="Minhas Regras de Recorrência" bordered={false} style={{ marginTop: '24px' }} className="recurrences-table-card">
        <Table
          columns={columns}
          dataSource={recurrences}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'], className: 'recorrencias-pagination' }}
          scroll={{ x: 1000 }} 
          size="middle"
          locale={{ emptyText: <Empty description="Nenhuma recorrência encontrada para os filtros selecionados." image={Empty.PRESENTED_IMAGE_SIMPLE} className="empty-table-recorrencia"/> }}
        />
      </Card>

      <Modal
         title={editingRecurrence ? "Editar Regra de Recorrência" : "Nova Regra de Recorrência"}
         open={isModalVisible}
         onCancel={() => { setIsModalVisible(false); setEditingRecurrence(null); }}
         footer={null}
         destroyOnClose
         width={700}
         className="add-recurrence-modal modal-style-map"
       >
         <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleFormSubmit}
         >
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="description" label="Descrição" rules={[{ required: true }]}>
                        <Input placeholder="Ex: Assinatura Netflix, Salário Mensal" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="type" label="Tipo" rules={[{ required: true }]}>
                        <Radio.Group 
                            onChange={(e) => form.setFieldsValue({ type: e.target.value })} 
                            buttonStyle="solid"
                        >
                            <Radio.Button value="Saída">Despesa</Radio.Button>
                            <Radio.Button value="Entrada">Receita</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="value" label="Valor (R$)" rules={[{ required: true, type: 'number', min: 0.01 }]}>
                        <InputNumber min={0.01} precision={2} style={{ width: '100%' }} addonBefore="R$"/>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="financialCategoryId" label="Categoria" rules={[{ required: true }]}>
                        <Select 
                            placeholder="Selecione uma categoria" 
                            loading={loadingCategoriesModal} 
                            showSearch 
                            optionFilterProp="children"
                            filterOption={(input, option) => 
                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {categoriasDisponiveisModal.map(cat => (
                                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Col>
            </Row>
            <Form.Item name="frequency" label="Frequência" rules={[{ required: true }]}>
                <Select placeholder="Com que frequência ocorre?" onChange={(value) => {
                    form.setFieldsValue({ frequency: value });
                    setFrequenciaModal(value);
                }}>
                    <Option value="daily">Diária</Option>
                    <Option value="weekly">Semanal</Option>
                    <Option value="bi-weekly">Quinzenal</Option>
                    <Option value="monthly">Mensal</Option>
                    <Option value="quarterly">Trimestral</Option>
                    <Option value="semi-annually">Semestral</Option>
                    <Option value="annually">Anual</Option>
                </Select>
            </Form.Item>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="interval"
                        label="Repetir a cada"
                        tooltip="Ex: a cada 1 semana, a cada 2 meses."
                        rules={[{ required: true, message: 'Informe o intervalo!'}]}
                    >
                        <InputNumber min={1} style={{ width: '100%' }} addonAfter={form.getFieldValue('frequency') ? form.getFieldValue('frequency').replace(/ly$/, '(s)').replace('bi-weekly', 'quinzena(s)') : 'vez(es)'} />
                    </Form.Item>
                </Col>
                {(frequenciaModal === 'weekly' || frequenciaModal === 'bi-weekly') && (
                    <Col span={12}>
                        <Form.Item name="dayOfWeek" label="Dia da Semana"
                            rules={[{ required: true, message: 'Selecione o dia da semana!' }]}
                        >
                            <Select placeholder="Selecione o dia">
                                {diasDaSemanaModal.map(dia => <Option key={dia.value} value={dia.value}>{dia.label}</Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                )}
                {(frequenciaModal === 'monthly' || frequenciaModal === 'quarterly' || frequenciaModal === 'semi-annually' || frequenciaModal === 'annually') && (
                    <Col span={12}>
                        <Form.Item 
                            name="dayOfMonth" 
                            label={`Dia do Mês ${frequenciaModal === 'annually' ? '(Opcional)' : ''}`}
                            rules={[{ required: ['monthly', 'quarterly', 'semi-annually'].includes(frequenciaModal) , message: 'Dia do mês é obrigatório!' }]}
                        >
                            <InputNumber min={1} max={31} style={{width: '100%'}} placeholder="Ex: 5, 31 (último dia)"/>
                        </Form.Item>
                    </Col>
                )}
            </Row>
             <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="startDate" label="Data de Início" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="endDate" label="Data de Término (Opcional)">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>
                </Col>
            </Row>
             <Row gutter={16} align="middle">
                <Col xs={24} sm={12}>
                    <Form.Item name="autoCreateTransaction" valuePropName="checked">
                        <Switch
                            checkedChildren="Gerar Transação"
                            unCheckedChildren="Apenas Lembrar"
                        />
                         <Tooltip title="Se marcado, uma transação será criada automaticamente no vencimento. Senão, será apenas um lembrete.">
                            <InfoCircleOutlined style={{ marginLeft: 8, color: 'var(--map-cinza-texto)' }} />
                        </Tooltip>
                    </Form.Item>
                </Col>
                 <Col xs={24} sm={12}>
                    <Form.Item name="isActive" label="Status da Regra" valuePropName="checked">
                        <Switch checkedChildren="Ativa" unCheckedChildren="Inativa" />
                    </Form.Item>
                </Col>
             </Row>
             <Form.Item name="notes" label="Observações (Opcional)">
                <Input.TextArea rows={2} placeholder="Algum detalhe adicional?" />
             </Form.Item>
             <Divider />
             <Form.Item style={{textAlign: 'right', marginBottom: 0}}>
                 <Button onClick={() => {setIsModalVisible(false); setEditingRecurrence(null);}} style={{ marginRight: 8 }} className="cancel-btn-form">
                     Cancelar
                 </Button>
                 <Button type="primary" htmlType="submit" className="submit-btn-form">
                     {editingRecurrence ? "Salvar Alterações" : "Criar Recorrência"}
                 </Button>
             </Form.Item>
         </Form>
       </Modal>
    </Layout.Content>
  );
};

export default RecorrenciasPage;