import React, { useState, useEffect, useMemo } from 'react';
import {
  Layout, Typography, Button, Card, Avatar, List, Tag, Divider,
  Result, Statistic, Spin, Modal, Form, Input, Select, Row, Col, message, Alert, Table
} from 'antd';
import {
  UserOutlined, ShopOutlined, IdcardOutlined, PlusCircleOutlined,
  GlobalOutlined, SolutionOutlined, LoadingOutlined, DollarCircleOutlined,
  KeyOutlined, WalletOutlined, CrownOutlined, ArrowRightOutlined, CheckCircleFilled
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useNavigate } from 'react-router-dom';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

import './MeuPerfilPage.css';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

dayjs.locale('pt-br');

// --- SIMULAÇÃO DOS DADOS DE PLANOS (COPIADO DE PricingSection.jsx) ---
const fullPlansData = {
  monthly: [
    {
      id: '7', name: 'Básico Mensal', icon: <UserOutlined />, price: '39', priceSuffix: ',90', period: '/mês',
      features: ['Perfis Financeiros Pessoais Ilimitados', 'Sincronização com Google Agenda', 'Gestão de Contas e Cartões'], buttonText: 'Assinar Agora', isFeatured: false,
    },
    {
      id: '9', name: 'Avançado Mensal', icon: <ShopOutlined />, price: '79', priceSuffix: ',90', period: '/mês',
      features: ['Todos os benefícios do Plano Básico', 'Perfis Empresariais (PJ/MEI)', 'Gestão de Clientes (CRM) e Serviços'], buttonText: 'Assinar Total Control', isFeatured: true,
    },
  ],
  yearly: [
    {
      id: '8', name: 'Básico Anual', icon: <UserOutlined />, price: '389', priceSuffix: ',90', period: '/ano',
      features: ['Perfis Financeiros Pessoais Ilimitados', 'Sincronização com Google Agenda', 'Gestão de Contas e Cartões'], buttonText: 'Assinar Plano Anual', isFeatured: false,
    },
    {
      id: '10', name: 'Avançado Anual', icon: <ShopOutlined />, price: '789', priceSuffix: ',90', period: '/ano',
      features: ['Todos os benefícios do Plano Básico', 'Perfis Empresariais (PJ/MEI)', 'Gestão de Clientes (CRM) e Serviços'], buttonText: 'Assinar Total Control Anual', isFeatured: true,
    },
  ]
};

// Helper para formatar o nome do plano
const formatPlanName = (accessLevel) => {
  if (!accessLevel || accessLevel === 'gratuito') return 'Gratuito';
  return accessLevel
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const AffiliateHistoryTable = ({ history, loading }) => {
  const columns = [
    { title: 'Data', dataIndex: 'joinDate', key: 'joinDate', render: (date) => new Date(date).toLocaleDateString('pt-BR') },
    { title: 'Indicado', dataIndex: 'name', key: 'name' },
    { title: 'Plano', dataIndex: ['subscription', 'planName'], key: 'planName', render: (plan) => plan ? <Tag color="blue">{plan}</Tag> : <Tag>N/A</Tag> },
    { title: 'Comissão', dataIndex: ['subscription', 'commissionEarned'], key: 'commission', render: (val) => val ? `R$ ${parseFloat(val).toFixed(2)}` : '-' },
  ];

  return (
    <Table
      dataSource={history}
      columns={columns}
      rowKey="referredClientId"
      loading={loading}
      pagination={{ pageSize: 5 }}
      size="small"
    />
  );
};

const MeuPerfilPage = () => {
  const navigate = useNavigate();
  const {
    userProfiles,
    selectedProfileId,
    setSelectedProfileId,
    loadingProfiles,
    isAuthenticated,
    fetchUserProfiles
  } = useProfile();

  const [mainUserData, setMainUserData] = useState(null);
  const [affiliateData, setAffiliateData] = useState(null);
  const [loadingAffiliateData, setLoadingAffiliateData] = useState(true);
  const [affiliateHistory, setAffiliateHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- NOVO ESTADO: Modal de Troca de Plano ---
  const [isPlanChangeModalVisible, setIsPlanChangeModalVisible] = useState(false);

  // Estados para os modais
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [isWithdrawModalVisible, setIsWithdrawModalVisible] = useState(false);

  // Estados de formulário e carregamento
  const [profileForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Busca os dados principais do cliente e os dados do afiliado
  useEffect(() => {
    if (isAuthenticated && !loadingProfiles) {
      // Busca dados do cliente (perfil, plano, etc)
      apiClient.get('/auth/client/me')
        .then(response => {
          if (response.data?.status === 'success' && response.data?.data?.client) {
            const clientData = response.data.data.client;
            localStorage.setItem('userData', JSON.stringify(clientData));
            setMainUserData(clientData);
          }
        })
        .catch(err => console.error("Erro ao buscar dados do cliente:", err));

      // Busca dados do dashboard de afiliado (saldo, indicações, etc)
      setLoadingAffiliateData(true);
      apiClient.get('/affiliate/dashboard')
        .then(response => {
          if (response.data?.status === 'success') {
            setAffiliateData(response.data.data);
          }
        })
        .catch(err => console.error("Erro ao buscar dados de afiliado:", err))
        .finally(() => setLoadingAffiliateData(false));

      // Busca histórico de indicações
      setLoadingHistory(true);
      apiClient.get('/affiliate/referrals')
        .then(response => {
          if (response.data && Array.isArray(response.data)) {
            setAffiliateHistory(response.data);
          }
        })
        .catch(err => console.error("Erro ao buscar histórico de indicações:", err))
        .finally(() => setLoadingHistory(false));
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

  const onProfileFormFinish = async (values) => {
    if (!mainUserData?.id) return;
    setCreatingProfile(true);
    try {
      const payload = {
        accountName: values.nomeEmpresa,
        accountType: values.tipoEmpresa,
        documentNumber: values.documentNumber || null,
      };
      const response = await apiClient.post(`/clients/${mainUserData.id}/financial-accounts`, payload);
      message.success(`Perfil "${response.data.data.accountName}" criado com sucesso!`);
      await fetchUserProfiles();
      setSelectedProfileId(response.data.data.id.toString());
      setIsProfileModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || "Falha ao criar perfil.");
    } finally {
      setCreatingProfile(false);
    }
  };

  const copyReferralCode = () => {
    if (!affiliateData?.summary?.affiliateCode) return;
    navigator.clipboard.writeText(affiliateData.summary.affiliateCode)
      .then(() => message.success("Código copiado!"))
      .catch(() => message.error('Falha ao copiar.'));
  };

  const handleWithdrawClick = () => {
    withdrawForm.setFieldsValue({
      cpf: mainUserData?.cpf,
      pixKey: affiliateData?.summary?.asaasPayoutPixKey,
    });
    setIsWithdrawModalVisible(true);
  };

  const handleRequestWithdrawal = async (values) => {
    setSubmitting(true);
    try {
      const { cpf, pixKey } = values;
      const targetNumber = "5521998597002";

      const userName = mainUserData?.name || 'N/A';
      const userEmail = mainUserData?.email || 'N/A';
      const userPhone = mainUserData?.phone || 'N/A';
      const currentBalance = referralBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      const whatsappMessage = `
Olá, gostaria de solicitar um saque de comissões.

*Dados do Afiliado:*
- Nome: ${userName}
- E-mail: ${userEmail}
- Telefone: ${userPhone}
- CPF: ${cpf}
- Chave PIX: ${pixKey}
- Saldo Total Disponível: ${currentBalance}

Por favor, prossiga com o pagamento para a chave PIX informada.
          `.trim();

      const whatsappUrl = `https://wa.me/${targetNumber}?text=${encodeURIComponent(whatsappMessage)}`;

      window.open(whatsappUrl, '_blank');

      message.success("Solicitação de saque enviada via WhatsApp! Aguarde o contato.");
      setIsWithdrawModalVisible(false);

    } catch (error) {
      message.error("Falha ao gerar a solicitação de saque via WhatsApp.");
      console.error("Erro ao solicitar saque via WhatsApp:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // --- NOVO HANDLER: Troca de Plano ---
  const handlePlanChangeSelect = (planId) => {
    setIsPlanChangeModalVisible(false);
    // Redireciona para o checkout, que cuidará da lógica de pagamento/assinatura
    navigate(`/checkout/${planId}`);
  };

  const filterPlansForUser = (plans, currentLevel) => {
    const isAdvanced = currentLevel?.includes('avancado') || currentLevel?.startsWith('vitalicio');
    const isBasic = currentLevel?.includes('basico');
    const isFree = currentLevel?.includes('gratuito') || !currentLevel;

    // Concatena todos os planos em um array simples para facilitar o filtro
    const allPlans = [...(plans.monthly || []), ...(plans.yearly || [])];

    return allPlans.filter(plan => {
      const planNameLower = plan.name.toLowerCase();
      // O usuário nunca deve ter a opção de selecionar o plano gratuito (ID 1) para "Trocar Plano"
      if (plan.id === '1' || planNameLower.includes('gratuito')) return false;

      // Se o plano atual é Avançado ou Vitalício:
      if (isAdvanced) {
        // Pode selecionar Basic (downgrade) ou Advanced (troca de ciclo)
        return planNameLower.includes('básico') || planNameLower.includes('avançado') || planNameLower.includes('vitalício');
      }

      // Se o plano atual é Básico:
      if (isBasic) {
        // Pode selecionar Basic (troca de ciclo) ou Advanced (upgrade)
        return planNameLower.includes('básico') || planNameLower.includes('avançado') || planNameLower.includes('vitalício');
      }

      // Se o plano atual é Gratuito ou Nulo:
      if (isFree) {
        // Deve ver todos os planos pagos (Básico e Avançado)
        return planNameLower.includes('básico') || planNameLower.includes('avançado') || planNameLower.includes('vitalício');
      }

      return false;
    });
  };

  const plansForModal = useMemo(() => {
    const currentLevel = mainUserData?.accessLevel;
    // Usar os dados simulados
    return filterPlansForUser(fullPlansData, currentLevel);
  }, [mainUserData]);

  // --- FIM DOS NOVOS HANDLERS ---

  if (loadingProfiles || loadingAffiliateData || (!mainUserData && isAuthenticated)) {
    return (
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: 'var(--map-laranja)' }} spin />} />
      </Content>
    );
  }
  if (!isAuthenticated) {
    return (
      <Content style={{ padding: 50, textAlign: 'center' }}>
        <Title level={3}>Acesso Negado</Title><Paragraph>Você precisa estar logado.</Paragraph>
        <Button type="primary" onClick={() => window.location.href = '/login'}>Ir para Login</Button>
      </Content>
    );
  }

  const referralBalance = parseFloat(affiliateData?.summary?.balance || 0);

  return (
    <Content className="page-content-wrapper perfil-content-wrapper">
      <Title level={2} className="page-title-custom perfil-page-title">
        <SolutionOutlined className="title-icon-perfil" /> Meu Perfil e Contas
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Card de Informações Pessoais */}
            <Card className="perfil-card animated-card" bordered={false}>
              <div className="user-info-header">
                <Avatar size={80} icon={<UserOutlined />} className="user-avatar-perfil">
                  {mainUserData?.name ? mainUserData.name.charAt(0).toUpperCase() : null}
                </Avatar>
                <div className="user-details">
                  <Title level={3} className="user-name-perfil">{mainUserData?.name || 'Usuário'}</Title>
                  <Text className="user-email-perfil">{mainUserData?.email || 'Não informado'}</Text>
                </div>
              </div>
            </Card>

            {/* Card de Perfis de Conta */}
            <Card title={<Space><GlobalOutlined className="card-title-icon" />Seus Perfis Financeiros</Space>} className="perfil-card animated-card" bordered={false} style={{ animationDelay: '0.1s' }}>
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
                      style={{ cursor: 'pointer' }}
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
                <Paragraph>Nenhum perfil financeiro encontrado.</Paragraph>
              )}

              {mainUserData && (mainUserData.accessLevel?.includes('avancado') || mainUserData.accessLevel?.startsWith('vitalicio')) && !hasPJProfile && (
                <div className="create-pj-profile-section">
                  <Divider />
                  <Result
                    icon={<ShopOutlined style={{ color: 'var(--map-dourado)', fontSize: '48px' }} />}
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
                    icon={<ShopOutlined style={{ color: 'var(--map-dourado)', fontSize: '48px' }} />}
                    title="Quer gerenciar um negócio?"
                    subTitle="Para criar perfis empresariais (PJ/MEI) e acessar funcionalidades avançadas, você precisa de um dos nossos Planos Avançados."
                    extra={
                      <Button type="primary" className="create-pj-btn" onClick={() => message.info("Redirecionar para página de planos...")}>
                        Ver Planos Avançados
                      </Button>
                    }
                  />
                </div>
              )}
            </Card>

            {/* Card de Saldo de Comissões */}
            <Card title={<Space><WalletOutlined className="card-title-icon" />Programa de Afiliados</Space>} className="perfil-card benefits-card animated-card" bordered={false} style={{ animationDelay: '0.3s' }}>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={12}>
                  <Statistic
                    title="Total de Indicados (Ciclo Atual)"
                    value={affiliateData?.summary?.referralsCount || 0}
                    prefix={<UserOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Ganhos Totais (Ciclo Atual)"
                    value={referralBalance}
                    precision={2}
                    prefix="R$"
                    valueStyle={{ color: 'var(--map-dourado)', fontWeight: 600 }}
                  />
                </Col>
              </Row>

              <div style={{ marginBottom: 24 }}>
                <Text strong>Seu Link de Afiliado:</Text>
                <Input.Group compact style={{ marginTop: 8 }}>
                  <Input style={{ width: 'calc(100% - 100px)' }} value={affiliateData?.summary?.affiliateLink} readOnly />
                  <Button type="primary" onClick={copyReferralCode}>Copiar</Button>
                </Input.Group>
              </div>

              <Divider orientation="left">Histórico de Indicações (Ciclo Atual)</Divider>
              <AffiliateHistoryTable history={affiliateHistory} loading={loadingHistory} />

              <Divider />

              <Button type="default" block className="withdraw-benefits-btn" disabled={referralBalance < 50} onClick={handleWithdrawClick}>
                Solicitar Saque de Comissões
              </Button>
              <Paragraph className="benefits-footer-text">
                O valor mínimo para saque é de R$ 50,00.
              </Paragraph>
            </Card>

            {/* Card de Plano */}
            <Card title={<Space><CrownOutlined className="card-title-icon" />Seu Plano Atual</Space>} className="perfil-card plan-card animated-card" bordered={false} style={{ animationDelay: '0.4s' }}>
              <div className="current-plan-info">
                <Title level={4} className="current-plan-name">
                  {formatPlanName(mainUserData?.accessLevel)}
                </Title>
                {mainUserData?.accessExpiresAt && !mainUserData.accessLevel?.startsWith('vitalicio') ? (
                  <Text className="current-plan-detail">Válido até: {dayjs(mainUserData.accessExpiresAt).format('DD/MM/YYYY')}</Text>
                ) : mainUserData?.accessLevel?.startsWith('vitalicio') ? (
                  <Text className="current-plan-detail">Acesso Vitalício!</Text>
                ) : (
                  <Text className="current-plan-detail">Você está utilizando o plano gratuito.</Text>
                )}
              </div>
              {/* --- NOVO BOTÃO: Trocar Plano --- */}
              <Button type="primary" block className="manage-plan-btn" onClick={() => setIsPlanChangeModalVisible(true)}>
                Trocar Plano
              </Button>
              {/* --- FIM NOVO BOTÃO --- */}
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Modal de Criação de Perfil */}
      <Modal
        title={<Space><ShopOutlined /> Criar Novo Perfil Empresarial</Space>}
        open={isProfileModalVisible}
        onCancel={() => setIsProfileModalVisible(false)}
        footer={null}
        destroyOnClose
        width={500}
        className="profile-creation-modal modal-style-map"
      >
        <Form form={profileForm} layout="vertical" onFinish={onProfileFormFinish}>
          <Form.Item name="nomeEmpresa" label="Nome da Empresa / Nome do Negócio" rules={[{ required: true, message: 'Por favor, insira o nome do seu negócio!' }, { min: 3, message: "Mínimo 3 caracteres." }]}>
            <Input placeholder="Ex: MAP Soluções Criativas" />
          </Form.Item>
          <Form.Item name="tipoEmpresa" label="Tipo de Perfil Empresarial" rules={[{ required: true, message: 'Selecione o tipo de perfil!' }]}>
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
            <Button onClick={() => setIsProfileModalVisible(false)} className="cancel-btn-form" disabled={creatingProfile}>Cancelar</Button>
            <Button type="primary" htmlType="submit" className="submit-btn-form" loading={creatingProfile}>Criar Perfil</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* NOVO/MODIFICADO: Modal Unificado para Solicitar Saque via WhatsApp */}
      <Modal
        title={<Space><DollarCircleOutlined /> Solicitar Saque de Comissões</Space>}
        open={isWithdrawModalVisible}
        onCancel={() => setIsWithdrawModalVisible(false)}
        footer={null}
        className="withdraw-modal modal-style-map"
        destroyOnClose // Garante que o formulário seja resetado ao fechar
      >
        <Spin spinning={submitting}>
          <div className="balance-info">
            <Text>Saldo Disponível</Text>
            <Title level={2} className="balance-value">R$ {referralBalance.toFixed(2).replace('.', ',')}</Title>
          </div>
          <Alert
            message="Solicitação via WhatsApp"
            description="Seu pedido de saque será enviado diretamente para nossa equipe via WhatsApp. Certifique-se de que os dados abaixo estão corretos."
            type="info"
            showIcon
            style={{ marginBottom: '20px' }}
          />
          <Form form={withdrawForm} layout="vertical" onFinish={handleRequestWithdrawal}>
            <Form.Item
              name="cpf"
              label="Seu CPF (para verificação)"
              rules={[{ required: true, message: 'Por favor, insira seu CPF!' }]}
            >
              <Input placeholder="000.000.000-00" prefix={<IdcardOutlined />} />
            </Form.Item>
            <Form.Item
              name="pixKey"
              label="Sua Chave PIX de Destino"
              rules={[{ required: true, message: 'Por favor, insira sua chave PIX!' }]}
            >
              <Input placeholder="Email, CPF, CNPJ ou Telefone" prefix={<KeyOutlined />} />
            </Form.Item>
            <Paragraph type="secondary" style={{ textAlign: 'center', marginTop: '15px' }}>
              *O valor total disponível de R$ {referralBalance.toFixed(2).replace('.', ',')} será considerado para o saque.*
            </Paragraph>
            <Form.Item style={{ marginTop: '20px' }}>
              <Button type="primary" htmlType="submit" loading={submitting} block size="large" className="submit-btn-form">
                Enviar Solicitação de Saque via WhatsApp
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      {/* --- NOVO MODAL: Trocar Plano --- */}
      <Modal
        title={<Space><CrownOutlined /> Escolher Novo Plano</Space>}
        open={isPlanChangeModalVisible}
        onCancel={() => setIsPlanChangeModalVisible(false)}
        footer={null}
        width={800}
        className="plan-change-modal modal-style-map"
        destroyOnClose
      >
        <Paragraph type="secondary" style={{ marginBottom: '20px' }}>
          Seu plano atual é **{formatPlanName(mainUserData?.accessLevel)}**. Escolha um novo plano abaixo. O pagamento será processado pelo Mercado Pago.
        </Paragraph>
        <Row gutter={[24, 24]} justify="center">
          {plansForModal.length > 0 ? plansForModal.map(plan => (
            <Col xs={24} md={12} key={plan.id}>
              <Card className="plan-selection-card" hoverable onClick={() => handlePlanChangeSelect(plan.id)}>
                <Title level={4} className="plan-selection-name">{plan.name}</Title>
                <Paragraph className="plan-selection-price">
                  <Text strong>R$ {plan.price}{plan.priceSuffix}</Text> {plan.period}
                </Paragraph>
                <List
                  className="plan-selection-features"
                  dataSource={plan.features.slice(0, 3)} // Exibe apenas 3 para brevidade
                  renderItem={(item) => (<List.Item><CheckCircleFilled className="feature-icon" /> {item}</List.Item>)}
                />
                <Button type="primary" size="large" block style={{ marginTop: '15px' }} icon={<ArrowRightOutlined />}>
                  {plan.name.toLowerCase().includes('avançado') ? 'Fazer Upgrade' : 'Selecionar Plano'}
                </Button>
              </Card>
            </Col>
          )) : (
            <Col span={24} style={{ textAlign: 'center' }}>
              <Alert message="Não há planos disponíveis para troca neste momento." type="info" showIcon />
            </Col>
          )}
        </Row>
      </Modal>
      {/* --- FIM NOVO MODAL --- */}

    </Content>
  );
};

export default MeuPerfilPage;