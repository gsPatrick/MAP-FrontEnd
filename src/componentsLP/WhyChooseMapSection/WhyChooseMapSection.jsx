// src/componentsLP/BenefitsSection/BenefitsSection.jsx - VERSÃO "PILARES"
import React, { useEffect } from 'react';
import { Row, Col, Typography } from 'antd';
import {
  RocketOutlined,     // Eficiência
  EyeOutlined,        // Clareza
  HeartOutlined,      // Tranquilidade
  GlobalOutlined,     // Conectividade
} from '@ant-design/icons';
import './WhyChooseMapSection.css'; // Usará o novo CSS

const { Title, Paragraph } = Typography;

const benefitsPillarsData = [
  {
    key: 'efficiency',
    icon: <RocketOutlined />,
    title: 'Eficiência Incomparável',
    description: 'Recupere seu tempo mais valioso. O MAP automatiza tarefas repetitivas e centraliza sua gestão, permitindo que você foque no que realmente importa: crescer.',
    color: 'var(--map-laranja)'
  },
  {
    key: 'clarity',
    icon: <EyeOutlined />,
    title: 'Clareza Absoluta',
    description: 'Transforme dados confusos em insights poderosos. Com relatórios intuitivos e visão 360°, você toma decisões mais inteligentes para suas finanças e seu negócio.',
    color: 'var(--map-dourado)'
  },
  {
    key: 'peace',
    icon: <HeartOutlined />,
    title: 'Tranquilidade e Confiança',
    description: 'Durma em paz sabendo que tudo está sob controle. Lembretes automáticos, alertas proativos e segurança de ponta cuidam dos detalhes para você.',
    color: 'var(--map-laranja-escuro)' // Usando a cor 3
  },
];

const BenefitsSection = () => {
    useEffect(() => {
        const elementsToAnimate = document.querySelectorAll('.pillars-section-wrapper .animate-on-scroll');
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
            el.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

  return (
    <div id="beneficios" className="pillars-section-wrapper section-padding">
      <div className="pillars-background-shape shape-1"></div>
      <div className="pillars-background-shape shape-2"></div>
      
      <div className="section-container pillars-section-container">
        <div className="section-header-centered pillars-header animate-on-scroll">
          <Title level={2} className="section-title pillars-section-title">
            Por que o MAP é a Escolha Certa para <span className="highlight-pillars-gradient">Sua Jornada</span>?
          </Title>
          <Paragraph className="section-subtitle pillars-section-subtitle">
            Vamos além de funcionalidades. Entregamos uma transformação na sua forma de gerenciar o tempo, o dinheiro e a paz de espírito.
          </Paragraph>
        </div>

        <Row gutter={[32, 40]} justify="center">
          {benefitsPillarsData.map((pillar, index) => (
            <Col xs={24} md={8} key={pillar.key} className="pillar-card-col animate-on-scroll" style={{transitionDelay: `${0.2 + index * 0.15}s`}}>
              <div className="pillar-card" style={{'--pillar-color': pillar.color}}>
                <div className="pillar-card-icon-wrapper">
                  {pillar.icon}
                </div>
                <Title level={3} className="pillar-card-title">
                  {pillar.title}
                </Title>
                <Paragraph className="pillar-card-description">
                  {pillar.description}
                </Paragraph>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default BenefitsSection;