// src/componentsLP/Header/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // Renomeado para evitar conflito com Link de AntD se houver
import { Layout, Menu, Button, Row, Col, Drawer, Space } from 'antd';
import { MenuOutlined, LineChartOutlined, LoginOutlined } from '@ant-design/icons';
import './Header.css';

const { Header: AntHeader } = Layout;

const Header = () => {
  const navigate = useNavigate();
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

    // Define a activeKey inicial baseado no hash da URL, se houver
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash) {
      setActiveKey(currentHash);
    }


    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleMenuClick = (key) => {
    setActiveKey(key);
    if (drawerVisible) {
      closeDrawer();
    }

    if (key) {
      const section = document.getElementById(key);
      if (section) {
        // Atualiza o hash da URL para refletir a seção ativa
        // window.location.hash = key; // Comentado para evitar pulo brusco antes da rolagem suave
        
        // Calcula a posição da seção levando em conta a altura do header fixo
        const headerOffset = document.querySelector('.lp-header')?.offsetHeight || 70; // Altura do header
        const elementPosition = section.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset - 10; // -10 para um pequeno espaço extra

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else {
        console.warn(`Seção com id "${key}" não encontrada.`);
        // Se a seção não for encontrada, mas for uma rota (ex: /faq), navega
        if (key.startsWith('/')) {
            navigate(key);
        }
      }
    } else {
      // Clique no logo, rolar para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // window.location.hash = ''; // Limpa o hash ao ir para o topo
    }
  };

  const menuItems = [
    { key: 'funcionalidades', label: 'Funcionalidades', onClick: () => handleMenuClick('funcionalidades') },
    { key: 'beneficios', label: 'Benefícios', onClick: () => handleMenuClick('beneficios') },
    { key: 'planos', label: 'Planos', onClick: () => handleMenuClick('planos') },
    { key: 'sobre', label: 'Sobre', onClick: () => handleMenuClick('sobre') },
    // Adicione mais itens conforme necessário, por exemplo, para FAQ:
    // { key: 'faq', label: 'FAQ', onClick: () => handleMenuClick('faq') }, 
  ];

  return (
    <AntHeader className={`lp-header ${isScrolled ? 'scrolled' : ''}`}>
      <Row justify="space-between" align="middle" className="header-row" wrap={false}>
        <Col flex="1" className="logo-column">
          <RouterLink to="/" onClick={() => handleMenuClick('')} className="logo-link">
            <LineChartOutlined className="logo-icon-placeholder" />
            <span className="logo-text">No Controle</span>
          </RouterLink>
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
          <RouterLink to="/" onClick={() => { handleMenuClick(''); closeDrawer();}} className="drawer-logo-link">
            <LineChartOutlined className="logo-icon-placeholder drawer-logo-icon" />
            <span className="logo-text drawer-logo-text">No Controle</span>
          </RouterLink>
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