// src/componentsLP/WaterReminderSection/WaterReminderSection.jsx - VERSÃO ULTRA
import React, { useEffect, useState } from 'react';
import { Row, Col, Typography } from 'antd';
import {
  ExperimentOutlined,
  SettingOutlined,
  WhatsAppOutlined,
  AimOutlined,
} from '@ant-design/icons';
import './WaterReminderSection.css';

const { Title, Paragraph } = Typography;

const featurePoints = [
    {
        id: 'config',
        icon: <SettingOutlined />,
        title: 'Totalmente Configurável',
        description: 'Defina seus horários de início e fim, escolha a frequência dos lembretes (de 2h, 3h ou personalizada) e ajuste tudo à sua rotina.',
    },
    {
        id: 'goal',
        icon: <AimOutlined />,
        title: 'Metas Personalizadas',
        description: 'Estabeleça sua meta diária de hidratação em ml. O MAP acompanha seu progresso e te ajuda a alcançar seu objetivo de bem-estar.',
    },
    {
        id: 'wpp',
        icon: <WhatsAppOutlined />,
        title: 'Lembretes Amigáveis no WhatsApp',
        description: 'Receba mensagens simpáticas e pontuais diretamente no seu chat, sem precisar abrir outro aplicativo. Um toque para não esquecer.',
    }
];

const WaterReminderSection = () => {
    const [progress, setProgress] = useState(5); // Inicia com um pouco de progresso

    useEffect(() => {
        const section = document.querySelector('.water-v2-section-wrapper');
        const elementsToAnimate = section.querySelectorAll('.animate-on-scroll');
        
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        if (entry.target.classList.contains('water-v2-mockup-wrapper')) {
                            // Inicia a animação da barra de progresso quando o celular aparece
                            setTimeout(() => setProgress(75), 500); // Anima para 75%
                        }
                    } else {
                        // Opcional: resetar a animação ao sair da tela
                        if (entry.target.classList.contains('water-v2-mockup-wrapper')) {
                           setProgress(5);
                        }
                    }
                });
            },
            { threshold: 0.2 }
        );

        elementsToAnimate.forEach((el) => observer.observe(el));
        
        return () => observer.disconnect();
    }, []);

    return (
        <div className="water-v2-section-wrapper section-padding-large">
            <div className="water-v2-bg-blur-layer"></div>
            <div className="water-v2-bg-grid"></div>

            <div className="section-container water-v2-container">
                <Row justify="center" className="water-v2-header-row">
                    <Col xs={24} md={20} lg={18} className="animate-on-scroll">
                        <Title level={2} className="water-v2-main-title">
                            Cuide do seu maior ativo: <span className="highlight-v2-cyan">você</span>.
                        </Title>
                        <Paragraph className="water-v2-main-subtitle">
                            A hidratação é a base da produtividade e do bem-estar. O MAP transforma esse hábito essencial em uma tarefa simples e automatizada, integrada à sua rotina.
                        </Paragraph>
                    </Col>
                </Row>

                <Row justify="center" align="middle" className="water-v2-main-content-row">
                    {/* --- Mockup Central do Celular --- */}
                    <Col xs={24} lg={10} className="water-v2-mockup-col">
                        <div className="water-v2-mockup-wrapper animate-on-scroll" style={{ transitionDelay: '0.2s' }}>
                            <div className="water-v2-mockup">
                                <div className="water-v2-mockup-notch"></div>
                                <div className="water-v2-screen">
                                    <div className="water-v2-screen-header">
                                        <ExperimentOutlined />
                                        <span>Hidratação Diária</span>
                                    </div>
                                    <div className="water-v2-progress-container">
                                        <div className="water-v2-liquid" style={{ height: `${progress}%` }}>
                                            <div className="water-v2-wave wave-1"></div>
                                            <div className="water-v2-wave wave-2"></div>
                                        </div>
                                        <div className="water-v2-progress-text">
                                            <span className="progress-value">{Math.round((progress / 100) * 2500)}ml</span>
                                            <span className="progress-goal">de 2500ml</span>
                                        </div>
                                    </div>
                                    <div className="water-v2-screen-footer">
                                        <span>Lembretes Ativados</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Col>

                    {/* --- Pontos de Funcionalidade --- */}
                    <Col xs={24} lg={14} className="water-v2-features-col">
                        <div className="water-v2-features-list">
                            {featurePoints.map((item, index) => (
                                <div key={item.id} className="water-v2-feature-item animate-on-scroll" style={{ transitionDelay: `${0.4 + index * 0.15}s` }}>
                                    <div className="feature-v2-icon-wrapper">
                                        {item.icon}
                                    </div>
                                    <div className="feature-v2-text-content">
                                        <Title level={4} className="feature-v2-title">{item.title}</Title>
                                        <Paragraph className="feature-v2-description">{item.description}</Paragraph>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default WaterReminderSection;