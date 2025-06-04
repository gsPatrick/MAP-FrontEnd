// src/componentsLP/AboutCreatorSection/AboutCreatorSection.jsx
import React, { useEffect } from 'react';
import { Row, Col, Typography } from 'antd';
import {
  HeartFilled,
  AimOutlined, // Para "Nascido para Simplificar"
  RobotOutlined, // Para "Funcionalidades Inteligentes"
  ShopOutlined, // Para "Soluções para Negócios"
} from '@ant-design/icons';
import './AboutCreatorSection.css';

// Imagem da criadora - substitua pelo caminho correto da sua imagem
import creatorImage from '../../assets/images/daniele-aguiar.png';

const { Title, Paragraph } = Typography;

const cardData = [
  {
    id: 'card1',
    icon: <AimOutlined />,
    title: 'Nascido para Simplificar',
    text: 'O MAP nasceu do desejo de facilitar a vida de quem precisa de organização, foco e bem-estar no dia a dia. Pensado nos mínimos detalhes, este aplicativo foi criado para oferecer o melhor atendimento e controle na palma da sua mão.',
    delay: '0.2s',
  },
  {
    id: 'card2',
    icon: <RobotOutlined />,
    title: 'Seu Assistente Pessoal Completo',
    text: 'Com lembretes personalizados, como o de tomar água, controle financeiro completo, integração com a Google Agenda e muitas outras funcionalidades práticas, o MAP é um verdadeiro assistente pessoal.',
    delay: '0.35s',
  },
  {
    id: 'card3',
    icon: <ShopOutlined />,
    title: 'MAP para Empresas: Gestão Integrada',
    text: 'Além do plano individual, o MAP também oferece um plano empresarial completo, ideal para pequenos e médios negócios. Nele, você conta com controle de estoque, cadastro de clientes e organização de rotina comercial, tudo em um só lugar.',
    delay: '0.5s',
  },
];

const AboutCreatorSection = () => {
  useEffect(() => {
    const elementsToAnimate = document.querySelectorAll('.about-creator-section-wrapper .animate-on-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            // entry.target.classList.remove('visible');
          }
        });
      },
      { threshold: 0.1 } // Anima quando 10% do elemento está visível
    );

    elementsToAnimate.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-creator-section-wrapper section-padding-large">
      <div className="background-ring ring1"></div>
      <div className="background-ring ring2"></div>
      <div className="background-ring ring3 modern-blob1"></div> {/* Elemento gráfico adicional */}


      <div className="section-container about-creator-container">
        <Row justify="center" className="about-creator-header-row">
          <Col xs={24} md={10} lg={8} className="about-creator-image-col animate-on-scroll">
            <div className="about-creator-image-outer-ring">
              <div className="about-creator-image-container">
                 <img src={creatorImage} alt="Daniele Aguiar, criadora do MAP" className="creator-image-actual" /> 
              </div>
            </div>
          </Col>
          <Col xs={24} md={14} lg={16} className="about-creator-title-col animate-on-scroll" style={{ animationDelay: '0.1s' }}>
            <Title level={2} className="about-creator-main-title">
              Desenvolvido com <HeartFilled className="title-heart-icon" /> para transformar sua rotina
            </Title>
            <Paragraph className="about-creator-subtitle">
              Conheça a essência e as soluções que o MAP oferece para você e seu negócio.
            </Paragraph>
          </Col>
        </Row>

        {/* Grid de Cards */}
        <Row gutter={[24, 24]} className="about-cards-grid">
          {cardData.map((card) => (
            <Col xs={24} sm={24} md={8} key={card.id} className="animate-on-scroll" style={{ animationDelay: card.delay }}>
              <div className="modern-feature-card">
                <div className="card-icon-wrapper">
                  {card.icon}
                </div>
                <Title level={4} className="card-title">{card.title}</Title>
                <Paragraph className="card-text">{card.text}</Paragraph>
              </div>
            </Col>
          ))}
        </Row>

        <Row justify="center" className="about-creator-conclusion-row">
          <Col xs={24} lg={20} className="animate-on-scroll" style={{ animationDelay: '0.6s' }}>
            <Paragraph className="about-creator-idealizer">
              Idealizado e desenvolvido com muito carinho pela empresária <span className="creator-name">Daniele Aguiar</span>, o MAP é mais do que um app — é uma ferramenta feita para cuidar de você, da sua empresa e do seu tempo.
            </Paragraph>
            <div className="about-creator-impact-phrase-wrapper">
              <span className="quote-icon left-quote">“</span>
              <Paragraph className="about-creator-impact-phrase">
                Com o MAP, você não perde o tempo… <span className="highlight-control">você ganha o controle</span>.
              </Paragraph>
              <span className="quote-icon right-quote">”</span>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default AboutCreatorSection;