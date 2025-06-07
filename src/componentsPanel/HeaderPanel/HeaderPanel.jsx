// src/componentsPanel/HeaderPanel/HeaderPanel.jsx
import React from 'react';
import { Layout, Avatar, Typography, Select, Space, Dropdown, Menu, Tooltip, Button, Divider } from 'antd';
import {
  UserOutlined, SettingOutlined, LogoutOutlined, DownOutlined,
  CreditCardOutlined, ShopOutlined, MessageOutlined, GlobalOutlined,
  LineChartOutlined, SwapOutlined, MenuOutlined // <<< IMPORTAR MenuOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext';
import './HeaderPanel.css';

const { Header } = Layout;
const { Text } = Typography;
const { Option } = Select;

// ACEITAR AS NOVAS PROPS: isMobile e onMenuClick
const HeaderPanel = ({
  userName = "Usuário Exemplo",
  appName = "No Controle",
  isMobile,
  onMenuClick
}) => {
  const navigate = useNavigate();
  const {
    userProfiles,
    selectedProfileId,
    setSelectedProfileId,
    currentProfile
  } = useProfile();

  const profilesToUse = userProfiles && userProfiles.length > 0 ? userProfiles : [{ id: 'loading_pf', name: 'Carregando...', type: 'PF', icon: <CreditCardOutlined /> }];
  const currentProfileDetails = currentProfile || profilesToUse[0];

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // <<< IMPORTANTE: LIMPAR TOKEN NO LOGOUT
    localStorage.removeItem('selectedProfileId');
    setSelectedProfileId(null);
    navigate('/login');
  };

  const handleProfileChangeInSelect = (value) => {
    setSelectedProfileId(value);
  };

  const userMenu = (
    <Menu className="user-menu-dropdown-overlay">
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link to="/painel/meu-perfil">Meu Perfil</Link>
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        <Link to="/painel/configuracoes">Configurações</Link>
      </Menu.Item>
      {profilesToUse.length > 1 && profilesToUse[0].id !== 'loading_pf' && (
        <>
          <Menu.Divider />
          <Menu.SubMenu key="change-profile" title="Trocar Perfil" icon={<SwapOutlined />}>
            {profilesToUse.map(profile => (
              <Menu.Item
                key={profile.id}
                onClick={() => handleProfileChangeInSelect(profile.id)}
                icon={profile.icon || (profile.type === 'PF' ? <UserOutlined /> : <ShopOutlined />)}
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

  return (
    <Header className="header-panel modern refined">
      <div className="header-panel-left-section">
        {/* Renderiza o botão de menu em modo mobile */}
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
          <LineChartOutlined className="brand-icon" />
          {/* Esconde o texto da marca em mobile para dar espaço */}
          {!isMobile && <Text className="brand-name">{appName}</Text>}
        </div>
        {!isMobile && currentProfileDetails && currentProfileDetails.id !== 'loading_pf' && (
          <>
            <Divider type="vertical" className="brand-profile-divider" />
            <div className="current-profile-name-header">
              {currentProfileDetails.icon || (currentProfileDetails.type === 'PF' ? <UserOutlined /> : <ShopOutlined />)}
              <Text className="profile-name-text-header">
                {currentProfileDetails.name}
              </Text>
            </div>
          </>
        )}
      </div>

      <div className="header-panel-right-section">
        {!isMobile && profilesToUse.length > 1 && profilesToUse[0].id !== 'loading_pf' && (
            <Select
                value={selectedProfileId}
                className="profile-selector-modern header-item"
                onChange={handleProfileChangeInSelect}
                bordered={false}
                dropdownMatchSelectWidth={false}
                popupClassName="profile-selector-dropdown-modern"
                suffixIcon={<DownOutlined />}
                optionLabelProp="label"
            >
            {profilesToUse.map((profile) => (
                <Option key={profile.id} value={profile.id} label={
                    <Space className="profile-option-selected-label">
                        {profile.icon || (profile.type === 'PF' ? <UserOutlined /> : <ShopOutlined />)}
                        <span className="profile-name-short">{profile.name.length > 15 ? `${profile.name.substring(0,13)}...` : profile.name}</span>
                    </Space>
                }>
                <Space className="profile-option-item-dropdown">
                    {profile.icon || (profile.type === 'PF' ? <UserOutlined /> : <ShopOutlined />)}
                    <span>{profile.name} ({profile.type})</span>
                </Space>
                </Option>
            ))}
            </Select>
        )}

        <Space size="small" align="center">
          <Tooltip title="Abrir Chatbot" placement="bottom">
            <Button
                type="text"
                shape="circle"
                icon={<MessageOutlined />}
                className="header-panel-action-btn header-item"
                onClick={() => navigate('/painel/chat')}
            />
          </Tooltip>
          <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight" overlayClassName="user-menu-dropdown-overlay">
            <a onClick={(e) => e.preventDefault()} className="user-avatar-link header-item">
              <Avatar size={36} icon={<UserOutlined />} className="user-avatar-modern" />
            </a>
          </Dropdown>
        </Space>
      </div>
      <div className="header-bottom-accent-line"></div>
    </Header>
  );
};

export default HeaderPanel;