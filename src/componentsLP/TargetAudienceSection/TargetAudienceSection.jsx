// src/componentsLP/TargetAudienceSection/TargetAudienceSection.jsx
import React, { useEffect } from 'react';
import { Typography, Row, Col, Card, List } from 'antd';
import { UserOutlined, ShopOutlined, CheckCircleTwoTone } from '@ant-design/icons';
import './TargetAudienceSection.css';

const { Title, Paragraph, Text } = Typography;

const audienceData = [
  {
    key: 'personal',
    icon: <UserOutlined />,
    title: 'Para Sua Vida Pessoal (PF)',
    description:
      'Organize suas finanças pessoais, planeje seu orçamento familiar, controle gastos com lazer, contas de casa e alcance seus objetivos financeiros com clareza e simplicidade.',
    features: [
      'Controle total de despesas e receitas pessoais.',
      'Gestão de cartões de crédito e contas bancárias.',
      'Planejamento de metas e orçamentos.',
      'Agenda pessoal integrada para compromissos.',
      'Lembretes automáticos para contas a pagar.',
    ],
    color: 'var(--map-dourado)',
    cardClass: 'personal-card-style' // Classe específica para estilização adicional se necessário
  },
  {
    key: 'business',
    icon: <ShopOutlined />,
    title: 'Para Seu Negócio (PJ/MEI)',
    description:
      'Gestão financeira completa para sua empresa ou MEI. Desde o fluxo de caixa até o controle de estoque e clientes, tudo em um só lugar para impulsionar seu crescimento.',
    features: [
      'Separação clara das finanças empresariais.',
      'Controle de contas a pagar e receber do negócio.',
      'Gerenciamento de produtos/serviços e estoque.',
      'Cadastro e acompanhamento de clientes.',
      'Relatórios específicos para análise empresarial.',
    ],
    color: 'var(--map-laranja)',
    cardClass: 'business-card-style' // Classe específica
  },
];

const TargetAudienceSection = () => {
  useEffect(() => {
    const section = document.querySelector('.target-audience-section-wrapper');
    const cards = document.querySelectorAll('.audience-card-wrapper');

    const observerOptions = {
      threshold: 0.1, // Para a seção
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          sectionObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    if (section) {
      sectionObserver.observe(section);
    }

    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          const cardContent = entry.target.querySelector('.audience-card-content-wrapper');
          const animatedItems = cardContent.querySelectorAll('.audience-card-animate-item');
          
          animatedItems.forEach((item, idx) => {
            item.style.transitionDelay = `${idx * 0.08 + 0.25}s`; // Stagger para elementos internos
            item.classList.add('item-visible');
          });
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -50px 0px" });

    cards.forEach((cardWrapper, index) => {
      // Stagger para a entrada dos cards (wrapper)
      cardWrapper.style.transitionDelay = `${index * 0.15}s`;
      cardObserver.observe(cardWrapper);
    });

    return () => {
      if (section) sectionObserver.disconnect();
      cardObserver.disconnect();
    };
  }, []);

  return (
    <div className="target-audience-section-wrapper section-padding">
      <div className="section-container target-audience-container">
        <div className="section-header-centered">
          <Title level={2} className="section-title target-audience-title">
            Para Quem é o <span className="highlight-brand-title">MAP no Controle</span>?
          </Title>
          <Paragraph className="section-subtitle target-audience-subtitle">
            Seja para organizar suas finanças pessoais ou para gerenciar seu negócio,
            temos as ferramentas certas para você.
          </Paragraph>
        </div>

        <Row gutter={[32, 32]} justify="center">
          {audienceData.map((audience) => (
            <Col xs={24} md={12} key={audience.key} className="audience-card-wrapper">
              <Card bordered={false} className={`audience-card ${audience.cardClass}`} style={{ '--audience-color': audience.color }}>
                <div className="audience-card-content-wrapper"> {/* Novo wrapper para conteúdo */}
                  <div className="audience-card-icon-container audience-card-animate-item">
                      {React.cloneElement(audience.icon, { className: 'audience-card-icon' })}
                  </div>
                  <Title level={3} className="audience-card-title audience-card-animate-item">
                    {audience.title}
                  </Title>
                  <Paragraph className="audience-card-description audience-card-animate-item">
                    {audience.description}
                  </Paragraph>
                  <List
                    className="audience-card-features audience-card-animate-item" // Anima o bloco da lista
                    dataSource={audience.features}
                    renderItem={(item, index) => ( // Adicionado index para possível delay individual dos itens
                      <List.Item className="audience-feature-item" style={{transitionDelay: `${index * 0.05 + 0.4}s`}}> {/* Delay para cada item da lista */}
                        <CheckCircleTwoTone twoToneColor="var(--audience-color)" className="feature-check-icon" />
                        <Text>{item}</Text>
                      </List.Item>
                    )}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default TargetAudienceSection;