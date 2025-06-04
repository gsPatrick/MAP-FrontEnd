// src/componentsLP/BenefitsSection/BenefitsSection.jsx
import React, { useEffect } from 'react';
import { Typography, Row, Col, Card } from 'antd';
import {
  ClockCircleOutlined, // Economia de Tempo
  BarChartOutlined,    // Clareza Financeira
  CheckSquareOutlined, // Organização
  RobotOutlined,       // Inteligência Artificial
  MobileOutlined,      // Acesso Móvel
  SafetyCertificateOutlined, // Segurança
} from '@ant-design/icons';
import './BenefitsSection.css';

const { Title, Paragraph } = Typography;

const benefitsData = [
  {
    key: '1',
    icon: <ClockCircleOutlined />,
    title: 'Economia de Tempo Precioso',
    description:
      'Diga adeus às planilhas complexas. Com o MAP no Controle, registre tudo em segundos via WhatsApp e automatize tarefas repetitivas.',
  },
  {
    key: '2',
    icon: <BarChartOutlined />,
    title: 'Clareza Financeira Total',
    description:
      'Visualize suas receitas, despesas e fluxo de caixa de forma intuitiva. Tome decisões informadas com relatórios claros e precisos.',
  },
  {
    key: '3',
    icon: <CheckSquareOutlined />,
    title: 'Organização Sem Esforço',
    description:
      'Contas, compromissos e até estoque, tudo centralizado e acessível. Nunca mais perca um prazo ou informação importante.',
  },
  {
    key: '4',
    icon: <RobotOutlined />,
    title: 'Inteligência a Seu Favor',
    description:
      'Nossa IA trabalha por você, categorizando transações, enviando lembretes e ajudando a otimizar sua gestão financeira e administrativa.',
  },
  {
    key: '5',
    icon: <MobileOutlined />,
    title: 'Acesso de Onde Estiver',
    description:
      'Seu assistente pessoal no seu bolso. Gerencie tudo pelo WhatsApp ou acesse o dashboard completo de qualquer dispositivo conectado.',
  },
  {
    key: '6',
    icon: <SafetyCertificateOutlined />,
    title: 'Segurança e Confiança',
    description:
      'Seus dados são protegidos com tecnologia de ponta, garantindo privacidade e tranquilidade para você focar no que realmente importa.',
  },
];

const BenefitsSection = () => {
  useEffect(() => {
    const section = document.querySelector('.benefits-section-wrapper');
    const benefitCards = document.querySelectorAll('.benefit-card-item');

    const observerOptions = {
      threshold: 0.1, // Para a seção
    };
    const cardObserverOptions = {
      threshold: 0.2, // Para os cards
      rootMargin: "0px 0px -50px 0px" // Dispara um pouco antes de entrar totalmente na viewport
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
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          entry.target.style.animationDelay = `${index * 0.1}s`; // Stagger
          entry.target.classList.add('visible');
          cardObserver.unobserve(entry.target);
        }
      });
    }, cardObserverOptions);

    benefitCards.forEach(card => cardObserver.observe(card));
    
    return () => {
      if (section) sectionObserver.disconnect();
      cardObserver.disconnect();
    };
  }, []);

  return (
    <div className="benefits-section-wrapper section-padding">
      <div className="section-container benefits-section-container">
        <div className="section-header-centered">
          <Title level={2} className="section-title benefits-title">
            Por Que Escolher o <span className="highlight-brand-title">MAP no Controle</span>?
          </Title>
          <Paragraph className="section-subtitle benefits-subtitle">
            Descubra como nosso assistente inteligente pode revolucionar sua gestão diária,
            trazendo mais eficiência, controle e tranquilidade.
          </Paragraph>
        </div>

        <Row gutter={[32, 32]} justify="center">
          {benefitsData.map((benefit) => (
            <Col xs={24} sm={12} md={8} key={benefit.key} className="benefit-card-item">
              <Card bordered={false} className="benefit-card">
                <div className="benefit-icon-wrapper">
                  {/* O ícone em si será estilizado para branco via CSS */}
                  {benefit.icon}
                </div>
                <Title level={4} className="benefit-card-title">
                  {benefit.title}
                </Title>
                <Paragraph className="benefit-card-description">
                  {benefit.description}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default BenefitsSection;