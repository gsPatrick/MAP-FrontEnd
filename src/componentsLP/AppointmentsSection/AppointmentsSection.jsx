// src/componentsLP/AppointmentsSection/AppointmentsSection.jsx
import React, { useEffect } from 'react';
import { Row, Col, Typography } from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  GoogleOutlined,
  BellOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './AppointmentsSection.css';

const { Title, Paragraph } = Typography;

const appointmentFeaturesData = [
  {
    id: 'feat1',
    icon: <TeamOutlined />,
    title: 'Conecte seus Clientes',
    text: 'Associe clientes do seu negócio a cada compromisso. Mantenha um histórico completo e organize sua carteira de forma visual e integrada.',
    delay: '0.2s',
  },
  {
    id: 'feat2',
    icon: <GoogleOutlined />,
    title: 'Sincronia com Google Agenda',
    text: 'Integração bidirecional perfeita. Crie ou altere eventos no MAP ou no Google Calendar e veja tudo ser atualizado em tempo real, sem esforço.',
    delay: '0.35s',
  },
  {
    id: 'feat3',
    icon: <BellOutlined />,
    title: 'Lembretes Automáticos',
    text: 'Configure lembretes personalizados para você e seus clientes. Reduza o não comparecimento e esteja sempre preparado para o próximo passo.',
    delay: '0.5s',
  },
];

const AppointmentsSection = () => {
  useEffect(() => {
    const elementsToAnimate = document.querySelectorAll('.appointments-section-wrapper .animate-on-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            // entry.target.classList.remove('visible'); // Para re-animar
          }
        });
      },
      { threshold: 0.1 }
    );

    elementsToAnimate.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    // Adicione o ID 'agendamentos' se quiser linkar a partir do menu
    <div id="agendamentos" className="appointments-section-wrapper section-padding-large">
      <div className="background-accent-blob blob-a1"></div>
      <div className="background-accent-blob blob-a2"></div>

      <div className="section-container appointments-container">
        {/* --- Linha Principal com Ícone e Mockup --- */}
        <Row justify="center" align="middle" gutter={[48, 48]} className="appointments-main-row">
          <Col xs={24} lg={12} className="appointments-text-col animate-on-scroll">
            <div className="appointments-icon-container">
              <div className="appointments-icon-rings"></div>
              <CalendarOutlined className="appointments-central-icon" />
            </div>
            <Title level={2} className="appointments-main-title">
              Sua agenda <span className="highlight-brand">inteligente</span>, sempre sob controle.
            </Title>
            <Paragraph className="appointments-main-subtitle">
              Conecte seus compromissos, clientes e finanças em uma plataforma unificada. Nunca mais perca uma oportunidade.
            </Paragraph>
          </Col>

          <Col xs={24} lg={12} className="appointments-visual-col animate-on-scroll" style={{ animationDelay: '0.2s' }}>
            <div className="appointments-mockup-card">
              <div className="mockup-card-header">
                Próximos Compromissos
              </div>
              <div className="mockup-events-list">
                <div className="mockup-event-item confirmed">
                  <div className="mockup-event-time"><ClockCircleOutlined /> 09:00</div>
                  <div className="mockup-event-title">Reunião de Alinhamento</div>
                  <div className="mockup-event-client"><UserOutlined /> Cliente Corp S.A.</div>
                </div>
                <div className="mockup-event-item pending">
                  <div className="mockup-event-time"><ClockCircleOutlined /> 14:30</div>
                  <div className="mockup-event-title">Consulta de Retorno</div>
                  <div className="mockup-event-client"><UserOutlined /> Paciente Silva</div>
                </div>
                <div className="mockup-event-item personal">
                  <div className="mockup-event-time"><ClockCircleOutlined /> 18:00</div>
                  <div className="mockup-event-title">Academia - Treino B</div>
                  <div className="mockup-event-client">Pessoal</div>
                </div>
                 <div className="mockup-event-item cancelled">
                  <div className="mockup-event-time"><ClockCircleOutlined /> 20:00</div>
                  <div className="mockup-event-title">Jantar com Amigos</div>
                  <div className="mockup-event-client">Cancelado</div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* --- Grid de Cards com Funcionalidades Detalhadas --- */}
        <Row gutter={[24, 24]} className="appointments-features-grid">
          {appointmentFeaturesData.map((card) => (
            <Col xs={24} sm={24} md={8} key={card.id} className="animate-on-scroll" style={{ animationDelay: card.delay }}>
              <div className="appointments-feature-card">
                <div className="card-icon-wrapper">
                  {card.icon}
                </div>
                <Title level={4} className="card-title">{card.title}</Title>
                <Paragraph className="card-text">{card.text}</Paragraph>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default AppointmentsSection;