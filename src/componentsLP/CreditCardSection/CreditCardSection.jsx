// src/componentsLP/CreditCardSection/CreditCardSection.jsx
import React, { useEffect, useRef } from 'react';
import { Row, Col, Typography } from 'antd';
import {
  DollarCircleOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import './CreditCardSection.css'; // O CSS para esta seção

const { Title, Paragraph } = Typography;

const cardFeatures = [
  {
    key: 'limit',
    icon: <DollarCircleOutlined />,
    title: 'Limite Sempre à Vista',
    description: 'Saiba exatamente quanto você pode gastar. Acompanhe seu limite total, usado e disponível em tempo real, sem surpresas.',
  },
  {
    key: 'invoice',
    icon: <CalendarOutlined />,
    title: 'Faturas Descomplicadas',
    description: 'Visualize suas faturas abertas e fechadas, com datas claras de fechamento e vencimento. Planeje seus pagamentos com antecedência.',
  },
  {
    key: 'security',
    icon: <SafetyCertificateOutlined />,
    title: 'Cadastro Seguro e Centralizado',
    description: 'Cadastre todos os seus cartões em um ambiente seguro e tenha uma visão unificada de seus gastos e responsabilidades.',
  },
];

const mockupCardsData = [
    { id: 'card_1', className: 'card-1', bank: 'Flex Card', number: '1234', logo: 'elo' },
    { id: 'card_2', className: 'card-2', bank: 'Digital One', number: '5678', logo: 'mastercard' },
    { id: 'card_3', className: 'card-3', bank: 'Infinity Bank', number: '9012', logo: 'visa' },
]

const CreditCardSection = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const currentSection = sectionRef.current;
    if (!currentSection) return;

    const elementsToAnimate = currentSection.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    elementsToAnimate.forEach((el, index) => {
      el.style.transitionDelay = `${0.1 + index * 0.1}s`;
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} id="cartoes" className="credit-card-section-wrapper section-padding-large">
      <div className="cc-background-glow"></div>
      <div className="cc-background-grid"></div>

      <div className="section-container credit-card-container">
        {/* --- Header da Seção --- */}
        <Row justify="center" className="credit-card-header-row">
          <Col xs={24} md={20} className="animate-on-scroll">
            <Title level={2} className="credit-card-main-title">
              Domine seus cartões de crédito. <span className="highlight-credit-card-text">Sem estresse.</span>
            </Title>
            <Paragraph className="credit-card-main-subtitle">
              Centralize a gestão de todos os seus cartões. Acompanhe limites, faturas e vencimentos de forma visual e intuitiva, diretamente pelo MAP.
            </Paragraph>
          </Col>
        </Row>

        {/* --- Conteúdo Principal: Mockups e Features --- */}
        <Row justify="center" align="middle" gutter={[48, 48]} className="credit-card-content-row">
          {/* Coluna da Esquerda: Mockups Visuais dos Cartões */}
          <Col xs={24} lg={12} className="credit-card-visuals-col animate-on-scroll" style={{ transitionDelay: '0.2s' }}>
            <div className="credit-card-mockup-stack">
              {mockupCardsData.map(card => (
                  <div key={card.id} className={`card-mockup ${card.className}`}>
                    <div className="card-header">
                      <span className="card-bank">{card.bank}</span>
                      <div className="card-chip"></div>
                    </div>
                    <div className="card-number">•••• •••• •••• {card.number}</div>
                    <div className="card-footer">
                      <span className="card-holder">SEU NOME</span>
                      <div className={`card-logo ${card.logo}`}></div>
                    </div>
                  </div>
              ))}
              {/* Overlay de informações */}
              <div className="card-info-overlay">
                <Title level={5} className="overlay-title">Fatura Aberta (Digital One)</Title>
                <Paragraph className="overlay-value">R$ 1.254,80</Paragraph>
                <Paragraph className="overlay-meta">Fecha em: 25/08</Paragraph>
              </div>
            </div>
          </Col>

          {/* Coluna da Direita: Pontos de Funcionalidade */}
          <Col xs={24} lg={12} className="credit-card-features-col">
            <div className="credit-card-features-list">
              {cardFeatures.map((item, index) => (
                <div key={item.key} className="credit-card-feature-item animate-on-scroll" style={{ transitionDelay: `${0.4 + index * 0.15}s` }}>
                  <div className="cc-feature-icon-wrapper">
                    {item.icon}
                  </div>
                  <div className="cc-feature-text-content">
                    <Title level={4} className="cc-feature-title">{item.title}</Title>
                    <Paragraph className="cc-feature-description">{item.description}</Paragraph>
                  </div>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default CreditCardSection;