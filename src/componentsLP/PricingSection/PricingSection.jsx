// src/componentsLP/PricingSection/PricingSection.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Button, Switch, Tag, List } from 'antd';
import { CheckCircleFilled, StarFilled } from '@ant-design/icons';
import './PricingSection.css';

const { Title, Paragraph, Text } = Typography;

const plansData = {
  monthly: [
    {
      id: 'personal',
      name: 'Plano Pessoal Pro',
      price: 'R$29',
      originalPrice: null, // Para descontos anuais
      period: '/mês',
      description: 'Ideal para controle financeiro pessoal completo e organização de tarefas.',
      features: [
        'Perfis Financeiros Ilimitados (PF)',
        'Transações Ilimitadas',
        'Agendamentos Avançados e Lembretes',
        'Recorrências Automatizadas',
        'Gestão de Cartões de Crédito',
        'Relatórios Detalhados',
        'Suporte Prioritário por Email',
      ],
      buttonText: 'Assinar Agora',
      isFeatured: true, // Destaque para este plano
      tagText: 'Mais Popular'
    },
    {
      id: 'business',
      name: 'Plano Empresarial',
      price: 'R$59',
      originalPrice: null,
      period: '/mês',
      description: 'Todas as ferramentas para gerenciar seu MEI ou pequena empresa com eficiência.',
      features: [
        'Tudo do Pessoal Pro',
        'Perfis Financeiros PJ Ilimitados',
        'Controle de Produtos e Estoque',
        'Alertas de Estoque Mínimo',
        'Múltiplos Usuários (em breve)',
        'Suporte Dedicado WhatsApp & Email',
      ],
      buttonText: 'Escolher Plano Empresa',
      isFeatured: false,
    },
  ],
  annually: [ // Preços anuais com desconto simulado
    {
      id: 'personal',
      name: 'Plano Pessoal Pro',
      price: 'R$290', // Ex: R$29 * 12 = R$348. Desconto para R$290
      originalPrice: 'R$348',
      period: '/ano',
      description: 'Ideal para controle financeiro pessoal completo e organização de tarefas.',
      features: [
        'Perfis Financeiros Ilimitados (PF)',
        'Transações Ilimitadas',
        'Agendamentos Avançados e Lembretes',
        'Recorrências Automatizadas',
        'Gestão de Cartões de Crédito',
        'Relatórios Detalhados',
        'Suporte Prioritário por Email',
        <Text strong style={{color: 'var(--map-dourado)'}}>Economize 2 meses!</Text>
      ],
      buttonText: 'Assinar Plano Anual',
      isFeatured: true,
      tagText: 'Melhor Valor'
    },
    {
      id: 'business',
      name: 'Plano Empresarial',
      price: 'R$590', // Ex: R$59 * 12 = R$708. Desconto para R$590
      originalPrice: 'R$708',
      period: '/ano',
      description: 'Todas as ferramentas para gerenciar seu MEI ou pequena empresa com eficiência.',
      features: [
        'Tudo do Pessoal Pro',
        'Perfis Financeiros PJ Ilimitados',
        'Controle de Produtos e Estoque',
        'Alertas de Estoque Mínimo',
        'Múltiplos Usuários (em breve)',
        'Suporte Dedicado WhatsApp & Email',
        <Text strong style={{color: 'var(--map-dourado)'}}>Economize 2 meses!</Text>
      ],
      buttonText: 'Escolher Plano Anual',
      isFeatured: false,
    },
  ]
};


const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annually'
  const [currentPlans, setCurrentPlans] = useState(plansData.monthly);

  useEffect(() => {
    setCurrentPlans(plansData[billingCycle]);

    // Animação de entrada
    const sectionElements = document.querySelectorAll('.pricing-section-animate');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (entry.target.classList.contains('pricing-card-wrapper')) {
            const card = entry.target.querySelector('.pricing-card');
            if (card) {
              // Você pode adicionar animações internas aos cards aqui se desejar
            }
          }
          // observer.unobserve(entry.target); // Para animar apenas uma vez
        } else {
          // entry.target.classList.remove('visible'); // Para re-animar
        }
      });
    }, { threshold: 0.1 });

    sectionElements.forEach((el, index) => {
      if (el.classList.contains('pricing-card-wrapper')) {
        el.style.transitionDelay = `${index * 0.1}s`;
      }
      observer.observe(el);
    });
    return () => sectionElements.forEach(el => observer.unobserve(el));
  }, [billingCycle]);

  const handleBillingCycleChange = (checked) => {
    setBillingCycle(checked ? 'annually' : 'monthly');
  };

  const handlePlanSelect = (planId) => {
    console.log(`Plano selecionado: ${planId}, Ciclo: ${billingCycle}`);
    // Navegar para a página de checkout/cadastro
  };

  return (
    <div className="pricing-section-wrapper">
      <div className="pricing-section-container">
        <Title level={2} className="pricing-main-title pricing-section-animate">
          Planos Flexíveis para <span className="highlight-brand">Cada Necessidade</span>
        </Title>
        <Paragraph className="pricing-main-subtitle pricing-section-animate" style={{transitionDelay: '0.1s'}}>
          Escolha o plano perfeito para você ou sua empresa e comece a ter o controle total agora mesmo.
        </Paragraph>

        <Row gutter={[24, 24]} justify="center" align="stretch" className="pricing-cards-row">
          {currentPlans.map((plan, index) => (
            <Col xs={24} sm={24} md={12} lg={8} key={plan.id} className="pricing-card-wrapper pricing-section-animate">
              <Card
                className={`pricing-card ${plan.isFeatured ? 'featured' : ''}`}
                bordered={false}
                hoverable
              >
                {plan.isFeatured && plan.tagText && (
                  <Tag icon={<StarFilled />} color="volcano" className="featured-tag">
                    {plan.tagText}
                  </Tag>
                )}
                <Title level={3} className="plan-name">{plan.name}</Title>
                <Paragraph className="plan-description">{plan.description}</Paragraph>

                <div className="plan-price-container">
                  {plan.originalPrice && billingCycle === 'annually' && (
                    <Text delete className="original-price">{plan.originalPrice}</Text>
                  )}
                  <Text className="plan-price">{plan.price}</Text>
                  <Text className="plan-period">{plan.period}</Text>
                </div>

                <List
                  className="plan-features-list"
                  dataSource={plan.features}
                  renderItem={(item) => (
                    <List.Item>
                      <CheckCircleFilled className="feature-icon" /> {item}
                    </List.Item>
                  )}
                />
                <Button
                  type={plan.isFeatured ? 'primary' : 'default'}
                  size="large"
                  block
                  className="plan-cta-button"
                  onClick={() => handlePlanSelect(plan.id)}
                  style={plan.isFeatured ? {background: 'var(--map-laranja)', borderColor: 'var(--map-laranja)'} : {}}
                >
                  {plan.buttonText}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
         <Paragraph className="pricing-footer-note pricing-section-animate" style={{transitionDelay: '0.3s'}}>
            Dúvidas? <a href="/contato">Fale conosco</a> ou confira nossa <a href="/faq">FAQ</a>.
        </Paragraph>
      </div>
    </div>
  );
};

export default PricingSection;