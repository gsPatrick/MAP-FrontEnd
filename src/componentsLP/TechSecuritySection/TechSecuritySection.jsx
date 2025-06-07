// src/componentsLP/TechSecuritySection/TechSecuritySection.jsx - VERSÃO "BLUEPRINT"
import React, { useEffect, useRef } from 'react';
import { Row, Col, Typography } from 'antd';
import {
  SafetyCertificateOutlined,
  ApiOutlined,
  RobotOutlined,
  UnlockOutlined,
  CloudServerOutlined,
  MessageOutlined,
  GoogleOutlined,
  WhatsAppOutlined
} from '@ant-design/icons';
import './TechSecuritySection.css';

const { Title, Paragraph, Text } = Typography;

const techPillarsData = [
  {
    key: 'ai',
    icon: <RobotOutlined />,
    title: 'Inteligência Artificial que Entende Você',
    description: 'Nossa IA foi treinada para ir além de simples comandos. Ela interpreta, aprende e automatiza, transformando uma simples conversa em ações precisas de gestão.',
    subpoints: [
      { icon: <MessageOutlined />, text: 'Processamento de Linguagem Natural (PLN) para interações fluidas.' },
      { icon: <CloudServerOutlined />, text: 'Categorização automática de transações baseada em seu histórico.' },
      { icon: <UnlockOutlined />, text: 'Extração de dados de agendamentos e pagamentos de forma segura.' },
    ],
    color: 'var(--map-laranja)' // Laranja para IA
  },
  {
    key: 'security',
    icon: <SafetyCertificateOutlined />,
    title: 'Arquitetura de Segurança Robusta',
    description: 'A tranquilidade dos seus dados não é um opcional, é a nossa fundação. Adotamos múltiplas camadas de proteção para garantir sua privacidade e a integridade das suas informações.',
    subpoints: [
      { icon: <UnlockOutlined />, text: 'Criptografia AES-256 para dados em repouso e em trânsito.' },
      { icon: <CloudServerOutlined />, text: 'Infraestrutura em nuvem com os mais altos padrões de segurança.' },
      { icon: <ApiOutlined />, text: 'Políticas rigorosas de acesso e controle de dados.' },
    ],
    color: 'var(--map-dourado)' // Dourado para Segurança
  }
];

const TechSecuritySection = () => {
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

        elementsToAnimate.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

  return (
    <div ref={sectionRef} className="blueprint-section-wrapper section-padding-large">
      <div className="blueprint-background-grid"></div>
      
      <div className="section-container blueprint-section-container">
        <div className="section-header-centered blueprint-header animate-on-scroll">
          <Title level={2} className="section-title blueprint-section-title">
            Projetado para <span className="highlight-blueprint-orange">Performar</span>. Construído para <span className="highlight-blueprint-gold">Proteger</span>.
          </Title>
          <Paragraph className="section-subtitle blueprint-section-subtitle">
            Conheça os pilares tecnológicos que fazem do MAP no Controle uma ferramenta poderosa, intuitiva e, acima de tudo, confiável.
          </Paragraph>
        </div>

        <Row justify="center" align="middle" gutter={[48, 48]}>
            <Col xs={24} lg={12} className="blueprint-visual-col animate-on-scroll" style={{ transitionDelay: '0.2s' }}>
                <div className="blueprint-central-core">
                    <div className="core-pulse"></div>
                    <div className="core-icon-main">MAP</div>
                    <div className="orbiting-icon icon-ai">
                        <RobotOutlined />
                    </div>
                    <div className="orbiting-icon icon-security">
                        <SafetyCertificateOutlined />
                    </div>
                    <div className="orbiting-icon icon-wpp">
                        <WhatsAppOutlined />
                    </div>
                    <div className="orbiting-icon icon-gcal">
                        <GoogleOutlined />
                    </div>
                </div>
            </Col>
            <Col xs={24} lg={12} className="blueprint-pillars-col">
                {techPillarsData.map((pillar, index) => (
                    <div key={pillar.key} className="blueprint-pillar-item animate-on-scroll" style={{ transitionDelay: `${0.4 + index * 0.2}s` }}>
                        <div className="pillar-header">
                            <div className="pillar-icon-wrapper" style={{'--pillar-color': pillar.color}}>
                                {pillar.icon}
                            </div>
                            <Title level={4} className="pillar-title">{pillar.title}</Title>
                        </div>
                        <Paragraph className="pillar-description">{pillar.description}</Paragraph>
                        <ul className="pillar-subpoints-list">
                            {pillar.subpoints.map(sub => (
                                <li key={sub.text}>
                                    {React.cloneElement(sub.icon, {style: {color: pillar.color}})}
                                    <Text>{sub.text}</Text>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </Col>
        </Row>
      </div>
    </div>
  );
};

export default TechSecuritySection;