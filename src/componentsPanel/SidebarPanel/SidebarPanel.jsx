// src/componentsPanel/SidebarPanel/SidebarPanel.jsx
import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  PieChartOutlined, SwapOutlined, ScheduleOutlined, CreditCardOutlined,
  ShoppingCartOutlined, CalendarOutlined, MessageOutlined, SettingOutlined,
  UserOutlined, LineChartOutlined, TeamOutlined, TagsOutlined, CrownOutlined // <<< IMPORTAR CrownOutlined
} from '@ant-design/icons';
import './SidebarPanel.css';

const { Sider } = Layout;
const { Title } = Typography;

const SidebarPanel = ({ collapsed, onCollapse, selectedProfileType, onMenuItemClick, isMobile }) => {
  const location = useLocation();

  // --- MENU PARA ADMINISTRADORES ---
  const adminMenuItems = [
    { key: '/admin/dashboard', icon: <CrownOutlined />, label: <Link to="/admin/dashboard">Admin</Link> },
  ];

  // --- MENU PARA CLIENTES ---
  const clientMenuItems = [
    { key: '/painel', icon: <PieChartOutlined />, label: <Link to="/painel">Visão Geral</Link> },
    { key: '/painel/transacoes', icon: <SwapOutlined />, label: <Link to="/painel/transacoes">Transações</Link> },
    { key: '/painel/recorrencias', icon: <ScheduleOutlined />, label: <Link to="/painel/recorrencias">Recorrências</Link> },
    { key: '/painel/categorias', icon: <TagsOutlined />, label: <Link to="/painel/categorias">Categorias</Link> },
    { key: '/painel/cartoes', icon: <CreditCardOutlined />, label: <Link to="/painel/cartoes">Cartões</Link> },
    (selectedProfileType === 'PJ' || selectedProfileType === 'MEI') && {
      key: '/painel/produtos', icon: <ShoppingCartOutlined />, label: <Link to="/painel/produtos">Produtos & Estoque</Link>,
    },
        (selectedProfileType === 'PJ' || selectedProfileType === 'MEI') && {
      key: '/painel/servicos', icon: <ShoppingCartOutlined />, label: <Link to="/painel/servicos">Serviços</Link>,
    },
    (selectedProfileType === 'PJ' || selectedProfileType === 'MEI') && {
        key: '/painel/clientes', icon: <TeamOutlined />, label: <Link to="/painel/clientes">Clientes de Negócio</Link>,
    },
    { key: '/painel/agendamentos', icon: <CalendarOutlined />, label: <Link to="/painel/agendamentos">Agendamentos</Link> },
    { key: '/painel/chat', icon: <MessageOutlined />, label: <Link to="/painel/chat">Chat com Assistente</Link> },
    { key: '/painel/hidratacao', icon: <CreditCardOutlined />, label: <Link to="/painel/hidratacao">Hidratação</Link> },
    { type: 'divider' },
    { key: '/painel/meu-perfil', icon: <UserOutlined />, label: <Link to="/painel/meu-perfil">Meu Perfil</Link> },
    { key: '/painel/configuracoes', icon: <SettingOutlined />, label: <Link to="/painel/configuracoes">Configurações</Link> },
  ].filter(Boolean);

  // --- ESCOLHE O MENU CORRETO BASEADO NO TIPO DE PERFIL ---
  const menuItems = selectedProfileType === 'ADMIN' ? adminMenuItems : clientMenuItems;

  // Lógica para determinar a chave selecionada (funciona para ambos os menus)
  let selectedKey = '';
  // Ordena para garantir que rotas mais específicas (ex: /painel/cartoes) sejam checadas antes de /painel
  const sortedMenuItems = [...menuItems].sort((a, b) => (b?.key?.length || 0) - (a?.key?.length || 0));
  for (const item of sortedMenuItems) {
    if (item && item.key && location.pathname.startsWith(item.key)) {
       selectedKey = item.key;
       break;
    }
  }

  const sidebarContent = (
    <>
      <div className="sidebar-logo-container">
        <LineChartOutlined className="sidebar-logo-icon" />
        {!collapsed && <Title level={4} className="sidebar-logo-text">MAP no Controle</Title>}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        className="sidebar-menu"
        onClick={onMenuItemClick}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
      />
    </>
  );

  if (isMobile) {
    return (
      <div style={{ 
          height: '100%',
          display: 'flex', 
          flexDirection: 'column', 
          backgroundColor: '#001529' 
      }}>
        {sidebarContent}
      </div>
    );
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={220}
      theme="dark"
      className="panel-sidebar"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
      }}
      breakpoint="lg"
      collapsedWidth={80}
    >
      {sidebarContent}
    </Sider>
  );
};

export default SidebarPanel;