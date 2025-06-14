// src/componentsPanel/HeaderPanel/HeaderPanel.jsx
import React from 'react';
import { Layout, Avatar, Typography, Space, Dropdown, Menu, Tooltip, Button, Divider, Select } from 'antd';
import {
  UserOutlined, SettingOutlined, LogoutOutlined, CrownOutlined, MenuOutlined, MessageOutlined,
  LineChartOutlined, SwapOutlined, DownOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import './HeaderPanel.css';

const { Header } = Layout;
const { Text } = Typography;
const { Option } = Select;

const HeaderPanel = ({ isMobile, onMenuClick }) => {
  const navigate = useNavigate();
  const {
    userProfiles,
    selectedProfileId,
    setSelectedProfileId,
    currentProfile
  } = useProfile();
  
  const isAdmin = currentProfile?.type === 'ADMIN';
  const headerTitle = isAdmin ? "Painel Administrativo" : "No Controle";
  const userName = currentProfile?.name || "Usuário";

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('selectedProfileId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    setSelectedProfileId(null);
    navigate('/login');
  };

  // --- MENU DO USUÁRIO PARA CLIENTES (COMPORTAMENTO ORIGINAL RESTAURADO) ---
  const clientUserMenu = (
    <Menu className="user-menu-dropdown-overlay">
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link to="/painel/meu-perfil">Meu Perfil</Link>
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        <Link to="/painel/configuracoes">Configurações</Link>
      </Menu.Item>

      {/* LÓGICA DE TROCA DE PERFIL RESTAURADA */}
      {userProfiles && userProfiles.length > 1 && (
        <>
          <Menu.Divider />
          <Menu.SubMenu key="change-profile" title="Trocar Perfil" icon={<SwapOutlined />}>
            {userProfiles.map(profile => (
              <Menu.Item
                key={profile.id}
                onClick={() => setSelectedProfileId(profile.id)}
                icon={profile.icon || <UserOutlined />}
              >
                {profile.name}
              </Menu.Item>
            ))}
          </Menu.SubMenu>
        </>
      )}

      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout} danger>
        Sair
      </Menu.Item>
    </Menu>
  );

  // --- MENU DO USUÁRIO PARA ADMINS (SIMPLES, APENAS SAIR) ---
  const adminUserMenu = (
    <Menu className="user-menu-dropdown-overlay">
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout} danger>
        Sair
      </Menu.Item>
    </Menu>
  );

  return (
    <Header className="header-panel modern refined">
      <div className="header-panel-left-section">
        {isMobile && (
          <Button
            className="menu-toggle-btn"
            type="text"
            icon={<MenuOutlined />}
            onClick={onMenuClick}
            style={{ marginRight: '10px' }}
          />
        )}
        <div className="header-panel-brand">
          {isAdmin ? <CrownOutlined className="brand-icon" /> : <LineChartOutlined className="brand-icon" />}
          {!isMobile && <Text className="brand-name">{headerTitle}</Text>}
        </div>
        
        {/* Mostra nome do perfil para CLIENTES */}
        {!isMobile && !isAdmin && currentProfile && (
          <>
            <Divider type="vertical" className="brand-profile-divider" />
            <div className="current-profile-name-header">
              {currentProfile.icon || <UserOutlined />}
              <Text className="profile-name-text-header">{currentProfile.name}</Text>
            </div>
          </>
        )}
      </div>

      <div className="header-panel-right-section">
        {/* Mostra seletor de perfil e chatbot para CLIENTES */}
        {!isAdmin && (
          <Space size="middle" align="center">
            {/* LÓGICA DO SELETOR DE PERFIL RESTAURADA */}
            {!isMobile && userProfiles && userProfiles.length > 1 && (
              <Select
                  value={selectedProfileId}
                  className="profile-selector-modern header-item"
                  onChange={(value) => setSelectedProfileId(value)}
                  bordered={false}
                  dropdownMatchSelectWidth={false}
                  popupClassName="profile-selector-dropdown-modern"
                  suffixIcon={<DownOutlined />}
                  optionLabelProp="label"
              >
              {userProfiles.map((profile) => (
                  <Option key={profile.id} value={profile.id} label={
                      <Space className="profile-option-selected-label">
                          {profile.icon || <UserOutlined />}
                          <span className="profile-name-short">{profile.name.length > 15 ? `${profile.name.substring(0,13)}...` : profile.name}</span>
                      </Space>
                  }>
                  <Space className="profile-option-item-dropdown">
                      {profile.icon || <UserOutlined />}
                      <span>{profile.name} ({profile.type})</span>
                  </Space>
                  </Option>
              ))}
              </Select>
            )}
            <Tooltip title="Abrir Chatbot" placement="bottom">
              <Button
                  type="text"
                  shape="circle"
                  icon={<MessageOutlined />}
                  className="header-panel-action-btn header-item"
                  onClick={() => navigate('/painel/chat')}
              />
            </Tooltip>
          </Space>
        )}

        {/* Avatar e Dropdown para TODOS */}
        <Dropdown 
          overlay={isAdmin ? adminUserMenu : clientUserMenu} // Renderiza o menu correto
          trigger={['click']} 
          placement="bottomRight" 
        >
          <a onClick={(e) => e.preventDefault()} className="user-avatar-link header-item">
            <Space>
              {isAdmin && !isMobile && <Text style={{ color: 'white' }}>{userName}</Text>}
              <Avatar size={36} icon={<UserOutlined />} className="user-avatar-modern" />
            </Space>
          </a>
        </Dropdown>
      </div>
      <div className="header-bottom-accent-line"></div>
    </Header>
  );
};

export default HeaderPanel;