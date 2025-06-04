// src/componentsLP/GoogleCalendarSection/GoogleCalendarSection.jsx
import React, { useEffect } from 'react';
import { Typography, Row, Col } from 'antd'; // Card e Tag removidos se as features forem mais simples
import {
  GoogleOutlined, // Ícone principal do Google
  CalendarOutlined,
  ClockCircleOutlined,
  RetweetOutlined,
  CheckSquareOutlined,
  ShareAltOutlined,
  SettingOutlined,
  BellOutlined,      // Ícone flutuante
  PlusCircleFilled // Ícone flutuante
} from '@ant-design/icons';
import './GoogleCalendarSection.css';

const { Title, Paragraph } = Typography;

const agendaFeaturesData = [
  {
    key: '1',
    icon: <CalendarOutlined />,
    title: 'Eventos Claros',
    color: '#4285F4', // Blue
  },
  {
    key: '2',
    icon: <ClockCircleOutlined />,
    title: 'Lembretes Pontuais',
    color: '#DB4437', // Red
  },
  {
    key: '3',
    icon: <RetweetOutlined />,
    title: 'Recorrências Inteligentes',
    color: '#F4B400', // Yellow
  },
  {
    key: '4',
    icon: <CheckSquareOutlined />,
    title: 'Tarefas e Metas',
    color: '#0F9D58', // Green
  },
  {
    key: '5',
    icon: <ShareAltOutlined />,
    title: 'Compartilhamento Fácil',
    color: '#7c4dff', // Purple (cor exemplo, pode ajustar se quiser manter padrão Google)
  },
  {
    key: '6',
    icon: <SettingOutlined />,
    title: 'Visual Personalizável',
    color: '#ff6d00', // Orange (cor exemplo)
  },
];

const GoogleCalendarSection = () => {
  useEffect(() => {
    const section = document.querySelector('.gcal-focused-section-wrapper');
    const mainIconContainer = document.querySelector('.gcal-main-icon-container');
    const title = document.querySelector('.gcal-focused-main-title');
    const subtitle = document.querySelector('.gcal-focused-main-subtitle');
    const featureItems = document.querySelectorAll('.gcal-focused-feature-item');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // observer.unobserve(entry.target); // Para animar só uma vez
          } else {
            // entry.target.classList.remove('visible'); // Para re-animar
          }
        });
      },
      { threshold: 0.05 }
    );

    if (section) observer.observe(section);
    if (mainIconContainer) {
        mainIconContainer.style.transitionDelay = '0.1s';
        observer.observe(mainIconContainer);
    }
    if (title) {
        title.style.transitionDelay = '0.3s';
        observer.observe(title);
    }
    if (subtitle) {
        subtitle.style.transitionDelay = '0.4s';
        observer.observe(subtitle);
    }
    featureItems.forEach((item, index) => {
      item.style.transitionDelay = `${0.5 + index * 0.08}s`;
      observer.observe(item);
    });
    
    return () => {
      if(section) observer.disconnect();
    };
  }, []);

  return (
    <div className="gcal-focused-section-wrapper section-padding-large">
      <div className="section-container gcal-focused-container">
        <div className="gcal-main-icon-container">
          <div className="gcal-main-icon-rings">
            {/* Anéis são puramente CSS agora para simplicidade no JSX */}
          </div>
          <GoogleOutlined className="gcal-central-google-icon" />
          {/* Ícones flutuantes relacionados à agenda */}
          <CalendarOutlined className="gcal-floating-item gcal-float-calendar" />
          <BellOutlined className="gcal-floating-item gcal-float-bell" />
          <PlusCircleFilled className="gcal-floating-item gcal-float-plus" />
        </div>

        <Title level={2} className="gcal-focused-main-title">
          Sua Agenda, <span className="gcal-highlight-google-animated">MAP no Controle</span>.
        </Title>
        <Paragraph className="gcal-focused-main-subtitle">
          Organização intuitiva com a inteligência e o design que você já conhece e confia,
          agora integrados à sua gestão completa.
        </Paragraph>

        <Row gutter={[20, 30]} className="gcal-features-grid">
          {agendaFeaturesData.map((feature) => (
            <Col xs={12} sm={8} md={6} lg={4} key={feature.key} className="gcal-focused-feature-item">
              <div className="gcal-feature-icon-wrapper-focused" style={{ '--feature-color': feature.color, '--feature-color-rgb': feature.color === '#4285F4' ? '66,133,244' : feature.color === '#DB4437' ? '219,68,55' : feature.color === '#F4B400' ? '244,180,0' : feature.color === '#0F9D58' ? '15,157,88' : feature.color === '#7c4dff' ? '124,77,255' : '255,109,0' }}>
                {React.cloneElement(feature.icon, { className: 'gcal-feature-icon-inner' })}
              </div>
              <Paragraph className="gcal-feature-title-focused">{feature.title}</Paragraph>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default GoogleCalendarSection;