// src/pages/MeuPerfilPage/MeuPerfilPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layout, Card, Avatar, Typography, Button, Divider, Modal, Form, Input, Select,
  Statistic, Tag, Tooltip, Empty, List, Space, message, Row, Col,
  Result
} from 'antd';
import {
  UserOutlined, ShopOutlined, IdcardOutlined, CopyOutlined, GiftOutlined, CrownOutlined,
  EditOutlined, PlusCircleOutlined, SolutionOutlined, WalletOutlined, GlobalOutlined,
  CreditCardOutlined, DropboxOutlined, LoadingOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

import './MeuPerfilPage.css';

// A importação do Layout é mantida pois o <Content> é um sub-componente dele.
const { Content } = Layout; 
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

dayjs.locale('pt-br');

const MeuPerfilPage = () => {
  const {
    userProfiles,
    selectedProfileId,
    setSelectedProfileId,
    currentProfile,
    loadingProfiles,
    isAuthenticated,
    fetchUserProfiles
  } = useProfile();

  // O estado do sidebar foi removido daqui.
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [profileForm] = Form.useForm();
  const [creatingProfile, setCreatingProfile] = useState(false);

  const [mainUserData, setMainUserData] = useState(null);

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        setMainUserData(JSON.parse(storedUserData));
      } catch (e) {
        console.error("Erro ao parsear userData do localStorage", e);
      }
    } else if (isAuthenticated && !loadingProfiles) {
      apiClient.get('/auth/client/me')
        .then(response => {
          if (response.data?.status === 'success' && response.data?.data?.client) {
            const clientData = response.data.data.client;
            localStorage.setItem('userData', JSON.stringify(clientData));
            setMainUserData(clientData);
          }
        })
        .catch(err => console.error("Erro ao buscar dados do cliente no MeuPerfilPage:", err));
    }
  }, [isAuthenticated, loadingProfiles]);


  const hasPJProfile = useMemo(() => {
    return userProfiles.some(p => p.type === 'PJ' || p.type === 'MEI');
  }, [userProfiles]);

  const showProfileModal = () => {
    profileForm.resetFields();
    profileForm.setFieldsValue({ tipoEmpresa: 'PJ' });
    setIsProfileModalVisible(true);
  };

  const handleProfileModalCancel = () => {
    setIsProfileModalVisible(false);
    profileForm.resetFields();
  };

  const onProfileFormFinish = async (values) => {
    if (!mainUserData || !mainUserData.id) {
      message.error("Dados do usuário principal não encontrados. Não é possível criar perfil.");
      return;
    }
    setCreatingProfile(true);
    try {
      const payload = {
        accountName: values.nomeEmpresa,
        accountType: values.tipoEmpresa,
        documentNumber: values.documentNumber || null,
      };
      const response = await apiClient.post(`/clients/${mainUserData.id}/financial-accounts`, payload);

      if (response.data && response.data.status === 'success') {
        message.success(<Text style={{ color: 'var(--map-dourado)'}}>Perfil "{response.data.data.accountName}" criado com sucesso!</Text>);
        await fetchUserProfiles(); 
        setSelectedProfileId(response.data.data.id.toString()); 
        handleProfileModalCancel();
      } else {
        message.error(response.data?.message || "Falha ao criar perfil empresarial.");
      }
    } catch (error) {
      console.error("Erro ao criar perfil empresarial:", error);
    } finally {
      setCreatingProfile(false);
    }
  };

  const copyReferralCode = () => {
    const referralCode = mainUserData?.referralCode || 'MAPUSER2024';
    navigator.clipboard.writeText(referralCode)
      .then(() => message.success(<Text style={{ color: 'var(--map-dourado)'}}>Código copiado!</Text>))
      .catch(err => message.error('Falha ao copiar o código.'));
  };

  const referralBalance = mainUserData?.referralBalance || 0;


  if (loadingProfiles || !mainUserData && isAuthenticated) { 
    return (
        <Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}>
            <LoadingOutlined style={{fontSize: 48, color: 'var(--map-laranja)'}} spin/>
        </Content>
    );
  }
  if (!isAuthenticated && !loadingProfiles) {
     return (
        <Content style={{padding: 50, textAlign: 'center'}}>
            <Title level={3}>Acesso Negado</Title><Paragraph>Você precisa estar logado.</Paragraph>
            <Button type="primary" onClick={() => window.location.href = '/login'}>
              Ir para Login
            </Button>
        </Content>
      );
  }


  return (
    <Content className="page-content-wrapper perfil-content-wrapper">
      <Title level={2} className="page-title-custom perfil-page-title">
        <SolutionOutlined className="title-icon-perfil" /> Meu Perfil e Contas
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card className="perfil-card animated-card" bordered={false}>
              <div className="user-info-header">
                <Avatar size={80} icon={!mainUserData?.avatarUrl && <UserOutlined />} src={mainUserData?.avatarUrl} className="user-avatar-perfil">
                  {!mainUserData?.avatarUrl && mainUserData?.name ? mainUserData.name.charAt(0).toUpperCase() : null}
                </Avatar>
                <div className="user-details">
                  <Title level={3} className="user-name-perfil">{mainUserData?.name || 'Usuário'}</Title>
                  <Text className="user-email-perfil">{mainUserData?.email || 'Não informado'}</Text>
                </div>
              </div>
            </Card>

            <Card title={<Space><GlobalOutlined className="card-title-icon" />Seus Perfis Financeiros</Space>} className="perfil-card animated-card" bordered={false} style={{animationDelay: '0.1s'}}>
              {userProfiles.length > 0 ? (
                <List
                    itemLayout="horizontal"
                    dataSource={userProfiles}
                    renderItem={profile => (
                    <List.Item
                        className={`profile-list-item ${selectedProfileId === profile.id ? 'active-profile-item' : ''}`}
                        actions={[
                            selectedProfileId === profile.id && <Tag color="green" className="active-tag-profile">Ativo no Painel</Tag>,
                        ]}
                        onClick={() => setSelectedProfileId(profile.id)}
                        style={{cursor: 'pointer'}}
                    >
                        <List.Item.Meta
                        avatar={React.cloneElement(profile.icon || <UserOutlined />, { className: 'profile-item-icon' })}
                        title={<Text strong className="profile-item-name">{profile.name}</Text>}
                        description={<Text className="profile-item-type">{profile.type === 'PF' ? 'Pessoal' : `Empresarial (${profile.type})`}</Text>}
                        />
                    </List.Item>
                    )}
                />
              ) : (
                <Paragraph>Nenhum perfil financeiro encontrado. Você pode criar um abaixo, se aplicável, ou verifique suas configurações.</Paragraph>
              )}

              {mainUserData && (mainUserData.accessLevel?.includes('avancado') || mainUserData.accessLevel?.startsWith('vitalicio')) && !hasPJProfile && (
                <div className="create-pj-profile-section">
                  <Divider />
                  <Result
                    icon={<ShopOutlined style={{color: 'var(--map-dourado)', fontSize: '48px'}}/>}
                    title="Pronto para gerenciar seu negócio?"
                    subTitle="Crie um perfil para sua empresa (PJ) ou como Microempreendedor (MEI) para finanças e estoque dedicados."
                    extra={
                      <Button type="primary" icon={<PlusCircleOutlined />} onClick={showProfileModal} className="create-pj-btn">
                        Criar Perfil Empresarial
                      </Button>
                    }
                  />
                </div>
              )}
               {mainUserData && (!mainUserData.accessLevel?.includes('avancado') && !mainUserData.accessLevel?.startsWith('vitalicio')) && !hasPJProfile && (
                    <div className="create-pj-profile-section">
                        <Divider />
                        <Result
                            status="info"
                            icon={<ShopOutlined style={{color: 'var(--map-dourado)', fontSize: '48px'}}/>}
                            title="Quer gerenciar um negócio?"
                            subTitle="Para criar perfis empresariais (PJ/MEI) e acessar funcionalidades avançadas como controle de estoque, você precisa de um dos nossos Planos Avançados."
                            extra={
                            <Button type="primary" className="create-pj-btn" onClick={() => message.info("Redirecionar para página de planos...")}>
                                Ver Planos Avançados
                            </Button>
                            }
                        />
                    </div>
                )}
            </Card>

            <Card title={<Space><GiftOutlined className="card-title-icon" />Seu Código de Referência</Space>} className="perfil-card animated-card" bordered={false} style={{animationDelay: '0.2s'}}>
              <Paragraph className="referral-desc">
                Compartilhe seu código com amigos e ganhe <Text strong className="referral-highlight">R$ 10,00</Text> de bônus para cada novo usuário Pro que se cadastrar usando ele!
              </Paragraph>
              <div className="referral-code-area">
                <Text strong className="referral-code-text">{mainUserData?.referralCode || 'MAPUSER2024'}</Text>
                <Button icon={<CopyOutlined />} onClick={copyReferralCode} className="copy-code-btn">Copiar</Button>
              </div>
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title={<Space><WalletOutlined className="card-title-icon" />Meus Benefícios</Space>} className="perfil-card benefits-card animated-card" bordered={false} style={{animationDelay: '0.3s'}}>
              <Statistic
                title={<Text className="statistic-title">Saldo de Indicações</Text>}
                value={referralBalance}
                precision={2}
                prefix="R$"
                valueStyle={{ color: 'var(--map-dourado)', fontWeight: 600, fontSize: '28px' }}
                className="referral-statistic"
              />
              <Button type="default" block className="withdraw-benefits-btn" disabled={referralBalance < 50}>
                Sacar Saldo (Mín. R$ 50,00)
              </Button>
              <Paragraph className="benefits-footer-text">
                Seu saldo será creditado em sua conta bancária em até 5 dias úteis.
              </Paragraph>
            </Card>

            <Card title={<Space><CrownOutlined className="card-title-icon" />Seu Plano Atual</Space>} className="perfil-card plan-card animated-card" bordered={false} style={{animationDelay: '0.4s'}}>
              <div className="current-plan-info">
                <Title level={4} className="current-plan-name">
                    {mainUserData?.accessLevel ? mainUserData.accessLevel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Gratuito'}
                </Title>
                {mainUserData?.accessExpiresAt && !mainUserData.accessLevel?.startsWith('vitalicio') ? (
                  <Text className="current-plan-detail">Válido até: {dayjs(mainUserData.accessExpiresAt).format('DD/MM/YYYY')}</Text>
                ) : mainUserData?.accessLevel?.startsWith('vitalicio') ? (
                  <Text className="current-plan-detail">Acesso Vitalício!</Text>
                ) : (
                  <Text className="current-plan-detail">Você está utilizando o plano gratuito.</Text>
                )}
              </div>
              <Button type="primary" block className="manage-plan-btn" onClick={() => message.info("Redirecionar para página de planos...")}>
                Ver Todos os Planos e Upgrades
              </Button>
            </Card>
          </Space>
        </Col>
      </Row>

      <Modal
        title={<Space><ShopOutlined /> Criar Novo Perfil Empresarial</Space>}
        open={isProfileModalVisible}
        onCancel={handleProfileModalCancel}
        footer={null}
        destroyOnClose
        width={500}
        className="profile-creation-modal modal-style-map"
      >
        <Form form={profileForm} layout="vertical" onFinish={onProfileFormFinish}>
          <Form.Item
            name="nomeEmpresa"
            label="Nome da Empresa / Nome do Negócio"
            rules={[{ required: true, message: 'Por favor, insira o nome da sua empresa ou negócio!' }, {min: 3, message: "Mínimo 3 caracteres."}]}
          >
            <Input placeholder="Ex: MAP Soluções Criativas" />
          </Form.Item>
          <Form.Item
            name="tipoEmpresa"
            label="Tipo de Perfil Empresarial"
            rules={[{ required: true, message: 'Selecione o tipo de perfil!' }]}
          >
            <Select placeholder="Selecione PJ ou MEI">
              <Option value="PJ"><ShopOutlined /> Pessoa Jurídica (PJ)</Option>
              <Option value="MEI"><IdcardOutlined /> Microempreendedor Individual (MEI)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="documentNumber" label="CNPJ (Opcional)">
            <Input placeholder="XX.XXX.XXX/0001-XX" />
          </Form.Item>
          <Divider className="form-divider" />
          <Form.Item className="form-action-buttons">
            <Button onClick={handleProfileModalCancel} className="cancel-btn-form" disabled={creatingProfile}>Cancelar</Button>
            <Button type="primary" htmlType="submit" className="submit-btn-form" loading={creatingProfile}>Criar Perfil</Button>
          </Form.Item>
        </Form>
      </Modal>

    </Content>
  );
};

export default MeuPerfilPage;