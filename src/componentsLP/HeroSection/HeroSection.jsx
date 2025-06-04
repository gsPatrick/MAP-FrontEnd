// src/componentsLP/HeroSection/HeroSection.jsx
import React, { useEffect } from 'react';
import { Row, Col, Button, Typography, Card } from 'antd';
import {
  WhatsAppOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  AimOutlined,
  PieChartOutlined,
  MessageOutlined,
  BellOutlined,
} from '@ant-design/icons';
import './HeroSection.css';

const { Title, Paragraph } = Typography;

const HeroSection = () => {
  useEffect(() => {
    const heroElements = document.querySelectorAll('.hero-animate, .graphic-element-animate');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // observer.unobserve(entry.target); // Descomente para animar apenas uma vez
        } else {
          // entry.target.classList.remove('visible'); // Descomente para re-animar ao rolar para fora e dentro da view
        }
      });
    }, { threshold: 0.1 }); // Ajuste o threshold conforme necessário

    heroElements.forEach(el => {
      observer.observe(el);
    });

    return () => heroElements.forEach(el => observer.unobserve(el));
  }, []);

  const handleCTAClick = () => {
    console.log("CTA da Hero Section clicado!");
    // navigate('/planos') ou scroll para seção de planos/cadastro
  };

  return (
    <div className="hero-section-wrapper">
      <div className="hero-section-container">
        <Row gutter={[48, 48]} align="middle" className="hero-row">
          {/* Coluna de Texto */}
          <Col xs={24} md={12} className="hero-text-col">
            <Title level={1} className="hero-headline hero-animate">
              Controle Total, <span className="highlight-orange-new">Zero Complicação</span>.
              Seu Assistente Pessoal Inteligente.
            </Title>
            <Paragraph className="hero-subheadline hero-animate">
              Com o <strong className="highlight-brand-new">No Controle</strong>, gerencie suas finanças,
              tarefas e até o estoque do seu negócio diretamente pelo WhatsApp.
              Inteligência Artificial que trabalha para você, 24/7.
            </Paragraph>
            <div className="hero-features-preview hero-animate">
              <div className="feature-item">
                <SafetyCertificateOutlined className="feature-icon-new" /> Segurança Avançada
              </div>
              <div className="feature-item">
                <AimOutlined className="feature-icon-new" /> IA Precisa
              </div>
              <div className="feature-item">
                <WhatsAppOutlined className="feature-icon-new" /> Gestão via WhatsApp
              </div>
            </div>
            <Button
              type="primary"
              size="large"
              className="hero-cta-button hero-animate"
              onClick={handleCTAClick}
            >
              Experimente o Controle Total
            </Button>
            <Paragraph className="hero-cta-subtext hero-animate">
              Transforme sua rotina agora. Simples e eficaz.
            </Paragraph>
          </Col>

          {/* Coluna de Elementos Gráficos Revisada */}
          <Col xs={24} md={12} className="hero-graphics-col">
            <div className="graphics-main-container">
              {/* Mockup Principal do Celular */}
              <div className="mockup-phone-main graphic-element-animate" style={{animationDelay: '0.2s'}}>
                <div className="mockup-phone-screen">
                  {/* Conteúdo da tela do celular */}
                  <div className="screen-header">
                    <span className="screen-time">09:41</span>
                    <span><WhatsAppOutlined /> MAP Assessor</span>
                    <BellOutlined />
                  </div>
                  <div className="screen-content">
                    <div className="chat-message received">
                      <Paragraph strong>MAP:</Paragraph>
                      <Paragraph>Seu resumo diário está pronto! Alguma despesa nova hoje?</Paragraph>
                    </div>
                    <div className="chat-message sent"> {/* Estilo do balão "sent" será atualizado no CSS */}
                      <Paragraph>Sim, paguei o fornecedor X, R$150.</Paragraph>
                    </div>
                    <div className="chat-message received">
                      <Paragraph strong>MAP:</Paragraph>
                      <Paragraph>Registrado com sucesso! 👍</Paragraph>
                    </div>
                  </div>
                  <div className="screen-footer">
                    <span>Aa</span> <EditOutlined /> <MessageOutlined />
                  </div>
                </div>
              </div>

              {/* Elementos de UI Flutuantes */}
              <Card className="floating-ui-element ui-card-1 graphic-element-animate" style={{animationDelay: '0.4s'}}>
                <PieChartOutlined className="ui-card-icon-1" style={{ fontSize: '24px', marginRight: '10px' }} /> {/* Classe para cor específica */}
                <div>
                  <Title level={5} style={{ margin: 0 }}>Despesas do Mês</Title>
                  <Paragraph style={{ margin: 0, fontSize: '12px' }}>R$ 1.235,50</Paragraph>
                </div>
              </Card>

              <Card className="floating-ui-element ui-card-2 graphic-element-animate" style={{animationDelay: '0.6s'}}>
                <SafetyCertificateOutlined className="ui-card-icon-2" style={{ fontSize: '24px', marginRight: '10px' }} /> {/* Classe para cor específica */}
                <div>
                  <Title level={5} style={{ margin: 0 }}>Dados Protegidos</Title>
                  <Paragraph style={{ margin: 0, fontSize: '12px' }}>Criptografia Ativa</Paragraph>
                </div>
              </Card>
              
              <div className="floating-ui-element ui-bubble-1 graphic-element-animate" style={{animationDelay: '0.8s'}}> {/* Estilo do bubble será atualizado no CSS */}
                <WhatsAppOutlined /> Saldo Atualizado!
              </div>

              {/* Formas Decorativas de Fundo */}
              <div className="decorative-blob blob-1 graphic-element-animate" style={{animationDelay: '0.1s'}}></div>
              <div className="decorative-blob blob-2 graphic-element-animate" style={{animationDelay: '0.3s'}}></div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default HeroSection;