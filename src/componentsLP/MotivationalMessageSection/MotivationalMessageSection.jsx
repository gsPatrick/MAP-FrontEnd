// src/componentsLP/MotivationalMessageSection/MotivationalMessageSection.jsx - VERSÃO MELHORADA
import React, { useEffect, useRef } from 'react';
import { Row, Col, Typography } from 'antd';
import { BulbOutlined, WhatsAppOutlined } from '@ant-design/icons';
import './MotivationalMessageSection.css'; // Usará o novo CSS

const { Title, Paragraph } = Typography;

const MotivationalMessageSection = () => {
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
      { threshold: 0.1 }
    );

    elementsToAnimate.forEach((el) => observer.observe(el));

    // Efeito de Parallax no fundo
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { offsetWidth, offsetHeight } = currentSection;
      const xPos = (clientX / offsetWidth - 0.5) * -30; // -30 é a intensidade do movimento
      const yPos = (clientY / offsetHeight - 0.5) * -30;

      currentSection.querySelector('.motivation-v2-bg-blob1').style.transform = `translate(${xPos}px, ${yPos}px)`;
      currentSection.querySelector('.motivation-v2-bg-blob2').style.transform = `translate(${-xPos * 0.7}px, ${-yPos * 0.7}px)`;
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div ref={sectionRef} className="motivation-v2-section-wrapper section-padding-large">
      <div className="motivation-v2-background">
        <div className="motivation-v2-bg-blob1"></div>
        <div className="motivation-v2-bg-blob2"></div>
        <div className="motivation-v2-bg-stars"></div>
      </div>

      <div className="section-container motivation-v2-container">
        <Row justify="center">
          <Col xs={24} md={20} lg={18}>
            <div className="motivation-v2-content-box animate-on-scroll">
              <div className="motivation-v2-icon-container">
                <div className="motivation-v2-icon-ring ring-1"></div>
                <div className="motivation-v2-icon-ring ring-2"></div>
                <div className="motivation-v2-icon-ring ring-3"></div>
                <BulbOutlined className="motivation-v2-central-icon" />
              </div>
              <Title level={2} className="motivation-v2-main-title animate-on-scroll" style={{ transitionDelay: '0.2s' }}>
                Comece cada dia com um <span className="highlight-v2-magenta">impulso de ânimo</span>.
              </Title>
              <Paragraph className="motivation-v2-main-subtitle animate-on-scroll" style={{ transitionDelay: '0.3s' }}>
                O MAP vai além da organização. Ele cuida do seu bem-estar com mensagens inspiradoras, entregues diretamente no seu WhatsApp para iluminar sua jornada.
              </Paragraph>
              
              <div className="motivation-v2-mockup-bubble-wrapper animate-on-scroll" style={{ transitionDelay: '0.4s' }}>
                <div className="motivation-v2-mockup-bubble">
                    <div className="bubble-v2-header">
                        <WhatsAppOutlined className="bubble-v2-wpp-icon" />
                        <span className="bubble-v2-sender">MAP Assistente</span>
                    </div>
                    <Paragraph className="bubble-v2-message">
                      "O sucesso é a soma de pequenos esforços repetidos dia após dia." ✨
                    </Paragraph>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default MotivationalMessageSection;