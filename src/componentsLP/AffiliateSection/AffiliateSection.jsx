// src/componentsLP/AffiliateSection/AffiliateSection.jsx
import React, { useEffect, useRef } from 'react';
import { Row, Col, Typography, Button } from 'antd';
import {
  ShareAltOutlined,
  UsergroupAddOutlined,
  DashboardOutlined,
  ArrowRightOutlined,
  RiseOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import './AffiliateSection.css'; // O CSS para esta seção

const { Title, Paragraph } = Typography;

const affiliateSteps = [
  {
    key: 'share',
    icon: <ShareAltOutlined />,
    title: 'Ative e Compartilhe',
    description: 'Acesse seu painel, pegue seu link exclusivo e compartilhe com sua rede de contatos, amigos e clientes.',
  },
  {
    key: 'track',
    icon: <DashboardOutlined />,
    title: 'Acompanhe em Tempo Real',
    description: 'Visualize todos os seus indicados, o status de suas assinaturas e o crescimento do seu saldo diretamente no seu dashboard.',
  },
  {
    key: 'earn',
    icon: <WalletOutlined />,
    title: 'Receba Suas Comissões',
    description: 'Seu saldo é atualizado a cada novo assinante. Acumule e solicite o saque dos seus ganhos de forma simples e segura.',
  },
];

const AffiliateSection = () => {
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
    <div ref={sectionRef} id="afiliados" className="affiliate-section-wrapper section-padding-large">
      <div className="affiliate-bg-glow"></div>
      <div className="affiliate-bg-grid"></div>

      <div className="section-container affiliate-container">
        {/* --- Conteúdo Principal: Texto e Mockup --- */}
        <Row justify="center" align="middle" gutter={[64, 48]} className="affiliate-content-row">
          {/* Coluna da Esquerda: Texto e Passos */}
          <Col xs={24} lg={12} className="affiliate-text-col">
            <Title level={2} className="affiliate-main-title animate-on-scroll">
              Seja um Parceiro e <span className="highlight-affiliate-text">Cresça Conosco</span>.
            </Title>
            <Paragraph className="affiliate-main-subtitle animate-on-scroll" style={{ transitionDelay: '0.2s' }}>
              Acreditamos no poder da comunidade. Indique o No Controle e seja recompensado por nos ajudar a levar organização e inteligência a mais pessoas e negócios.
            </Paragraph>

            <div className="affiliate-steps-list">
              {affiliateSteps.map((item, index) => (
                <div key={item.key} className="affiliate-step-item animate-on-scroll" style={{ transitionDelay: `${0.3 + index * 0.15}s` }}>
                  <div className="affiliate-step-icon-wrapper">
                    {item.icon}
                  </div>
                  <div className="affiliate-step-text-content">
                    <Title level={4} className="affiliate-step-title">{item.title}</Title>
                    <Paragraph className="affiliate-step-description">{item.description}</Paragraph>
                  </div>
                </div>
              ))}
            </div>
          </Col>

          {/* Coluna da Direita: Mockup do Dashboard */}
          <Col xs={24} lg={12} className="affiliate-visual-col animate-on-scroll" style={{ transitionDelay: '0.3s' }}>
            <div className="affiliate-dashboard-mockup">
              <div className="dashboard-mockup-header">
                <DashboardOutlined />
                <span>Meu Painel de Afiliado</span>
              </div>
              <div className="dashboard-mockup-content">
                <div className="referral-link-section">
                  <Paragraph className="referral-link-label">Seu Link de Indicação</Paragraph>
                  <div className="referral-link-box">
                    <span>mapnocontrole.com.br/?ref=SEUCODIGO</span>
                  </div>
                </div>
                <Row gutter={16} className="kpi-row">
                  <Col span={12}>
                    <div className="kpi-card">
                      <UsergroupAddOutlined className="kpi-icon" />
                      <Paragraph className="kpi-label">Total de Indicados</Paragraph>
                      <Paragraph className="kpi-value">42</Paragraph>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="kpi-card">
                      <WalletOutlined className="kpi-icon" />
                      <Paragraph className="kpi-label">Saldo Disponível</Paragraph>
                      <Paragraph className="kpi-value">R$ 3.250,00</Paragraph>
                    </div>
                  </Col>
                </Row>
                <div className="chart-section">
                  <div className="chart-header">
                     <RiseOutlined />
                     <span>Desempenho Mensal</span>
                  </div>
                  <div className="chart-bars">
                    <div className="bar" style={{ height: '40%' }}></div>
                    <div className="bar" style={{ height: '65%' }}></div>
                    <div className="bar" style={{ height: '55%' }}></div>
                    <div className="bar" style={{ height: '80%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default AffiliateSection;