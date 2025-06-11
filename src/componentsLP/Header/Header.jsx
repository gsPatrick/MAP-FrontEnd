// src/componentsLP/Header/Header.jsx

import React, { useState, useEffect } from 'react';
// <<< MUDANÇA 1: Importar useLocation
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Row, Col, Drawer, Space } from 'antd';
import { MenuOutlined, LineChartOutlined, LoginOutlined } from '@ant-design/icons';
import './Header.css';

const { Header: AntHeader } = Layout;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation(); // <<< MUDANÇA 2: Obter a localização atual
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeKey, setActiveKey] = useState('');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 480);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const handleResize = () => {
      setIsMobileView(window.innerWidth < 480);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    handleResize(); 

    const currentHash = window.location.hash.replace('#', '');
    if (currentHash) {
      setActiveKey(currentHash);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // <<< MUDANÇA 3: A lógica de navegação foi completamente atualizada
  const handleMenuClick = (key) => {
    setActiveKey(key);
    if (drawerVisible) {
      closeDrawer();
    }

    // Verifica se estamos na página inicial (Landing Page)
    if (location.pathname === '/') {
      // Se estivermos na LP, usamos a rolagem suave existente
      if (key) {
        const section = document.getElementById(key);
        if (section) {
          const headerOffset = document.querySelector('.lp-header')?.offsetHeight || 70;
          const elementPosition = section.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - headerOffset - 10;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        } else {
          console.warn(`Seção com id "${key}" não encontrada.`);
        }
      } else {
        // Clique no logo para ir ao topo da LP
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Se estivermos em outra página (ex: /planos), navegamos para a LP com a âncora
      if (key) {
        navigate(`/#${key}`);
      } else {
        // Clique no logo para voltar à página inicial
        navigate('/');
      }
    }
  };

  const menuItems = [
    { key: 'funcionalidades', label: 'Funcionalidades', onClick: () => handleMenuClick('funcionalidades') },
    { key: 'beneficios', label: 'Benefícios', onClick: () => handleMenuClick('beneficios') },
    { key: 'planos', label: 'Planos', onClick: () => handleMenuClick('planos') },
    { key: 'sobre', label: 'Sobre', onClick: () => handleMenuClick('sobre') },
  ];

  return (
    <AntHeader className={`lp-header ${isScrolled ? 'scrolled' : ''}`}>
      <Row justify="space-between" align="middle" className="header-row" wrap={false}>
        <Col flex="1" className="logo-column">
          {/* O clique no logo agora também usa a nova lógica handleMenuClick */}
          <a onClick={() => handleMenuClick('')} className="logo-link" style={{ cursor: 'pointer' }}>
            <LineChartOutlined className="logo-icon-placeholder" />
            <span className="logo-text">No Controle</span>
          </a>
        </Col>

        <Col xs={0} sm={0} md={14} lg={12} xl={10} className="menu-desktop-col">
          <Menu
            mode="horizontal"
            items={menuItems.map(item => ({ key: item.key, label: item.label, onClick: item.onClick }))}
            selectedKeys={[activeKey]}
            className="header-menu"
            disabledOverflow={true}
          />
        </Col>

        <Col className="actions-column">
          <Space size="small" align="center">
            {!isMobileView && (
                 <Button
                    type="primary"
                    className="header-action-button"
                    onClick={handleLoginClick}
                  >
                   Acessar Plataforma
                 </Button>
            )}
            <Button
              className="menu-mobile-button"
              type="text"
              icon={<MenuOutlined />}
              onClick={showDrawer}
            />
          </Space>
        </Col>
      </Row>

      <Drawer
        title={
          <a onClick={() => { handleMenuClick(''); closeDrawer();}} className="drawer-logo-link" style={{ cursor: 'pointer' }}>
            <LineChartOutlined className="logo-icon-placeholder drawer-logo-icon" />
            <span className="logo-text drawer-logo-text">No Controle</span>
          </a>
        }
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        className="menu-drawer"
        closable={true}
      >
        <Menu
          mode="vertical"
          items={menuItems.map(item => ({ key: item.key, label: item.label, onClick: item.onClick }))}
          selectedKeys={[activeKey]}
          className="drawer-menu"
        />
        <Button
            type="primary"
            className="drawer-action-button"
            onClick={() => {handleLoginClick(); closeDrawer();}}
            block
            icon={<LoginOutlined />}
          >
            Acessar Plataforma
        </Button>
      </Drawer>
    </AntHeader>
  );
};

export default Header;