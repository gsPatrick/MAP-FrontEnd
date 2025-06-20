// src/pages/AdminPage/AdminPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Layout, Card, Avatar, Typography, Button, Modal, Form, Input, Select,
  Statistic, Tag, Table, Space, message, Row, Col, List,
  Dropdown, Menu, Descriptions, Spin, Tabs, InputNumber, Tooltip
} from 'antd';
import {
  UserOutlined, CrownOutlined, SearchOutlined, PlusOutlined, EditOutlined, 
  DeleteOutlined, TeamOutlined, CheckCircleOutlined, StopOutlined, LockOutlined,
  MoreOutlined, EyeOutlined, ClearOutlined, WarningOutlined, MessageOutlined, 
  DollarCircleOutlined, UsergroupAddOutlined, PhoneOutlined, GiftOutlined,
  UnorderedListOutlined // Novo ícone
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import debounce from 'lodash.debounce';

import apiClient from '../../services/api'; 
import './AdminPage.css';

dayjs.locale('pt-br');

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const AdminPage = () => {
    // --- ESTADOS GERAIS ---
    const [activeTabKey, setActiveTabKey] = useState("1");

    // --- ESTADOS DE DADOS ---
    const [clients, setClients] = useState([]);
    const [plans, setPlans] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [affiliates, setAffiliates] = useState([]);
    const [affiliateMetrics, setAffiliateMetrics] = useState({ totalBalance: 0, totalReferrals: 0, totalEarned: 0 });

    // --- ESTADOS DE CONTROLE ---
    const [loading, setLoading] = useState({ table: true, metrics: true, form: false, affiliates: true, broadcast: false, plans: true });
    const [filters, setFilters] = useState({ search: '', accessLevel: undefined, status: undefined });
    const [pagination, setPagination] = useState({ current: 1, pageSize: 8, total: 0 });

    // --- ESTADOS DOS MODAIS ---
    const [modalState, setModalState] = useState({
        user: false,
        planUpdate: false,
        planCreate: false,
        planEdit: false,
        details: false,
        broadcast: false,
        affiliateDetails: false, // << NOVO ESTADO DE MODAL
    });
    const [editingUser, setEditingUser] = useState(null);
    const [editingPlan, setEditingPlan] = useState(null);
    const [userForPlanUpdate, setUserForPlanUpdate] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);
    const [viewingAffiliate, setViewingAffiliate] = useState(null); // << NOVO ESTADO

    // --- FORMS ---
    const [userForm] = Form.useForm();
    const [planUpdateForm] = Form.useForm();
    const [planCreateForm] = Form.useForm();
    const [planEditForm] = Form.useForm();
    const [broadcastForm] = Form.useForm();

    // --- FUNÇÕES DE BUSCA DE DADOS ---
    const fetchClients = useCallback(async (currentPagination, currentFilters) => {
        setLoading(prev => ({ ...prev, table: true }));
        try {
            const params = { page: currentPagination.current, limit: currentPagination.pageSize, ...currentFilters };
            Object.keys(params).forEach(key => (params[key] === '' || params[key] === undefined) && delete params[key]);
            const response = await apiClient.get('/admin/clients', { params });
            setClients(response.data.clients || []);
            setPagination(prev => ({ ...prev, total: response.data.totalItems || 0, current: response.data.currentPage || 1, pageSize: response.data.limit || 8 }));
        } catch (error) { message.error('Falha ao buscar clientes.'); console.error("Erro em fetchClients:", error); }
        finally { setLoading(prev => ({ ...prev, table: false })); }
    }, []);

    const fetchPlans = useCallback(async () => {
        setLoading(prev => ({ ...prev, plans: true }));
        try {
            const response = await apiClient.get('/admin/plans'); 
            setPlans(response.data.data || []);
        } catch (error) { message.error('Falha ao buscar a lista de planos.'); console.error("Erro em fetchPlans:", error); }
        finally { setLoading(prev => ({ ...prev, plans: false })); }
    }, []);

    const fetchAffiliates = useCallback(async () => {
        setLoading(prev => ({ ...prev, affiliates: true }));
        try {
            const response = await apiClient.get('/admin/dashboard/affiliates');
            const data = response.data.data || [];
            setAffiliates(data);
            const metrics = data.reduce((acc, aff) => {
                acc.totalBalance += parseFloat(aff.balance || 0);
                acc.totalReferrals += parseInt(aff.totalReferrals || 0, 10);
                acc.totalEarned += parseFloat(aff.totalEarned || 0);
                return acc;
            }, { totalBalance: 0, totalReferrals: 0, totalEarned: 0 });
            setAffiliateMetrics(metrics);
        } catch (error) { message.error('Falha ao buscar dados dos afiliados.'); console.error("Erro em fetchAffiliates:", error); }
        finally { setLoading(prev => ({ ...prev, affiliates: false })); }
    }, []);

    // --- EFEITOS DE CICLO DE VIDA ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(prev => ({ ...prev, metrics: true }));
            try {
                const response = await apiClient.get('/admin/dashboard/metrics');
                setMetrics(response.data.data);
            } catch (error) { message.error('Falha ao carregar métricas do dashboard.'); console.error("Erro nas métricas:", error); }
            finally { setLoading(prev => ({ ...prev, metrics: false })); }
        };
        fetchInitialData();
        fetchPlans();
    }, [fetchPlans]);

    const debouncedFetchClients = useMemo(() => debounce((p, f) => fetchClients(p, f), 500), [fetchClients]);

    useEffect(() => {
        debouncedFetchClients(pagination, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, pagination.current, pagination.pageSize]);

    // --- HANDLERS ---
    const handleTabChange = (key) => {
        setActiveTabKey(key);
        if (key === "2" && affiliates.length === 0) fetchAffiliates();
        if (key === "4" && plans.length === 0) fetchPlans();
    };

    const handleOpenModal = (modalType, data = null) => {
        setModalState(prev => ({ ...prev, [modalType]: true }));
        if (modalType === 'affiliateDetails') {
            setViewingAffiliate(data);
        } else if (modalType === 'planEdit') {
            setEditingPlan(data);
            planEditForm.setFieldsValue(data);
        } else if (modalType === 'user') {
            setEditingUser(data);
            userForm.setFieldsValue(data ? { ...data, password: '' } : { name: '', email: '', phone: '', accessLevel: undefined, status: 'Ativo' });
        } else if (modalType === 'planUpdate') {
            setUserForPlanUpdate(data);
            const currentPlan = plans.find(p => p.id === data.planId || p.tier === data.accessLevel);
            planUpdateForm.setFieldsValue({ planId: currentPlan?.id });
        } else if (modalType === 'details') {
            setViewingUser(data);
        } else if (modalType === 'broadcast') {
            broadcastForm.resetFields();
        } else if (modalType === 'planCreate') {
            planCreateForm.resetFields();
        }
    };

    const handleCancelModals = () => setModalState({ user: false, planUpdate: false, planCreate: false, planEdit: false, details: false, broadcast: false, affiliateDetails: false });

    const handleFormSubmit = async (formType, values) => {
        setLoading(p => ({...p, form: true}));
        try {
            switch (formType) {
                case 'planEdit':
                    await apiClient.put(`/admin/plans/${editingPlan.id}`, values);
                    message.success(`Plano "${values.name}" atualizado!`);
                    fetchPlans();
                    break;
                case 'user':
                    if (editingUser) {
                        if (!values.password) delete values.password;
                        await apiClient.put(`/admin/clients/${editingUser.id}`, values);
                        message.success(`Usuário "${values.name}" atualizado!`);
                    } else {
                        await apiClient.post('/admin/clients', values);
                        message.success(`Usuário criado com sucesso!`);
                    }
                    break;
                case 'planUpdate':
                    await apiClient.post('/admin/clients/change-plan', { clientId: userForPlanUpdate.id, planId: values.planId });
                    message.success(`Plano de "${userForPlanUpdate.name}" atualizado!`);
                    break;
                case 'planCreate':
                    await apiClient.post('/admin/plans/custom', values);
                    message.success(`Plano "${values.name}" criado com sucesso!`);
                    fetchPlans(); 
                    break;
                case 'broadcast':
                    const response = await apiClient.post('/admin/broadcast', { message: values.message });
                    const { sentCount, failedCount, total } = response.data.data;
                    message.success(`Transmissão enviada! Sucesso: ${sentCount}/${total}. Falhas: ${failedCount}.`);
                    break;
                default: break;
            }
            handleCancelModals();
            if (['user', 'planUpdate'].includes(formType)) fetchClients(pagination, filters);
        } catch (error) { message.error(error.response?.data?.message || `Ocorreu um erro.`); }
        finally { setLoading(p => ({...p, form: false})); }
    };

    const handleDeleteUser = (user) => {
        Modal.confirm({
          title: `Excluir "${user.name}"?`, icon: <WarningOutlined />, content: 'Esta ação é irreversível.',
          okText: 'Sim, Excluir', okType: 'danger', cancelText: 'Cancelar',
          async onOk() {
            try {
              await apiClient.delete(`/admin/clients/${user.id}`);
              message.warn(`Usuário "${user.name}" excluído.`);
              fetchClients(pagination, filters);
            } catch (error) { message.error('Falha ao excluir usuário.'); }
          },
        });
    };
    
    const handleTableChange = (newPagination) => {
        setPagination(p => ({ ...p, current: newPagination.current, pageSize: newPagination.pageSize }));
    };

    const handleFilterChange = (key, value) => {
        setPagination(p => ({...p, current: 1}));
        setFilters(f => ({ ...f, [key]: value }));
    };

    const handleClearFilters = () => {
        setPagination(p => ({...p, current: 1}));
        setFilters({ search: '', accessLevel: undefined, status: undefined });
    }

    // --- COLUNAS DAS TABELAS ---
    const userTableColumns = [
        { title: 'Usuário', dataIndex: 'name', key: 'name', width: 280, fixed: 'left',
          render: (_, r) => <Space><Avatar src={r.avatarUrl} icon={<UserOutlined />} /><div><Text strong className="admin-table-username">{r.name || 'N/A'}</Text><br/><Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text></div></Space> },
        { title: 'Plano', dataIndex: 'accessLevel', key: 'accessLevel', width: 200, render: (level) => {
            if (!level) return <Tag>N/A</Tag>;
            let color = level.includes('vitalicio') ? 'purple' : level.includes('avancado') ? 'gold' : level.includes('basico') ? 'cyan' : 'default';
            return <Tag color={color} icon={<CrownOutlined />} className="admin-table-tag">{level.replace(/_/g, ' ')}</Tag>;
        }},
        { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status) => {
            const map = { Ativo: {c: 'success', i: <CheckCircleOutlined/>}, Inativo: {c: 'default', i: <StopOutlined/>}, Bloqueado: {c: 'error', i: <LockOutlined/>}};
            const {c, i} = map[status] || {c: 'default'}; return <Tag color={c} icon={i} className="admin-table-tag">{status}</Tag>;
        }},
        { title: 'Cadastro', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: (d) => d ? dayjs(d).format('DD/MM/YYYY') : 'N/A' },
        { title: 'Vencimento', dataIndex: 'accessExpiresAt', key: 'accessExpiresAt', width: 150, render: (d) => d ? dayjs(d).format('DD/MM/YYYY') : <Text type="secondary" italic>N/A</Text> },
        { title: 'Ações', key: 'actions', align: 'center', width: 80, fixed: 'right', render: (_, record) => (
            <Dropdown overlay={<Menu>
                    <Menu.Item key="1" icon={<EyeOutlined />} onClick={() => handleOpenModal('details', record)}>Ver Detalhes</Menu.Item>
                    <Menu.Item key="2" icon={<EditOutlined />} onClick={() => handleOpenModal('user', record)}>Editar Usuário</Menu.Item>
                    <Menu.Item key="3" icon={<CrownOutlined />} onClick={() => handleOpenModal('planUpdate', record)}>Atualizar Plano</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item key="4" icon={<DeleteOutlined />} danger onClick={() => handleDeleteUser(record)}>Excluir</Menu.Item>
                </Menu>} trigger={['click']}>
                <Button type="text" icon={<MoreOutlined />} className="action-dropdown-btn" />
            </Dropdown>
        )},
    ];

    const affiliateTableColumns = [
        { title: 'Afiliado', dataIndex: 'name', key: 'name', fixed: 'left', width: 250, render: (_, r) => <Space><Avatar icon={<UserOutlined />} /><div><Text strong>{r.name}</Text><br/><Text type="secondary" style={{fontSize: 12}}>{r.email}</Text></div></Space> },
        { title: 'Cód. Afiliado', dataIndex: 'affiliateCode', key: 'affiliateCode', align: 'center', render: (code) => <Tag color="blue">{code}</Tag> },
        { title: 'Saldo Atual', dataIndex: 'balance', key: 'balance', align: 'right', sorter: (a, b) => parseFloat(a.balance) - parseFloat(b.balance), render: (val) => <Text strong style={{color: '#3f8600'}}>{parseFloat(val).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</Text> },
        { title: 'Ganhos Totais', dataIndex: 'totalEarned', key: 'totalEarned', align: 'right', sorter: (a, b) => a.totalEarned - b.totalEarned, render: (val) => parseFloat(val).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) },
        { title: 'Indicados', dataIndex: 'totalReferrals', key: 'totalReferrals', align: 'center', sorter: (a, b) => a.totalReferrals - b.totalReferrals },
        { title: 'Histórico', key: 'history', align: 'center', render: (_, record) => (
            <Button type="link" icon={<UnorderedListOutlined />} onClick={() => handleOpenModal('affiliateDetails', record)} disabled={!record.referrals || record.referrals.length === 0}>
                Ver Indicados
            </Button>
        )},
    ];
    
    const referralTableColumns = [
        { title: 'Data', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: (date) => dayjs(date).format('DD/MM/YYYY') },
        { title: 'Nome do Indicado', dataIndex: ['referred', 'name'], key: 'referredName' },
        { title: 'Email do Indicado', dataIndex: 'email', key: 'email' },
        { title: 'Plano Vendido', dataIndex: ['plan', 'name'], key: 'planName', render: (name) => <Tag color="geekblue">{name}</Tag> },
        { title: 'Comissão', dataIndex: 'commissionAmount', key: 'commissionAmount', align: 'right', render: (val) => <Text style={{color: 'green'}}>+ {parseFloat(val).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</Text> },
    ];

    if (loading.metrics) {
        return (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}>
                <Spin size="large" tip="Carregando Painel Administrativo..." />
            </div>
        );
    }

    return (
        <div className="admin-page-content">
            <Tabs activeKey={activeTabKey} onChange={handleTabChange} className="admin-page-tabs">
                <TabPane tab={<><TeamOutlined /> Gestão de Usuários</>} key="1">
                    <Row gutter={[24, 24]}><Col span={24}><div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                            <Title level={3} style={{marginBottom: 0}}>Visão Geral dos Usuários</Title>
                            <Text type="secondary">Acompanhe as métricas e gerencie os clientes da plataforma.</Text>
                        </div>
                        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => handleOpenModal('user')} className="add-user-btn-header">Novo Usuário</Button>
                    </div></Col></Row>
                    <Row gutter={[24, 24]} style={{marginTop: 24}}>
                        <Col xs={12} md={6}><Card bordered={false} className="stat-card"><Statistic title="Clientes Totais" value={metrics?.totalClients ?? 0} loading={loading.metrics} /></Card></Col>
                        <Col xs={12} md={6}><Card bordered={false} className="stat-card"><Statistic title="Ativos" value={metrics?.activeClients ?? 0} loading={loading.metrics} /></Card></Col>
                        <Col xs={12} md={6}><Card bordered={false} className="stat-card"><Statistic title="Pagantes" value={metrics ? Object.values(metrics.plans).reduce((acc, val) => acc + val, 0) - (metrics.plans.gratuito || 0) : 0} loading={loading.metrics} /></Card></Col>
                        <Col xs={12} md={6}><Card bordered={false} className="stat-card"><Statistic title="Expirados" value={metrics?.needsPayment ?? 0} loading={loading.metrics} valueStyle={{color: '#cf1322'}} prefix={<WarningOutlined/>} /></Card></Col>
                    </Row>
                    <Card bordered={false} className="filters-card-admin" style={{marginTop: 24}}>
                        <Row gutter={[16, 16]} align="middle">
                            <Col xs={24} lg={10}><Input.Search placeholder="Buscar por nome, e-mail ou telefone..." allowClear size="large" onSearch={v => handleFilterChange('search', v)} onChange={e => !e.target.value && handleFilterChange('search', '')} /></Col>
                            <Col xs={12} sm={8} lg={5}><Select placeholder="Plano" style={{width: '100%'}} size="large" value={filters.accessLevel} onChange={v => handleFilterChange('accessLevel', v)} allowClear>{Object.keys(metrics?.plans || {}).map(p => <Option key={p} value={p}>{p.replace(/_/g, ' ')}</Option>)}</Select></Col>
                            <Col xs={12} sm={8} lg={5}><Select placeholder="Status" style={{width: '100%'}} size="large" value={filters.status} onChange={v => handleFilterChange('status', v)} allowClear><Option value="Ativo">Ativo</Option><Option value="Inativo">Inativo</Option><Option value="Bloqueado">Bloqueado</Option></Select></Col>
                            <Col xs={24} sm={8} lg={4} style={{textAlign: 'right'}}><Button icon={<ClearOutlined/>} onClick={handleClearFilters} size="large">Limpar Filtros</Button></Col>
                        </Row>
                    </Card>
                    <Table className="admin-users-table" columns={userTableColumns} dataSource={clients} rowKey="id" loading={loading.table} pagination={pagination} onChange={handleTableChange} scroll={{ x: 1200 }} />
                </TabPane>
                <TabPane tab={<><DollarCircleOutlined /> Painel de Afiliados</>} key="2">
                    <Title level={3} style={{marginBottom: 0}}>Desempenho dos Afiliados</Title>
                    <Text type="secondary">Monitore os saldos e veja quem cada afiliado indicou.</Text>
                    <Row gutter={[24, 24]} style={{marginTop: 24}}>
                        <Col xs={24} md={8}><Card bordered={false} className="stat-card"><Statistic title="Total de Ganhos (Comissões)" value={affiliateMetrics.totalEarned} loading={loading.affiliates} precision={2} prefix="R$" /></Card></Col>
                        <Col xs={12} md={8}><Card bordered={false} className="stat-card"><Statistic title="Saldo Atual em Contas" value={affiliateMetrics.totalBalance} loading={loading.affiliates} precision={2} prefix="R$" /></Card></Col>
                        <Col xs={12} md={8}><Card bordered={false} className="stat-card"><Statistic title="Total de Indicados" value={affiliateMetrics.totalReferrals} loading={loading.affiliates} prefix={<UsergroupAddOutlined/>} /></Card></Col>
                    </Row>
                    <Table 
                        className="affiliates-table" 
                        style={{marginTop: 24}} 
                        columns={affiliateTableColumns} 
                        dataSource={affiliates} 
                        rowKey="id" 
                        loading={loading.affiliates} 
                        pagination={{ pageSize: 10 }} 
                        scroll={{ x: 1000 }}
                    />
                </TabPane>
                <TabPane tab={<><GiftOutlined /> Gestão de Planos</>} key="4">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
                        <div>
                            <Title level={3} style={{marginBottom: 0}}>Planos do Sistema</Title>
                            <Text type="secondary">Crie planos customizados e edite os valores de comissão.</Text>
                        </div>
                        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => handleOpenModal('planCreate')}>Criar Novo Plano</Button>
                    </div>
                    <Card>
                        <List
                            loading={loading.plans}
                            dataSource={plans}
                            rowKey="id"
                            renderItem={plan => (
                                <List.Item
                                    actions={[
                                        <Tooltip title="Editar Plano">
                                            <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenModal('planEdit', plan)} />
                                        </Tooltip>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar icon={<GiftOutlined />} style={{backgroundColor: '#87d068'}} />}
                                        title={<Text strong>{plan.name}</Text>}
                                        description={`Preço: R$${plan.price} | Duração: ${plan.durationDays} dias | Nível: ${plan.tier} | Comissão: R$${plan.affiliateCommissionValue}`}
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </TabPane>
                <TabPane tab={<><MessageOutlined /> Comunicação</>} key="3">
                     <Card title="Ferramentas de Comunicação" className="tools-card">
                        <Row align="middle" justify="space-between">
                            <Col>
                                <Title level={5}>Enviar Mensagem em Massa</Title>
                                <Text type="secondary">Envie uma notificação via WhatsApp para todos os clientes com status "Ativo".</Text>
                            </Col>
                            <Col>
                                <Button type="primary" size="large" icon={<MessageOutlined />} onClick={() => handleOpenModal('broadcast')}>Criar Mensagem</Button>
                            </Col>
                        </Row>
                     </Card>
                </TabPane>
            </Tabs>

            {/* ================================================================== */}
            {/* INÍCIO DA SEÇÃO MODIFICADA: MODAL DE USUÁRIO                       */}
            {/* ================================================================== */}
            <Modal open={modalState.user} onCancel={handleCancelModals} footer={null} className="admin-modal-white" width={650} destroyOnClose>
                <Spin spinning={loading.form}>
                    <div className="modal-content-wrapper">
                        <Title level={3} className="modal-title-custom"><UserOutlined/> {editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</Title>
                        <Form form={userForm} layout="vertical" onFinish={(v) => handleFormSubmit('user', v)}>
                           <Row gutter={24}>
                                {/* Nome: Opcional na criação, obrigatório na edição */}
                                <Col span={12}><Form.Item name="name" label="Nome Completo" rules={[{ required: !!editingUser, message: 'O nome é obrigatório para edição.' }]}><Input size="large" placeholder={editingUser ? "Nome do usuário" : "Nome (opcional)"} /></Form.Item></Col>
                                {/* Email: Opcional na criação, obrigatório na edição */}
                                <Col span={12}><Form.Item name="email" label="E-mail" rules={[{ type: 'email', message: 'Formato de e-mail inválido.' }, { required: !!editingUser, message: 'O e-mail é obrigatório para edição.' }]}><Input size="large" placeholder={editingUser ? "email@dominio.com" : "E-mail (opcional)"} /></Form.Item></Col>
                            </Row>
                            <Row gutter={24}>
                                {/* Telefone: Obrigatório sempre */}
                                <Col span={12}><Form.Item name="phone" label="Telefone (com DDI)" rules={[{ required: true, message: 'O telefone é obrigatório.' }]}><Input size="large" prefix={<PhoneOutlined />} placeholder="5511987654321" /></Form.Item></Col>
                                {/* Senha: Opcional sempre, com validação de tamanho se preenchida */}
                                <Col span={12}><Form.Item name="password" label={editingUser ? "Nova Senha (opcional)" : "Senha (opcional)"} rules={[{ min: 6, message: 'A senha deve ter no mínimo 6 caracteres.' }]}><Input.Password size="large" placeholder="••••••••" /></Form.Item></Col>
                            </Row>
                             <Row gutter={24}>
                                {/* Status: Opcional na criação, obrigatório na edição */}
                                <Col span={12}><Form.Item name="status" label="Status" rules={[{ required: !!editingUser, message: 'O status é obrigatório para edição.' }]}><Select size="large" placeholder="Selecione o status"><Option value="Ativo">Ativo</Option><Option value="Inativo">Inativo</Option><Option value="Bloqueado">Bloqueado</Option></Select></Form.Item></Col>
                                {/* Plano: Obrigatório e visível apenas na criação */}
                                {!editingUser && <Col span={12}><Form.Item name="accessLevel" label="Plano Inicial" rules={[{ required: true, message: 'O plano inicial é obrigatório.' }]}><Select size="large" loading={loading.plans} placeholder="Selecione o plano">{plans.map(p => <Option key={p.id} value={p.tier}>{p.name}</Option>)}</Select></Form.Item></Col>}
                            </Row>
                            <div className="modal-footer-custom">
                                <Button onClick={handleCancelModals} className="cancel-btn-form" size="large">Cancelar</Button>
                                <Button type="primary" htmlType="submit" loading={loading.form} className="submit-btn-form" size="large">{editingUser ? 'Salvar' : 'Criar Usuário'}</Button>
                            </div>
                        </Form>
                    </div>
                </Spin>
            </Modal>
            {/* ================================================================== */}
            {/* FIM DA SEÇÃO MODIFICADA                                            */}
            {/* ================================================================== */}

            <Modal open={modalState.planUpdate} onCancel={handleCancelModals} footer={null} className="admin-modal-white" width={500} destroyOnClose>
                <Spin spinning={loading.form}>
                     <div className="modal-content-wrapper">
                        <Title level={3} className="modal-title-custom"><CrownOutlined/> Atualizar Plano de <Text strong>{userForPlanUpdate?.name}</Text></Title>
                        <Form form={planUpdateForm} layout="vertical" onFinish={(v) => handleFormSubmit('planUpdate', v)}>
                            <Form.Item name="planId" label="Selecione o novo plano" rules={[{ required: true }]}>
                                <Select size="large" placeholder="Selecione um plano" loading={loading.plans}>
                                    {plans.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                                </Select>
                            </Form.Item>
                            <div className="modal-footer-custom">
                                <Button onClick={handleCancelModals} className="cancel-btn-form" size="large">Cancelar</Button>
                                <Button type="primary" htmlType="submit" loading={loading.form} className="submit-btn-form" size="large">Atualizar Plano</Button>
                            </div>
                        </Form>
                    </div>
                </Spin>
            </Modal>

            <Modal open={modalState.planCreate} onCancel={handleCancelModals} footer={null} className="admin-modal-white" width={600} destroyOnClose>
                <Spin spinning={loading.form}>
                    <div className="modal-content-wrapper">
                        <Title level={3} className="modal-title-custom"><GiftOutlined/> Criar Plano Customizado</Title>
                        <Form form={planCreateForm} layout="vertical" onFinish={(v) => handleFormSubmit('planCreate', v)}>
                           <Form.Item name="name" label="Nome do Plano" rules={[{ required: true, message: 'O nome do plano é obrigatório.' }]}><Input size="large" placeholder="Ex: Presente VIP - 3 Meses" /></Form.Item>
                            <Row gutter={24}>
                                <Col span={12}><Form.Item name="price" label="Preço (R$)" initialValue={0} rules={[{ required: true }]}><InputNumber size="large" style={{width: '100%'}} min={0} step={0.01} precision={2} /></Form.Item></Col>
                                <Col span={12}><Form.Item name="durationDays" label="Duração (dias)" rules={[{ required: true, message: 'A duração é obrigatória.' }]}><InputNumber size="large" style={{width: '100%'}} min={1} placeholder="Ex: 90" /></Form.Item></Col>
                            </Row>
                            <Row gutter={24}>
                                <Col span={12}><Form.Item name="tier" label="Nível de Acesso" rules={[{ required: true, message: 'O nível é obrigatório.' }]}><Select size="large" placeholder="Selecione o nível"><Option value="basico">Básico</Option><Option value="avancado">Avançado</Option></Select></Form.Item></Col>
                                <Col span={12}><Form.Item name="affiliateCommissionValue" label="Comissão Afiliado (R$)" initialValue={0}><InputNumber size="large" style={{width: '100%'}} min={0} step={0.01} precision={2} /></Form.Item></Col>
                            </Row>
                            <div className="modal-footer-custom">
                                <Button onClick={handleCancelModals} className="cancel-btn-form" size="large">Cancelar</Button>
                                <Button type="primary" htmlType="submit" loading={loading.form} className="submit-btn-form" size="large">Criar Plano</Button>
                            </div>
                        </Form>
                    </div>
                </Spin>
            </Modal>
            
            <Modal open={modalState.planEdit} onCancel={handleCancelModals} footer={null} className="admin-modal-white" width={600} destroyOnClose>
                <Spin spinning={loading.form}>
                    <div className="modal-content-wrapper">
                        <Title level={3} className="modal-title-custom"><EditOutlined/> Editar Plano: <Text type="secondary">{editingPlan?.name}</Text></Title>
                        <Form form={planEditForm} layout="vertical" onFinish={(v) => handleFormSubmit('planEdit', v)} initialValues={editingPlan}>
                           <Form.Item name="name" label="Nome do Plano" rules={[{ required: true }]}><Input size="large" /></Form.Item>
                            <Row gutter={24}>
                                <Col span={12}><Form.Item name="price" label="Preço (R$)" rules={[{ required: true }]}><InputNumber size="large" style={{width: '100%'}} min={0} step={0.01} precision={2} /></Form.Item></Col>
                                <Col span={12}><Form.Item name="durationDays" label="Duração (dias)" rules={[{ required: true }]}><InputNumber size="large" style={{width: '100%'}} min={1} /></Form.Item></Col>
                            </Row>
                            <Row gutter={24}>
                                <Col span={12}><Form.Item name="tier" label="Nível de Acesso" rules={[{ required: true }]}><Select size="large"><Option value="basico">Básico</Option><Option value="avancado">Avançado</Option></Select></Form.Item></Col>
                                <Col span={12}><Form.Item name="affiliateCommissionValue" label="Comissão Afiliado (R$)" rules={[{ required: true }]}><InputNumber size="large" style={{width: '100%'}} min={0} step={0.01} precision={2} /></Form.Item></Col>
                            </Row>
                            <div className="modal-footer-custom">
                                <Button onClick={handleCancelModals} className="cancel-btn-form" size="large">Cancelar</Button>
                                <Button type="primary" htmlType="submit" loading={loading.form} className="submit-btn-form" size="large">Salvar Alterações</Button>
                            </div>
                        </Form>
                    </div>
                </Spin>
            </Modal>

            <Modal open={modalState.details} onCancel={handleCancelModals} footer={<Button onClick={handleCancelModals} size="large" className="cancel-btn-form">Fechar</Button>} className="admin-modal-white" width={600}>
                {viewingUser && (
                    <div className="modal-content-wrapper user-details-modal-content">
                        <Avatar size={90} src={viewingUser.avatarUrl} icon={<UserOutlined />} className="details-avatar" />
                        <Title level={4} className="details-title">{viewingUser.name}</Title>
                        <Descriptions bordered layout="vertical" column={{ xs: 1, sm: 2 }}>
                            <Descriptions.Item label="ID do Cliente">{viewingUser.id}</Descriptions.Item>
                            <Descriptions.Item label="Telefone">{viewingUser.phone || 'Não informado'}</Descriptions.Item>
                            <Descriptions.Item label="E-mail" span={2}>{viewingUser.email}</Descriptions.Item>
                            <Descriptions.Item label="Plano Atual"><Tag color="gold">{viewingUser.accessLevel?.replace(/_/g, ' ')}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Status"><Tag color={viewingUser.status === 'Ativo' ? 'success' : 'error'}>{viewingUser.status}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Data de Cadastro">{dayjs(viewingUser.createdAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
                            <Descriptions.Item label="Vencimento do Acesso">{viewingUser.accessExpiresAt ? dayjs(viewingUser.accessExpiresAt).format('DD/MM/YYYY') : 'Não se aplica'}</Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>

            <Modal open={modalState.broadcast} onCancel={handleCancelModals} footer={null} className="admin-modal-white" width={600} destroyOnClose>
                <Spin spinning={loading.broadcast}>
                    <div className="modal-content-wrapper broadcast-modal-content">
                        <Title level={3} className="modal-title-custom"><MessageOutlined/> Enviar Mensagem em Massa</Title>
                        <Form form={broadcastForm} layout="vertical" onFinish={(v) => handleFormSubmit('broadcast', v)}>
                            <Form.Item name="message" label="Conteúdo da Mensagem" rules={[{ required: true, message: 'A mensagem não pode ser vazia.' }]}>
                                <Input.TextArea placeholder="Digite a mensagem que será enviada para todos os clientes ativos..." size="large" rows={5}/>
                            </Form.Item>
                            <Paragraph type="secondary" className='broadcast-warning'><WarningOutlined/> A mensagem será enviada a todos os clientes com status "Ativo" e com telefone cadastrado. Esta ação não pode ser desfeita.</Paragraph>
                            <div className="modal-footer-custom">
                                <Button onClick={handleCancelModals} className="cancel-btn-form" size="large">Cancelar</Button>
                                <Button type="primary" htmlType="submit" loading={loading.broadcast} className="submit-btn-form" size="large">Enviar Transmissão</Button>
                            </div>
                        </Form>
                    </div>
                </Spin>
            </Modal>

            <Modal 
                open={modalState.affiliateDetails} 
                onCancel={handleCancelModals} 
                footer={<Button onClick={handleCancelModals} size="large" className="cancel-btn-form">Fechar</Button>} 
                className="admin-modal-white" 
                width={800} 
                destroyOnClose
            >
                {viewingAffiliate && (
                    <div className="modal-content-wrapper">
                        <Title level={3} className="modal-title-custom"><UnorderedListOutlined /> Histórico de Indicações de <Text type="secondary">{viewingAffiliate.name}</Text></Title>
                        <Table
                            columns={referralTableColumns}
                            dataSource={viewingAffiliate.referrals}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            size="default"
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminPage;