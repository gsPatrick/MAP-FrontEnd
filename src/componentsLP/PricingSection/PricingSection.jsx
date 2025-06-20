// src/componentsLP/PricingSection/PricingSection.jsx - VERSÃO LUXO
import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Card, Typography, Button, List, Tag, Switch } from 'antd';
import { CheckCircleFilled, StarFilled, UserOutlined, ShopOutlined, ArrowRightOutlined } from '@ant-design/icons';
import './PricingSection.css'; // Usará o novo CSS de Luxo

const { Title, Paragraph, Text } = Typography;

const plansData = {
  monthly: [
    {
      id: 'personal_monthly',
      name: 'Plano Pessoal Essencial',
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
      buttonText: 'Começar Agora',
      checkoutUrl: 'https://www.asaas.com/c/yrrrjobvjunf95f5', // ATUALIZADO
      isFeatured: false,
    },
    {
      id: 'business_monthly',
      name: 'Plano Pessoal + Empresarial',
      icon: <ShopOutlined />,
      price: '79',
      priceSuffix: ',00',
      period: '/mês',
      description: 'A solução completa que unifica sua vida pessoal e o comando do seu negócio. Potência máxima para quem busca o topo.',
      features: [
        'Todos os benefícios do Plano Pessoal',
        'Perfis Empresariais (PJ/MEI) Ilimitados',
        'Gestão de Clientes (CRM)',
        'Controle de Produtos e Estoque',
        'Análises e Relatórios Empresariais',
        'Suporte Prioritário via WhatsApp',
      ],
      buttonText: 'Assinar Total Control',
      checkoutUrl: 'https://www.asaas.com/c/iz8sx7yp784zsga3', // ATUALIZADO
      isFeatured: true,
    },
  ],
  yearly: [
    {
        id: 'personal_yearly',
        name: 'Plano Pessoal Essencial',
        icon: <UserOutlined />,
        price: '380',
        priceSuffix: ',00',
        period: '/ano',
        originalPrice: 'R$ 390,00',
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
        checkoutUrl: 'https://www.asaas.com/c/hqnp04qtl686uy6f', // ATUALIZADO
        isFeatured: false,
      },
      {
        id: 'business_yearly',
        name: 'Plano Pessoal + Empresarial',
        icon: <ShopOutlined />,
        price: '780',
        priceSuffix: ',00',
        period: '/ano',
        originalPrice: 'R$ 790,00',
        description: 'Potência máxima para sua vida e seu negócio, com a tranquilidade de um ano inteiro de controle e um valor especial.',
        features: [
          'Todos os benefícios do Plano Pessoal',
          'Perfis Empresariais (PJ/MEI) Ilimitados',
          'Gestão de Clientes (CRM)',
          'Controle de Produtos e Estoque',
          'Análises e Relatórios Empresariais',
          'Suporte Prioritário via WhatsApp',
        ],
        buttonText: 'Assinar Total Control Anual',
        checkoutUrl: 'https://www.asaas.com/c/9w71uq6ekx5r2u22', // ATUALIZADO
        isFeatured: true,
      },
  ]
};

const PricingSection = () => {
    const [billingCycle, setBillingCycle] = useState('monthly');
    const sectionRef = useRef(null);

    useEffect(() => {
        const currentSection = sectionRef.current;
        if (!currentSection) return;

        const elementsToAnimate = currentSection.querySelectorAll('.animate-on-scroll');
        const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            }
        });
        }, { threshold: 0.1 });

        elementsToAnimate.forEach((el, index) => {
        if (el.classList.contains('pricing-luxe-card-wrapper')) {
            el.style.transitionDelay = `${0.4 + index * 0.15}s`;
        } else {
            el.style.transitionDelay = `${0.1 + index * 0.1}s`;
        }
        observer.observe(el);
        });

        return () => observer.disconnect();
    }, [billingCycle]); // Re-executa ao mudar o ciclo para aplicar animações

    const handlePlanSelect = (url) => {
        window.open(url, '_blank');
    };

    const handleBillingToggle = (checked) => {
        setBillingCycle(checked ? 'yearly' : 'monthly');
    };

  return (
    <div ref={sectionRef} id="planos" className="pricing-luxe-section-wrapper">
      <div className="pricing-luxe-bg-elements">
        <div className="bg-luxe-shape shape-1"></div>
        <div className="bg-luxe-shape shape-2"></div>
        <div className="bg-luxe-flare"></div>
      </div>
      <div className="section-container pricing-luxe-container">
        <Title level={2} className="pricing-luxe-main-title animate-on-scroll">
          Um Plano para Cada <span className="highlight-luxe-text">Nível de Ambição</span>.
        </Title>
        <Paragraph className="pricing-luxe-main-subtitle animate-on-scroll">
          Escolha o caminho para o seu controle total. Planos flexíveis pensados para impulsionar seus resultados, sejam eles pessoais ou empresariais.
        </Paragraph>

        {/* --- INÍCIO: SELETOR DE PLANO E AVISO ASAAS --- */}
        <div className="billing-toggle-wrapper animate-on-scroll">
            <span className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}>
                Cobrança Mensal
            </span>
            <Switch onChange={handleBillingToggle} checked={billingCycle === 'yearly'} />
            <span className={`billing-option ${billingCycle === 'yearly' ? 'active' : ''}`}>
                Cobrança Anual
                <Tag className="discount-tag">Economize 2 meses</Tag>
            </span>
        </div>

        <Paragraph className="asaas-terms-notice animate-on-scroll">
            Os pagamentos são processados de forma segura pelo Asaas. Ao continuar, você concorda com os <a href="https://www.asaas.com/termos-de-uso" target="_blank" rel="noopener noreferrer">Termos de Uso</a> da plataforma.
        </Paragraph>
        {/* --- FIM: SELETOR DE PLANO E AVISO ASAAS --- */}


        <Row gutter={[32, 48]} justify="center" align="stretch" className="pricing-luxe-cards-row">
          {plansData[billingCycle].map((plan) => (
            <Col xs={24} md={12} lg={10} key={plan.id} className="pricing-luxe-card-wrapper animate-on-scroll">
              <div className={`pricing-luxe-card ${plan.isFeatured ? 'featured' : ''}`}>
                 <div className="card-luxe-background-shine"></div>
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
                    onClick={() => handlePlanSelect(plan.checkoutUrl)}
                    >
                    {plan.buttonText} <ArrowRightOutlined />
                    </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default PricingSection;