// src/pages/AdminPage/AdminPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout,
  Table,
  Typography,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Input,
  message,
  Popconfirm,
  Tabs,
  Card,
  Row,
  Col,
  InputNumber,
  Radio,
  Spin,
} from 'antd';
import {
  UserSwitchOutlined,
  DeleteOutlined,
  PlusOutlined,
  SendOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import apiClient from '../../services/api';
import './AdminPage.css';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const AdminPage = () => {
  // Estados de dados
  const [clients, setClients] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [customPlans, setCustomPlans] = useState([]);

  // Estados de UI e controle
  const [loading, setLoading] = useState({ clients: false, plans: false, broadcast: false });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({ search: '', userStatus: 'all' });

  // Modais
  const [editingClient, setEditingClient] = useState(null);
  const [isPlanModalVisible, setIsPlanModalVisible] = useState(false);
  const [isCreateUserModalVisible, setIsCreateUserModalVisible] = useState(false);

  // Forms
  const [planForm] = Form.useForm();
  const [broadcastForm] = Form.useForm();
  const [changePlanForm] = Form.useForm();
  const [createUserForm] = Form.useForm();

  const planNameMapping = {
    gratuito: 'Gratuito',
    basico_mensal: 'Básico Mensal',
    basico_anual: 'Básico Anual',
    avancado_mensal: 'Avançado Mensal',
    avancado_anual: 'Avançado Anual',
    vitalicio_basico: 'Vitalício Básico',
    vitalicio_avancado: 'Vitalício Avançado',
  };

  // --- Funções de Fetch ---
  const fetchClients = useCallback(async (page = 1, pageSize = 10, search = filters.search, userStatus = filters.userStatus) => {
    setLoading(prev => ({ ...prev, clients: true }));
    try {
      const response = await apiClient.get('/admin/clients/list', {
        params: { page, limit: pageSize, search, filter: userStatus },
      });
      setClients(response.data.clients);
      setPagination({
        current: response.data.currentPage,
        pageSize: pageSize,
        total: response.data.totalItems,
      });
    } catch (error) {
      message.error('Falha ao carregar a lista de clientes.');
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
    }
  }, [filters.search, filters.userStatus]);

  const fetchAllPlans = useCallback(async () => {
    setLoading(prev => ({ ...prev, plans: true }));
    try {
      const response = await apiClient.get('/admin/plans');
      setAllPlans(response.data.data);
    } catch (error) {
      message.error('Falha ao carregar todos os planos.');
    } finally {
      setLoading(prev => ({ ...prev, plans: false }));
    }
  }, []);

  const fetchCustomPlans = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/plans', { params: { isCustom: 'true' } });
      setCustomPlans(response.data.data);
    } catch (error) {
      message.error('Falha ao carregar planos customizados.');
    }
  }, []);

  // --- Efeitos ---
  useEffect(() => {
    fetchClients(pagination.current, pagination.pageSize, filters.search, filters.userStatus);
  }, [fetchClients, pagination.current, pagination.pageSize, filters.search, filters.userStatus]);

  useEffect(() => {
    fetchAllPlans();
    fetchCustomPlans();
  }, [fetchAllPlans, fetchCustomPlans]);

  // --- Handlers de Ações ---
  const handleTableChange = (newPagination) => {
    setPagination(prev => ({ ...prev, current: newPagination.current, pageSize: newPagination.pageSize }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'search' || key === 'userStatus') {
        setPagination(prev => ({...prev, current: 1})); // Reseta para a primeira página ao filtrar
    }
  };

  const showPlanModal = (client) => {
    setEditingClient(client);
    setIsPlanModalVisible(true);
  };
  
  const handleDeleteClient = async (clientId) => {
    try {
      await apiClient.delete(`/admin/clients/${clientId}`);
      message.success('Cliente excluído com sucesso!');
      fetchClients(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Erro ao excluir o cliente.');
    }
  };

  const handlePlanChange = async (values) => {
    setLoading(prev => ({...prev, clients: true}));
    try {
      await apiClient.post('/admin/clients/change-plan', {
        clientId: editingClient.id,
        planId: values.planId,
        customMessage: values.customMessage
      });
      message.success(`Plano de ${editingClient.name} atualizado!`);
      setIsPlanModalVisible(false);
      changePlanForm.resetFields();
      setEditingClient(null);
      fetchClients(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Erro ao atualizar o plano.');
    } finally {
        setLoading(prev => ({...prev, clients: false}));
    }
  };
  
  const handleCreateUser = async (values) => {
    setLoading(prev => ({...prev, clients: true}));
    try {
        await apiClient.post('/admin/clients/create-as-admin', values);
        message.success(`Usuário ${values.name} criado com sucesso!`);
        setIsCreateUserModalVisible(false);
        createUserForm.resetFields();
        fetchClients(); // Volta para a primeira página
    } catch(error) {
        message.error(error.response?.data?.message || 'Erro ao criar usuário.');
    } finally {
        setLoading(prev => ({...prev, clients: false}));
    }
  }
  
  const handleCreatePlan = async (values) => {
    try {
        await apiClient.post('/admin/plans/custom', values);
        message.success(`Plano "${values.name}" criado com sucesso!`);
        planForm.resetFields();
        fetchCustomPlans(); // Atualiza a lista de planos customizados
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Erro ao criar o plano.';
        message.error(errorMessage);
    }
  };

  const handleSendBroadcast = async (values) => {
    const { message: broadcastMessage, targetGroup } = values;
    setLoading(prev => ({...prev, broadcast: true}));
    try {
        const response = await apiClient.post('/admin/broadcast', { message: broadcastMessage, targetGroup });
        message.success(`Transmissão enviada! Sucesso: ${response.data.data.sentCount}, Falhas: ${response.data.data.failedCount}.`);
        broadcastForm.resetFields();
    } catch (error) {
        message.error('Erro ao enviar a transmissão.');
    } finally {
        setLoading(prev => ({...prev, broadcast: false}));
    }
  };
  
  const clientColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
    { title: 'Nome', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Telefone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Plano Atual',
      dataIndex: 'accessLevel',
      key: 'accessLevel',
      render: (level) => <Tag color="blue">{planNameMapping[level] || level}</Tag>,
    },
    {
      title: 'Expira em',
      dataIndex: 'accessExpiresAt',
      key: 'accessExpiresAt',
      render: (date) => (date ? new Date(date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Vitalício/Gratuito'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'Ativo' ? 'green' : 'volcano';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<UserSwitchOutlined />} onClick={() => showPlanModal(record)}>
            Alterar Plano
          </Button>
          <Popconfirm
            title={`Tem certeza que quer excluir ${record.name}?`}
            description="Esta ação é irreversível e excluirá TODOS os dados do cliente."
            onConfirm={() => handleDeleteClient(record.id)}
            okText="Sim, excluir"
            cancelText="Não"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>Excluir</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const customPlanColumns = [
    { title: 'Nome do Plano', dataIndex: 'name', key: 'name' },
    { 
      title: 'Preço', 
      dataIndex: 'price', 
      key: 'price', 
      render: (price) => {
        const numericPrice = parseFloat(price);
        return `R$ ${!isNaN(numericPrice) ? numericPrice.toFixed(2) : '0.00'}`;
      }
    },
    { title: 'Duração', dataIndex: 'durationDays', key: 'durationDays', render: (days) => `${days} dias` },
    { title: 'Nível', dataIndex: 'tier', key: 'tier', render: (tier) => <Tag>{tier.charAt(0).toUpperCase() + tier.slice(1)}</Tag> },
  ];

  const UserManagementTab = (
    <Card title="Gerenciamento de Usuários">
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }} gutter={[16, 16]}>
          <Col xs={24} lg={16}>
              <Space wrap>
                  <Input.Search
                      placeholder="Buscar por nome, email ou telefone..."
                      onSearch={(value) => handleFilterChange('search', value)}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      enterButton={<Button icon={<SearchOutlined />} type="primary" />}
                      style={{ minWidth: 250, flexGrow: 1 }}
                      allowClear
                  />
                  <Select value={filters.userStatus} onChange={(value) => handleFilterChange('userStatus', value)} style={{ width: 200 }}>
                      <Option value="all">Todos os Status</Option>
                      <Option value="active">Ativos</Option>
                      <Option value="expiring_soon">Expirando em 7 dias</Option>
                      <Option value="expired">Expirados/Inativos</Option>
                  </Select>
              </Space>
          </Col>
          <Col xs={24} lg={8} style={{ textAlign: 'right' }}>
              <Button type="primary" icon={<UserAddOutlined />} onClick={() => setIsCreateUserModalVisible(true)}>
                  Criar Novo Usuário
              </Button>
          </Col>
      </Row>
      <Table columns={clientColumns} dataSource={clients} rowKey="id" pagination={pagination} loading={loading.clients} onChange={handleTableChange} scroll={{ x: 'max-content' }} />
    </Card>
  );

  const PlanManagementTab = (
    <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
            <Card title="Criar Plano Customizado (Parceria, etc)">
                <Form form={planForm} layout="vertical" onFinish={handleCreatePlan}>
                    <Form.Item name="name" label="Nome do Plano" rules={[{ required: true }]}>
                        <Input placeholder="Ex: Parceria - Blog da Maria" />
                    </Form.Item>
                    <Form.Item name="price" label="Preço" initialValue={0} rules={[{ required: true }]}>
                        <InputNumber min={0} style={{ width: '100%' }} formatter={value => `R$ ${value}`} parser={value => value.replace('R$ ', '')}/>
                    </Form.Item>
                    <Form.Item name="durationDays" label="Duração (dias)" initialValue={365} rules={[{ required: true }]}>
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="Ex: 30 para mensal, 365 para anual" />
                    </Form.Item>
                    <Form.Item name="tier" label="Nível de Acesso (Tier)" initialValue="avancado" rules={[{ required: true }]}>
                        <Select>
                            <Option value="basico">Básico</Option>
                            <Option value="avancado">Avançado</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                            Criar Plano
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </Col>
        <Col xs={24} md={12}>
            <Card title="Planos Customizados Existentes">
                 <Table columns={customPlanColumns} dataSource={customPlans} rowKey="id" pagination={false} loading={loading.plans} scroll={{ x: 'max-content' }}/>
            </Card>
        </Col>
    </Row>
  );

  const BroadcastTab = (
    <Card title="Comunicação em Massa">
        <Form form={broadcastForm} layout="vertical" onFinish={handleSendBroadcast}>
            <Form.Item name="targetGroup" label="Enviar Para" initialValue="all_active" rules={[{ required: true }]}>
                <Radio.Group>
                    <Radio value="all_active">Todos os Usuários Ativos</Radio>
                    <Radio value="expiring_soon">Usuários com Plano Expirando (próx. 7 dias)</Radio>
                    <Radio value="expired">Usuários com Plano Expirado/Inativo</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item name="message" label="Mensagem" rules={[{ required: true }]}>
                <Input.TextArea rows={6} placeholder="Digite sua mensagem aqui... Ela será enviada via WhatsApp para os clientes selecionados." />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading.broadcast}>Enviar Transmissão</Button>
            </Form.Item>
        </Form>
    </Card>
  );

  return (
    <Layout className="admin-page-layout">
        <Content className="admin-page-content">
            <div className="admin-header">
                <Title level={2}>Painel do Administrador</Title>
                <Button icon={<ReloadOutlined />} onClick={() => fetchClients()} loading={loading.clients}>Atualizar Lista</Button>
            </div>
            
            <Tabs defaultActiveKey="1" type="card">
                <Tabs.TabPane tab="Usuários" key="1">{UserManagementTab}</Tabs.TabPane>
                <Tabs.TabPane tab="Planos" key="2">{PlanManagementTab}</Tabs.TabPane>
                <Tabs.TabPane tab="Transmissão" key="3">{BroadcastTab}</Tabs.TabPane>
            </Tabs>
        </Content>

        <Modal 
            title={`Alterar Plano de ${editingClient?.name}`} 
            open={isPlanModalVisible} 
            onCancel={() => { setIsPlanModalVisible(false); setEditingClient(null); changePlanForm.resetFields(); }} 
            footer={null}
            destroyOnClose
        >
            <Form form={changePlanForm} layout="vertical" onFinish={handlePlanChange}>
                <Form.Item name="planId" label="Selecione o Novo Plano" rules={[{ required: true }]}>
                    <Select placeholder="Escolha um plano" loading={loading.plans}>
                        {allPlans.map(plan => {
                            const price = parseFloat(plan.price);
                            const formattedPrice = !isNaN(price) ? price.toFixed(2) : '0.00';
                            return (
                                <Option key={plan.id} value={plan.id}>
                                    {plan.name} (R$ {formattedPrice})
                                </Option>
                            );
                        })}
                    </Select>
                </Form.Item>
                <Form.Item name="customMessage" label="Mensagem de Ativação (Opcional)">
                    <Input.TextArea rows={4} placeholder="Deixe em branco para usar a mensagem padrão. Escreva aqui para enviar uma mensagem personalizada."/>
                </Form.Item>
                <Form.Item><Button type="primary" htmlType="submit" loading={loading.clients}>Salvar Alteração</Button></Form.Item>
            </Form>
        </Modal>
        
        <Modal 
            title="Criar Novo Usuário" 
            open={isCreateUserModalVisible} 
            onCancel={() => { setIsCreateUserModalVisible(false); createUserForm.resetFields(); }} 
            footer={null}
            destroyOnClose
        >
             <Form form={createUserForm} layout="vertical" onFinish={handleCreateUser}>
                <Form.Item name="name" label="Nome Completo" rules={[{ required: true, message: 'O nome é obrigatório' }]}><Input /></Form.Item>
                <Form.Item name="phone" label="Telefone (WhatsApp)" rules={[{ required: true, message: 'O telefone é obrigatório' }]}><Input placeholder="Ex: 5511999998888"/></Form.Item>
                <Form.Item name="email" label="E-mail" rules={[{type: 'email', message: 'Insira um e-mail válido'}]}><Input type="email" /></Form.Item>
                <Form.Item name="password" label="Senha" rules={[{ required: true, min: 6, message: 'A senha deve ter no mínimo 6 caracteres' }]}><Input.Password /></Form.Item>
                <Form.Item name="planId" label="Plano Inicial" rules={[{ required: true, message: 'Selecione um plano' }]}>
                    <Select placeholder="Escolha um plano" loading={loading.plans}>
                        {allPlans.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Select>
                </Form.Item>
                <Form.Item name="customMessage" label="Mensagem de Boas-Vindas (Opcional)">
                    <Input.TextArea rows={4} placeholder="Escreva uma mensagem para ser enviada no WhatsApp após a criação."/>
                </Form.Item>
                <Form.Item><Button type="primary" htmlType="submit" loading={loading.clients}>Criar Usuário</Button></Form.Item>
            </Form>
        </Modal>
    </Layout>
  );
};

export default AdminPage;