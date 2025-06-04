// src/componentsLP/FaqSection/FaqSection.jsx
import React, { useEffect } from 'react';
import { Typography, Collapse, Space } from 'antd';
import { QuestionCircleOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import './FaqSection.css';

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

// Lista de Perguntas e Respostas
const faqData = [
  {
    key: '1',
    question: 'O "MAP no Controle" é seguro para minhas informações financeiras?',
    answer:
      'Sim, a segurança dos seus dados é nossa prioridade máxima. Utilizamos criptografia de ponta para proteger todas as suas informações e seguimos as melhores práticas de segurança de dados. Suas interações e registros são confidenciais.',
  },
  {
    key: '2',
    question: 'Preciso instalar algum aplicativo para usar o sistema?',
    answer:
      'Para interagir com o assistente via WhatsApp, você não precisa instalar nada além do próprio WhatsApp. Nossa plataforma web, com o dashboard completo, será acessível através de qualquer navegador moderno em seu computador ou dispositivo móvel, sem necessidade de instalação.',
  },
  {
    key: '3',
    question: 'Quais tipos de contas financeiras posso gerenciar?',
    answer:
      'O "MAP no Controle" é flexível! Você pode gerenciar diferentes perfis financeiros, como "Pessoal (PF)", "Empresa (PJ)" ou "MEI", permitindo uma organização clara e separada das suas finanças pessoais e dos seus negócios.',
  },
  {
    key: '4',
    question: 'Como o assistente no WhatsApp entende meus comandos?',
    answer:
      'Nosso assistente utiliza Inteligência Artificial avançada (integrada com tecnologias como GPT da OpenAI) para interpretar suas mensagens em linguagem natural. Ele é treinado para entender intenções como registrar gastos, agendar pagamentos, consultar saldos, e extrair os dados relevantes da sua conversa.',
  },
  {
    key: '5',
    question: 'O sistema oferece lembretes para contas a pagar?',
    answer:
      'Sim! Você pode registrar contas a pagar e a receber com datas de vencimento. O sistema enviará lembretes automáticos para que você nunca mais perca um prazo importante.',
  },
  {
    key: '6',
    question: 'Existe algum plano gratuito ou período de teste?',
    answer:
      'Estamos definindo nossos planos, mas planejamos oferecer opções acessíveis, incluindo um possível período de teste para que você possa experimentar as funcionalidades chave do "MAP no Controle" antes de se decidir. Fique atento aos nossos anúncios!',
  },
];

const FaqSection = () => {
  useEffect(() => {
    // Animação de entrada para a seção
    const section = document.querySelector('.faq-section-wrapper');
    if (section) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target); // Opcional: observar apenas uma vez
            }
          });
        },
        { threshold: 0.1 } // Dispara quando 10% da seção está visível
      );
      observer.observe(section);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div className="faq-section-wrapper section-padding">
      <div className="section-container faq-section-container">
        <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: '40px' }}>
          <Title level={2} className="section-title faq-title">
            Ainda tem Dúvidas?
          </Title>
          <Paragraph className="section-subtitle faq-subtitle">
            Encontre aqui respostas para as perguntas mais comuns sobre o MAP no Controle.
          </Paragraph>
        </Space>

        <Collapse
          accordion // Apenas um painel pode estar aberto por vez
          bordered={false} // Remove a borda padrão do Collapse
          className="faq-collapse"
          expandIcon={({ isActive }) => (isActive ? <MinusOutlined /> : <PlusOutlined />)}
          // defaultActiveKey={['1']} // Para deixar um painel aberto por padrão
        >
          {faqData.map((item) => (
            <Panel
              header={
                <span className="faq-question-header">
                  <QuestionCircleOutlined className="faq-question-icon" />
                  {item.question}
                </span>
              }
              key={item.key}
              className="faq-panel"
            >
              <Paragraph className="faq-answer">{item.answer}</Paragraph>
            </Panel>
          ))}
        </Collapse>
        <Paragraph className="faq-contact-prompt">
          Não encontrou sua dúvida?{' '}
          <a href="mailto:suporte@mapnocontrole.com.br" className="faq-contact-link">
            Entre em contato conosco!
          </a>
        </Paragraph>
      </div>
    </div>
  );
};

export default FaqSection;