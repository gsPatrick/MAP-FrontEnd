// src/componentsLP/FooterLP/FooterLP.jsx
import React, { useEffect } from 'react';
import { Layout, Row, Col, Typography, Space, Divider } from 'antd';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'; // Importado useNavigate e useLocation
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
  const navigate = useNavigate();
  const location = useLocation(); // Para verificar se já estamos na Landing Page

  useEffect(() => {
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
        { threshold: 0.5 }
      );
      observer.observe(devCreditsElement);
      return () => observer.disconnect();
    }
  }, []);

  const handleFooterLinkClick = (e, targetId) => {
    e.preventDefault(); // Previne a navegação padrão do link
    
    // Verifica se o targetId é uma rota completa ou um ID de seção
    if (targetId.startsWith('/')) {
      navigate(targetId); // Navega para a rota se for uma URL completa
      window.scrollTo({ top: 0, behavior: 'auto' }); // Rola para o topo da nova página
    } else {
      // Se estamos na Landing Page (path '/'), rola para a seção
      if (location.pathname === '/') {
        const section = document.getElementById(targetId);
        if (section) {
          const headerOffset = document.querySelector('.lp-header')?.offsetHeight || 70;
          const elementPosition = section.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - headerOffset - 10;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        } else {
          console.warn(`Seção com id "${targetId}" não encontrada na Landing Page.`);
          // Poderia navegar para a raiz e tentar ancorar, mas pode ser confuso se a seção não existir
          // navigate(`/#${targetId}`); 
        }
      } else {
        // Se não estamos na Landing Page, navega para ela com o hash
        navigate(`/#${targetId}`);
        // A rolagem para o hash será tratada pelo navegador ou por um useEffect na LandingPage se necessário
      }
    }
  };


  const footerLinks = [
    { to: 'funcionalidades', label: 'Funcionalidades' },
    { to: 'planos', label: 'Planos' },
    { to: 'faq', label: 'Perguntas Frequentes' }, // ID de seção
  ];

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
              {footerLinks.map(link => (
                <li key={link.to}>
                  {/* 
                    Usamos <a> com onClick para links de seção para ter controle total sobre a rolagem.
                    Para rotas completas, podemos usar RouterLink ou <a> com onClick que chama navigate.
                  */}
                  <a href={link.to.startsWith('/') ? link.to : `#${link.to}`} onClick={(e) => handleFooterLinkClick(e, link.to)}>
                    {link.label}
                  </a>
                </li>
              ))}
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
                <a href="https://wa.me/5521995557002" target="_blank" rel="noopener noreferrer">
                  WhatsApp Suporte
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        {/* Créditos ao Desenvolvedor */}

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