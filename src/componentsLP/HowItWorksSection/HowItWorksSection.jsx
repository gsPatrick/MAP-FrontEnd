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

const stepsDataUpdated = [
  {
    id: 'register',
    mainIcon: <FormOutlined />,
    title: '1. Crie Sua Conta Online',
    description: 'Acesse nossa plataforma, faça seu cadastro em minutos e escolha o plano ideal. Tudo simples, rápido e seguro.',
    highlightColor: 'var(--map-dourado)',
  },
  {
    id: 'interfaces',
    mainIcon: <BranchesOutlined />,
    secondaryIcons: [<WhatsAppOutlined key="wpp" />, <DesktopOutlined key="desk" />],
    title: '2. Use no WhatsApp ou Painel Web',
    description: 'Adicione nosso contato no WhatsApp para comandos ágeis ou acesse seu painel web completo. Mesmas funcionalidades, sua escolha.',
    highlightColor: 'var(--map-laranja)',
  },
  {
    id: 'interact',
    mainIcon: <RobotOutlined />,
    title: '3. Interaja com a IA e Automatize',
    description: 'Converse com o MAP para registrar transações, agendar tarefas e mais. No WhatsApp ou no chat do painel, a IA está pronta!',
    highlightColor: 'var(--map-dourado)',
  },
  {
    id: 'control',
    mainIcon: <LineChartOutlined />,
    title: '4. Domine Sua Gestão',
    description: 'Visualize relatórios, acompanhe o desempenho e tome decisões informadas com todas as suas informações organizadas 24/7.',
    highlightColor: 'var(--map-laranja-escuro)',
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
          // Animar elementos internos do card quando o card se torna visível
          if (entry.target.classList.contains('hiw-updated-step-card-wrapper')) {
            const card = entry.target.querySelector('.hiw-updated-step-card');
            if (card) {
              const elementsToAnimate = card.querySelectorAll('.hiw-card-el-animate');
              elementsToAnimate.forEach((el, idx) => {
                el.style.transitionDelay = `${idx * 0.1 + 0.2}s`; // Stagger para elementos internos
                el.classList.add('el-visible');
              });
            }
          }
          // obs.unobserve(entry.target); // Para animar apenas uma vez
        } else {
          // entry.target.classList.remove('visible'); // Para re-animar
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

    const observer = new IntersectionObserver(observerCallback, { threshold: 0.15 });

    sectionElements.forEach((el) => observer.observe(el));
    cardWrappers.forEach((el, index) => {
        el.style.transitionDelay = `${index * 0.12}s`; // Stagger para os cards em si
        observer.observe(el);
    });
    
    return () => {
        sectionElements.forEach(el => observer.unobserve(el));
        cardWrappers.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="hiw-updated-section-wrapper">
      <div className="hiw-updated-section-container">
        <Title level={2} className="hiw-updated-main-title hiw-updated-section-animate">
          Como o <span className="highlight-brand">MAP no Controle</span> Transforma Sua Rotina
        </Title>
        <Paragraph className="hiw-updated-main-subtitle hiw-updated-section-animate" style={{transitionDelay: '0.1s'}}>
          Em apenas alguns passos, você terá um assistente pessoal inteligente ao seu dispor, onde e como precisar.
        </Paragraph>

        <div className="hiw-updated-steps-layout">
          <Row gutter={[32, 32]} justify="center">
            {stepsDataUpdated.map((step) => ( // Removido 'index' daqui se não for usado para key ou delay no wrapper
              <Col xs={24} sm={12} lg={6} key={step.id} className="hiw-updated-step-card-wrapper hiw-updated-section-animate">
                <div className="hiw-updated-step-card">
                  <div className="hiw-updated-step-icon-container hiw-card-el-animate"> {/* Animar container do ícone */}
                    {React.cloneElement(step.mainIcon, {
                      className: 'hiw-updated-main-step-icon', // Animação específica para o ícone pode ser aqui
                      style: { color: step.highlightColor },
                    })}
                    {step.secondaryIcons && (
                      <div className="hiw-updated-secondary-icons">
                        {step.secondaryIcons.map((icon, idx) => React.cloneElement(icon, {
                          key: idx,
                          className: 'hiw-updated-sec-icon hiw-card-el-animate', // Animar ícones secundários
                          style: { transitionDelay: `${(idx * 0.08) + 0.35}s` } // Stagger para ícones secundários
                        }))}
                      </div>
                    )}
                  </div>
                  <Title level={4} className="hiw-updated-step-title hiw-card-el-animate">{step.title}</Title>
                  <Paragraph className="hiw-updated-step-description hiw-card-el-animate">{step.description}</Paragraph>
                </div>
                {/* Conectores CSS (mantidos como placeholder) */}
                {/* {index < stepsDataUpdated.length - 1 && <div className="hiw-updated-connector-placeholder"></div>} */}
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksSection;