// src/pages/PainelLayout/PainelLayout.jsx
import React, { useState, useEffect } from 'react';
import { Layout, Drawer } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import HeaderPanel from '../componentsPanel/HeaderPanel/HeaderPanel';
import SidebarPanel from '../componentsPanel/SidebarPanel/SidebarPanel';
import { useProfile } from '../contexts/ProfileContext';

const { Content } = Layout;
const MOBILE_BREAKPOINT = 992;

const PainelLayout = () => {
  const { currentProfile } = useProfile();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const userNameForHeader = currentProfile?.ownerClientName || currentProfile?.name || "Usuário";

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile && drawerVisible) {
        setDrawerVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawerVisible]);

  useEffect(() => {
    if (isMobile && drawerVisible) {
      setDrawerVisible(false);
    }
  }, [location, isMobile]);

  const handleToggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };
  
  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  }

  // DEFININDO O SIDEBAR UMA VEZ PARA REUTILIZAÇÃO
  const sidebar = (
    <SidebarPanel
      isMobile={isMobile} // <<< PASSA A PROP isMobile
      collapsed={isMobile ? false : collapsed}
      onCollapse={handleToggleCollapse}
      selectedProfileType={currentProfile?.type}
      onMenuItemClick={() => isMobile && setDrawerVisible(false)}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isMobile ? (
        <Drawer
          placement="left"
          onClose={handleToggleDrawer}
          open={drawerVisible}
          closable={false}
          width="250px"
          bodyStyle={{ padding: 0 }} // O fundo agora é controlado pelo conteúdo do sidebar
        >
          {sidebar} {/* <<< USA A VARIÁVEL sidebar */}
        </Drawer>
      ) : (
        sidebar // <<< USA A MESMA VARIÁVEL sidebar
      )}
      <Layout 
        className="site-layout" 
        style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 220), transition: 'margin-left 0.2s' }}
      >
        <HeaderPanel
          userName={userNameForHeader}
          isMobile={isMobile}
          onMenuClick={handleToggleDrawer}
        />
        <Outlet /> 
      </Layout>
    </Layout>
  );
};

export default PainelLayout;