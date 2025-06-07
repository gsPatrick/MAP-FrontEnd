// src/componentsLP/BrandValuesSection/BrandValuesSection.jsx
import React, { useEffect } from 'react';
import { Row, Col, Typography } from 'antd';
import {
  RocketOutlined, // Inovação
  HeartOutlined, // Cuidado com o cliente
  CheckSquareOutlined, // Simplicidade
} from '@ant-design/icons';
import './BrandValuesSection.css';

const { Title, Paragraph } = Typography;

const valuesData = [
  {
    key: 'v1',
    icon: <CheckSquareOutlined />,
    title: 'Simplicidade',
    description: 'Acreditamos que a melhor tecnologia é aquela que desaparece, tornando sua vida mais fácil sem complicação.',
  },
  {
    key: 'v2',
    icon: <RocketOutlined />,
    title: 'Inovação Constante',
    description: 'Estamos sempre buscando novas formas de automatizar, otimizar e entregar mais valor para o seu dia a dia.',
  },
  {
    key: 'v3',
    icon: <HeartOutlined />,
    title: 'Cuidado Genuíno',
    description: 'Você não é apenas um usuário, é nosso parceiro. Seu bem-estar e sucesso são o nosso principal objetivo.',
  }
];

const BrandValuesSection = () => {
    useEffect(() => {
    const elementsToAnimate = document.querySelectorAll('.brand-values-section-wrapper .animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.2 });

    elementsToAnimate.forEach((el, index) => {
      el.style.transitionDelay = `${index * 0.15}s`;
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="brand-values-section-wrapper section-padding">
      <div className="section-container brand-values-container">
        <div className="section-header-centered animate-on-scroll">
          <Title level={2} className="section-title brand-values-title">
            Nossa Essência em Três Pilares
          </Title>
        </div>

        <Row gutter={[48, 40]} justify="center">
          {valuesData.map((value) => (
            <Col xs={24} md={8} key={value.key} className="value-item-col animate-on-scroll">
              <div className="value-item">
                <div className="value-icon-wrapper">
                  {value.icon}
                </div>
                <Title level={4} className="value-item-title">{value.title}</Title>
                <Paragraph className="value-item-description">{value.description}</Paragraph>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default BrandValuesSection;