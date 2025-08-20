// src/componentsLP/ChecklistSection/ChecklistSection.jsx
import React, { useEffect, useRef } from 'react';
import { Row, Col, Typography } from 'antd';
import {
  OrderedListOutlined,
  CheckCircleOutlined,
  RobotOutlined,
  FormOutlined,
  CheckCircleFilled,
  BorderOutlined,
  StarOutlined, // <<<<<<< ÍCONE CORRETO (substitui 'Sparkle')
} from '@ant-design/icons';
import './ChecklistSection.css'; // O CSS para esta seção

const { Title, Paragraph } = Typography;

const featurePoints = [
  {
    id: 'create-lists',
    icon: <OrderedListOutlined />,
    title: 'Crie Listas Poderosas',
    description: 'Defina suas tarefas e metas diárias ou semanais. Mantenha o foco no que realmente importa para você ou seu negócio.',
  },
  {
    id: 'track-progress',
    icon: <CheckCircleOutlined />,
    title: 'Acompanhamento Intuitivo',
    description: 'Marque itens como concluídos com um toque. Acompanhe seu progresso visualmente e sinta a satisfação de cada tarefa finalizada.',
  },
  {
    id: 'ai-celebration',
    icon: <RobotOutlined />,
    title: 'Reconhecimento Inteligente',
    description: 'Ao finalizar seu checklist, nosso assistente MAP envia uma mensagem motivacional exclusiva via WhatsApp, celebrando suas conquistas. 🎉',
  },
];

const ChecklistSection = () => {
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
      { threshold: 0.1 } // Dispara quando 10% do elemento está visível
    );

    elementsToAnimate.forEach((el, index) => {
      // Adiciona um pequeno atraso escalonado para cada elemento
      el.style.transitionDelay = `${0.1 + index * 0.1}s`;
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} id="checklist" className="checklist-section-wrapper section-padding-large">
      <div className="checklist-bg-elements">
        <div className="checklist-bg-shape shape-1 animate-on-scroll" style={{ transitionDelay: '0.1s' }}></div>
        <div className="checklist-bg-shape shape-2 animate-on-scroll" style={{ transitionDelay: '0.2s' }}></div>
        <div className="checklist-bg-glow animate-on-scroll" style={{ transitionDelay: '0.3s' }}></div>
      </div>
      
      <div className="section-container checklist-container">
        {/* --- Header da Seção --- */}
        <Row justify="center" className="checklist-header-row">
          <Col xs={24} md={20} lg={18} className="animate-on-scroll">
            <Title level={2} className="checklist-main-title">
              Organize seu dia, celebre suas <span className="highlight-checklist-gradient">conquistas</span>.
            </Title>
            <Paragraph className="checklist-main-subtitle">
              Mantenha suas tarefas pessoais e do negócio (PJ/MEI) em ordem. Receba um impulso de motivação e clareza ao concluir seu planejamento diário.
            </Paragraph>
          </Col>
        </Row>

        {/* --- Conteúdo Principal: Features e Mockup --- */}
        <Row justify="center" align="middle" gutter={[48, 48]} className="checklist-content-row">
          {/* Coluna da Esquerda: Pontos de Funcionalidade */}
          <Col xs={24} lg={12} className="checklist-features-col">
            <div className="checklist-features-list">
              {featurePoints.map((item, index) => (
                <div key={item.id} className="checklist-feature-item animate-on-scroll" style={{ transitionDelay: `${0.2 + index * 0.15}s` }}>
                  <div className="feature-icon-wrapper">
                    {item.icon}
                  </div>
                  <div className="feature-text-content">
                    <Title level={4} className="feature-title">{item.title}</Title>
                    <Paragraph className="feature-description">{item.description}</Paragraph>
                  </div>
                </div>
              ))}
            </div>
          </Col>

          {/* Coluna da Direita: Mockup de Celular */}
          <Col xs={24} lg={12} className="checklist-mockup-col">
            <div className="checklist-mockup-wrapper animate-on-scroll" style={{ transitionDelay: '0.4s' }}>
              <div className="checklist-mockup">
                <div className="checklist-mockup-notch"></div>
                <div className="checklist-mockup-screen">
                  <div className="checklist-screen-header">
                    <FormOutlined /> {/* Ícone válido */}
                    Meu Checklist
                  </div>
                  <div className="checklist-tasks-area">
                    <div className="task-item completed">
                      <CheckCircleFilled className="task-status-icon" />
                      <span className="task-text">Responder emails importantes</span>
                    </div>
                    <div className="task-item completed">
                      <CheckCircleFilled className="task-status-icon" />
                      <span className="task-text">Fazer lançamento financeiro</span>
                    </div>
                    <div className="task-item">
                      <BorderOutlined className="task-status-icon" />
                      <span className="task-text">Reunião de equipe (14h)</span>
                    </div>
                    <div className="task-item">
                      <BorderOutlined className="task-status-icon" />
                      <span className="task-text">Atualizar estoque de produtos</span>
                    </div>
                    <div className="task-item">
                      <BorderOutlined className="task-status-icon" />
                      <span className="task-text">Planejar posts da semana</span>
                    </div>
                  </div>
                  <div className="ai-celebration-overlay">
                    {/* <<<<<<< MUDANÇA IMPORTANTE: Substituído o ícone fictício */}
                    <StarOutlined className="sparkle-icon" />
                    <Paragraph>Parabéns, [Nome]! Todas as tarefas de hoje concluídas! Você é imparável! 💪✨</Paragraph>
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

export default ChecklistSection;