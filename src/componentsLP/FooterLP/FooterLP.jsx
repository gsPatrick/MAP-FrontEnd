// src/componentsLP/FooterLP/FooterLP.jsx
import React, { useEffect } from 'react';
import { Layout, Row, Col, Typography, Space, Divider } from 'antd';
import { Link } from 'react-router-dom';
import {
  MailOutlined,
  WhatsAppOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  YoutubeOutlined,
  LineChartOutlined, // Placeholder para logo
  HeartFilled, // Para os créditos
} from '@ant-design/icons';
import './FooterLP.css';

const { Footer: AntFooter } = Layout;
const { Title, Paragraph, Text } = Typography;

const FooterLP = () => {
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // Animação para os créditos do desenvolvedor
    const devCreditsElement = document.querySelector('.footer-dev-credits');
    if (devCreditsElement) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 } // Dispara quando 50% do elemento está visível
      );
      observer.observe(devCreditsElement);
      return () => observer.disconnect();
    }
  }, []);


  return (
    <AntFooter className="lp-footer-wrapper">
      <div className="section-container lp-footer-container">
        <Row gutter={[32, 32]} justify="space-between" className="footer-main-content">
          {/* Coluna 1: Sobre a Empresa/Marca */}
          <Col xs={24} sm={24} md={10} lg={8} className="footer-col">
            <div className="footer-logo-area">
              <LineChartOutlined className="footer-logo-icon" />
              <Title level={4} className="footer-brand-name">
                No Controle
              </Title>
            </div>
            <Paragraph className="footer-brand-description">
              Seu assistente pessoal inteligente para gestão financeira e administrativa,
              simplificando seu dia a dia com a praticidade do WhatsApp e o poder da IA.
            </Paragraph>
            <Space size="middle" className="footer-social-icons">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <InstagramOutlined />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <LinkedinOutlined />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <YoutubeOutlined />
              </a>
            </Space>
          </Col>

          {/* Coluna 2: Links Úteis */}
          <Col xs={24} sm={12} md={6} lg={5} className="footer-col">
            <Title level={5} className="footer-col-title">Links Rápidos</Title>
            <ul className="footer-links-list">
              <li><Link to="/#funcionalidades">Funcionalidades</Link></li>
              <li><Link to="/#planos">Planos</Link></li>
              <li><Link to="/termos-de-uso">Termos de Uso</Link></li>
              <li><Link to="/politica-de-privacidade">Política de Privacidade</Link></li>
              <li><Link to="/faq">Perguntas Frequentes</Link></li>
            </ul>
          </Col>

          {/* Coluna 3: Contato */}
          <Col xs={24} sm={12} md={8} lg={6} className="footer-col">
            <Title level={5} className="footer-col-title">Entre em Contato</Title>
            <ul className="footer-contact-list">
              <li>
                <MailOutlined />
                <a href="mailto:contato@mapnocontrole.com.br">contato@mapnocontrole.com.br</a>
              </li>
              <li>
                <WhatsAppOutlined />
                <a href="https://wa.me/SEUNUMEROWHATSAPP" target="_blank" rel="noopener noreferrer">
                  WhatsApp Suporte
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        {/* Créditos ao Desenvolvedor */}
        <Row justify="center" className="footer-dev-credits-row">
          <Col>
            <Paragraph className="footer-dev-credits">
              Desenvolvido com <HeartFilled className="dev-heart-icon" /> por{' '}
              <a href="https://codebypatrick.dev" target="_blank" rel="noopener noreferrer" className="dev-link">
                Patrick.Developer
              </a>
            </Paragraph>
          </Col>
        </Row>

        <Divider className="footer-divider" />

        <Row>
          <Col span={24} style={{ textAlign: 'center' }}>
            <Text className="footer-copyright">
              © {currentYear} No Controle. Todos os direitos reservados.
            </Text>
          </Col>
        </Row>
      </div>
    </AntFooter>
  );
};

export default FooterLP;