// src/componentsLP/DashboardSection/DashboardSection.jsx - VERSÃO DE TRANSIÇÃO FLUIDA
import React, { useEffect, useRef } from 'react';
import { Row, Col, Typography } from 'antd';
import {
  DesktopOutlined,
  AreaChartOutlined,
  SolutionOutlined,
  SettingOutlined,
  PieChartOutlined,
  WalletOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import './DashboardSection.css'; // Usará o novo CSS de Transição

const { Title, Paragraph } = Typography;

const dashboardFeaturesData = [
  {
    icon: <AreaChartOutlined />,
    title: 'Visão Analítica Completa',
    text: 'Gráficos interativos e relatórios detalhados que transformam seus dados brutos em insights poderosos para tomada de decisão.'
  },
  {
    icon: <SolutionOutlined />,
    title: 'Hub de Gestão Integrado',
    text: 'Centralize clientes, produtos e compromissos. Uma visão 360° do seu negócio em uma interface coesa e intuitiva.'
  },
  {
    icon: <SettingOutlined />,
    title: 'Controle e Personalização',
    text: 'Ajuste cada detalhe do sistema. Configure recorrências, automações e personalize a plataforma para operar do seu jeito.'
  }
];

const DashboardSection = () => {
    const sectionRef = useRef(null);

    useEffect(() => {
        const currentSection = sectionRef.current;
        if (!currentSection) return;

        const elementsToAnimate = currentSection.querySelectorAll('.animate-on-scroll');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        elementsToAnimate.forEach((el, index) => {
            el.style.transitionDelay = `${0.2 + index * 0.1}s`;
            observer.observe(el);
        });

        const panelContainer = currentSection.querySelector('.flow-panel-container');
        const handleMouseMove = (e) => {
            if(!panelContainer) return;
            const { clientX, clientY } = e;
            const { left, top, width, height } = currentSection.getBoundingClientRect();
            const x = (clientX - left - width / 2) / (width / 2);
            const y = (clientY - top - height / 2) / (height / 2);

            panelContainer.style.setProperty('--rot-x', `${-y * 5}deg`);
            panelContainer.style.setProperty('--rot-y', `${x * 5}deg`);
        };
        
        currentSection.addEventListener('mousemove', handleMouseMove);

        return () => {
            observer.disconnect();
            currentSection.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

  return (
    <div ref={sectionRef} id="dashboard" className="dashboard-flow-section-wrapper section-padding-large">
       {/* Elementos de fundo e transição */}
       <div className="dashboard-flow-background">
            <div className="flow-bg-stars"></div>
            <div className="flow-bg-nebula"></div>
       </div>
       <div className="flow-transition-top"></div>

      <div className="section-container dashboard-flow-container">
        {/* --- Header da Seção --- */}
        <Row justify="center" className="dashboard-flow-header-row">
          <Col xs={24} md={20} lg={18} className="animate-on-scroll">
            <div className="dashboard-flow-header-icon-wrapper">
                <DesktopOutlined className="dashboard-flow-header-icon" />
            </div>
            <Title level={2} className="dashboard-flow-main-title">
              Do Chat para o <span className="highlight-flow-text">Centro de Comando</span>.
            </Title>
            <Paragraph className="dashboard-flow-main-subtitle">
              A agilidade do WhatsApp encontra o poder da análise visual. Mergulhe nos seus dados em um painel de controle completo e intuitivo.
            </Paragraph>
          </Col>
        </Row>

        {/* --- Painel Gráfico Central --- */}
        <Row justify="center">
            <Col xs={24} className="animate-on-scroll" style={{ transitionDelay: '0.3s' }}>
                <div className="flow-panel-container">
                    {/* Linhas de energia que conectam com a seção anterior */}
                    <div className="energy-flow-lines">
                        <div className="line"></div>
                        <div className="line"></div>
                        <div className="line"></div>
                        <div className="line"></div>
                    </div>

                    <div className="flow-panel-frame">
                        <div className="panel-flow-grid"></div>
                        {/* Widgets simulados */}
                        <div className="flow-widget widget-chart">
                            <div className="flow-widget-header"><AreaChartOutlined /> <span>Receita Mensal</span></div>
                            <div className="flow-widget-content chart-bars-flow">
                                <div className="bar" style={{height: '50%'}}></div>
                                <div className="bar" style={{height: '75%'}}></div>
                                <div className="bar" style={{height: '60%'}}></div>
                                <div className="bar" style={{height: '85%'}}></div>
                            </div>
                        </div>
                        <div className="flow-widget widget-kpi-top">
                             <div className="flow-widget-header"><WalletOutlined /> <span>Saldo Atual</span></div>
                             <div className="flow-widget-content kpi-value-flow">R$ 12.3k</div>
                        </div>
                        <div className="flow-widget widget-kpi-bottom">
                            <div className="flow-widget-header"><CalendarOutlined /> <span>Compromissos</span></div>
                            <div className="flow-widget-content kpi-value-flow">3 Hoje</div>
                        </div>
                         <div className="flow-widget widget-pie">
                            <div className="flow-widget-header"><PieChartOutlined /> <span>Despesas</span></div>
                            <div className="flow-widget-content pie-chart-flow"></div>
                        </div>
                    </div>
                </div>
            </Col>
        </Row>
        
        {/* --- Grid de Benefícios do Dashboard --- */}
        <Row gutter={[32, 32]} justify="center" className="dashboard-flow-features-row">
            {dashboardFeaturesData.map((feature, index) => (
                <Col xs={24} md={8} key={index} className="animate-on-scroll" style={{ transitionDelay: `${0.5 + index * 0.15}s` }}>
                    <div className="dashboard-flow-feature-card">
                        <div className="feature-flow-icon-wrapper">
                            {feature.icon}
                        </div>
                        <Title level={4} className="feature-flow-title">{feature.title}</Title>
                        <Paragraph className="feature-flow-text">{feature.text}</Paragraph>
                    </div>
                </Col>
            ))}
        </Row>

      </div>
       <div className="flow-transition-bottom"></div>
    </div>
  );
};

export default DashboardSection;