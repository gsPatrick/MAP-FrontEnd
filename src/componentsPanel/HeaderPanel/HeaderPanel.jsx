import React, { useState } from 'react'; // Mantém useState para estados locais (embora notificationsCount seja removido, pode haver outros usos futuros)
import { Layout, Avatar, Typography, Select, Space, Dropdown, Menu, Tooltip, Button, Divider } from 'antd';
import {
  UserOutlined,
  // BellOutlined, // Removido - não mais usado para notificações
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
  CreditCardOutlined,
  ShopOutlined,
  MessageOutlined,
  GlobalOutlined,
  LineChartOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useProfile } from '../../contexts/ProfileContext'; // <<< IMPORTAR useProfile
import './HeaderPanel.css';

const { Header } = Layout;
const { Text } = Typography;
const { Option } = Select;

const HeaderPanel = ({
  userName = "Usuário Exemplo",
  appName = "No Controle"
}) => {
  const navigate = useNavigate();
  // const [notificationsCount, setNotificationsCount] = useState(3); // Removido estado de notificações

  const {
    userProfiles,
    selectedProfileId,
    setSelectedProfileId,
    currentProfile
  } = useProfile();

  const profilesToUse = userProfiles && userProfiles.length > 0 ? userProfiles : [{ id: 'loading_pf', name: 'Carregando...', type: 'PF', icon: <CreditCardOutlined /> }];
  const currentProfileDetails = currentProfile || profilesToUse[0];

  const handleLogout = () => {
    console.log('Logout');
    localStorage.removeItem('selectedProfileId');
    setSelectedProfileId(null);
    navigate('/login');
  };

  // const handleProfileChangeInDropdown = (e) => { // Esta função não estava sendo usada e pode ser removida se não houver intenção futura
  //   setSelectedProfileId(e.key);
  // };

  const handleProfileChangeInSelect = (value) => {
    setSelectedProfileId(value);
  };

  const userMenu = (
    <Menu className="header-panel-user-dropdown-menu">
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
        <div className="header-panel-brand">
          <LineChartOutlined className="brand-icon" />
          <Text className="brand-name">{appName}</Text>
        </div>
        {currentProfileDetails && currentProfileDetails.id !== 'loading_pf' && (
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
        {profilesToUse.length > 1 && profilesToUse[0].id !== 'loading_pf' && (
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
                onClick={() => navigate('/painel/chat')} // <<< MODIFICADO AQUI
            />
          </Tooltip>

          {/* Seção de notificações removida daqui */}

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