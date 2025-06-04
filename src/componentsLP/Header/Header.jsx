// src/componentsLP/Header/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleMenuClick = (key) => {
    setActiveKey(key);
    console.log(`Navegar para a seção: ${key}`);
    if (drawerVisible) {
      closeDrawer();
    }
  };

  const menuItems = [
    { key: 'funcionalidades', label: 'Funcionalidades', onClick: () => handleMenuClick('funcionalidades') },
    { key: 'beneficios', label: 'Benefícios', onClick: () => handleMenuClick('beneficios') },
    { key: 'planos', label: 'Planos', onClick: () => handleMenuClick('planos') },
    { key: 'depoimentos', label: 'Depoimentos', onClick: () => handleMenuClick('depoimentos') },
  ];

  return (
    <AntHeader className={`lp-header ${isScrolled ? 'scrolled' : ''}`}>
      <Row justify="space-between" align="middle" className="header-row" wrap={false}>
        <Col flex="1" className="logo-column">
          <Link to="/" onClick={() => handleMenuClick('')} className="logo-link">
            <LineChartOutlined className="logo-icon-placeholder" />
            <span className="logo-text">No Controle</span>
          </Link>
        </Col>

        <Col xs={0} sm={0} md={14} lg={12} xl={10} className="menu-desktop-col">
          <Menu
            mode="horizontal"
            items={menuItems}
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
          <Link to="/" onClick={() => { handleMenuClick(''); closeDrawer();}} className="drawer-logo-link">
            <LineChartOutlined className="logo-icon-placeholder drawer-logo-icon" />
            <span className="logo-text drawer-logo-text">No Controle</span>
          </Link>
        }
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        className="menu-drawer"
        closable={true}
      >
        <Menu
          mode="vertical"
          items={menuItems}
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