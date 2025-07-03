// src/pages/ConfiguracoesPage/ConfiguracoesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Typography, Card, Form, Input, Button, Tabs, Row, Col,
  Modal, List, Avatar, Space, Tooltip, Popconfirm, message, Radio, Divider, Empty, Spin, Select, Tag, Alert,
  Checkbox, TimePicker, DatePicker
} from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, ShareAltOutlined, SettingOutlined, InfoCircleOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined, UsergroupAddOutlined,
  CreditCardOutlined, ShopOutlined, IdcardOutlined, ProfileOutlined, WhatsAppOutlined,
  GoogleOutlined, LinkOutlined, DisconnectOutlined, SyncOutlined, CheckCircleFilled, CloseCircleFilled, StopOutlined, SaveOutlined,
  ScheduleOutlined, CalendarOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { RRule } from 'rrule';
import moment from 'moment';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

import './ConfiguracoesPage.css';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const initialMainUserDataMock = { id: null, name: 'Carregando...', email: 'Carregando...', phone: 'Carregando...' };
const googleCalendarColors = [
    { id: '1', name: 'Azul Lavanda', hex: '#7986cb' }, { id: '2', name: 'Verde Sálvia', hex: '#33b679' },
    { id: '3', name: 'Uva', hex: '#8e24aa' }, { id: '4', name: 'Flamingo', hex: '#e67c73' },
    { id: '5', name: 'Banana', hex: '#f6c026' }, { id: '6', name: 'Tangerina', hex: '#f5511d' },
    { id: '7', name: 'Pavão', hex: '#039be5' }, { id: '8', name: 'Grafite', hex: '#616161' },
    { id: '9', name: 'Mirtilo', hex: '#3f51b5' }, { id: '10', name: 'Manjericão', hex: '#0b8043' },
    { id: '11', name: 'Tomate', hex: '#d60000' },
];
const daysOfWeekMap = { mon: RRule.MO, tue: RRule.TU, wed: RRule.WE, thu: RRule.TH, fri: RRule.FR, sat: RRule.SA, sun: RRule.SU };
const rruleToFormMap = { MO: 'mon', TU: 'tue', WE: 'wed', TH: 'thu', FR: 'fri', SA: 'sat', SU: 'sun' };
const daysOfWeekOptions = [
    { label: 'Segunda', value: 'mon' }, { label: 'Terça', value: 'tue' },
    { label: 'Quarta', value: 'wed' }, { label: 'Quinta', value: 'thu' },
    { label: 'Sexta', value: 'fri' }, { label: 'Sábado', value: 'sat' },
    { label: 'Domingo', value: 'sun' },
];

const ConfiguracoesPage = () => {
    const { currentProfile, currentProfileType, currentProfileName, fetchUserProfiles, userProfiles, isAuthenticated, loadingProfiles } = useProfile();
    
    const [mainUserData, setMainUserData] = useState(initialMainUserDataMock);
    const [isEditInfoModalVisible, setIsEditInfoModalVisible] = useState(false);
    const [editInfoForm] = Form.useForm();
    const [isSavingInfo, setIsSavingInfo] = useState(false);
    const [sharedUsers, setSharedUsers] = useState([]);
    const [loadingSharedUsers, setLoadingSharedUsers] = useState(false);
    const [isAccessModalVisible, setIsAccessModalVisible] = useState(false);
    const [editingAccessUser, setEditingAccessUser] = useState(null);
    const [accessForm] = Form.useForm();
    const [isSavingAccess, setIsSavingAccess] = useState(false);
    
    const ownerHasBusinessProfile = userProfiles.some(p => p.type === 'PJ' || p.type === 'MEI');
    const businessProfiles = userProfiles.filter(p => p.type === 'PJ' || p.type === 'MEI');

    const [googleSyncStatus, setGoogleSyncStatus] = useState(null);
    const [loadingGoogleStatus, setLoadingGoogleStatus] = useState(false);
    const [isSavingGoogleColors, setIsSavingGoogleColors] = useState(false);
    const [googleColorsForm] = Form.useForm();

    const [availabilityRules, setAvailabilityRules] = useState([]);
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [scheduleForm] = Form.useForm();
    const [isDayOffModalVisible, setIsDayOffModalVisible] = useState(false);
    const [dayOffForm] = Form.useForm();
    const [isSavingDayOff, setIsSavingDayOff] = useState(false);

    const fetchClientData = useCallback(async () => {
        if (!isAuthenticated) { setMainUserData(initialMainUserDataMock); return; }
        try {
            const response = await apiClient.get('/auth/client/me');
            if (response.data?.status === 'success' && response.data?.data?.client) {
                const client = response.data.data.client;
                const clientDetails = {
                    id: client.id, name: client.name || 'Nome não definido',
                    email: client.email || 'Email não definido', phone: client.phone || 'Telefone não definido',
                };
                setMainUserData(clientDetails);
                localStorage.setItem('userData', JSON.stringify(clientDetails));
            } else { setMainUserData(initialMainUserDataMock); }
        } catch (error) { setMainUserData(initialMainUserDataMock); }
    }, [isAuthenticated]);

    const fetchSharedAccesses = useCallback(async () => {
        if (!isAuthenticated) { setSharedUsers([]); setLoadingSharedUsers(false); return; }
        setLoadingSharedUsers(true);
        try {
            const response = await apiClient.get('/shared-access/my-shares');
            setSharedUsers(response.data?.sharedAccesses || []);
        } catch (error) { setSharedUsers([]); } finally { setLoadingSharedUsers(false); }
    }, [isAuthenticated]);

    const fetchGoogleSyncStatus = useCallback(async () => {
        if (!isAuthenticated) { setGoogleSyncStatus(null); setLoadingGoogleStatus(false); return; }
        setLoadingGoogleStatus(true);
        try {
            const response = await apiClient.get('/auth/google/status');
            if (response.data?.status === 'success') {
                setGoogleSyncStatus(response.data.data);
                googleColorsForm.setFieldsValue({
                    googleCalendarColorIdPF: response.data.data.colorIdPF || '1',
                    googleCalendarColorIdPJ: response.data.data.colorIdPJ || '2',
                });
            } else { setGoogleSyncStatus(null); }
        } catch (error) { setGoogleSyncStatus(null); } finally { setLoadingGoogleStatus(false); }
    }, [isAuthenticated, googleColorsForm]);

    const fetchAvailabilityRules = useCallback(async () => {
        if (!currentProfile?.id || (currentProfileType !== 'PJ' && currentProfileType !== 'MEI')) {
            setAvailabilityRules([]);
            scheduleForm.resetFields();
            return;
        }
        setLoadingSchedule(true);
        try {
            const response = await apiClient.get(`/availability/${currentProfile.id}`);
            const rules = response.data.data || [];
            setAvailabilityRules(rules);

            const workRule = rules.find(r => r.type === 'work');
            const breakRule = rules.find(r => r.type === 'break');
            
            let workingDays = [];
            if (workRule && workRule.rrule) {
                const rruleObj = RRule.fromString(workRule.rrule);
                workingDays = rruleObj.options.byweekday.map(dayIndex => rruleToFormMap[Object.keys(rruleToFormMap)[dayIndex]]);
            }

            scheduleForm.setFieldsValue({
                workingDays: workingDays,
                startTime: workRule?.startTime ? moment(workRule.startTime, 'HH:mm:ss') : null,
                endTime: workRule?.endTime ? moment(workRule.endTime, 'HH:mm:ss') : null,
                breakStartTime: breakRule?.startTime ? moment(breakRule.startTime, 'HH:mm:ss') : null,
                breakEndTime: breakRule?.endTime ? moment(breakRule.endTime, 'HH:mm:ss') : null,
            });

        } catch (error) {
            console.error("Erro ao buscar regras de disponibilidade:", error);
            setAvailabilityRules([]);
            scheduleForm.resetFields();
        } finally {
            setLoadingSchedule(false);
        }
    }, [currentProfile, currentProfileType, scheduleForm]);

    useEffect(() => {
        if (isAuthenticated && !loadingProfiles) {
            fetchClientData();
            fetchSharedAccesses();
            fetchGoogleSyncStatus();
            if (currentProfile) {
                fetchAvailabilityRules();
            }
        } else if (!isAuthenticated && !loadingProfiles) {
            setMainUserData(initialMainUserDataMock);
            setSharedUsers([]);
            setGoogleSyncStatus(null);
            setAvailabilityRules([]);
        }
    }, [isAuthenticated, loadingProfiles, currentProfile, fetchClientData, fetchSharedAccesses, fetchGoogleSyncStatus, fetchAvailabilityRules]);
    
    // <<< BLOCO DE FUNÇÕES RESTAURADO >>>
    const showEditInfoModal = () => {
        editInfoForm.setFieldsValue({
            name: mainUserData.name, email: mainUserData.email, phone: mainUserData.phone,
            currentPassword: '', newPassword: '', confirmNewPassword: '',
        });
        setIsEditInfoModalVisible(true);
    };
    const handleEditInfoCancel = () => { setIsEditInfoModalVisible(false); editInfoForm.resetFields(); };
    // <<< FIM DO BLOCO RESTAURADO >>>

    const handleEditInfoFinish = async (values) => {
        setIsSavingInfo(true);
        const payload = { name: values.name, email: values.email, phone: values.phone };
        if (values.newPassword) {
            if (!values.currentPassword) {
                message.error('Insira sua senha atual para alterar a senha.'); setIsSavingInfo(false); return;
            }
            payload.password = values.currentPassword; payload.newPassword = values.newPassword;
        } else if (values.currentPassword && (values.email !== mainUserData.email || values.name !== mainUserData.name || values.phone !== mainUserData.phone)) {
            payload.password = values.currentPassword;
        }
        try {
            const response = await apiClient.put('/auth/client/me/update-profile', payload);
            if (response.data?.status === 'success') {
                const updatedClientData = response.data.data.client;
                setMainUserData(prev => ({ ...prev, ...updatedClientData }));
                localStorage.setItem('userData', JSON.stringify(updatedClientData));
                message.success('Informações atualizadas!'); setIsEditInfoModalVisible(false);
                if (values.newPassword) message.info('Sua senha foi alterada.');
            }
        } catch (error) { /* Interceptor trata */ } finally { setIsSavingInfo(false); }
    };

    const showAccessModal = (user = null) => {
        setEditingAccessUser(user);
        if (user) {
            accessForm.setFieldsValue({
                sharedAccessPhone: user.sharedAccessPhone,
                canAccessPersonalProfile: user.canAccessPersonalProfile,
                canAccessBusinessProfileId: user.canAccessBusinessProfileId || null,
            });
        } else {
            accessForm.resetFields();
            accessForm.setFieldsValue({
                canAccessPersonalProfile: true,
                canAccessBusinessProfileId: null,
            });
        }
        setIsAccessModalVisible(true);
    };

    const handleAccessModalCancel = () => {
        setIsAccessModalVisible(false);
        setEditingAccessUser(null);
        accessForm.resetFields();
    };

    const onAccessFormFinish = async (values) => {
        setIsSavingAccess(true);
        
        const {
            sharedAccessPhone,
            sharedAccessPassword,
            canAccessPersonalProfile,
            canAccessBusinessProfileId,
        } = values;

        if (!canAccessPersonalProfile && !canAccessBusinessProfileId) {
            message.error('Selecione pelo menos um perfil (Pessoal ou Empresarial) para compartilhar.');
            setIsSavingAccess(false);
            return;
        }

        const payload = {
            sharedAccessPhone,
            sharedAccessPassword,
            canAccessPersonalProfile: !!canAccessPersonalProfile,
            canAccessBusinessProfileId: canAccessBusinessProfileId || null,
        };
        
        if (editingAccessUser && !payload.sharedAccessPassword) {
            delete payload.sharedAccessPassword;
        }

        try {
            if (editingAccessUser) {
                await apiClient.put(`/shared-access/my-shares/${editingAccessUser.id}`, payload);
                message.success(`Acesso para o telefone "${sharedAccessPhone}" foi atualizado!`);
            } else {
                await apiClient.post('/shared-access/grant', payload);
                message.success(`Acesso concedido para o telefone "${sharedAccessPhone}"!`);
            }
            fetchSharedAccesses();
            handleAccessModalCancel();
        } catch (error) {
            // O interceptor de erro do apiClient já deve mostrar a mensagem
        } finally {
            setIsSavingAccess(false);
        }
    };
    
    const handleDeleteAccessUser = async (sharedAccessId, userName) => {
        try {
            await apiClient.delete(`/shared-access/my-shares/${sharedAccessId}`);
            message.warn(`Acesso de "${userName}" removido.`); fetchSharedAccesses();
        } catch (error) { /* Interceptor */ }
    };
    const getProfileAccessTypeLabel = (accessRecord) => {
        const labels = [];
        if (accessRecord.canAccessPersonalProfile) labels.push(<Space key="pf-label"><CreditCardOutlined /> Pessoal</Space>);
        if (accessRecord.canAccessBusinessProfileId && accessRecord.accessibleBusinessProfile) {
            labels.push(<Space key={`biz-label-${accessRecord.accessibleBusinessProfile.id}`}><ShopOutlined /> {accessRecord.accessibleBusinessProfile.accountName} ({accessRecord.accessibleBusinessProfile.accountType})</Space>);
        } else if (accessRecord.canAccessBusinessProfileId && !accessRecord.accessibleBusinessProfile) {
            labels.push(<Space key="biz-deleted-label" style={{color: 'var(--ant-error-color)'}}><ShopOutlined /> Perfil Empresarial (Indisponível)</Space>);
        }
        if (labels.length === 0) return <Text type="secondary">Nenhum perfil</Text>;
        return labels.map((label, index) => <span key={index}>{label}{index < labels.length - 1 && ", "}</span>);
    };
    const handleConnectGoogle = async () => {
        setLoadingGoogleStatus(true);
        try {
            const response = await apiClient.get('/auth/google/connect');
            if (response.data?.data?.authorizationUrl) {
                const newWindow = window.open(response.data.data.authorizationUrl, '_blank', 'width=600,height=700');
                if (newWindow) {
                    const timer = setInterval(() => {
                        if (newWindow.closed) {
                            clearInterval(timer); message.info('Verificando conexão com Google...', 2);
                            setTimeout(fetchGoogleSyncStatus, 1500);
                        }
                    }, 1000);
                } else {
                    message.error("Não foi possível abrir a janela de autenticação do Google. Verifique bloqueadores de pop-up.");
                    setLoadingGoogleStatus(false);
                }
            } else {
                message.error("Não foi possível obter a URL de autorização do Google."); setLoadingGoogleStatus(false);
            }
        } catch (error) { setLoadingGoogleStatus(false); }
    };
    const handleDisconnectGoogle = async () => {
        Modal.confirm({
            title: 'Desconectar Google Agenda?',
            content: 'Isso removerá a sincronização e o acesso à sua agenda. Agendamentos existentes não serão afetados.',
            okText: 'Sim, Desconectar', okType: 'danger', cancelText: 'Não', className: 'modal-confirm-map',
            onOk: async () => {
                setLoadingGoogleStatus(true);
                try { await apiClient.post('/auth/google/disconnect'); message.success("Google Calendar desconectado."); fetchGoogleSyncStatus(); }
                catch (error) { /* Interceptor */ }
            },
        });
    };
    const handleSaveGoogleColors = async (values) => {
        setIsSavingGoogleColors(true);
        try {
            await apiClient.put('/auth/client/me/calendar-preferences', {
                googleCalendarColorIdPF: values.googleCalendarColorIdPF,
                googleCalendarColorIdPJ: values.googleCalendarColorIdPJ,
            });
            message.success("Cores para o Google Agenda salvas!"); fetchGoogleSyncStatus();
        } catch (error) { /* Interceptor */ } finally { setIsSavingGoogleColors(false); }
    };
    const renderColorOption = (color) => (
        <Option key={color.id} value={color.id} label={color.name}>
            <Space><span style={{ display: 'inline-block', width: 16, height: 16, backgroundColor: color.hex, borderRadius: '3px', border: '1px solid #ccc' }} />{color.name}</Space>
        </Option>
    );
    const handleSaveSchedule = async (values) => {
        if (!currentProfile?.id) return;
        setIsSavingSchedule(true);

        try {
            const oldRulesToDelete = availabilityRules.filter(r => r.type === 'work' || r.type === 'break');
            if (oldRulesToDelete.length > 0) {
                await Promise.all(
                    oldRulesToDelete.map(rule => apiClient.delete(`/availability/${currentProfile.id}/${rule.id}`))
                );
            }

            if (values.workingDays && values.workingDays.length > 0 && values.startTime && values.endTime) {
                const workRRule = new RRule({
                    freq: RRule.WEEKLY,
                    byweekday: values.workingDays.map(day => daysOfWeekMap[day]),
                }).toString();

                const workPayload = {
                    type: 'work',
                    title: 'Horário de Trabalho',
                    rrule: workRRule,
                    startTime: values.startTime.format('HH:mm:ss'),
                    endTime: values.endTime.format('HH:mm:ss'),
                };
                await apiClient.post(`/availability/${currentProfile.id}`, workPayload);
            }

            if (values.breakStartTime && values.breakEndTime && values.workingDays && values.workingDays.length > 0) {
                const breakRRule = new RRule({
                    freq: RRule.WEEKLY,
                    byweekday: values.workingDays.map(day => daysOfWeekMap[day]),
                }).toString();

                const breakPayload = {
                    type: 'break',
                    title: 'Pausa/Almoço',
                    rrule: breakRRule,
                    startTime: values.breakStartTime.format('HH:mm:ss'),
                    endTime: values.breakEndTime.format('HH:mm:ss'),
                };
                await apiClient.post(`/availability/${currentProfile.id}`, breakPayload);
            }

            message.success('Jornada de trabalho salva com sucesso!');
            fetchAvailabilityRules();

        } catch (error) {
            console.error("Erro ao salvar jornada de trabalho:", error);
            message.error("Não foi possível salvar a jornada de trabalho. Tente novamente.");
        } finally {
            setIsSavingSchedule(false);
        }
    };
    const handleAddDayOff = async (values) => {
        if (!currentProfile?.id) return;
        setIsSavingDayOff(true);
        const payload = {
            type: 'day_off',
            title: values.description || 'Folga',
            specificDate: values.date.format('YYYY-MM-DD'),
        };
        try {
            await apiClient.post(`/availability/${currentProfile.id}`, payload);
            message.success('Dia de folga adicionado!');
            setIsDayOffModalVisible(false);
            dayOffForm.resetFields();
            fetchAvailabilityRules();
        } catch (error) {
            console.error("Erro ao adicionar dia de folga:", error);
        } finally {
            setIsSavingDayOff(false);
        }
    };
    const handleDeleteDayOff = async (ruleId) => {
        if (!currentProfile?.id) return;
        try {
            await apiClient.delete(`/availability/${currentProfile.id}/${ruleId}`);
            message.warn('Dia de folga removido.');
            fetchAvailabilityRules();
        } catch (error) {
            console.error("Erro ao remover dia de folga:", error);
        }
    };
    
    if (loadingProfiles && !isAuthenticated) return <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" tip="Verificando..." /></Content>;
    if (!isAuthenticated && !loadingProfiles) return <Content style={{ padding: 50, textAlign: 'center' }}><Title level={3}>Acesso Negado</Title><Paragraph>Faça login para continuar.</Paragraph><Button type="primary" href="/login">Login</Button></Content>;
    if (loadingProfiles || (!mainUserData.id && isAuthenticated)) {
        return (<Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}><Spin size="large" tip="Carregando..." /></Content>);
    }

    const daysOffData = availabilityRules.filter(r => r.type === 'day_off');
    
    const isScheduleTabDisabled = currentProfileType !== 'PJ' && currentProfileType !== 'MEI';
    const scheduleTabTitle = (
        <span><ScheduleOutlined /> Horários e Disponibilidade</span>
    );
    const scheduleTab = isScheduleTabDisabled ? (
        <Tooltip title="Disponível apenas para perfis de negócio (PJ/MEI)">
            {scheduleTabTitle}
        </Tooltip>
    ) : scheduleTabTitle;


    return (
        <Content className="page-content-wrapper configuracoes-content">
            <Title level={2} className="page-title-custom configuracoes-title"><SettingOutlined className="title-icon-config" /> Configurações</Title>
            <Paragraph type="secondary" className="page-subtitle-config">
                Gerencie sua conta, acessos compartilhados e integrações.
                {currentProfileName && <> Perfil ativo: <Text strong>{currentProfileName}</Text>.</>}
            </Paragraph>

            <Tabs defaultActiveKey="1" type="card" className="configuracoes-tabs">
                 <TabPane tab={<span><UserOutlined /> Minha Conta</span>} key="1" className="tab-pane-minha-conta">
                    <Card title="Informações da Conta Principal" bordered={false} className="config-card animated-card"
                        extra={<Button type="link" icon={<EditOutlined />} onClick={showEditInfoModal} className="edit-personal-info-btn">Editar</Button>}
                    >
                        <Row gutter={[16, 24]}>
                            <Col xs={24} sm={12}><Text strong>Nome:</Text> <br /><Text>{mainUserData.name}</Text></Col>
                            <Col xs={24} sm={12}><Text strong>Email de Acesso:</Text> <br /><Text>{mainUserData.email}</Text></Col>
                            <Col xs={24} sm={12}><Text strong>Telefone Principal (WhatsApp):</Text> <br /><Text>{mainUserData.phone}</Text></Col>
                        </Row>
                        <Divider />
                        <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '15px' }}>
                            Estes são seus dados de acesso à plataforma e interação via WhatsApp.
                        </Paragraph>
                    </Card>
                </TabPane>
                <TabPane tab={<span><ShareAltOutlined /> Acesso Compartilhado</span>} key="2" className="tab-pane-acesso-compartilhado">
                    <Card title="Gerenciar Acessos Concedidos" bordered={false} className="config-card animated-card" style={{ animationDelay: '0.1s' }}
                        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => showAccessModal()} className="add-access-btn">Conceder Acesso</Button>}
                    >
                        <Paragraph type="secondary" style={{ marginBottom: '20px' }}>
                            Permita que outros usuários acessem seus perfis financeiros através do WhatsApp e da plataforma.
                        </Paragraph>
                        {loadingSharedUsers ? <div style={{ textAlign: 'center', padding: '20px' }}><Spin tip="Carregando..." /></div> :
                            sharedUsers.length > 0 ? (
                                <List itemLayout="horizontal" dataSource={sharedUsers} className="shared-access-list"
                                    renderItem={sharedAccessRecord => (
                                        <List.Item
                                            actions={[
                                                <Tooltip title="Editar Permissões" key={`edit-${sharedAccessRecord.id}`}><Button type="text" icon={<EditOutlined />} onClick={() => showAccessModal(sharedAccessRecord)} className="list-action-btn edit" /></Tooltip>,
                                                <Popconfirm key={`delete-${sharedAccessRecord.id}`} title={`Remover acesso de "${sharedAccessRecord.sharedAccessPhone}"?`} onConfirm={() => handleDeleteAccessUser(sharedAccessRecord.id, sharedAccessRecord.sharedAccessPhone)} okText="Sim" cancelText="Não" okButtonProps={{ danger: true, className: 'popconfirm-delete-btn' }}><Tooltip title="Remover Acesso"><Button type="text" danger icon={<DeleteOutlined />} className="list-action-btn delete" /></Tooltip></Popconfirm>
                                            ]}>
                                            <List.Item.Meta
                                                avatar={<Avatar icon={<UserOutlined />} className="shared-user-avatar" />}
                                                title={<Text strong className="shared-user-name">{sharedAccessRecord.sharedAccessPhone}</Text>}
                                                description={<Space direction="vertical" size={2}> <Text type="secondary" className="profile-access-type-list">Perfis: <Text strong style={{ color: 'var(--map-laranja)' }}>{getProfileAccessTypeLabel(sharedAccessRecord)}</Text></Text> <Tag color={sharedAccessRecord.status === 'Ativo' ? 'success' : 'default'} icon={sharedAccessRecord.status === 'Ativo' ? <CheckCircleFilled /> : <CloseCircleFilled />}>Status: {sharedAccessRecord.status}</Tag> </Space>} />
                                        </List.Item>)} />
                            ) : (<Empty description="Nenhum acesso compartilhado." image={<UsergroupAddOutlined style={{ fontSize: '48px', color: 'var(--map-cinza-texto)' }} />} ><Button type="primary" icon={<PlusOutlined />} onClick={() => showAccessModal()} className="add-access-btn">Conceder Primeiro Acesso</Button></Empty>)}
                    </Card>
                </TabPane>
                <TabPane tab={<span><LinkOutlined /> Integrações</span>} key="3" className="tab-pane-integracoes">
                    <Card title={<Space><GoogleOutlined style={{ color: '#DB4437' }} /> Google Calendar</Space>} bordered={false} className="config-card animated-card" style={{ animationDelay: '0.2s' }}>
                        {loadingGoogleStatus && <div style={{ textAlign: 'center', padding: '20px' }}><Spin tip="Verificando status..." /></div>}
                        {!loadingGoogleStatus && googleSyncStatus && googleSyncStatus.isGoogleCalendarSynced && (
                            <>
                                <Alert message={<Text strong>Google Calendar Conectado!</Text>} description={<Space direction="vertical"> <Text>Sincronizando com: <Text code>{googleSyncStatus.googleCalendarIdPrincipal || 'Calendário Principal'}</Text>.</Text> {googleSyncStatus.googleChannelExpiryDate && <Text type="secondary" style={{ fontSize: '12px' }}> Notificações ativas até: {new Date(googleSyncStatus.googleChannelExpiryDate).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}. (Renovação automática)</Text>} </Space>} type="success" showIcon icon={<CheckCircleFilled />} style={{ marginBottom: 24 }} />
                                <Button type="primary" danger icon={<DisconnectOutlined />} onClick={handleDisconnectGoogle} loading={loadingGoogleStatus} className="google-disconnect-btn"> Desconectar Google Calendar </Button>
                                <Divider>Personalizar Cores dos Eventos</Divider>
                                <Paragraph type="secondary"> Cores para identificar agendamentos PF e PJ no Google Calendar. </Paragraph>
                                <Form form={googleColorsForm} layout="vertical" onFinish={handleSaveGoogleColors} initialValues={{ googleCalendarColorIdPF: googleSyncStatus.colorIdPF || '1', googleCalendarColorIdPJ: googleSyncStatus.colorIdPJ || '2', }}>
                                    <Row gutter={24}>
                                        <Col xs={24} sm={12}><Form.Item name="googleCalendarColorIdPF" label="Cor para Agendamentos Pessoais (PF)"><Select placeholder="Selecione uma cor" allowClear className="google-color-select"> {googleCalendarColors.map(renderColorOption)} </Select></Form.Item></Col>
                                        <Col xs={24} sm={12}><Form.Item name="googleCalendarColorIdPJ" label="Cor para Agendamentos Empresariais (PJ/MEI)"><Select placeholder="Selecione uma cor" allowClear className="google-color-select"> {googleCalendarColors.map(renderColorOption)} </Select></Form.Item></Col>
                                    </Row>
                                    <Form.Item style={{ marginTop: '10px' }}><Button type="primary" htmlType="submit" loading={isSavingGoogleColors} icon={<SaveOutlined />} className="save-google-colors-btn"> Salvar Cores </Button></Form.Item>
                                </Form>
                            </>
                        )}
                        {!loadingGoogleStatus && (!googleSyncStatus || !googleSyncStatus.isGoogleCalendarSynced) && (
                            <>
                                <Alert message="Google Calendar Não Conectado" description="Conecte sua conta Google para sincronizar seus agendamentos." type="info" showIcon icon={<InfoCircleOutlined />} style={{ marginBottom: 24 }} />
                                <Button type="primary" icon={<GoogleOutlined />} onClick={handleConnectGoogle} loading={loadingGoogleStatus} className="google-connect-btn"> Conectar com Google Calendar </Button>
                            </>
                        )}
                    </Card>
                </TabPane>
                <TabPane tab={scheduleTab} key="4" disabled={isScheduleTabDisabled}>
                    <Spin spinning={loadingSchedule} tip="Carregando configurações de horário...">
                        <Card title={`Disponibilidade para o perfil "${currentProfileName}"`} bordered={false} className="config-card animated-card" style={{ animationDelay: '0.3s' }}>
                            {(currentProfileType !== 'PJ' && currentProfileType !== 'MEI') ? (
                                <Empty description="Selecione um perfil de negócio (PJ ou MEI) para configurar os horários." />
                            ) : (
                                <Form form={scheduleForm} layout="vertical" onFinish={handleSaveSchedule}>
                                    <Title level={5} style={{ color: 'var(--map-preto)' }}>Jornada de Trabalho Padrão</Title>
                                    <Paragraph type="secondary">Defina os dias e horários que você geralmente está disponível para agendamentos.</Paragraph>
                                    
                                    <Form.Item name="workingDays" label="Dias da Semana de Trabalho">
                                        <Checkbox.Group options={daysOfWeekOptions} />
                                    </Form.Item>

                                    <Row gutter={24}>
                                        <Col xs={24} sm={12}><Form.Item name="startTime" label="Início do Expediente" rules={[{ required: !!scheduleForm.getFieldValue('workingDays')?.length, message: 'Obrigatório se houver dias de trabalho' }]}><TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Ex: 09:00" minuteStep={15} /></Form.Item></Col>
                                        <Col xs={24} sm={12}><Form.Item name="endTime" label="Fim do Expediente" rules={[{ required: !!scheduleForm.getFieldValue('workingDays')?.length, message: 'Obrigatório se houver dias de trabalho' }]}><TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Ex: 18:00" minuteStep={15} /></Form.Item></Col>
                                    </Row>

                                    <Row gutter={24}>
                                        <Col xs={24} sm={12}><Form.Item name="breakStartTime" label="Início da Pausa (Opcional)"><TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Ex: 12:00" minuteStep={15} /></Form.Item></Col>
                                        <Col xs={24} sm={12}><Form.Item name="breakEndTime" label="Fim da Pausa (Opcional)"><TimePicker format="HH:mm" style={{ width: '100%' }} placeholder="Ex: 13:00" minuteStep={15} /></Form.Item></Col>
                                    </Row>

                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSavingSchedule} className="save-schedule-btn">
                                            Salvar Jornada de Trabalho
                                        </Button>
                                    </Form.Item>

                                    <Divider />

                                    <Title level={5} style={{ color: 'var(--map-preto)' }}>Folgas e Feriados Específicos</Title>
                                    <Paragraph type="secondary">Adicione dias específicos em que você não estará disponível (ex: feriados, férias).</Paragraph>
                                    
                                    <List
                                        className="days-off-list"
                                        itemLayout="horizontal"
                                        dataSource={daysOffData}
                                        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nenhum dia de folga cadastrado." /> }}
                                        renderItem={item => (
                                            <List.Item
                                                actions={[
                                                    <Popconfirm title="Remover esta folga?" onConfirm={() => handleDeleteDayOff(item.id)} okText="Sim" cancelText="Não">
                                                        <Tooltip title="Remover Folga"><Button type="text" danger icon={<DeleteOutlined />} /></Tooltip>
                                                    </Popconfirm>
                                                ]}
                                            >
                                                <List.Item.Meta
                                                    avatar={<CalendarOutlined style={{ fontSize: '20px', color: 'var(--map-laranja-escuro)' }} />}
                                                    title={<Text strong>{moment(item.specificDate).format('dddd, DD [de] MMMM [de] YYYY')}</Text>}
                                                    description={item.title || 'Folga'}
                                                />
                                            </List.Item>
                                        )}
                                    />
                                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => setIsDayOffModalVisible(true)} style={{ marginTop: '16px' }}>
                                        Adicionar Dia de Folga
                                    </Button>
                                </Form>
                            )}
                        </Card>
                    </Spin>
                </TabPane>
            </Tabs>
            
            <Modal title={<Space><IdcardOutlined /> Editar Minhas Informações</Space>} open={isEditInfoModalVisible} onCancel={handleEditInfoCancel} footer={null} destroyOnClose width={600} className="edit-info-modal modal-style-map">
                <Form form={editInfoForm} layout="vertical" onFinish={handleEditInfoFinish}>
                    <Form.Item name="name" label="Nome Completo" rules={[{ required: true, message: 'Insira seu nome!' }]}><Input prefix={<UserOutlined />} /></Form.Item>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}><Form.Item name="email" label="Email Principal" rules={[{ required: true, message: 'Insira seu email!' }, { type: 'email', message: 'Email inválido!' }]}><Input prefix={<MailOutlined />} /></Form.Item></Col>
                        <Col xs={24} sm={12}><Form.Item name="phone" label="Telefone Principal (WhatsApp)" rules={[{ required: true, message: 'Insira seu telefone!' }]}><Input prefix={<PhoneOutlined />} /></Form.Item></Col>
                    </Row>
                    <Paragraph type="secondary" style={{ fontSize: '13px', margin: '15px 0' }}>Para alterar seus dados ou senha, insira sua senha atual.</Paragraph>
                    <Form.Item name="currentPassword" label="Senha Atual (para confirmar alterações)"><Input.Password prefix={<LockOutlined />} /></Form.Item>
                    <Divider>Alterar Senha (Opcional)</Divider>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}><Form.Item name="newPassword" label="Nova Senha" rules={[{ min: 6, message: 'Mínimo 6 caracteres.' }]} hasFeedback><Input.Password prefix={<LockOutlined />} /></Form.Item></Col>
                        <Col xs={24} sm={12}><Form.Item name="confirmNewPassword" label="Confirmar Nova Senha" dependencies={['newPassword']} hasFeedback rules={[({ getFieldValue }) => ({ validator(_, value) { if (!value && !getFieldValue('newPassword')) return Promise.resolve(); if (getFieldValue('newPassword') && !value) return Promise.reject(new Error('Confirme a nova senha!')); if (value && !getFieldValue('newPassword')) return Promise.reject(new Error('Preencha "Nova Senha" primeiro!')); if (getFieldValue('newPassword') === value) return Promise.resolve(); return Promise.reject(new Error('As senhas não coincidem!')); }, }),]}><Input.Password prefix={<LockOutlined />} /></Form.Item></Col>
                    </Row>
                    <Form.Item className="form-action-buttons"><Button onClick={handleEditInfoCancel} className="cancel-btn-form" disabled={isSavingInfo}>Cancelar</Button><Button type="primary" htmlType="submit" className="submit-btn-form" loading={isSavingInfo}>Salvar</Button></Form.Item>
                </Form>
            </Modal>

            <Modal
                title={<Space><ShareAltOutlined />{editingAccessUser ? "Editar Acesso Concedido" : "Conceder Novo Acesso"}</Space>}
                open={isAccessModalVisible}
                onCancel={handleAccessModalCancel}
                footer={null}
                destroyOnClose
                width={600}
                className="access-modal modal-style-map"
            >
                <Form form={accessForm} layout="vertical" onFinish={onAccessFormFinish} disabled={isSavingAccess}>
                    <Title level={5} style={{ color: "var(--header-text-secondary)" }}>Dados do Convidado</Title>
                    <Paragraph type="secondary" style={{ fontSize: '12px', marginBottom: '15px' }}>
                        O convidado usará o número de telefone para interagir via WhatsApp e a senha para acessar a plataforma web.
                    </Paragraph>

                    <Form.Item
                        name="sharedAccessPhone"
                        label="Telefone WhatsApp do Convidado"
                        rules={[{ required: true, message: 'O Telefone WhatsApp do convidado é obrigatório!' }]}
                    >
                        <Input
                            prefix={<WhatsAppOutlined />}
                            placeholder="Ex: 71982862912"
                            disabled={!!editingAccessUser}
                        />
                    </Form.Item>
                    {editingAccessUser &&
                        <Paragraph type="secondary" style={{ fontSize: '11px', marginTop: '-10px', marginBottom: '15px' }}>
                            <InfoCircleOutlined/> O telefone não pode ser alterado após o acesso ser criado. Para mudar o número, remova este acesso e crie um novo.
                        </Paragraph>
                    }
                    
                    <Form.Item
                        name="sharedAccessPassword"
                        label={editingAccessUser ? "Nova Senha (deixe em branco para não alterar)" : "Senha para o Convidado"}
                        rules={editingAccessUser ? [{ min: 6, message: "Mínimo 6 caracteres." }] : [{ required: true, message: 'Senha é obrigatória!' }, { min: 6, message: "Mínimo 6 caracteres." }]}
                        hasFeedback={!editingAccessUser || !!accessForm.getFieldValue('sharedAccessPassword')}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Crie uma senha segura"/>
                    </Form.Item>

                    <Divider className="form-divider">Permissões de Acesso</Divider>
                    <Paragraph type="secondary" style={{ fontSize: '12px', marginBottom: '15px' }}>
                        Selecione quais dos SEUS perfis este convidado poderá visualizar e gerenciar.
                    </Paragraph>

                    <Form.Item name="canAccessPersonalProfile" valuePropName="checked">
                        <Checkbox><CreditCardOutlined /> Acesso ao Perfil Pessoal (PF)</Checkbox>
                    </Form.Item>
                    
                    {ownerHasBusinessProfile && (
                        <Form.Item name="canAccessBusinessProfileId" label="Acesso ao Perfil Empresarial">
                            <Select placeholder="Selecione um perfil empresarial ou nenhum" allowClear>
                                {businessProfiles.map(profile => (
                                    <Option key={profile.id} value={profile.id}>
                                        <ShopOutlined /> {profile.name} ({profile.type})
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}
                    
                    <Form.Item className="form-action-buttons">
                        <Button onClick={handleAccessModalCancel} className="cancel-btn-form" disabled={isSavingAccess}>Cancelar</Button>
                        <Button type="primary" htmlType="submit" className="submit-btn-form" loading={isSavingAccess}>
                            {editingAccessUser ? "Salvar Alterações" : "Conceder Acesso"}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={<Space><CalendarOutlined /> Adicionar Dia de Folga/Feriado</Space>}
                open={isDayOffModalVisible}
                onCancel={() => setIsDayOffModalVisible(false)}
                footer={null}
                destroyOnClose
                className="day-off-modal modal-style-map"
            >
                <Form form={dayOffForm} layout="vertical" onFinish={handleAddDayOff}>
                    <Form.Item name="date" label="Data da Folga" rules={[{ required: true, message: 'Selecione a data!' }]}>
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Selecione o dia" />
                    </Form.Item>
                    <Form.Item name="description" label="Descrição (Opcional)">
                        <Input placeholder="Ex: Feriado Nacional, Férias" />
                    </Form.Item>
                    <Form.Item className="form-action-buttons">
                        <Button onClick={() => setIsDayOffModalVisible(false)} className="cancel-btn-form" disabled={isSavingDayOff}>Cancelar</Button>
                        <Button type="primary" htmlType="submit" className="submit-btn-form" loading={isSavingDayOff}>Adicionar Folga</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </Content>
    );
};

export default ConfiguracoesPage;