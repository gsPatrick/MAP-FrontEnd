// src/componentsLP/ContactPromptSection/ContactPromptSection.jsx
import React, { useEffect } from 'react';
import { Typography, Button, Card } from 'antd';
import { WhatsAppOutlined } from '@ant-design/icons';
import './ContactPromptSection.css'; // Certifique-se que o caminho está correto

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
              // observer.unobserve(entry.target); // Descomente para animar apenas uma vez
            } else {
              // entry.target.classList.remove('visible'); // Opcional: re-animar
            }
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(section);
      return () => observer.disconnect();
    }
  }, []);

  const handleContactClick = () => {
    console.log('Botão Fale Conosco clicado');
    // LEMBRE-SE DE ATUALIZAR SEU NÚMERO DE WHATSAPP AQUI
    window.open('https://wa.me/SEUNUMEROWHATSAPP', '_blank');
  };

  return (
    <div className="contact-prompt-section-wrapper section-padding-enhanced">
      <div className="section-container contact-prompt-container">
        <Card bordered={false} className="contact-prompt-card elevated">
          <div className="card-icon-accent">
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
            type="primary" // Mantido como primary para AntD aplicar estilos base, mas vamos sobrescrever
            size="large"
            icon={<WhatsAppOutlined className="button-icon-animated" />}
            className="contact-prompt-button gradient-button"
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