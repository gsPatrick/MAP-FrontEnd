// src/componentsLP/ContactPromptSection/ContactPromptSection.jsx
import React, { useEffect } from 'react';
import { Typography, Button, Card } from 'antd';
import { WhatsAppOutlined } from '@ant-design/icons';
import './ContactPromptSection.css';

const { Title, Paragraph } = Typography;

const ContactPromptSection = () => {
  useEffect(() => {
    const section = document.querySelector('.contact-prompt-section-wrapper');
    if (section) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              // Descomente abaixo para animar apenas uma vez
              // observer.unobserve(entry.target);
            } else {
              // Opcional: remover a classe para re-animar ao sair da view
              // entry.target.classList.remove('visible');
            }
          });
        },
        { threshold: 0.2 } // Aumentar um pouco o threshold para garantir que mais do card esteja visível
      );
      observer.observe(section);
      return () => observer.disconnect();
    }
  }, []);

  const handleContactClick = () => {
    console.log('Botão Fale Conosco clicado');
    window.open('https://wa.me/SEUNUMEROWHATSAPP', '_blank'); // Lembre-se de colocar seu número
  };

  return (
    <div className="contact-prompt-section-wrapper section-padding-enhanced"> {/* Nova classe para padding */}
      <div className="section-container contact-prompt-container">
        <Card bordered={false} className="contact-prompt-card elevated"> {/* Nova classe 'elevated' */}
          <div className="card-icon-accent"> {/* Ícone de acento no card */}
            <WhatsAppOutlined />
          </div>
          <Title level={3} className="contact-prompt-title">
            Queremos te ouvir!
          </Title>
          <Paragraph className="contact-prompt-text">
            Nossa equipe de especialistas está pronta para te ajudar a dar o próximo passo
            e responder a todas as suas perguntas.
          </Paragraph>
          <Button
            type="primary" // Mudar para primary para um visual mais destacado
            size="large"
            icon={<WhatsAppOutlined className="button-icon-animated" />} // Ícone animado
            className="contact-prompt-button gradient-button" // Nova classe para botão com gradiente
            onClick={handleContactClick}
          >
            Fale com um Especialista
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default ContactPromptSection;