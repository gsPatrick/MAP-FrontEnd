// src/componentsLP/PricingSection/PricingSection.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, List, Tag, Switch, message, Spin } from 'antd';
import { CheckCircleFilled, StarFilled, UserOutlined, ShopOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';
import './PricingSection.css';

const { Title, Paragraph, Text } = Typography;

// Os dados dos planos agora vêm de um arquivo central para consistência
const plansData = {
  monthly: [
    {
      id: '1', name: 'Básico Mensal', icon: <UserOutlined />, price: '39', priceSuffix: ',90', period: '/mês',
      description: 'O controle definitivo para suas finanças pessoais e sua rotina diária.',
      features: [ 'Perfis Financeiros Pessoais Ilimitados', 'Sincronização com Google Agenda', 'Gestão de Contas e Cartões', 'Lembretes de Água e Motivacionais', 'Relatórios Financeiros Detalhados', 'Suporte via Email' ],
      buttonText: 'Assinar Agora', isFeatured: false,
    },
    {
      id: '3', name: 'Avançado Mensal', icon: <ShopOutlined />, price: '79', priceSuffix: ',90', period: '/mês',
      description: 'A solução completa que unifica sua vida pessoal e o comando do seu negócio.',
      features: [ 'Todos os benefícios do Plano Básico', 'Perfis Empresariais (PJ/MEI)', 'Gestão de Clientes (CRM) e Serviços', 'Controle de Produtos e Estoque', 'Agenda Pública e Agendamentos Online', 'Suporte Prioritário via WhatsApp' ],
      buttonText: 'Assinar Total Control', isFeatured: true,
    },
  ],
  yearly: [
    {
        id: '2', name: 'Básico Anual', icon: <UserOutlined />, price: '389', priceSuffix: ',90', period: '/ano',
        originalPrice: 'R$ 478,80',
        description: 'Um ano inteiro de organização com um desconto exclusivo para seu compromisso.',
        features: [ 'Perfis Financeiros Pessoais Ilimitados', 'Sincronização com Google Agenda', 'Gestão de Contas e Cartões', 'Lembretes de Água e Motivacionais', 'Relatórios Financeiros Detalhados', 'Suporte via Email' ],
        buttonText: 'Assinar Plano Anual', isFeatured: false,
      },
      {
        id: '4', name: 'Avançado Anual', icon: <ShopOutlined />, price: '789', priceSuffix: ',90', period: '/ano',
        originalPrice: 'R$ 958,80',
        description: 'Potência máxima para sua vida e seu negócio, com a tranquilidade de um ano inteiro de controle.',
        features: [ 'Todos os benefícios do Plano Básico', 'Perfis Empresariais (PJ/MEI)', 'Gestão de Clientes (CRM) e Serviços', 'Controle de Produtos e Estoque', 'Agenda Pública e Agendamentos Online', 'Suporte Prioritário via WhatsApp' ],
        buttonText: 'Assinar Total Control Anual', isFeatured: true,
      },
  ]
};

const PricingSection = () => {
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [loadingPlanId, setLoadingPlanId] = useState(null); // Para o loading do botão específico
    const navigate = useNavigate();
    
    // Verificação síncrona do token para determinar o estado inicial de login
    const isLoggedIn = !!localStorage.getItem('authToken');

    // Contexto para obter detalhes do usuário e saber se a assinatura está ativa
    const { loadingProfiles } = useProfile();
    const [userSubscription, setUserSubscription] = useState(null);
    const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

    useEffect(() => {
        const checkSubscription = async () => {
            if (isLoggedIn) {
                try {
                    // API para verificar a assinatura ativa do usuário logado
                    const response = await apiClient.get('/subscriptions/me/active');
                    if (response.data?.status === 'success' && response.data.data) {
                        setUserSubscription(response.data.data);
                    }
                } catch (error) {
                    // Se der erro 404 (sem assinatura ativa), é um estado normal.
                    if (error.response?.status !== 404) {
                        console.error("Não foi possível verificar a assinatura ativa.", error);
                    }
                }
            }
            setIsCheckingSubscription(false);
        };
        
        if (!loadingProfiles) {
            checkSubscription();
        }
    }, [isLoggedIn, loadingProfiles]);

    // <<< FUNÇÃO handlePlanSelect CORRIGIDA E FINAL >>>
    const handlePlanSelect = (planId) => {
        setLoadingPlanId(planId); // Ativa o loading no botão clicado

        // A decisão de para onde navegar é baseada unicamente no estado de login.
        if (isLoggedIn) {
            // Se o usuário já está logado (cenário de renovação),
            // ele vai direto para a nova página de checkout.
            navigate(`/checkout/${planId}`);
        } else {
            // Se não está logado, ele vai para a página de cadastro.
            // A página de cadastro, após o sucesso, cuidará do pagamento.
            navigate(`/assinar/${planId}`);
        }
        
        // O loading é desativado na próxima página, ou se o usuário voltar.
    };

    const handleBillingToggle = (checked) => {
        setBillingCycle(checked ? 'yearly' : 'monthly');
    };

    // Estado de carregamento enquanto verifica o perfil e a assinatura
    if (loadingProfiles || isCheckingSubscription) {
        return (
            <div id="planos" className="pricing-luxe-section-wrapper" style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    // Se o usuário está logado e tem uma assinatura ATIVA, mostra o status
    if (isLoggedIn && userSubscription?.status === 'Ativa') {
        const isVitalicio = userSubscription.plan.tier.includes('vitalicio');
        const endDate = new Date(userSubscription.endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

        return (
            <div id="planos" className="pricing-luxe-section-wrapper">
                <div className="section-container pricing-luxe-container">
                    <Title level={2} className="pricing-luxe-main-title">Seu Plano Atual</Title>
                    <Paragraph className="pricing-luxe-main-subtitle">Você já está no controle! Continue aproveitando todos os benefícios.</Paragraph>
                    <Card style={{ maxWidth: 600, margin: '40px auto', textAlign: 'left', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                        <Title level={4} style={{ color: 'var(--pricing-gold-dark)' }}>Plano: {userSubscription.plan.name}</Title>
                        <Paragraph>Status: <Tag color="green" style={{ fontSize: '14px', padding: '4px 10px' }}>{userSubscription.status}</Tag></Paragraph>
                        <Paragraph style={{ fontSize: '16px' }}>
                            {isVitalicio ? "Você possui acesso vitalício! 🎉" : `Seu acesso é válido até: ${endDate}`}
                        </Paragraph>
                        <Button type="primary" size="large" onClick={() => navigate('/painel')} className="plan-luxe-cta-button" style={{ marginTop: '20px' }}>
                            Acessar Painel <ArrowRightOutlined />
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    // Renderiza a seção de preços para usuários deslogados ou com plano expirado
    return (
        <div id="planos" className="pricing-luxe-section-wrapper">
            <div className="pricing-luxe-bg-elements">
                <div className="bg-luxe-shape shape-1"></div>
                <div className="bg-luxe-shape shape-2"></div>
                <div className="bg-luxe-flare"></div>
            </div>
            <div className="section-container pricing-luxe-container">
                <Title level={2} className="pricing-luxe-main-title">
                    Um Plano para Cada <span className="highlight-luxe-text">Nível de Ambição</span>.
                </Title>
                <Paragraph className="pricing-luxe-main-subtitle">
                    {isLoggedIn 
                        ? 'Sua assinatura expirou ou não está ativa. Renove agora para continuar no controle total!' 
                        : 'Escolha o caminho para o seu controle total. Planos flexíveis pensados para impulsionar seus resultados.'
                    }
                </Paragraph>
                <div className="billing-toggle-wrapper">
                    <span className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}>Cobrança Mensal</span>
                    <Switch onChange={handleBillingToggle} checked={billingCycle === 'yearly'} />
                    <span className={`billing-option ${billingCycle === 'yearly' ? 'active' : ''}`}>Cobrança Anual <Tag className="discount-tag">Economize 2 meses</Tag></span>
                </div>
                <Paragraph className="asaas-terms-notice">Os pagamentos são processados de forma segura pelo Mercado Pago.</Paragraph>
                <Row gutter={[32, 48]} justify="center" align="stretch" className="pricing-luxe-cards-row">
                    {plansData[billingCycle].map((plan) => (
                        <Col xs={24} md={12} lg={10} key={plan.id}>
                            <Card className={`pricing-luxe-card ${plan.isFeatured ? 'featured' : ''}`}>
                                {plan.isFeatured && (<div className="featured-luxe-banner"><StarFilled /> Mais Escolhido</div>)}
                                <div className="card-luxe-content">
                                    <div className="plan-luxe-icon-header">{plan.icon && React.cloneElement(plan.icon, {className: 'plan-luxe-title-icon'})}</div>
                                    <Title level={3} className="plan-luxe-name">{plan.name}</Title>
                                    <Paragraph className="plan-luxe-description">{plan.description}</Paragraph>
                                    <div className="plan-luxe-price-container">
                                        <div className="price-tag">
                                            <span className="price-currency">R$</span><span className="price-value">{plan.price}</span>
                                            <span className="price-meta"><span className="price-suffix">{plan.priceSuffix}</span><span className="price-period">{plan.period}</span></span>
                                        </div>
                                        {plan.originalPrice ? <Text className="original-price-strike">De {plan.originalPrice}</Text> : <div className="original-price-strike"></div>}
                                    </div>
                                    <List
                                        className="plan-luxe-features-list"
                                        dataSource={plan.features}
                                        renderItem={(item) => (<List.Item><CheckCircleFilled className="feature-luxe-icon" /> <Text>{item}</Text></List.Item>)}
                                    />
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        className="plan-luxe-cta-button"
                                        onClick={() => handlePlanSelect(plan.id)}
                                        loading={loadingPlanId === plan.id}
                                    >
                                        {isLoggedIn ? 'Renovar Assinatura' : plan.buttonText} <ArrowRightOutlined />
                                    </Button>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
};

export default PricingSection;