// src/componentsLP/DedicatedSupportSection/DedicatedSupportSection.jsx
import React, { useEffect, useRef } from 'react';
import { Row, Col, Typography, Button } from 'antd';
import {
  WhatsAppOutlined,
  QuestionCircleOutlined, // Para "Respostas Instantâneas"
  CodeOutlined,           // Para "Guia de Comandos"
  ClockCircleOutlined,    // Para "Sempre Disponível"
} from '@ant-design/icons';
import './DedicatedSupportSection.css'; // O CSS para esta seção

const { Title, Paragraph } = Typography;

const supportFeatures = [
  {
    key: 'faq',
    icon: <QuestionCircleOutlined />,
    title: 'Respostas Instantâneas',
    description: 'Tire dúvidas sobre funcionalidades, planos e como usar o sistema. Nossa IA está pronta para responder às perguntas mais comuns.',
  },
  {
    key: 'guide',
    icon: <CodeOutlined />,
    title: 'Guia de Comandos',
    description: 'Não sabe como registrar uma despesa ou agendar um compromisso? O MAP Suporte te ensina o comando exato para usar no bot principal.',
  },
  {
    key: 'availability',
    icon: <ClockCircleOutlined />,
    title: 'Sempre Disponível',
    description: 'Nosso assistente de suporte não dorme. Tenha ajuda e orientação a qualquer hora do dia, 7 dias por semana.',
  },
];

const DedicatedSupportSection = () => {
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
    <div ref={sectionRef} id="suporte" className="support-section-wrapper section-padding-large">
      <div className="support-bg-glow"></div>
      <div className="support-bg-grid"></div>
      
      <div className="section-container support-container">
        {/* --- Header da Seção --- */}
        <Row justify="center" className="support-header-row">
          <Col xs={24} md={20} className="animate-on-scroll">
            <Title level={2} className="support-main-title">
              Um Canal <span className="highlight-support-green">Exclusivo</span> para Suas Dúvidas
            </Title>
            <Paragraph className="support-main-subtitle">
              Conheça o MAP, seu assistente de suporte 24h. Um número de WhatsApp dedicado para te guiar, tirar dúvidas e garantir que você aproveite 100% do No Controle.
            </Paragraph>
          </Col>
        </Row>

        {/* --- Conteúdo Principal: Mockup e Features --- */}
        <Row justify="center" align="middle" gutter={[48, 48]} className="support-content-row">
          {/* Coluna da Esquerda: Mockup Visual */}
          <Col xs={24} lg={10} className="support-mockup-col animate-on-scroll" style={{ transitionDelay: '0.2s' }}>
            <div className="support-mockup-card">
              <div className="mockup-icon-header">
                <WhatsAppOutlined />
              </div>
              <Title level={4} className="mockup-contact-name">MAP Suporte 24h</Title>
              <Paragraph className="mockup-phone-number">+55 21 99555-7002</Paragraph>
              <Paragraph className="mockup-info-text">Seu assistente para dúvidas e FAQ.</Paragraph>
              <Button 
                type="primary" 
                className="mockup-cta-button" 
                icon={<WhatsAppOutlined />}
                onClick={() => window.open('https://wa.me/5521995557002', '_blank')}
              >
                Salvar Contato
              </Button>
            </div>
          </Col>

          {/* Coluna da Direita: Pontos de Funcionalidade do Suporte */}
          <Col xs={24} lg={14} className="support-features-col">
            <div className="support-features-list">
              {supportFeatures.map((item, index) => (
                <div key={item.key} className="support-feature-item animate-on-scroll" style={{ transitionDelay: `${0.4 + index * 0.15}s` }}>
                  <div className="support-feature-icon-wrapper">
                    {item.icon}
                  </div>
                  <div className="support-feature-text-content">
                    <Title level={4} className="support-feature-title">{item.title}</Title>
                    <Paragraph className="support-feature-description">{item.description}</Paragraph>
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

export default DedicatedSupportSection;