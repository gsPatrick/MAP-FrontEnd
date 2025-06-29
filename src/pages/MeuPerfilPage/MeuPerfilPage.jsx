// src/pages/MeuPerfilPage/MeuPerfilPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layout, Card, Avatar, Typography, Button, Divider, Modal, Form, Input, Select,
  Statistic, Tag, Tooltip, List, Space, message, Row, Col,
  Result, Alert, Spin
} from 'antd'; // Removido InputNumber, Adicionado Alert
import {
  UserOutlined, ShopOutlined, IdcardOutlined, CopyOutlined, GiftOutlined, CrownOutlined,
  PlusCircleOutlined, SolutionOutlined, WalletOutlined, GlobalOutlined,
  DollarCircleOutlined, TeamOutlined, LoadingOutlined,
  KeyOutlined, PhoneOutlined // Adicionado PhoneOutlined para input (se necessário), IdcardOutlined para CPF
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

import './MeuPerfilPage.css';

const { Content } = Layout; 
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

dayjs.locale('pt-br');

// Helper para formatar o nome do plano
const formatPlanName = (accessLevel) => {
  if (!accessLevel || accessLevel === 'gratuito') return 'Gratuito';
  return accessLevel
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const MeuPerfilPage = () => {
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

  // Estados para os modais
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  // MODIFICADO: Apenas um modal para o processo de saque via WhatsApp
  const [isWithdrawModalVisible, setIsWithdrawModalVisible] = useState(false); 
  // REMOVIDO: isPixKeyModalVisible não será mais usado
  // const [isPixKeyModalVisible, setIsPixKeyModalVisible] = useState(false);
  
  // Estados de formulário e carregamento
  const [profileForm] = Form.useForm();
  // REMOVIDO: pixKeyForm não será mais usado
  // const [pixKeyForm] = Form.useForm(); 
  // MODIFICADO: Apenas um formulário de saque
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

  // MODIFICADO: Função para abrir o modal de saque (agora unificado para WhatsApp)
  const handleWithdrawClick = () => {
    // Pré-preenche o formulário do modal de saque com dados existentes
    withdrawForm.setFieldsValue({
        cpf: mainUserData?.cpf, // Supondo que o CPF venha em mainUserData
        pixKey: affiliateData?.summary?.asaasPayoutPixKey, // Supondo que a chave PIX venha aqui
    });
    setIsWithdrawModalVisible(true);
  };

  // REMOVIDO: handleUpdatePixKey não será mais usado
  // const handleUpdatePixKey = async (values) => {
  //   setSubmitting(true);
  //   try {
  //     await apiClient.put('/affiliate/me/payout-info', { asaasPayoutPixKey: values.pixKey });
  //     message.success("Chave PIX atualizada com sucesso!");
  //     setAffiliateData(prev => ({ ...prev, summary: { ...prev.summary, asaasPayoutPixKey: values.pixKey } }));
  //     setIsPixKeyModalVisible(false);
  //     setIsWithdrawModalVisible(true);
  //   } catch (error) {
  //     message.error(error.response?.data?.message || "Falha ao atualizar a chave PIX.");
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  // MODIFICADO: Função para solicitar saque via WhatsApp
  const handleRequestWithdrawal = async (values) => {
    setSubmitting(true);
    try {
        const { cpf, pixKey } = values;
        const targetNumber = "5521998597002"; // Número da dona do sistema
        
        // Dados do usuário logado para a mensagem
        const userName = mainUserData?.name || 'N/A';
        const userEmail = mainUserData?.email || 'N/A';
        const userPhone = mainUserData?.phone || 'N/A';
        const currentBalance = referralBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Mensagem formatada para o WhatsApp
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
        `.trim(); // Remove espaços em branco no início/fim

        const whatsappUrl = `https://wa.me/${targetNumber}?text=${encodeURIComponent(whatsappMessage)}`;
        
        // Abre o WhatsApp Web em uma nova aba
        window.open(whatsappUrl, '_blank');
        
        message.success("Solicitação de saque enviada via WhatsApp! Aguarde o contato.");
        setIsWithdrawModalVisible(false);

        // REMOVIDO: A atualização local do saldo, pois o PIX é manual e o admin zera no backend
        // setAffiliateData(prev => ({
        //   ...prev,
        //   summary: {
        //     ...prev.summary,
        //     balance: (parseFloat(prev.summary.balance) - values.amount).toFixed(2)
        //   }
        // }));

    } catch (error) {
        message.error("Falha ao gerar a solicitação de saque via WhatsApp.");
        console.error("Erro ao solicitar saque via WhatsApp:", error);
    } finally {
        setSubmitting(false);
    }
  };

  if (loadingProfiles || loadingAffiliateData || (!mainUserData && isAuthenticated)) { 
    return (
        <Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}>
            <Spin indicator={<LoadingOutlined style={{fontSize: 48, color: 'var(--map-laranja)'}} spin/>}/>
        </Content>
    );
  }
  if (!isAuthenticated) {
     return (
        <Content style={{padding: 50, textAlign: 'center'}}>
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
                <Paragraph>Nenhum perfil financeiro encontrado.</Paragraph>
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

            {/* Card de Afiliados */}
            <Card title={<Space><GiftOutlined className="card-title-icon" />Programa de Afiliados</Space>} className="perfil-card affiliate-dashboard-card animated-card" bordered={false} style={{animationDelay: '0.2s'}}>
                <List>
                    <List.Item>
                        {/* <<<< CORREÇÃO AQUI: Usando 'affiliateCode' e mostrando um spinner enquanto carrega >>>> */}
                        <Statistic 
                            title="Seu Código de Indicação" 
                            value={affiliateData?.summary?.affiliateCode || '...'} 
                            loading={loadingAffiliateData}
                        />
                        <Button 
                            icon={<CopyOutlined />} 
                            onClick={copyReferralCode} 
                            className="copy-code-btn"
                            disabled={!affiliateData?.summary?.affiliateCode}
                        >
                            Copiar
                        </Button>
                    </List.Item>
                    <List.Item>
                        <Statistic title="Total de Indicados" value={affiliateData?.totalReferrals ?? 0} prefix={<TeamOutlined />} loading={loadingAffiliateData} />
                    </List.Item>
                    <List.Item>
                        <Statistic title="Total de Comissões Ganhas" value={affiliateData?.totalEarned ?? 0} prefix="R$" precision={2} loading={loadingAffiliateData} />
                    </List.Item>
                </List>
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Card de Saldo e Saque */}
            <Card title={<Space><WalletOutlined className="card-title-icon" />Seu Saldo de Comissões</Space>} className="perfil-card benefits-card animated-card" bordered={false} style={{animationDelay: '0.3s'}}>
              <Statistic
                value={referralBalance}
                precision={2}
                prefix="R$"
                valueStyle={{ color: 'var(--map-dourado)', fontWeight: 600, fontSize: '28px' }}
                className="referral-statistic"
                loading={loadingAffiliateData}
              />
              {/* MODIFICADO: Botão sempre abre o modal de saque via WhatsApp */}
              <Button type="default" block className="withdraw-benefits-btn" disabled={referralBalance < 50} onClick={handleWithdrawClick}>
                Solicitar Saque de Comissões
              </Button>
              <Paragraph className="benefits-footer-text">
                O valor mínimo para saque é de R$ 50,00.
              </Paragraph>
            </Card>

            {/* Card de Plano */}
            <Card title={<Space><CrownOutlined className="card-title-icon" />Seu Plano Atual</Space>} className="perfil-card plan-card animated-card" bordered={false} style={{animationDelay: '0.4s'}}>
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
          <Form.Item name="nomeEmpresa" label="Nome da Empresa / Nome do Negócio" rules={[{ required: true, message: 'Por favor, insira o nome do seu negócio!' }, {min: 3, message: "Mínimo 3 caracteres."}]}>
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

      {/* REMOVIDO: Modal para Configurar Chave PIX (isPixKeyModalVisible) */}
      {/*
      <Modal
        title={<Space><KeyOutlined /> Configurar Chave PIX para Saque</Space>}
        open={isPixKeyModalVisible}
        onCancel={() => setIsPixKeyModalVisible(false)}
        footer={null}
        className="withdraw-modal modal-style-map"
      >
        <Alert
          message="Primeiro Passo"
          description="Para solicitar saques, você precisa cadastrar sua chave PIX. Este será o destino de suas comissões."
          type="info"
          showIcon
        />
        <Form form={pixKeyForm} layout="vertical" onFinish={handleUpdatePixKey}>
          <Form.Item
            name="pixKey"
            label="Sua Chave PIX"
            rules={[{ required: true, message: 'Por favor, insira sua chave PIX!' }]}
          >
            <Input placeholder="Email, CPF, CNPJ ou Telefone" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block className="submit-btn-form">
              Salvar e Continuar para Saque
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      */}

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
                style={{marginBottom: '20px'}}
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
                {/* REMOVIDO: Campo de valor específico, o saque é do saldo TOTAL */}
                {/* O valor total disponível será implicitamente enviado na mensagem */}
                <Paragraph type="secondary" style={{textAlign: 'center', marginTop: '15px'}}>
                    *O valor total disponível de R$ {referralBalance.toFixed(2).replace('.', ',')} será considerado para o saque.*
                </Paragraph>
                <Form.Item style={{marginTop: '20px'}}>
                    <Button type="primary" htmlType="submit" loading={submitting} block size="large" className="submit-btn-form">
                        Enviar Solicitação de Saque via WhatsApp
                    </Button>
                </Form.Item>
            </Form>
        </Spin>
      </Modal>

    </Content>
  );
};

export default MeuPerfilPage;