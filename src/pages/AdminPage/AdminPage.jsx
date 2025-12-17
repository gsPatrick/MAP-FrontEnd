// src/pages/AdminPage/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Drawer, Button } from 'antd';
import { TeamOutlined, DollarCircleOutlined, MenuOutlined, ReadOutlined, SendOutlined, RobotOutlined } from '@ant-design/icons';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import './AdminPage.css';

const { Sider, Content } = Layout;
const MOBILE_BREAKPOINT = 768;

const AdminPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navega para a página de usuários se a rota for apenas /admin/dashboard
  useEffect(() => {
    if (location.pathname === '/admin/dashboard' || location.pathname === '/admin/dashboard/') {
      navigate('/admin/dashboard/users', { replace: true });
    }
  }, [location.pathname, navigate]);

  const selectedKey = location.pathname.split('/')[3] || 'users';

  const menuItems = [
    { key: 'users', icon: <TeamOutlined />, label: <Link to="/admin/dashboard/users">Usuários</Link> },
    { key: 'affiliates', icon: <DollarCircleOutlined />, label: <Link to="/admin/dashboard/affiliates">Afiliados</Link> },
    { key: 'plans', icon: <ReadOutlined />, label: <Link to="/admin/dashboard/plans">Planos</Link> },
    { key: 'broadcast', icon: <SendOutlined />, label: <Link to="/admin/dashboard/broadcast">Transmissão</Link> },
    { key: 'settings', icon: <RobotOutlined />, label: <Link to="/admin/dashboard/settings">Configurações</Link> }, // <<< Novo Item
  ];

  const sidebarContent = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={() => isMobile && setDrawerVisible(false)}
    />
  );

  return (
    <Layout className="admin-page-layout">
      {isMobile ? (
        <Drawer
          title="Menu Admin"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          bodyStyle={{ padding: 0 }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
          <div className="admin-logo" />
          {sidebarContent}
        </Sider>
      )}
      <Layout>
        <Content className="admin-page-content-wrapper">
          {isMobile && (
            <Button
              className="admin-mobile-menu-button"
              type="primary"
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
            />
          )}
          {/* Outlet renderizará as sub-rotas como UserManagementPage, AffiliateManagementPage, etc. */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminPage;