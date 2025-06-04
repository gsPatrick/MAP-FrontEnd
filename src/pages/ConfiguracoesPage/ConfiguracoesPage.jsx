// src/pages/ConfiguracoesPage/ConfiguracoesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Typography, Card, Form, Input, Button, Tabs, Row, Col,
  Modal, List, Avatar, Space, Tooltip, Popconfirm, message, Radio, Divider, Empty, Spin, Select, Tag, Alert
} from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, ShareAltOutlined, SettingOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined, UsergroupAddOutlined,
  CreditCardOutlined, ShopOutlined, IdcardOutlined, ProfileOutlined, WhatsAppOutlined,
  GoogleOutlined, LinkOutlined, DisconnectOutlined, SyncOutlined, CheckCircleFilled, CloseCircleFilled, StopOutlined, SaveOutlined, InfoCircleOutlined // Trocado PaletteOutlined por SaveOutlined
} from '@ant-design/icons';

import { useProfile } from '../../contexts/ProfileContext';
import HeaderPanel from '../../componentsPanel/HeaderPanel/HeaderPanel';
import SidebarPanel from '../../componentsPanel/SidebarPanel/SidebarPanel';
import apiClient from '../../services/api';

import './ConfiguracoesPage.css';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const initialMainUserDataMock = {
  id: null, name: 'Carregando...', email: 'Carregando...', phone: 'Carregando...',
};

const googleCalendarColors = [
  { id: '1', name: 'Azul Lavanda', hex: '#7986cb' }, { id: '2', name: 'Verde Sálvia', hex: '#33b679' },
  { id: '3', name: 'Uva', hex: '#8e24aa' }, { id: '4', name: 'Flamingo', hex: '#e67c73' },
  { id: '5', name: 'Banana', hex: '#f6c026' }, { id: '6', name: 'Tangerina', hex: '#f5511d' },
  { id: '7', name: 'Pavão', hex: '#039be5' }, { id: '8', name: 'Grafite', hex: '#616161' },
  { id: '9', name: 'Mirtilo', hex: '#3f51b5' }, { id: '10', name: 'Manjericão', hex: '#0b8043' },
  { id: '11', name: 'Tomate', hex: '#d60000' },
];

const ConfiguracoesPage = () => {
  const { currentProfile, currentProfileType, currentProfileName, fetchUserProfiles, userProfiles, isAuthenticated, loadingProfiles } = useProfile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
  
  // Este estado não é mais necessário para o Select, mas pode ser útil para lógica interna se houver
  const [ownerHasBusinessProfile, setOwnerHasBusinessProfile] = useState(false);

  const [googleSyncStatus, setGoogleSyncStatus] = useState(null);
  const [loadingGoogleStatus, setLoadingGoogleStatus] = useState(false);
  const [isSavingGoogleColors, setIsSavingGoogleColors] = useState(false);
  const [googleColorsForm] = Form.useForm();

  const userNameForHeader = mainUserData?.name?.split(" ")[0] || "Usuário";

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

  useEffect(() => {
    if (isAuthenticated && !loadingProfiles) {
      fetchClientData();
      fetchSharedAccesses();
      fetchGoogleSyncStatus();
    } else if (!isAuthenticated && !loadingProfiles) {
      setMainUserData(initialMainUserDataMock); setSharedUsers([]); setGoogleSyncStatus(null);
      setLoadingSharedUsers(false); setLoadingGoogleStatus(false);
    }
  }, [isAuthenticated, loadingProfiles, fetchClientData, fetchSharedAccesses, fetchGoogleSyncStatus]);

  useEffect(() => {
    // Verifica se o usuário dono (o que está logado) possui algum perfil PJ/MEI
    if (userProfiles && userProfiles.length > 0) {
      const hasBiz = userProfiles.some(p => p.type === 'PJ' || p.type === 'MEI');
      setOwnerHasBusinessProfile(hasBiz);
    } else {
      setOwnerHasBusinessProfile(false);
    }
  }, [userProfiles]);

  const showEditInfoModal = () => {
    editInfoForm.setFieldsValue({
      name: mainUserData.name, email: mainUserData.email, phone: mainUserData.phone,
      currentPassword: '', newPassword: '', confirmNewPassword: '',
    });
    setIsEditInfoModalVisible(true);
  };
  const handleEditInfoCancel = () => { setIsEditInfoModalVisible(false); editInfoForm.resetFields(); };
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
        if (values.name !== mainUserData.name) { /* Potencialmente atualizar header */ }
        if (values.newPassword) message.info('Sua senha foi alterada.');
      }
    } catch (error) { /* Interceptor trata */ } finally { setIsSavingInfo(false); }
  };

  const showAccessModal = (user = null) => {
    setEditingAccessUser(user);
    if (user) {
      let accessType = 'Nenhum';
      if (user.canAccessPersonalProfile && user.canAccessBusinessProfileId) accessType = 'Ambos';
      else if (user.canAccessPersonalProfile) accessType = 'PF';
      else if (user.canAccessBusinessProfileId) accessType = 'PJ';
      
      accessForm.setFieldsValue({
        sharedWithClientName: user.sharedWithClientName,
        sharedAccessEmail: user.sharedAccessEmail,
        sharedAccessPhone: user.sharedAccessPhone,
        accessType: accessType,
      });
    } else {
      accessForm.resetFields();
      accessForm.setFieldsValue({ accessType: 'Nenhum' });
    }
    setIsAccessModalVisible(true);
  };
  const handleAccessModalCancel = () => {
    setIsAccessModalVisible(false); setEditingAccessUser(null); accessForm.resetFields();
  };

  const onAccessFormFinish = async (values) => {
    setIsSavingAccess(true);
    let canAccessPersonalProfile = false;
    // Se o tipo de acesso selecionado permite acesso empresarial, e o dono TEM um perfil empresarial,
    // o backend associará ao ID do perfil empresarial do dono.
    // O frontend não precisa mais enviar canAccessBusinessProfileId.
    let attemptBusinessAccess = false;

    if (values.accessType === 'PF' || values.accessType === 'Ambos') {
      canAccessPersonalProfile = true;
    }
    if (values.accessType === 'PJ' || values.accessType === 'Ambos') {
      if (!ownerHasBusinessProfile) {
        message.warn('Você não possui um perfil empresarial (PJ/MEI) para compartilhar. Acesso empresarial não será concedido.');
        // Não define attemptBusinessAccess = true, o backend ignorará
      } else {
        attemptBusinessAccess = true;
      }
    }

    if (values.accessType === 'Nenhum' || (!canAccessPersonalProfile && !attemptBusinessAccess)) {
      message.error('Selecione pelo menos um tipo de perfil (Pessoal ou Empresarial) para compartilhar.');
      setIsSavingAccess(false); return;
    }

    const payload = {
      sharedAccessEmail: values.sharedAccessEmail,
      sharedAccessPhone: values.sharedAccessPhone,
      sharedWithClientName: values.sharedWithClientName,
      sharedAccessPassword: values.sharedAccessPassword,
      canAccessPersonalProfile,
      // O backend determinará o canAccessBusinessProfileId se attemptBusinessAccess for true
      // e o owner tiver um perfil PJ/MEI.
      // Se você quiser ser explícito e seu backend aceitar um booleano para "tentar compartilhar empresarial":
      canAccessAnyBusinessProfile: attemptBusinessAccess,
    };
    // Se o backend espera um ID nulo ou o ID específico:
    // payload.canAccessBusinessProfileId = attemptBusinessAccess ? (ownerBusinessProfiles[0]?.id || null) : null;


    if (editingAccessUser && !values.sharedAccessPassword) delete payload.sharedAccessPassword;
    if (!payload.sharedAccessEmail && !payload.sharedAccessPhone) {
      message.error('Email ou Telefone WhatsApp é obrigatório para o acesso.'); setIsSavingAccess(false); return;
    }

    try {
      if (editingAccessUser) {
        await apiClient.put(`/shared-access/my-shares/${editingAccessUser.id}`, payload);
        message.success(`Acesso para "${values.sharedWithClientName || values.sharedAccessEmail}" atualizado!`);
      } else {
        await apiClient.post('/shared-access/grant', payload);
        message.success(`Acesso para "${values.sharedWithClientName || values.sharedAccessEmail}" concedido!`);
      }
      fetchSharedAccesses(); handleAccessModalCancel();
    } catch (error) { /* Interceptor */ } finally { setIsSavingAccess(false); }
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
    // Se `accessibleBusinessProfile` existir, significa que o acesso PJ foi concedido E o perfil existe.
    if (accessRecord.canAccessBusinessProfileId && accessRecord.accessibleBusinessProfile) {
        labels.push(<Space key={`biz-label-${accessRecord.accessibleBusinessProfile.id}`}><ShopOutlined /> {accessRecord.accessibleBusinessProfile.accountName} ({accessRecord.accessibleBusinessProfile.accountType})</Space>);
    } else if (accessRecord.canAccessBusinessProfileId && !accessRecord.accessibleBusinessProfile) {
        // Isso pode acontecer se o perfil PJ do dono foi deletado após o compartilhamento ser criado
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
        catch (error) { /* Interceptor */ } finally { /* setLoadingGoogleStatus(false); fetchGoogleSyncStatus já faz */ }
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

  if (loadingProfiles && !isAuthenticated) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" tip="Verificando..." /></div>;
  if (!isAuthenticated && !loadingProfiles) return <div style={{ padding: 50, textAlign: 'center' }}><Title level={3}>Acesso Negado</Title><Paragraph>Faça login para continuar.</Paragraph><Button type="primary" href="/login">Login</Button></div>;
  if (loadingProfiles || (!mainUserData.id && isAuthenticated)) {
     return (<Layout style={{ minHeight: '100vh' }}><SidebarPanel collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} selectedProfileType={currentProfileType} /><Layout className="site-layout" style={{ marginLeft: sidebarCollapsed ? 80 : 220 }}><HeaderPanel userName={userNameForHeader} /><Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}><Spin size="large" tip="Carregando..."/></Content></Layout></Layout>);
  }

  return (
    <Layout style={{ minHeight: '100vh' }} className="configuracoes-page-layout">
      <SidebarPanel collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} selectedProfileType={currentProfileType} />
      <Layout className="site-layout" style={{ marginLeft: sidebarCollapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <HeaderPanel userName={userNameForHeader} />
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
                <Row gutter={[16,24]}>
                    <Col xs={24} sm={12}><Text strong>Nome:</Text> <br/><Text>{mainUserData.name}</Text></Col>
                    <Col xs={24} sm={12}><Text strong>Email de Acesso:</Text> <br/><Text>{mainUserData.email}</Text></Col>
                    <Col xs={24} sm={12}><Text strong>Telefone Principal (WhatsApp):</Text> <br/><Text>{mainUserData.phone}</Text></Col>
                </Row>
                <Divider/>
                <Paragraph type="secondary" style={{fontSize: '12px', marginTop: '15px'}}>
                    Estes são seus dados de acesso à plataforma e interação via WhatsApp.
                </Paragraph>
              </Card>
            </TabPane>

            <TabPane tab={<span><ShareAltOutlined /> Acesso Compartilhado</span>} key="2" className="tab-pane-acesso-compartilhado">
                 <Card title="Gerenciar Acessos Concedidos" bordered={false} className="config-card animated-card" style={{animationDelay: '0.1s'}}
                    extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => showAccessModal()} className="add-access-btn">Conceder Acesso</Button>}
                 >
                    <Paragraph type="secondary" style={{marginBottom: '20px'}}>
                      Permita que outros usuários acessem seus perfis financeiros.
                    </Paragraph>
                    {loadingSharedUsers ? <div style={{textAlign: 'center', padding: '20px'}}><Spin tip="Carregando..."/></div> :
                    sharedUsers.length > 0 ? (
                      <List itemLayout="horizontal" dataSource={sharedUsers} className="shared-access-list"
                        renderItem={sharedAccessRecord => (
                          <List.Item
                            actions={[ /* ... ações de editar/deletar acesso ... */
                              <Tooltip title="Editar Permissões" key={`edit-${sharedAccessRecord.id}`}><Button type="text" icon={<EditOutlined />} onClick={() => showAccessModal(sharedAccessRecord)} className="list-action-btn edit" /></Tooltip>,
                              <Popconfirm key={`delete-${sharedAccessRecord.id}`} title={`Remover acesso de "${sharedAccessRecord.sharedWithClientName || sharedAccessRecord.sharedAccessEmail}"?`} onConfirm={() => handleDeleteAccessUser(sharedAccessRecord.id, sharedAccessRecord.sharedWithClientName || sharedAccessRecord.sharedAccessEmail)} okText="Sim" cancelText="Não" okButtonProps={{ danger: true, className: 'popconfirm-delete-btn' }}><Tooltip title="Remover Acesso"><Button type="text" danger icon={<DeleteOutlined />} className="list-action-btn delete" /></Tooltip></Popconfirm>
                            ]}>
                            <List.Item.Meta
                              avatar={<Avatar icon={<UserOutlined />} className="shared-user-avatar" />}
                              title={<Text strong className="shared-user-name">{sharedAccessRecord.sharedWithClientName || sharedAccessRecord.sharedAccessEmail || 'Convidado'}</Text>}
                              description={ <Space direction="vertical" size={2}> {sharedAccessRecord.sharedAccessEmail && <Text type="secondary" copyable={{text: sharedAccessRecord.sharedAccessEmail}}><MailOutlined /> {sharedAccessRecord.sharedAccessEmail}</Text>} {sharedAccessRecord.sharedAccessPhone && <Text type="secondary" copyable={{text: sharedAccessRecord.sharedAccessPhone}}><WhatsAppOutlined /> {sharedAccessRecord.sharedAccessPhone}</Text>} <Text type="secondary" className="profile-access-type-list">Perfis: <Text strong style={{ color: 'var(--map-laranja)' }}>{getProfileAccessTypeLabel(sharedAccessRecord)}</Text></Text> <Tag color={sharedAccessRecord.status === 'Ativo' ? 'success' : 'default'} icon={sharedAccessRecord.status === 'Ativo' ? <CheckCircleFilled /> : <CloseCircleFilled /> }>Status: {sharedAccessRecord.status}</Tag> </Space> } />
                          </List.Item>)} />
                    ) : ( <Empty description="Nenhum acesso compartilhado." image={<UsergroupAddOutlined style={{fontSize: '48px', color: 'var(--map-cinza-texto)'}}/>} ><Button type="primary" icon={<PlusOutlined />} onClick={() => showAccessModal()} className="add-access-btn">Conceder Primeiro Acesso</Button></Empty> )}
                 </Card>
            </TabPane>

            <TabPane tab={<span><LinkOutlined /> Integrações</span>} key="3" className="tab-pane-integracoes">
              <Card title={<Space><GoogleOutlined style={{color: '#DB4437'}} /> Google Calendar</Space>} bordered={false} className="config-card animated-card" style={{animationDelay: '0.2s'}}>
                {loadingGoogleStatus && <div style={{textAlign: 'center', padding:'20px'}}><Spin tip="Verificando status..." /></div>}
                {!loadingGoogleStatus && googleSyncStatus && googleSyncStatus.isGoogleCalendarSynced && (
                  <>
                    <Alert message={<Text strong>Google Calendar Conectado!</Text>} description={ <Space direction="vertical"> <Text>Sincronizando com: <Text code>{googleSyncStatus.googleCalendarIdPrincipal || 'Calendário Principal'}</Text>.</Text> {googleSyncStatus.googleChannelExpiryDate && <Text type="secondary" style={{fontSize: '12px'}}> Notificações ativas até: {new Date(googleSyncStatus.googleChannelExpiryDate).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}. (Renovação automática)</Text>} </Space> } type="success" showIcon icon={<CheckCircleFilled />} style={{ marginBottom: 24 }} />
                    <Button type="primary" danger icon={<DisconnectOutlined />} onClick={handleDisconnectGoogle} loading={loadingGoogleStatus} className="google-disconnect-btn"> Desconectar Google Calendar </Button>
                    <Divider>Personalizar Cores dos Eventos</Divider>
                    <Paragraph type="secondary"> Cores para identificar agendamentos PF e PJ no Google Calendar. </Paragraph>
                    <Form form={googleColorsForm} layout="vertical" onFinish={handleSaveGoogleColors} initialValues={{ googleCalendarColorIdPF: googleSyncStatus.colorIdPF || '1', googleCalendarColorIdPJ: googleSyncStatus.colorIdPJ || '2', }}>
                        <Row gutter={24}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="googleCalendarColorIdPF" label="Cor para Agendamentos Pessoais (PF)">
                                <Select placeholder="Selecione uma cor" allowClear className="google-color-select"> {googleCalendarColors.map(renderColorOption)} </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item name="googleCalendarColorIdPJ" label="Cor para Agendamentos Empresariais (PJ/MEI)">
                                <Select placeholder="Selecione uma cor" allowClear className="google-color-select"> {googleCalendarColors.map(renderColorOption)} </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item style={{marginTop: '10px'}}>
                        <Button type="primary" htmlType="submit" loading={isSavingGoogleColors} icon={<SaveOutlined />} className="save-google-colors-btn"> Salvar Cores </Button>
                        </Form.Item>
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
          </Tabs>

          <Modal title={<Space><IdcardOutlined /> Editar Minhas Informações</Space>} open={isEditInfoModalVisible} onCancel={handleEditInfoCancel} footer={null} destroyOnClose width={600} className="edit-info-modal modal-style-map">
            <Form form={editInfoForm} layout="vertical" onFinish={handleEditInfoFinish}>
              <Form.Item name="name" label="Nome Completo" rules={[{ required: true, message: 'Insira seu nome!' }]}><Input prefix={<UserOutlined />} /></Form.Item>
              <Row gutter={16}>
                <Col xs={24} sm={12}><Form.Item name="email" label="Email Principal" rules={[{ required: true, message: 'Insira seu email!' },{ type: 'email', message: 'Email inválido!' }]}><Input prefix={<MailOutlined />} /></Form.Item></Col>
                <Col xs={24} sm={12}><Form.Item name="phone" label="Telefone Principal (WhatsApp)" rules={[{ required: true, message: 'Insira seu telefone!' }]}><Input prefix={<PhoneOutlined />} /></Form.Item></Col>
              </Row>
              <Paragraph type="secondary" style={{fontSize: '13px', margin: '15px 0'}}>Para alterar seus dados ou senha, insira sua senha atual.</Paragraph>
              <Form.Item name="currentPassword" label="Senha Atual (para confirmar alterações)"><Input.Password prefix={<LockOutlined />} /></Form.Item>
              <Divider>Alterar Senha (Opcional)</Divider>
              <Row gutter={16}>
                <Col xs={24} sm={12}><Form.Item name="newPassword" label="Nova Senha" rules={[{ min: 6, message: 'Mínimo 6 caracteres.'}]} hasFeedback><Input.Password prefix={<LockOutlined />} /></Form.Item></Col>
                <Col xs={24} sm={12}><Form.Item name="confirmNewPassword" label="Confirmar Nova Senha" dependencies={['newPassword']} hasFeedback rules={[({ getFieldValue }) => ({ validator(_, value) { if (!value && !getFieldValue('newPassword')) return Promise.resolve(); if (getFieldValue('newPassword') && !value) return Promise.reject(new Error('Confirme a nova senha!')); if (value && !getFieldValue('newPassword')) return Promise.reject(new Error('Preencha "Nova Senha" primeiro!')); if (getFieldValue('newPassword') === value) return Promise.resolve(); return Promise.reject(new Error('As senhas não coincidem!')); },}),]}><Input.Password prefix={<LockOutlined />} /></Form.Item></Col>
              </Row>
              <Form.Item className="form-action-buttons"><Button onClick={handleEditInfoCancel} className="cancel-btn-form" disabled={isSavingInfo}>Cancelar</Button><Button type="primary" htmlType="submit" className="submit-btn-form" loading={isSavingInfo}>Salvar</Button></Form.Item>
            </Form>
          </Modal>

          <Modal title={<Space><ShareAltOutlined />{editingAccessUser ? "Editar Acesso Concedido" : "Conceder Novo Acesso"}</Space>} open={isAccessModalVisible} onCancel={handleAccessModalCancel} footer={null} destroyOnClose width={650} className="access-modal modal-style-map">
            <Form form={accessForm} layout="vertical" onFinish={onAccessFormFinish} disabled={isSavingAccess}>
              <Title level={5} style={{color: "var(--header-text-secondary)"}}>Credenciais para o Convidado</Title>
              <Paragraph type="secondary" style={{fontSize: '12px', marginBottom: '15px'}}>O convidado usará estas credenciais para acessar os perfis compartilhados.</Paragraph>
              <Form.Item name="sharedWithClientName" label="Apelido para o Convidado (Opcional)"><Input prefix={<UserOutlined />} placeholder="Ex: Contador João"/></Form.Item>
              <Row gutter={16}>
                <Col xs={24} sm={12}><Form.Item name="sharedAccessEmail" label="Email de Login do Convidado" rules={[{ type: 'email', message: 'Email inválido!' }, ({getFieldValue}) => ({ required: !getFieldValue('sharedAccessPhone'), message: 'Email ou Telefone é obrigatório!'}) ]}><Input prefix={<MailOutlined />} /></Form.Item></Col>
                <Col xs={24} sm={12}><Form.Item name="sharedAccessPhone" label="Telefone WhatsApp do Convidado" rules={[({getFieldValue}) => ({ required: !getFieldValue('sharedAccessEmail'), message: 'Email ou Telefone é obrigatório!'}) ]}><Input prefix={<WhatsAppOutlined />} /></Form.Item></Col>
              </Row>
              <Form.Item name="sharedAccessPassword" label={editingAccessUser ? "Nova Senha (deixe em branco para não alterar)" : "Senha para o Convidado"} rules={editingAccessUser ? [{min:6, message: "Mínimo 6 caracteres."}] : [{ required: true, message: 'Senha é obrigatória!' }, {min: 6, message: "Mínimo 6 caracteres."}]} hasFeedback={!editingAccessUser || !!accessForm.getFieldValue('sharedAccessPassword')}><Input.Password prefix={<LockOutlined />} /></Form.Item>
              <Divider className="form-divider">Permissões de Acesso aos SEUS Perfis</Divider>
              <Form.Item name="accessType" label="Quais dos SEUS perfis este convidado poderá acessar?" rules={[{ required: true, message: 'Selecione o tipo de acesso!' }]}>
                <Radio.Group buttonStyle="outline" className="access-type-radio-group-simplified">
                  <Radio.Button value="PF"><CreditCardOutlined /> Apenas Pessoal (PF)</Radio.Button>
                  {ownerHasBusinessProfile && <Radio.Button value="PJ"><ShopOutlined /> Apenas Empresarial (PJ/MEI)</Radio.Button>}
                  {ownerHasBusinessProfile && <Radio.Button value="Ambos"><ProfileOutlined /> Ambos (Pessoal + Empresarial)</Radio.Button>}
                  <Radio.Button value="Nenhum" danger><StopOutlined /> Nenhum Perfil</Radio.Button>
                </Radio.Group>
              </Form.Item>
              {!ownerHasBusinessProfile && (accessForm.getFieldValue('accessType') === 'PJ' || accessForm.getFieldValue('accessType') === 'Ambos') &&
                <Alert message="Você não possui um perfil Empresarial (PJ/MEI) para compartilhar." type="warning" showIcon style={{marginBottom: '15px'}}/>
              }
              <Form.Item className="form-action-buttons"><Button onClick={handleAccessModalCancel} className="cancel-btn-form" disabled={isSavingAccess}>Cancelar</Button><Button type="primary" htmlType="submit" className="submit-btn-form" loading={isSavingAccess}>{editingAccessUser ? "Salvar" : "Conceder"}</Button></Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ConfiguracoesPage;