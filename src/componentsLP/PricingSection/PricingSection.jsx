// src/componentsLP/PricingSection/PricingSection.jsx
import React, { useState } from 'react';
import { Row, Col, Card, Typography, Button, List, Tag, Switch, message } from 'antd';
import { CheckCircleFilled, StarFilled, UserOutlined, ShopOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import './PricingSection.css';

const { Title, Paragraph, Text } = Typography;

// Os IDs dos planos foram ajustados para serem strings, o que é mais seguro
// para chaves e consistência.
const plansData = {
  monthly: [
    {
      id: '1',
      name: 'Básico Mensal',
      icon: <UserOutlined />,
      price: '39',
      priceSuffix: ',90',
      period: '/mês',
      description: 'O controle definitivo para suas finanças pessoais e sua rotina diária. Organização e bem-estar na palma da sua mão.',
      features: [
        'Perfis Financeiros Pessoais Ilimitados',
        'Sincronização com Google Agenda',
        'Gestão de Contas e Cartões',
        'Lembretes de Água e Motivacionais',
        'Relatórios Financeiros Detalhados',
        'Suporte via Email',
      ],
      buttonText: 'Assinar Agora',
      isFeatured: false,
    },
    {
      id: '3',
      name: 'Avançado Mensal',
      icon: <ShopOutlined />,
      price: '79',
      priceSuffix: ',90',
      period: '/mês',
      description: 'A solução completa que unifica sua vida pessoal e o comando do seu negócio. Potência máxima para quem busca o topo.',
      features: [
        'Todos os benefícios do Plano Básico',
        'Perfis Empresariais (PJ/MEI)',
        'Gestão de Clientes (CRM) e Serviços',
        'Controle de Produtos e Estoque',
        'Agenda Pública e Agendamentos Online',
        'Suporte Prioritário via WhatsApp',
      ],
      buttonText: 'Assinar Total Control',
      isFeatured: true,
    },
  ],
  yearly: [
    {
        id: '2',
        name: 'Básico Anual',
        icon: <UserOutlined />,
        price: '389',
        priceSuffix: ',90',
        period: '/ano',
        originalPrice: 'R$ 478,80',
        description: 'Um ano inteiro de organização e bem-estar com um desconto exclusivo para seu compromisso com o controle.',
        features: [
          'Perfis Financeiros Pessoais Ilimitados',
          'Sincronização com Google Agenda',
          'Gestão de Contas e Cartões',
          'Lembretes de Água e Motivacionais',
          'Relatórios Financeiros Detalhados',
          'Suporte via Email',
        ],
        buttonText: 'Assinar Plano Anual',
        isFeatured: false,
      },
      {
        id: '4',
        name: 'Avançado Anual',
        icon: <ShopOutlined />,
        price: '789',
        priceSuffix: ',90',
        period: '/ano',
        originalPrice: 'R$ 958,80',
        description: 'Potência máxima para sua vida e seu negócio, com a tranquilidade de um ano inteiro de controle e um valor especial.',
        features: [
          'Todos os benefícios do Plano Básico',
          'Perfis Empresariais (PJ/MEI)',
          'Gestão de Clientes (CRM) e Serviços',
          'Controle de Produtos e Estoque',
          'Agenda Pública e Agendamentos Online',
          'Suporte Prioritário via WhatsApp',
        ],
        buttonText: 'Assinar Total Control Anual',
        isFeatured: true,
      },
  ]
};

const PricingSection = () => {
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [loadingPlanId, setLoadingPlanId] = useState(null);
    const navigate = useNavigate();

    // Verifica se o usuário está logado de forma síncrona
    const isLoggedIn = !!localStorage.getItem('authToken');

    const handlePlanSelect = async (planId) => {
        if (isLoggedIn) {
            // FLUXO PARA USUÁRIO LOGADO (RENOVAÇÃO)
            setLoadingPlanId(planId);
            try {
                message.loading({ content: 'Gerando seu link de pagamento seguro...', key: 'mp_checkout', duration: 10 });
                const response = await apiClient.post('/mercado-pago/checkout', { planId: parseInt(planId, 10) });
                
                if (response.data?.status === 'success' && response.data.data?.checkoutUrl) {
                    message.success({ content: 'Redirecionando para o pagamento!', key: 'mp_checkout' });
                    window.location.href = response.data.data.checkoutUrl;
                } else {
                    throw new Error('Não foi possível obter o link de pagamento.');
                }
            } catch (error) {
                message.error({ content: 'Erro ao iniciar o pagamento. Tente novamente.', key: 'mp_checkout' });
                console.error("Erro no checkout MP para usuário logado:", error);
                setLoadingPlanId(null);
            }
        } else {
            // FLUXO PARA NOVO USUÁRIO (CADASTRO)
            navigate(`/assinar/${planId}`);
        }
    };

    const handleBillingToggle = (checked) => {
        setBillingCycle(checked ? 'yearly' : 'monthly');
    };

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
          Escolha o caminho para o seu controle total. Planos flexíveis pensados para impulsionar seus resultados, sejam eles pessoais ou empresariais.
        </Paragraph>
        
        <div className="billing-toggle-wrapper">
            <span className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}>
                Cobrança Mensal
            </span>
            <Switch onChange={handleBillingToggle} checked={billingCycle === 'yearly'} />
            <span className={`billing-option ${billingCycle === 'yearly' ? 'active' : ''}`}>
                Cobrança Anual
                <Tag className="discount-tag">Economize 2 meses</Tag>
            </span>
        </div>

        <Paragraph className="asaas-terms-notice">
            Os pagamentos são processados de forma segura pelo Mercado Pago.
        </Paragraph>
        
        <Row gutter={[32, 48]} justify="center" align="stretch" className="pricing-luxe-cards-row">
          {plansData[billingCycle].map((plan) => (
            <Col xs={24} md={12} lg={10} key={plan.id}>
              {/* O wrapper de animação foi removido daqui */}
              <Card className={`pricing-luxe-card ${plan.isFeatured ? 'featured' : ''}`}>
                 {plan.isFeatured && (
                  <div className="featured-luxe-banner">
                    <StarFilled /> Mais Escolhido
                  </div>
                )}
                <div className="card-luxe-content">
                    <div className="plan-luxe-icon-header">
                        {plan.icon && React.cloneElement(plan.icon, {className: 'plan-luxe-title-icon'})}
                    </div>
                    <Title level={3} className="plan-luxe-name">{plan.name}</Title>
                    <Paragraph className="plan-luxe-description">{plan.description}</Paragraph>

                    <div className="plan-luxe-price-container">
                        <div className="price-tag">
                            <span className="price-currency">R$</span>
                            <span className="price-value">{plan.price}</span>
                            <span className="price-meta">
                                <span className="price-suffix">{plan.priceSuffix}</span>
                                <span className="price-period">{plan.period}</span>
                            </span>
                        </div>
                        {plan.originalPrice ? <Text className="original-price-strike">De {plan.originalPrice}</Text> : <div className="original-price-strike"></div>}
                    </div>

                    <List
                    className="plan-luxe-features-list"
                    dataSource={plan.features}
                    renderItem={(item) => (
                        <List.Item>
                            <CheckCircleFilled className="feature-luxe-icon" /> 
                            <Text>{item}</Text>
                        </List.Item>
                    )}
                    />
                    <Button
                    type="primary"
                    size="large"
                    block
                    className="plan-luxe-cta-button"
                    onClick={() => handlePlanSelect(plan.id)}
                    loading={loadingPlanId === plan.id}
                    >
                    {plan.buttonText} <ArrowRightOutlined />
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