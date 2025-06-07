// src/pages/BusinessClientsPage/BusinessClientsPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layout, Typography, Button, List, Card, Space, Tooltip,
  Popconfirm, message, Tag, Row, Col, Empty, ConfigProvider, Avatar, Spin, Result // Adicionado Result
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined,
  UserOutlined, PhoneOutlined, MailOutlined, CheckCircleOutlined, CloseCircleOutlined,
  UserAddOutlined, LoadingOutlined, TeamOutlined, StopOutlined // Adicionado StopOutlined
} from '@ant-design/icons';
import ptBR from 'antd/lib/locale/pt_BR';

import { useProfile } from '../../contexts/ProfileContext';
import apiClient from '../../services/api';

import ModalBusinessClientForm from '../../modals/ModalBusinessClientForm/ModalBusinessClientForm';

import './BusinessClientsPage.css';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const BusinessClientsPage = () => {
  const {
    currentProfile,
    loadingProfiles,
    isAuthenticated
  } = useProfile();

  // REMOVIDO: const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // REMOVIDO: const userNameForHeader = ...

  const [businessClients, setBusinessClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [savingClient, setSavingClient] = useState(false);
  const [deletingClient, setDeletingClient] = useState(false);

  const isBusinessProfile = useMemo(() => currentProfile && ['PJ', 'MEI'].includes(currentProfile.type), [currentProfile]);

  const fetchBusinessClients = useCallback(async () => {
    if (!currentProfile || !isAuthenticated || !isBusinessProfile) {
      setBusinessClients([]);
      setLoadingClients(false);
      return;
    }
    setLoadingClients(true);
    try {
      const response = await apiClient.get(`/financial-accounts/${currentProfile.id}/business-clients`, {
        params: { sortBy: 'name', sortOrder: 'ASC', limit: 200 }
      });
      if (response.data && response.data.status === 'success') {
        const clientsArray = response.data.data || response.data.businessClients || [];
        setBusinessClients(clientsArray.map(client => ({ ...client, id: client.id.toString() })));
      } else {
        setBusinessClients([]);
        message.error(response.data?.message || "Falha ao carregar clientes de negócio.");
      }
    } catch (error) {
      console.error("Erro ao carregar clientes de negócio:", error);
      setBusinessClients([]);
    } finally {
      setLoadingClients(false);
    }
  }, [currentProfile, isAuthenticated, isBusinessProfile]);

  useEffect(() => {
    if (!loadingProfiles && isAuthenticated) {
      if (isBusinessProfile && currentProfile) {
        fetchBusinessClients();
      } else {
        setBusinessClients([]);
        setLoadingClients(false);
      }
    } else if (!isAuthenticated && !loadingProfiles) {
      setBusinessClients([]);
      setLoadingClients(false);
    }
  }, [currentProfile, isAuthenticated, loadingProfiles, isBusinessProfile, fetchBusinessClients]);

  const showModal = (client = null) => {
    setEditingClient(client);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingClient(null);
  };

  const handleModalFinish = async (values) => {
    if (!currentProfile || !isBusinessProfile) {
      message.error("Perfil inválido para esta operação.");
      return;
    }
    setSavingClient(true);
    
    const payload = { ...values };

    try {
      if (editingClient) {
        await apiClient.put(`/financial-accounts/${currentProfile.id}/business-clients/${editingClient.id}`, payload);
        message.success(`Cliente "${payload.name}" atualizado!`);
      } else {
        await apiClient.post(`/financial-accounts/${currentProfile.id}/business-clients`, payload);
        message.success(`Cliente "${payload.name}" criado!`);
      }
      fetchBusinessClients();
      handleModalCancel();
    } catch (error) {
      console.error("Erro ao salvar cliente de negócio:", error);
    } finally {
      setSavingClient(false);
    }
  };

  const handleDelete = async (clientToDelete) => {
    if (!currentProfile || !isBusinessProfile) return;
    setDeletingClient(true);
    try {
      await apiClient.delete(`/financial-accounts/${currentProfile.id}/business-clients/${clientToDelete.id}`);
      message.warn(`Cliente "${clientToDelete.name}" excluído!`);
      fetchBusinessClients();
    } catch (error) {
      console.error("Erro ao excluir cliente de negócio:", error);
    } finally {
      setDeletingClient(false);
    }
  };

  const renderClientItem = (item) => (
    <List.Item
      className={`business-client-item ${item.isActive ? '' : 'inactive'}`}
      actions={[
        <Tooltip title="Editar Cliente" key={`action-editar-${item.id}`}>
          <Button 
            type="text" 
            shape="circle" 
            icon={<EditOutlined />} 
            onClick={() => showModal(item)} 
            className="action-btn-editar-client" 
            disabled={savingClient || deletingClient || loadingClients} 
          />
        </Tooltip>,
        <Popconfirm
          key={`action-excluir-${item.id}`}
          title={<Text>Excluir "<Text strong style={{color: 'var(--map-laranja)'}}>{item.name}</Text>"?</Text>}
          description="Esta ação não pode ser desfeita."
          onConfirm={() => handleDelete(item)}
          okText="Sim, Excluir"
          cancelText="Não"
          placement="topRight"
          disabled={savingClient || deletingClient || loadingClients}
          okButtonProps={{ danger: true, className: 'popconfirm-delete-btn' }}
          cancelButtonProps={{ className: 'popconfirm-cancel-btn-custom' }}
        >
          <Tooltip title="Excluir Cliente">
            <Button 
              type="text" 
              shape="circle" 
              danger 
              icon={<DeleteOutlined />} 
              className="action-btn-excluir-client" 
              disabled={savingClient || deletingClient || loadingClients} 
            />
          </Tooltip>
        </Popconfirm>,
      ]}
    >
      <List.Item.Meta
         avatar={
            <Avatar 
                size={48} 
                src={item.photoUrl || undefined}
                icon={<UserOutlined />}
                className={`${item.isActive ? 'active-avatar' : 'inactive-avatar'} client-list-avatar`}
                alt={item.name}
            >
              {!item.photoUrl && item.name ? item.name.charAt(0).toUpperCase() : null}
            </Avatar>
         }
        title={<Text strong className="client-name">{item.name}</Text>}
        description={
          <>
            <div className="client-details">
                 {item.phone && <Tag icon={<PhoneOutlined />} color="blue" className="client-contact-tag">{item.phone}</Tag>}
                 {item.email && <Tag icon={<MailOutlined />} color="purple" className="client-contact-tag">{item.email}</Tag>}
            </div>
            {item.notes && <Paragraph ellipsis={{ rows: 1, expandable: true, symbol: 'mais' }} className="client-notes"><InfoCircleOutlined /> {item.notes}</Paragraph>}
            <Tag 
                icon={item.isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />} 
                color={item.isActive ? "success" : "error"}
                className="client-status-tag"
            >
                {item.isActive ? "Ativo" : "Inativo"}
            </Tag>
          </>
        }
      />
    </List.Item>
  );

    // --- Lógica de Renderização Condicional Simplificada ---
    if (loadingProfiles || (loadingClients && isAuthenticated && currentProfile && isBusinessProfile)) {
        return (
            <Content style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)'}}>
                <Spin indicator={<TeamOutlined style={{ fontSize: 48, color: 'var(--map-laranja)' }} spin />} tip="Carregando Clientes..." size="large"/>
            </Content>
        );
    }

    if (!isAuthenticated && !loadingProfiles) {
        return (
            <Content style={{ padding: 50, textAlign: 'center' }}>
                <Result
                    status="403"
                    title="Acesso Negado"
                    subTitle="Você precisa estar logado para acessar esta página."
                    extra={<Button type="primary" onClick={() => window.location.href = '/login'}>Fazer Login</Button>}
                />
            </Content>
        );
    }

    if (currentProfile && !isBusinessProfile && !loadingProfiles) {
        return (
            <Content className="restricted-access-content" style={{ padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
                <Result
                    status="warning"
                    icon={<StopOutlined style={{color: 'var(--map-laranja)'}}/>}
                    title="Funcionalidade Restrita"
                    subTitle="Clientes de Negócio estão disponíveis apenas para perfis PJ ou MEI."
                />
            </Content>
        );
    }
    
    if (!currentProfile && isAuthenticated && !loadingProfiles) {
        return (
            <Content style={{ padding: 50, textAlign: 'center' }}>
                 <Result
                    status="info"
                    icon={<UserOutlined style={{color: 'var(--map-laranja)'}}/>}
                    title="Nenhum Perfil Financeiro Selecionado"
                    subTitle="Por favor, selecione um perfil PJ ou MEI no topo da página para gerenciar clientes de negócio."
                    extra={<Button type="primary" onClick={() => document.querySelector('.profile-selector-modern')?.click()}>Selecionar Perfil</Button>}
                />
            </Content>
        );
    }

    // --- Renderização Principal ---
    return (
      <ConfigProvider locale={ptBR}>
        <Content className="business-clients-page-content">
          <Row justify="space-between" align="middle" className="page-header-clients">
            <Col>
              <Title level={2} className="page-title-clients">Meus Clientes de Negócio</Title>
              <Paragraph className="page-subtitle-clients">
                Gerencie seus clientes do perfil: <Text strong>{currentProfile?.name || 'N/D'}</Text>.
              </Paragraph>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                size="large"
                onClick={() => showModal()}
                className="btn-create-client"
                disabled={loadingClients || savingClient || deletingClient} 
              >
                Novo Cliente
              </Button>
            </Col>
          </Row>

          <Card bordered={false} className="clients-card">
            {businessClients.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={businessClients}
                renderItem={renderClientItem}
                className="business-clients-list"
              />
            ) : (
               <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        loadingClients 
                            ? "Carregando clientes..." 
                            : (currentProfile ? `Nenhum cliente cadastrado para ${currentProfile.name}.` : "Selecione um perfil PJ/MEI.")
                    }
                >
                    {(!loadingClients && currentProfile && isBusinessProfile) && (
                        <Button type="primary" onClick={() => showModal()} className="btn-create-client">
                            Adicionar Primeiro Cliente
                        </Button>
                    )}
                </Empty>
            )}
          </Card>
        </Content>
        <ModalBusinessClientForm
          open={isModalVisible}
          onCancel={handleModalCancel}
          onFinish={handleModalFinish}
          initialValues={editingClient}
          loading={savingClient}
        />
      </ConfigProvider>
    );
};

export default BusinessClientsPage;