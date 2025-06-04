// src/componentsPanel/SidebarPanel/SidebarPanel.jsx
import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  PieChartOutlined,    // Visão Geral
  SwapOutlined,         // Transações
  ScheduleOutlined,     // Contas a Pagar/Receber (ou Recorrências)
  CreditCardOutlined,   // Cartões
  ShoppingCartOutlined, // Produtos e Estoque
  CalendarOutlined,     // Agendamentos
  MessageOutlined,      // Chat
  SettingOutlined,      // Configurações
  UserOutlined,         // Meu Perfil
  LineChartOutlined,     // Logo
  TeamOutlined, // <<< NOVO ÍCONE PARA CLIENTES DE NEGÓCIO
  TagsOutlined, // <<< ÍCONE PARA CATEGORIAS
  BlockOutlined, // <<< ÍCONE PARA KANBAN
  // Mantenha CreditCardOutlined para Hidratação por enquanto se não houver outro mais adequado
  // UserOutlined para Perfil
  // SettingOutlined para Configurações
} from '@ant-design/icons';
import './SidebarPanel.css';

const { Sider } = Layout;
const { Title } = Typography;

const SidebarPanel = ({ collapsed, onCollapse, selectedProfileType }) => {
  const location = useLocation(); // Para destacar o item de menu ativo

  // Define os itens do menu
  // A chave (key) deve corresponder ao path da rota para o destaque funcionar automaticamente
  const menuItems = [
    {
      key: '/painel', // Ou '/painel/visao-geral' se for uma sub-rota específica
      icon: <PieChartOutlined />,
      label: <Link to="/painel">Visão Geral</Link>,
    },
    {
      key: '/painel/transacoes',
      icon: <SwapOutlined />,
      label: <Link to="/painel/transacoes">Transações</Link>,
    },
    {
      key: '/painel/recorrencias',
      icon: <ScheduleOutlined />, // Pode usar ScheduleOutlined para Recorrências/Contas
      label: <Link to="/painel/recorrencias">Recorrências</Link>,
    },
    {
      key: '/painel/categorias',
      icon: <TagsOutlined />, // Usando TagsOutlined para Categorias
      label: <Link to="/painel/categorias">Categorias</Link>,
    },
    {
      key: '/painel/kanban',
      icon: <BlockOutlined />, // Usando BlockOutlined para Kanban
      label: <Link to="/painel/kanban">Kanban</Link>,
    },
    {
      key: '/painel/cartoes',
      icon: <CreditCardOutlined />,
      label: <Link to="/painel/cartoes">Cartões</Link>,
    },
    // Item condicional para Produtos e Estoque (só para PJ/MEI)
    (selectedProfileType === 'PJ' || selectedProfileType === 'MEI') && {
      key: '/painel/produtos',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/painel/produtos">Produtos & Estoque</Link>,
    },
     // >>> NOVO ITEM CONDICIONAL PARA CLIENTES DE NEGÓCIO (só para PJ/MEI)
    (selectedProfileType === 'PJ' || selectedProfileType === 'MEI') && {
        key: '/painel/clientes',
        icon: <TeamOutlined />, // Ícone de equipe/clientes
        label: <Link to="/painel/clientes">Clientes de Negócio</Link>,
    },
    {
      key: '/painel/agendamentos',
      icon: <CalendarOutlined />,
      label: <Link to="/painel/agendamentos">Agendamentos</Link>,
    },
    {
      key: '/painel/chat',
      icon: <MessageOutlined />,
      label: <Link to="/painel/chat">Chat com Assistente</Link>,
    },
    {
      key: '/painel/hidratacao',
      icon: <CreditCardOutlined />, // Manter este por enquanto, ou escolher outro
      label: <Link to="/painel/hidratacao">Hidratação</Link>,
    },
    {
      type: 'divider', // Divisor visual
    },

    {
      key: '/painel/meu-perfil',
      icon: <UserOutlined />,
      label: <Link to="/painel/meu-perfil">Meu Perfil</Link>,
    },
    {
      key: '/painel/configuracoes',
      icon: <SettingOutlined />,
      label: <Link to="/painel/configuracoes">Configurações</Link>,
    },
  ].filter(Boolean); // Remove itens falsy (como os condicionais se a condição for falsa)


  // Determina a chave selecionada com base na localização atual
  // Tenta encontrar a correspondência mais específica primeiro
  let selectedKey = '';
  // Inverte a ordem para verificar os caminhos mais longos primeiro (rotas mais específicas)
  const sortedMenuItems = [...menuItems].sort((a, b) => (b?.key?.length || 0) - (a?.key?.length || 0));

  for (const item of sortedMenuItems) {
    if (item && item.key && location.pathname.startsWith(item.key)) {
       selectedKey = item.key;
       break; // Encontrou a correspondência mais longa, pode sair
    }
  }

  // Fallback para a rota base do painel se nenhuma outra for correspondida
  if (!selectedKey && location.pathname.startsWith('/painel')) {
      const basePanelItem = menuItems.find(item => item && item.key === '/painel');
      if(basePanelItem) selectedKey = basePanelItem.key;
  }


  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={220}
      theme="dark" // Tema escuro para a sidebar
      className="panel-sidebar"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        // paddingTop: '64px', // Se o HeaderPanel NÃO for parte deste Layout Sider/Content
        zIndex: 1000, // Abaixo do HeaderPanel se ele for sticky/fixed separado
      }}
      breakpoint="lg" // Colapsa automaticamente em telas menores que lg (992px)
      collapsedWidth={80} // Largura quando colapsada
    >
      <div className="sidebar-logo-container">
        <LineChartOutlined className="sidebar-logo-icon" />
        {!collapsed && (
          <Title level={4} className="sidebar-logo-text">
            MAP no Controle
          </Title>
        )}
      </div>
      {/* Ant Design Menu theme="dark" já define a cor de fundo escura */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]} // Item ativo destacado
        items={menuItems}
        className="sidebar-menu"
      />
    </Sider>
  );
};

export default SidebarPanel;