// src/componentsLP/HowItWorksSection/HowItWorksSection.jsx
import React, { useEffect } from 'react';
import { Row, Col, Typography } from 'antd';
import {
  FormOutlined,
  BranchesOutlined,
  RobotOutlined,
  LineChartOutlined,
  WhatsAppOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import './HowItWorksSection.css'; // Certifique-se que este é o arquivo correto

const { Title, Paragraph } = Typography;

// A propriedade highlightColor foi removida pois os ícones serão brancos
// e o fundo do card é fixo.
const stepsDataUpdated = [
  {
    id: 'register',
    mainIcon: <FormOutlined />,
    title: '1. Crie Sua Conta Online',
    description: 'Acesse nossa plataforma, faça seu cadastro em minutos e escolha o plano ideal. Tudo simples, rápido e seguro.',
  },
  {
    id: 'interfaces',
    mainIcon: <BranchesOutlined />,
    secondaryIcons: [<WhatsAppOutlined key="wpp" />, <DesktopOutlined key="desk" />],
    title: '2. Use no WhatsApp ou Painel Web',
    description: 'Adicione nosso contato no WhatsApp para comandos ágeis ou acesse seu painel web completo. Mesmas funcionalidades, sua escolha.',
  },
  {
    id: 'interact',
    mainIcon: <RobotOutlined />,
    title: '3. Interaja com a IA e Automatize',
    description: 'Converse com o MAP para registrar transações, agendar tarefas e mais. No WhatsApp ou no chat do painel, a IA está pronta!',
  },
  {
    id: 'control',
    mainIcon: <LineChartOutlined />,
    title: '4. Domine Sua Gestão',
    description: 'Visualize relatórios, acompanhe o desempenho e tome decisões informadas com todas as suas informações organizadas 24/7.',
  },
];

const HowItWorksSection = () => {
  useEffect(() => {
    const sectionElements = document.querySelectorAll('.hiw-updated-section-animate');
    const cardWrappers = document.querySelectorAll('.hiw-updated-step-card-wrapper');

    const observerCallback = (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (entry.target.classList.contains('hiw-updated-step-card-wrapper')) {
            const card = entry.target.querySelector('.hiw-updated-step-card');
            if (card) {
              const elementsToAnimate = card.querySelectorAll('.hiw-card-el-animate');
              elementsToAnimate.forEach((el, idx) => {
                el.style.transitionDelay = `${idx * 0.1 + 0.25}s`; // Stagger para elementos internos
                el.classList.add('el-visible');
              });
            }
          }
          // obs.unobserve(entry.target); // Para animar apenas uma vez
        } else {
           // Opcional: remover classes para re-animar ao sair e entrar na viewport
          // entry.target.classList.remove('visible');
          // if (entry.target.classList.contains('hiw-updated-step-card-wrapper')) {
          //   const card = entry.target.querySelector('.hiw-updated-step-card');
          //   if (card) {
          //     const elementsToAnimate = card.querySelectorAll('.hiw-card-el-animate');
          //     elementsToAnimate.forEach((el) => el.classList.remove('el-visible'));
          //   }
          // }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, { threshold: 0.1 });

    sectionElements.forEach((el) => observer.observe(el));
    cardWrappers.forEach((el, index) => {
        el.style.transitionDelay = `${index * 0.15}s`; // Stagger para os cards em si
        observer.observe(el);
    });
    
    return () => {
        sectionElements.forEach(el => observer.disconnect && observer.unobserve(el));
        cardWrappers.forEach(el => observer.disconnect && observer.unobserve(el));
    };
  }, []);

  return (
    <div className="hiw-updated-section-wrapper">
      <div className="hiw-updated-section-container">
        <Title level={2} className="hiw-updated-main-title hiw-updated-section-animate">
          Como o <span className="highlight-brand-gold">MAP no Controle</span> Transforma Sua Rotina
        </Title>
        <Paragraph className="hiw-updated-main-subtitle hiw-updated-section-animate" style={{transitionDelay: '0.1s'}}>
          Em apenas alguns passos, você terá um assistente pessoal inteligente ao seu dispor, onde e como precisar.
        </Paragraph>

        <div className="hiw-updated-steps-layout">
          <Row gutter={[32, 40]} justify="center"> {/* Aumentado gutter vertical */}
            {stepsDataUpdated.map((step) => (
              <Col xs={24} sm={12} lg={6} key={step.id} className="hiw-updated-step-card-wrapper hiw-updated-section-animate">
                <div className="hiw-updated-step-card">
                  <div className="hiw-updated-step-icon-container hiw-card-el-animate">
                    {React.cloneElement(step.mainIcon, {
                      className: 'hiw-updated-main-step-icon',
                    })}
                    {step.secondaryIcons && (
                      <div className="hiw-updated-secondary-icons">
                        {step.secondaryIcons.map((icon, idx) => React.cloneElement(icon, {
                          key: idx,
                          className: 'hiw-updated-sec-icon hiw-card-el-animate',
                          style: { transitionDelay: `${(idx * 0.1) + 0.4}s` } // Stagger para ícones secundários
                        }))}
                      </div>
                    )}
                  </div>
                  <Title level={4} className="hiw-updated-step-title hiw-card-el-animate">{step.title}</Title>
                  <Paragraph className="hiw-updated-step-description hiw-card-el-animate">{step.description}</Paragraph>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;