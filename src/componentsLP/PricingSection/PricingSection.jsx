// src/componentsLP/PricingSection/PricingSection.jsx
import React, { useEffect } from 'react';
import { Row, Col, Card, Typography, Button, List, Tag } from 'antd';
import { CheckCircleFilled, StarFilled, UserOutlined, ShopOutlined } from '@ant-design/icons';
import './PricingSection.css';

const { Title, Paragraph, Text } = Typography;

// Cores definidas para fácil referência, embora a maioria dos estilos estará no CSS
// Cor 1 (Dourado): #e3be62
// Cor 3 (Terracota Escuro): #903b07

const plansData = [
  {
    id: 'personal',
    name: 'Plano Pessoal - MENSAL',
    icon: <UserOutlined />,
    price: 'R$39',
    priceSuffix: ',90',
    period: '/mês',
    description: 'Controle total das suas finanças pessoais com praticidade e inteligência.',
    features: [
      'Perfis Financeiros Pessoais Ilimitados',
      'Transações e Contas (Receitas/Despesas) Ilimitadas',
      'Gestão de Cartões de Crédito',
      'Agendamentos e Lembretes (Pessoal)',
      'Recorrências Automatizadas (Pessoal)',
      'Relatórios Financeiros Pessoais',
      'Suporte Prioritário por Email',
    ],
    buttonText: 'Assinar Plano Pessoal',
    checkoutUrl: 'https://pay.hotmart.com/K100108898C',
    isFeatured: false,
    tagText: null,
  },
  {
    id: 'business',
    name: 'Plano Total Control (Pessoal + Empresarial)',
    icon: <ShopOutlined />,
    price: 'R$49',
    priceSuffix: ',90',
    period: '/mês',
    description: 'A solução completa para gerenciar suas finanças pessoais e do seu negócio (MEI/PJ).',
    features: [
      // Usaremos classe CSS para estilizar este item em vez de Text strong inline
      'Tudo do Plano Pessoal Essencial, e mais:',
      'Perfis Financeiros Empresariais (PJ/MEI) Ilimitados',
      'Controle de Contas a Pagar/Receber Empresarial',
      'Cadastro de Produtos e Serviços',
      'Controle de Estoque Simplificado',
      'Cadastro de Clientes do Negócio (CRM)',
      'Relatórios Financeiros Empresariais',
      'Suporte Dedicado (WhatsApp & Email)',
    ],
    buttonText: 'Assinar Plano Total Control',
    checkoutUrl: 'https://pay.hotmart.com/F100110333E',
    isFeatured: true,
    tagText: 'Mais Completo',
  },
];

const PricingSection = () => {
  useEffect(() => {
    const sectionElements = document.querySelectorAll('.pricing-section-animate');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // observer.unobserve(entry.target); // Para animar apenas uma vez
        } else {
          // entry.target.classList.remove('visible'); // Para re-animar
        }
      });
    }, { threshold: 0.1 });

    sectionElements.forEach((el, index) => {
      if (el.classList.contains('pricing-card-wrapper')) {
        el.style.transitionDelay = `${0.2 + index * 0.15}s`;
      } else {
        el.style.transitionDelay = `${index * 0.1}s`;
      }
      observer.observe(el);
    });
    return () => sectionElements.forEach(el => observer.unobserve(el));
  }, []);

  const handlePlanSelect = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="pricing-section-wrapper"> {/* Fundo da seção será branco */}
      <div className="pricing-section-container">
        <Title level={2} className="pricing-main-title pricing-section-animate">
          Escolha o Plano <span className="highlight-brand">Perfeito para Você</span>
        </Title>
        <Paragraph className="pricing-main-subtitle pricing-section-animate">
          Acesse todas as ferramentas para ter o controle total das suas finanças, seja pessoal ou do seu negócio.
        </Paragraph>

        <Row gutter={[32, 32]} justify="center" align="stretch" className="pricing-cards-row">
          {plansData.map((plan) => (
            <Col xs={24} md={12} lg={10} xl={8} key={plan.id} className="pricing-card-wrapper pricing-section-animate">
              <Card
                className={`pricing-card ${plan.isFeatured ? 'featured' : ''}`}
                bordered={false} // Manter sem borda padrão, a borda do featured será CSS
                hoverable
              >
                {plan.isFeatured && plan.tagText && (
                  <Tag icon={<StarFilled />} className="featured-tag"> {/* Cor será definida no CSS */}
                    {plan.tagText}
                  </Tag>
                )}
                <div className="plan-icon-header">
                  {plan.icon && React.cloneElement(plan.icon, {className: 'plan-title-icon'})}
                </div>
                <Title level={3} className="plan-name">{plan.name}</Title>
                <Paragraph className="plan-description">{plan.description}</Paragraph>

                <div className="plan-price-container">
                  <Text className="plan-price">
                    {plan.price}
                    <Text className="plan-price-suffix">{plan.priceSuffix}</Text>
                  </Text>
                  <Text className="plan-period">{plan.period}</Text>
                </div>

                <List
                  className="plan-features-list"
                  dataSource={plan.features}
                  renderItem={(item, index) => (
                    <List.Item className={index === 0 && plan.id ==='business' ? 'feature-item-highlighted' : ''}>
                      {/* Para o item "Tudo do Plano Pessoal...", não mostramos o ícone */}
                      {!(index === 0 && plan.id ==='business') && <CheckCircleFilled className="feature-icon" />} 
                      {item}
                    </List.Item>
                  )}
                />
                <Button
                  type="default" // O tipo será estilizado no CSS para diferenciar normal e featured
                  size="large"
                  block
                  className={`plan-cta-button ${plan.isFeatured ? 'featured-button' : 'normal-button'}`}
                  onClick={() => handlePlanSelect(plan.checkoutUrl)}
                  // Estilo inline removido, será tratado no CSS
                >
                  {plan.buttonText}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
         <Paragraph className="pricing-footer-note pricing-section-animate" style={{transitionDelay: '0.5s'}}>
            Pagamento seguro processado pela Hotmart. Dúvidas? <a href="#faq">Consulte nossa FAQ</a> ou <a href="#contato">fale conosco</a>.
        </Paragraph>
      </div>
    </div>
  );
};

export default PricingSection;