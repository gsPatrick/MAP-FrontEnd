// src/componentsLP/WhatsAppIntegrationSection/WhatsAppIntegrationSection.jsx
import React, { useEffect } from 'react';
import { Typography, Row, Col } from 'antd';
import { WhatsAppOutlined, RobotOutlined, SendOutlined, CheckCircleOutlined } from '@ant-design/icons';
import './WhatsAppIntegrationSection.css';

const { Title, Paragraph } = Typography;

const chatExamplesForMobileMockup = [
  { id: 'm_chat1', type: 'user', text: 'MAP, paguei a conta de luz R$150,20' },
  { id: 'm_chat2', type: 'map', text: 'Ok! Registrado: Despesa "Conta de Luz" R$150,20. 👍' },
  { id: 'm_chat3', type: 'user', text: 'Lembrete: Reunião Cliente Z amanhã 10h' },
  { id: 'm_chat4', type: 'map', text: 'Anotado! Lembrete "Reunião Cliente Z" para amanhã às 10:00. 🗓️' },
  { id: 'm_chat5', type: 'user', text: 'Saldo atual pf' },
  { id: 'm_chat6', type: 'map', text: 'Seu saldo pessoal é R$X.XXX,XX. Precisa de mais detalhes?' },
];

const WhatsAppIntegrationSection = () => {
  useEffect(() => {
    const section = document.querySelector('.wpp-integration-section-wrapper');
    const leftColumnElements = document.querySelectorAll('.wpp-left-column > .wpp-animate-entry');
    const mobileMockup = document.querySelector('.wpp-mobile-mockup');
    const chatBubbles = document.querySelectorAll('.wpp-mobile-chat-bubble-wrapper');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (entry.target.classList.contains('wpp-mobile-chat-bubble-wrapper')) {
                // Animação do balão é via CSS
            }
            // observer.unobserve(entry.target); // Para animar só uma vez
          } else {
            // entry.target.classList.remove('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (section) observer.observe(section);
    leftColumnElements.forEach((el, index) => {
      el.style.transitionDelay = `${0.2 + index * 0.15}s`;
      observer.observe(el);
    });
    if (mobileMockup) {
        mobileMockup.style.transitionDelay = '0.3s'; // Mockup entra um pouco depois da esquerda
        observer.observe(mobileMockup);
    }
    chatBubbles.forEach((bubble, index) => {
      // O delay da animação do balão é definido inline no CSS da classe de animação
      // mas podemos adicionar um stagger para a classe 'visible' se a animação depender disso
      bubble.style.animationDelay = `${0.6 + index * 0.3}s`; // Stagger para os balões aparecerem
      observer.observe(bubble); // Observar para aplicar a classe visible
    });

    return () => {
      if(section) observer.disconnect();
    };
  }, []);

  return (
    <div className="wpp-integration-section-wrapper section-padding-large">
      <div className="section-container wpp-integration-container">
        <Row gutter={[60, 40]} align="center" justify="center"> {/* Aumentado gutter */}
          {/* Coluna da Esquerda: Ícone WhatsApp Gigante e Frase de Impacto */}
          <Col xs={24} lg={10} className="wpp-left-column">
            <div className="wpp-main-icon-container wpp-animate-entry">
              <div className="wpp-icon-bg-rings">
                {/* Anéis são CSS puro */}
              </div>
              <WhatsAppOutlined className="wpp-central-icon-giant" />
            </div>
            <Title level={3} className="wpp-impact-phrase wpp-animate-entry">
              Sua vida financeira e agenda, <span className="wpp-highlight-bold">resolvidas por chat.</span>
            </Title>
            <Paragraph className="wpp-impact-subtitle wpp-animate-entry">
              Simples. Rápido. Inteligente.
            </Paragraph>
          </Col>

          {/* Coluna da Direita: Mockup de Celular com Chat */}
          <Col xs={24} lg={12} className="wpp-right-column">
            <div className="wpp-mobile-mockup wpp-animate-entry">
              <div className="wpp-mobile-mockup-notch"></div> {/* Notch do celular */}
              <div className="wpp-mobile-mockup-screen">
                <div className="wpp-mobile-chat-header">
                  <RobotOutlined /> MAP Assistente
                </div>
                <div className="wpp-mobile-chat-area">
                  {chatExamplesForMobileMockup.map((chat) => (
                    <div
                      key={chat.id}
                      className={`wpp-mobile-chat-bubble-wrapper ${chat.type === 'user' ? 'user' : 'map'}`}
                    >
                      <div className="wpp-mobile-chat-bubble">
                        <span className="wpp-mobile-chat-text">{chat.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="wpp-mobile-chat-input-area">
                  <span>Digite sua mensagem...</span>
                  <SendOutlined />
                </div>
              </div>
              <div className="wpp-mobile-mockup-side-button"></div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default WhatsAppIntegrationSection;